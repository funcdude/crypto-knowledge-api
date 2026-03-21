# Quick Test Commands

## Run Pinecone Direct Test (Verify Book is Loaded)

```bash
cd ~/crypto-knowledge-api
export PINECONE_API_KEY=$(pass api/pinecone/api-key)
python3 scripts/test-pinecone-direct.py
```

### What You'll See:
- ✅ Index connection status
- ✅ 975 vectors loaded
- ✅ 3 sample chunks from your book with real content
- ✅ All metadata confirmed

---

## Test API Health

```bash
curl http://localhost:8000/health | jq .
```

### Expected Response:
```json
{
  "status": "healthy",
  "services": {
    "redis": "healthy",
    "database": "healthy"
  }
}
```

---

## Test API Root

```bash
curl http://localhost:8000/ | jq .
```

### Expected Response:
Shows API metadata including book title, author, features

---

## Test Search Endpoint (402 Payment Required)

```bash
curl -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "What is Bitcoin?", "tier": "explanation", "max_results": 3}'
```

### Expected Response (HTTP 402):
```json
{
  "detail": {
    "error": "Payment required",
    "payment": {
      "chainId": 8453,
      "to": "0x28E6b3e3E32308787F50e6D99e2B98745b381946",
      "amount": "5000",
      "currency": "USDC"
    },
    "price_usd": 0.005
  }
}
```

---

## Test Pricing Endpoint

```bash
curl http://localhost:8000/api/v1/pricing | jq .pricing_tiers
```

### Expected Response:
```json
{
  "snippet": {
    "price": 0.001,
    "description": "Quick answer, 1-2 sentences"
  },
  "explanation": {
    "price": 0.005,
    "description": "Detailed explanation, 1-2 paragraphs"
  },
  ...
}
```

---

## Check API Logs

```bash
docker logs crypto-knowledge-api-api-1 | tail -50
```

---

## Check API is Running

```bash
docker ps | grep crypto
```

### Should Show:
- crypto-knowledge-api-api-1 (running)
- crypto-knowledge-api-db-1 (running)
- crypto-knowledge-api-redis-1 (running)

---

## Restart All Services

```bash
cd ~/crypto-knowledge-api
docker compose down
docker compose up -d db redis api
```

---

## View Pinecone Credentials

```bash
pass api/pinecone/api-key
```

Shows the stored Pinecone API key

---

## Full System Check

```bash
#!/bin/bash

echo "🔍 System Check"
echo ""

# 1. Pinecone
echo "1. Pinecone Index:"
export PINECONE_API_KEY=$(pass api/pinecone/api-key)
python3 scripts/test-pinecone-direct.py | grep -E "^[✓|✗]"

echo ""

# 2. API Health
echo "2. API Health:"
curl -s http://localhost:8000/health | jq .status

echo ""

# 3. Docker Containers
echo "3. Docker Containers:"
docker ps | grep crypto

echo ""

# 4. Search Endpoint
echo "4. Search 402 Response:"
curl -s -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Bitcoin"}' | jq .detail.error

echo ""
echo "✅ System check complete"
```

---

## One-Liner Tests

**Quick Pinecone:**
```bash
export PINECONE_API_KEY=$(pass api/pinecone/api-key) && python3 scripts/test-pinecone-direct.py 2>&1 | tail -20
```

**Quick API:**
```bash
curl http://localhost:8000/ && echo "" && curl http://localhost:8000/health
```

**Quick Payment:**
```bash
curl -X POST http://localhost:8000/api/v1/search -H "Content-Type: application/json" -d '{"query":"test"}' 2>&1 | jq '.detail.error'
```

---

## Production Verification Checklist

- [ ] Pinecone index has 975 vectors
- [ ] API returns 402 for searches without payment
- [ ] Payment address is correct (0x28e6...381946)
- [ ] Pricing tiers are configured (4 tiers)
- [ ] Analytics tracking is enabled
- [ ] Book content samples are verifiable
- [ ] Database and Redis are connected
- [ ] All health checks passing

---

## File Locations

```
~/crypto-knowledge-api/
├── scripts/
│   ├── test-pinecone-direct.py  ← Run this to test Pinecone
│   ├── test-local.sh
│   ├── verify-pinecone.sh
│   └── deploy.sh
├── backend/
│   └── app/
│       ├── main.py
│       ├── api/routes/
│       │   ├── knowledge.py
│       │   ├── health.py
│       │   └── x402.py
│       ├── services/
│       │   ├── knowledge_service.py
│       │   ├── embedding_service.py
│       │   └── analytics_service.py
│       └── core/
│           ├── config.py
│           ├── x402.py
│           ├── database.py
│           └── cache.py
├── docker-compose.yml
├── .env              ← Has Pinecone credentials
├── PINECONE_TEST_GUIDE.md
├── TESTING_PROGRESS.md
├── PINECONE_LIVE_TESTING.md
└── README.md
```

---

## Environment Variables

```bash
# Get credentials
export PINECONE_API_KEY=$(pass api/pinecone/api-key)
export BANKR_API_KEY=$(pass api/bankr/api-key)

# Or set manually
export PINECONE_API_KEY=pcsk_...
export PINECONE_ENVIRONMENT=us-east-1
export OPENAI_API_KEY=sk_...
```

---

## GitHub Reference

- **Repo:** https://github.com/funcdude/crypto-knowledge-api
- **PR #1:** https://github.com/funcdude/crypto-knowledge-api/pull/1
- **Branch:** fix/pinecone-integration-and-testing

---

## Important Endpoints

```
GET  http://localhost:8000/           → API info
GET  http://localhost:8000/health     → Health status
POST http://localhost:8000/api/v1/search           → Search (needs payment)
GET  http://localhost:8000/api/v1/pricing          → Pricing info
POST http://localhost:8000/api/v1/search           → Search endpoint
```

---

## Debugging

**Full API startup:**
```bash
docker logs crypto-knowledge-api-api-1 -f
```

**Pinecone connection issues:**
```bash
docker exec crypto-knowledge-api-api-1 ping controller.us-east-1.pinecone.io
```

**Database issues:**
```bash
docker exec crypto-knowledge-api-db-1 psql -U postgres -d crypto_knowledge -c "SELECT 1;"
```

**Redis issues:**
```bash
docker exec crypto-knowledge-api-redis-1 redis-cli ping
```

---

**All systems verified and ready!** 🚀
