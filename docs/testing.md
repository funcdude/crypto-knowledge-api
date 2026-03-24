# Testing Guide

## Local setup check

Verify all containers are running:

```bash
docker compose ps
```

Expected: `api`, `db`, `redis` all Up.

---

## Health endpoints

```bash
# Liveness
curl http://localhost:8000/health/live

# Readiness (checks DB + Redis)
curl http://localhost:8000/health/ready

# Full health status
curl http://localhost:8000/health
```

All three should return 200. The full health response shows per-service status:
```json
{"status": "healthy", "services": {"redis": "healthy", "database": "healthy"}}
```

---

## X402 payment flow

### 1. Confirm 402 is returned without payment

```bash
curl -s -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "What is Bitcoin?", "tier": "snippet"}' \
  -o /dev/null -w "%{http_code}"
```
Expected: `402`

### 2. Inspect the PAYMENT-REQUIRED header

```bash
curl -si -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "What is Bitcoin?", "tier": "snippet"}' \
  | grep -i payment-required
```

The header value is base64-encoded JSON. Decode it:

```bash
ENCODED=$(curl -si -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Bitcoin", "tier": "snippet"}' \
  | grep -i "payment-required:" | awk '{print $2}' | tr -d '\r')

echo $ENCODED | base64 -d | jq .
```

Expected structure (x402 v2):
```json
{
  "x402Version": 2,
  "error": "Payment Required",
  "accepts": [
    {
      "scheme": "exact",
      "network": "eip155:8453",
      "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      "amount": "1000",
      "payTo": "0x28E6b3e3E32308787F50e6D99e2B98745b381946",
      "maxTimeoutSeconds": 300
    }
  ]
}
```

### 3. Test with dev payment header (SKIP_PAYMENT_VERIFY=true)

Construct a minimal x402 v2 payload and base64-encode it:

```bash
PAYLOAD=$(echo '{"payload":{"transaction":"dev-test-001"},"accepted":{"network":"eip155:8453"}}' | base64)

curl -s -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -H "payment-signature: $PAYLOAD" \
  -d '{"query": "What is Bitcoin?", "tier": "snippet"}' | jq '{query, tier, total_results, cost_usd}'
```

Expected: 200 with results from Pinecone.

### 4. Verify tier pricing

```bash
# Check pricing endpoint (free, no payment)
curl -s http://localhost:8000/api/v1/pricing | jq '.pricing_tiers | to_entries[] | {tier: .key, price: .value.price}'
```

Expected prices: snippet $0.001, explanation $0.005, analysis $0.01, chapter_summary $0.02.

### 5. Verify correct payment address and chain

```bash
curl -si -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "tier": "snippet"}' \
  | grep -i payment-required \
  | awk '{print $2}' | tr -d '\r' \
  | base64 -d | jq '.accepts[0] | {network, payTo, amount}'
```

Expected:
- `network`: `"eip155:8453"` (Base mainnet)
- `payTo`: `"0x28E6b3e3E32308787F50e6D99e2B98745b381946"`
- `amount`: `"1000"` for snippet (= 0.001 USDC with 6 decimals)

### 6. Confirm invalid payment is rejected

```bash
curl -s -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -H "payment-signature: not-valid-base64!!!" \
  -d '{"query": "test"}' | jq .
```

Expected: 400 with `"Payment verification failed"`.

---

## Knowledge search

### GET variant

```bash
PAYLOAD=$(echo '{"payload":{"transaction":"dev-002"},"accepted":{"network":"eip155:8453"}}' | base64)

curl -s "http://localhost:8000/api/v1/search?q=DeFi&tier=snippet" \
  -H "payment-signature: $PAYLOAD" | jq '{total_results, cost_usd}'
```

### Concept endpoint

```bash
PAYLOAD=$(echo '{"payload":{"transaction":"dev-003"},"accepted":{"network":"eip155:8453"}}' | base64)

curl -s "http://localhost:8000/api/v1/concepts/blockchain?tier=explanation" \
  -H "payment-signature: $PAYLOAD" | jq '{concept, cost_usd}'
```

---

## Pinecone / search quality

After verifying the payment flow works, check that Pinecone is returning relevant content:

```bash
PAYLOAD=$(echo '{"payload":{"transaction":"dev-004"},"accepted":{"network":"eip155:8453"}}' | base64)

curl -s -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -H "payment-signature: $PAYLOAD" \
  -d '{"query": "What is Nakamoto consensus?", "tier": "explanation", "max_results": 3}' \
  | jq '.results[] | {relevance_score, content: .content[:100]}'
```

Good results have `relevance_score` above 0.80. If scores are below 0.60 or results are unrelated, check that `PINECONE_INDEX_NAME` matches the index where the book is loaded.

---

## Rate limiting

The API enforces 100 requests per minute per IP. To verify:

```bash
for i in {1..5}; do
  curl -s http://localhost:8000/health/live | jq .alive
done
```

After 100 rapid requests from the same IP you'll receive `429 Rate limit exceeded`.

---

## Quick sanity-check script

Run all critical checks in sequence:

```bash
#!/bin/bash
BASE="http://localhost:8000"
PAYLOAD=$(echo '{"payload":{"transaction":"sanity-check"},"accepted":{"network":"eip155:8453"}}' | base64)

echo "Health:" && curl -s $BASE/health | jq .status
echo "Live:" && curl -s $BASE/health/live | jq .alive
echo "Ready:" && curl -s $BASE/health/ready | jq .ready
echo "402 enforcement:" && curl -s -X POST $BASE/api/v1/search \
  -H "Content-Type: application/json" -d '{"query":"test","tier":"snippet"}' \
  -o /dev/null -w "%{http_code}\n"
echo "Search with payment:" && curl -s -X POST $BASE/api/v1/search \
  -H "Content-Type: application/json" \
  -H "payment-signature: $PAYLOAD" \
  -d '{"query":"What is Bitcoin?","tier":"snippet"}' | jq .total_results
echo "Pricing:" && curl -s $BASE/api/v1/pricing | jq '.pricing_tiers | keys'
```
