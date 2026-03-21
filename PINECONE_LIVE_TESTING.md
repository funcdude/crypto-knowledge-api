# Live Pinecone Integration Testing

## Real Setup Details ✅

```
Host:      crypto-knowledge-0eab2ad.svc.aped-4627-b74a.pinecone.io
Region:    us-east-1
Index:     crypto-knowledge
Records:   975 (from "Cryptocurrencies Decrypted")
Status:    Ready for testing
```

---

## Prerequisites

You need to provide:
1. **Pinecone API Key** - Get from https://app.pinecone.io/api-keys
2. **OpenAI API Key** (optional, for new embeddings) - Get from https://platform.openai.com/account/api-keys

---

## Testing Workflow

### Phase 1: Configure Environment (2 min)

```bash
cd ~/crypto-knowledge-api

# Set credentials (will be prompted for API key)
export PINECONE_API_KEY="your-api-key-here"
export OPENAI_API_KEY="sk-your-key-here"  # Optional

# Update .env
cat >> .env << EOF
PINECONE_API_KEY=$PINECONE_API_KEY
OPENAI_API_KEY=$OPENAI_API_KEY
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=crypto-knowledge
EOF
```

### Phase 2: Restart API (3-5 min)

```bash
# Rebuild with new environment
docker compose build api

# Restart services
docker compose down
docker compose up -d db redis api

# Wait for startup
sleep 5

# Check logs
docker logs crypto-knowledge-api-api-1 | tail -20
```

Expected in logs:
```
INFO: AI embedding service initialized
INFO: Knowledge service initialized
INFO: Crypto Knowledge API startup complete!
```

### Phase 3: Verify Health (2 min)

```bash
# Check all services healthy
curl http://localhost:8000/health | jq .

# Should show:
# {
#   "status": "healthy",
#   "services": {
#     "redis": "healthy",
#     "database": "healthy"
#   }
# }
```

### Phase 4: Test Search Without Payment (1 min)

```bash
# Query without payment - should return 402 Payment Required
curl -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is Bitcoin?",
    "tier": "explanation",
    "max_results": 3
  }' | jq .
```

Expected response:
```json
{
  "error": "Payment required",
  "payment": {
    "chainId": 8453,
    "to": "0x28e6b3e3e32308787f50e6d99e2b98745b381946",
    "amount": "5000",
    "currency": "USDC",
    "description": "Crypto knowledge search: What is Bitcoin?..."
  },
  "price_usd": 0.005
}
```

### Phase 5: Test Search WITH Mock Payment (3 min)

For full testing, we need a valid X402 payment header. For now, test with a mock header:

```bash
# Create a test payment header (format: base64 of payment data)
# In production this would be a signed transaction from Bankr

PAYMENT_HEADER="test-x402-header-placeholder"

curl -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -H "x-payment: $PAYMENT_HEADER" \
  -d '{
    "query": "What is decentralization?",
    "tier": "explanation",
    "max_results": 3
  }' | jq .
```

### Phase 6: Test Concept Endpoints (5 min)

```bash
# Without payment (should return 402)
curl "http://localhost:8000/api/v1/concepts/Bitcoin?tier=explanation" | jq .

# Get pricing info (free endpoint)
curl "http://localhost:8000/api/v1/pricing" | jq .

# Test compare endpoint
curl "http://localhost:8000/api/v1/compare?concept1=Bitcoin&concept2=Ethereum&tier=analysis" | jq .

# Test timeline
curl "http://localhost:8000/api/v1/timeline/Bitcoin?tier=analysis" | jq .
```

### Phase 7: Verify Book Content Search (10 min)

Test queries about content from your book:

```bash
# These should all work (book has 975 records)
QUERIES=(
  "decentralization"
  "smart contracts"
  "cryptographic security"
  "blockchain consensus"
  "economic freedom"
  "financial intermediaries"
)

for QUERY in "${QUERIES[@]}"; do
  echo "Testing: $QUERY"
  curl -X POST http://localhost:8000/api/v1/search \
    -H "Content-Type: application/json" \
    -d "{
      \"query\": \"$QUERY\",
      \"tier\": \"explanation\",
      \"max_results\": 2
    }" | jq '.payment' || echo "✓ Correctly requires payment"
  echo ""
done
```

### Phase 8: Check Analytics (2 min)

```bash
# Connect to Redis to check query tracking
docker exec -it crypto-knowledge-api-redis-1 redis-cli

# Check daily counts
GET analytics:daily:2026-03-21:count

# Check tier breakdown
KEYS analytics:daily:*:tier:*

# Check query storage
KEYS analytics:query:*

# Exit
exit
```

---

## Expected Results

### ✅ Success Indicators

1. **API starts without errors** — logs show embedding service initialized
2. **Health endpoint returns healthy** — all services green
3. **Search returns 402 without payment** — payment required response correct
4. **Payment headers accepted** — API validates payment format
5. **Concepts/Timeline endpoints work** — all routes responding
6. **Analytics tracking works** — queries logged to Redis
7. **Book content accessible** — 975 records searchable

### ⚠️ Common Issues & Solutions

**Issue:** "Invalid API Key"
```
Fix: Double-check PINECONE_API_KEY in .env
Check: https://app.pinecone.io/api-keys for active key
```

**Issue:** "Index not found"
```
Fix: Verify index name is "crypto-knowledge"
Fix: Check host URL: crypto-knowledge-0eab2ad.svc.aped-4627-b74a.pinecone.io
```

**Issue:** "Embedding dimension mismatch"
```
Fix: Ensure book was embedded with text-embedding-3-large (3072 dims)
```

**Issue:** "Connection timeout"
```
Fix: Check Docker logs: docker logs crypto-knowledge-api-api-1
Fix: Verify Pinecone host is reachable from network
```

---

## Test Data Examples

Queries to try from your book:

```
Short queries:
- "Bitcoin"
- "blockchain"
- "cryptocurrency"
- "smart contracts"

Longer queries:
- "How does decentralization improve financial systems?"
- "What is the relationship between cryptography and security?"
- "Explain the consensus mechanisms in cryptocurrency"
- "Why is economic freedom important in financial systems?"
```

---

## Next Steps

### If Basic Tests Pass ✅
1. Test X402 payment with real USDC transaction (optional)
2. Load frontend (localhost:3000)
3. Test payment flow through UI
4. Monitor API logs for performance

### If Tests Fail ❌
1. Check API logs: `docker logs crypto-knowledge-api-api-1`
2. Verify Pinecone connection: `curl https://api.pinecone.io/indexes -H "Api-Key: YOUR_KEY"`
3. Check environment variables: `docker exec crypto-knowledge-api-api-1 env | grep PINECONE`
4. Verify book content: Check Pinecone dashboard for 975 records

---

## Performance Expectations

| Operation | Expected Time |
|-----------|---|
| 402 response | 50-100ms |
| Search query | 200-500ms |
| Analytics tracking | 10-20ms |
| Health check | 50-100ms |

---

## Files to Reference

- `TESTING_PROGRESS.md` — Previous test results
- `SESSION_SUMMARY.txt` — Session overview
- `backend/app/services/embedding_service.py` — Search implementation
- `backend/app/services/knowledge_service.py` — Knowledge retrieval
- `docker-compose.yml` — Container configuration

---

## One-Liner Quick Tests

```bash
# Just started? Test connectivity:
curl http://localhost:8000/ && echo "✅ API responding"

# Check if Pinecone initialized:
docker logs crypto-knowledge-api-api-1 | grep -i pinecone

# Test search (expect 402):
curl -X POST http://localhost:8000/api/v1/search -H "Content-Type: application/json" -d '{"query":"Bitcoin"}' -s | jq '.error'

# Check Redis for analytics:
docker exec crypto-knowledge-api-redis-1 redis-cli GET analytics:daily:2026-03-21:count
```

---

## Status Tracking

- [ ] Pinecone API key obtained
- [ ] Environment configured
- [ ] Docker rebuilt
- [ ] API started cleanly
- [ ] Health check passes
- [ ] 402 response working
- [ ] Search with mock payment tested
- [ ] Concept endpoints tested
- [ ] Analytics verified
- [ ] Book content searchable
- [ ] All endpoints responding correctly

---

## Go Time! 🚀

Once you provide the API key, this testing suite will validate everything end-to-end.

**Current Status:** Ready to test with 975 book records loaded
**Blockers:** Just need API key
**Expected outcome:** Full AI-powered search working with X402 payments
