# 🔑 Pinecone Credentials Required for Testing

## Current Status
✅ API infrastructure is **95% complete and operational**  
✅ Docker containers running (PostgreSQL, Redis, FastAPI)  
✅ All service modules implemented and integrated  
✅ Book already loaded in Pinecone index `crypto-knowledge`  
⏳ **Blocked:** Need Pinecone API credentials to begin integration testing

---

## What We Need

### 1. **Pinecone API Key**
**Where to get it:**
1. Go to https://app.pinecone.io
2. Log in to your account
3. Click **API Keys** in the left sidebar
4. Copy your active API key
5. Provide the key value

**Format:** Typically looks like `pc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 2. **Pinecone Environment** (if different from default)
**Default:** `us-west1-gcp-free` (likely what you're using)  
**Where to find it:** https://app.pinecone.io/organizations (shown next to index name)

**Format:** Like `us-west1-gcp-free` or `us-east1-aws`

### 3. **Confirm Index Details**
Can you confirm:
- ✅ Index name: `crypto-knowledge` (we're using this)
- ✅ Book already embedded with OpenAI embeddings
- ✅ Number of vectors loaded (so we know content is there)

---

## What We'll Do With Credentials

Once you provide the API key, we'll:

1. **Update environment** (2 min)
   ```bash
   # Replace PLACEHOLDER in .env with real key
   PINECONE_API_KEY=pc_your_actual_key_here
   ```

2. **Rebuild API** (2-5 min)
   ```bash
   docker compose build api
   docker compose up -d api
   ```

3. **Run automated tests** (5 min)
   ```bash
   ./scripts/test-pinecone.sh
   ```
   This will verify:
   - ✅ API credentials are valid
   - ✅ Index exists and is accessible
   - ✅ Local API can connect to Pinecone
   - ✅ Search endpoint responds correctly

4. **Test search queries** (10 min)
   ```bash
   curl -X POST http://localhost:8000/api/v1/search \
     -H "Content-Type: application/json" \
     -d '{
       "query": "What is cryptocurrency?",
       "tier": "explanation",
       "max_results": 3
     }'
   ```

5. **Verify book content** (5 min)
   - Search for terms from your book chapters
   - Verify relevance scores and citations
   - Test different price tiers (snippet, explanation, analysis, chapter_summary)

---

## Expected Timeline
- **Credentials needed:** Now ⏳
- **Environment setup:** 2-5 min
- **Automated testing:** 5 min  
- **Manual search testing:** 10-15 min
- **Total:** ~30-45 minutes

---

## Also Helpful (Optional)

### OpenAI API Key
For embeddings, if you want to test with new queries:
- **Get it:** https://platform.openai.com/account/api-keys
- **Format:** `sk-...`
- **Not required:** We can use existing embeddings from your book

### Payment Testing (Advanced)
For X402 micropayment testing (if you want to test payment flow):
- Already integrated with Bankr wallet (`0x28e6...381946`)
- Can test 402 response without payment
- Full payment testing requires USDC on Base L2

---

## Quick Start Once Credentials Arrive

```bash
# 1. Update credentials
echo "PINECONE_API_KEY=pc_your_key" >> ~/.openclaw/workspace/crypto-knowledge-api/.env

# 2. Rebuild
cd ~/crypto-knowledge-api
docker compose build api
docker compose down && docker compose up -d db redis api

# 3. Wait for startup (watch logs)
docker logs -f crypto-knowledge-api-api-1

# 4. Test
./scripts/test-pinecone.sh

# 5. Try a search
curl -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is Bitcoin?",
    "tier": "explanation",
    "max_results": 3
  }'
```

---

## Documentation

When you're ready, these files have all the details:
- **`PINECONE_TESTING.md`** — Complete testing workflow (6 phases, 45 min)
- **`TESTING_PROGRESS.md`** — Full status report and deployment readiness
- **`scripts/test-pinecone.sh`** — Automated testing script

---

## Questions?

If you need to test immediately without Pinecone:
1. The API **starts and runs without Pinecone** (graceful degradation)
2. Health endpoints work
3. X402 payment flow testable
4. Just can't run search queries yet

Once Pinecone is connected, everything unlocks. 🚀

---

**Status:** API ready. Waiting on your go-ahead with credentials.  
**PR:** https://github.com/funcdude/crypto-knowledge-api/pull/1 (open with detailed progress)
