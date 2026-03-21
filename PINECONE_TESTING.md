# Pinecone Integration Testing Guide

## Setup Requirements

### 1. Obtain Pinecone Credentials
You'll need:
- **PINECONE_API_KEY** - Your API key from Pinecone console
- **PINECONE_ENVIRONMENT** - Typically `us-west1-gcp-free` or similar
- **Index Name** - Should be `crypto-knowledge` (where book is loaded)

### 2. Verify Book Content is Loaded
```bash
# Check Pinecone console or via API:
curl -X GET "https://api.pinecone.io/indexes" \
  -H "Api-Key: YOUR_PINECONE_API_KEY"
```

Should return index with:
- Name: `crypto-knowledge`
- Dimensions: 3072 (text-embedding-3-large)
- Vectors: Should contain book embeddings

---

## Testing Workflow

### Phase 1: Credential Setup (5 min)
1. Retrieve Pinecone API key from secure storage
2. Update `.env` with real credentials:
   ```bash
   PINECONE_API_KEY=<your-key>
   PINECONE_ENVIRONMENT=us-west1-gcp-free
   PINECONE_INDEX_NAME=crypto-knowledge
   ```
3. Also update OpenAI key if not already set:
   ```bash
   OPENAI_API_KEY=sk-<your-openai-key>
   ```

### Phase 2: Service Initialization (10 min)
1. Rebuild Docker image with new environment:
   ```bash
   docker compose build api
   ```
2. Restart containers:
   ```bash
   docker compose down && docker compose up -d db redis api
   ```
3. Check logs for initialization:
   ```bash
   docker logs crypto-knowledge-api-api-1 | grep -E "(Pinecone|embedding)"
   ```

### Phase 3: Health Check (5 min)
```bash
# Should now show all services healthy
curl http://localhost:8000/health | jq .
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-03-21T...",
  "services": {
    "redis": "healthy",
    "database": "healthy",
    "pinecone": "healthy"
  }
}
```

### Phase 4: Search Endpoint Testing (15 min)

#### Test 4a: Query Without Payment (Expect 402)
```bash
curl -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is Bitcoin?",
    "tier": "explanation",
    "max_results": 3
  }'
```

Expected response: **HTTP 402 Payment Required**
```json
{
  "error": "Payment required",
  "payment": {
    "chainId": 8453,
    "to": "0x28e6b3e3e32308787f50e6d99e2b98745b381946",
    "amount": "5000",
    "currency": "USDC"
  },
  "price_usd": 0.005
}
```

#### Test 4b: Query With Mock Payment (If Available)
```bash
# With valid X402 payment header
curl -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -H "x-payment: <valid-x402-header>" \
  -d '{
    "query": "What is Bitcoin?",
    "tier": "explanation",
    "max_results": 3
  }'
```

Expected response: **HTTP 200 OK**
```json
{
  "query": "What is Bitcoin?",
  "tier": "explanation",
  "results": [
    {
      "chapter": "1",
      "section": "Introduction",
      "content": "Bitcoin is a decentralized digital currency...",
      "relevance_score": 0.95
    }
  ],
  "total_results": 3,
  "processing_time_ms": 245,
  "cost_usd": 0.005,
  "citations": [...]
}
```

### Phase 5: Concept Endpoints (10 min)

#### Test Concept Explanation
```bash
curl "http://localhost:8000/api/v1/concepts/Bitcoin?tier=explanation" \
  -H "x-payment: <valid-header>"
```

#### Test Concept Comparison
```bash
curl "http://localhost:8000/api/v1/compare?concept1=Bitcoin&concept2=Ethereum&tier=analysis" \
  -H "x-payment: <valid-header>"
```

#### Test Topic Timeline
```bash
curl "http://localhost:8000/api/v1/timeline/Bitcoin?tier=analysis" \
  -H "x-payment: <valid-header>"
```

### Phase 6: Analytics Verification (5 min)

After successful queries, check Redis for analytics:
```bash
# Connect to Redis
docker exec -it crypto-knowledge-api-redis-1 redis-cli

# Check daily query count
GET analytics:daily:2026-03-21:count

# Check tier breakdown
GET analytics:daily:2026-03-21:tier:explanation
GET analytics:daily:2026-03-21:tier:analysis
```

Should show incremented counters for each query.

---

## Troubleshooting

### Issue: "Invalid API Key" or Unauthorized
**Cause:** Wrong Pinecone credentials  
**Fix:** 
1. Verify credentials in `.env`
2. Test with Pinecone CLI: `pinecone list-indexes`
3. Check Pinecone console for active keys

### Issue: "Index not found"
**Cause:** Index doesn't exist or wrong name  
**Fix:**
1. Verify index `crypto-knowledge` exists in Pinecone
2. Check environment variable `PINECONE_INDEX_NAME` matches

### Issue: "Embedding dimension mismatch"
**Cause:** Model changed or index created with different dimension  
**Fix:**
1. Verify index dimension is 3072 (for text-embedding-3-large)
2. If different, delete and recreate index
3. Re-upload book content

### Issue: Database health check still failing
**Cause:** Async context manager not properly handled  
**Fix:** Apply this patch to `backend/app/core/database.py`:
```python
async def close(self):
    """Close all connections in the pool"""
    if self.pool:
        await self.pool.close()
```

---

## Expected Timings

| Test | Expected Duration | Notes |
|------|-------------------|-------|
| Credential setup | 5 min | One-time, if credentials not in pass |
| Docker rebuild | 2-5 min | Depends on cache |
| Service startup | 3-5 min | Including Pinecone init |
| Search query | 200-500ms | Including OpenAI embedding + Pinecone search |
| 402 payment check | 50-100ms | Fast validation |
| Analytics check | 50-100ms | Redis lookup |

**Total estimated testing time: 45 minutes to full validation**

---

## Success Criteria

✅ All tests passing when:
1. Health endpoint shows all services healthy
2. Search endpoint returns 402 without payment
3. Search endpoint returns valid results with payment header
4. Query is tracked in Redis analytics
5. Concept/comparison/timeline endpoints respond correctly
6. Processing times within expected ranges

---

## Next Steps After Success
1. Test X402 payment verification with real transaction (if available)
2. Load additional book chapters if needed
3. Performance testing with concurrent requests
4. Frontend integration with payment flow
5. Deploy to staging environment

---

## Documentation References
- Pinecone Docs: https://docs.pinecone.io
- OpenAI Embeddings: https://platform.openai.com/docs/guides/embeddings
- X402 Spec: https://www.3933.net/x402
- Project Repo: https://github.com/funcdude/crypto-knowledge-api
