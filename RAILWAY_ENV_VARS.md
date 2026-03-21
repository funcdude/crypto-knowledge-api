# Railway Environment Variables Checklist

## Minimum Required (5 variables + 2 services)

### Critical Variables
```
OPENAI_API_KEY = sk-your-actual-key
PINECONE_API_KEY = pcsk_2xRuJP_3i4UubNK8v7KkLVfPGC96kJcTznjjmDtxGVtf7bpSSuKp6c7i47YugSofy2bkf4
PINECONE_ENVIRONMENT = us-east-1
PAYMENT_ADDRESS = 0x28e6b3e3e32308787f50e6d99e2b98745b381946
SECRET_KEY = <generate with: python -c "import secrets; print(secrets.token_urlsafe(50))">
```

### Services to Add (in Railway dashboard)
1. **PostgreSQL** — Railway auto-sets `DATABASE_URL`
2. **Redis** — Railway auto-sets `REDIS_URL`

---

## Full Configuration (Recommended)

Add these additional variables for complete setup:

```
# Pinecone
PINECONE_INDEX_NAME = crypto-knowledge

# Payment & Blockchain
X402_FACILITATOR_URL = https://facilitator.coinbase.com
BANKR_API_KEY = <from: pass api/bankr/api-key>

# Application
DEBUG = false
ALLOWED_HOSTS = localhost,127.0.0.1,your-domain.com
CORS_ORIGINS = https://your-frontend.com

# Content (optional - defaults provided)
BOOK_TITLE = Cryptocurrencies Decrypted: Hope and Economic Freedom for a Broken Financial System
BOOK_AUTHOR = Oskar Hurme

# Pricing (optional - defaults provided)
PRICE_SNIPPET = 0.001
PRICE_EXPLANATION = 0.005
PRICE_ANALYSIS = 0.01
PRICE_CHAPTER_SUMMARY = 0.02

# Performance (optional - defaults fine)
MAX_CHUNK_SIZE = 1000
MAX_QUERY_LENGTH = 500
CACHE_TTL = 3600
RATE_LIMIT_PER_MINUTE = 100
```

---

## Setup Steps

### 1. In Railway Dashboard
1. Go to https://railway.app/
2. Select your project
3. Click **Settings** (⚙️)
4. Scroll to **Environment**
5. Click **Add Variable**
6. Enter: `KEY = VALUE`
7. Press Enter
8. Repeat for each variable

### 2. Add Services
1. Click **New** button
2. Select **PostgreSQL** → Railway auto-configures `DATABASE_URL`
3. Click **New** button again
4. Select **Redis** → Railway auto-configures `REDIS_URL`

### 3. Deploy
1. Click **Deploy** button
2. Wait 5-10 minutes (first build is slower)
3. Check **Logs** tab for any errors
4. Get your public URL

### 4. Test
```bash
curl https://your-app.railway.app/health
```

Should return healthy status with all services.

---

## Key Notes

- **OPENAI_API_KEY**: Get from https://platform.openai.com/api-keys
- **PINECONE_API_KEY**: Already saved in `pass api/pinecone/api-key`
- **BANKR_API_KEY**: Saved in `pass api/bankr/api-key`
- **SECRET_KEY**: Generate random (don't reuse elsewhere)
- **PAYMENT_ADDRESS**: Your Bankr wallet (provided)
- **DATABASE_URL**: Railway auto-sets if you add PostgreSQL service
- **REDIS_URL**: Railway auto-sets if you add Redis service

---

## Variables Source Reference

| Variable | Source | Notes |
|----------|--------|-------|
| OPENAI_API_KEY | https://platform.openai.com/api-keys | Must start with `sk-` |
| PINECONE_API_KEY | `pass api/pinecone/api-key` | Already saved ✓ |
| PINECONE_ENVIRONMENT | us-east-1 | Fixed |
| PAYMENT_ADDRESS | 0x28e6b3e3e32308787f50e6d99e2b98745b381946 | Your wallet |
| BANKR_API_KEY | `pass api/bankr/api-key` | Optional but recommended |
| SECRET_KEY | Generate new | Use: `python -c "import secrets; print(secrets.token_urlsafe(50))"` |
| DATABASE_URL | Railway auto-sets | Add PostgreSQL service |
| REDIS_URL | Railway auto-sets | Add Redis service |

---

## After Deployment

Once Railway gives you a public URL:

```bash
# Test health endpoint
curl https://your-app.railway.app/health | jq .

# Test 402 payment enforcement
curl -X POST https://your-app.railway.app/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Bitcoin", "tier": "explanation"}'

# Check pricing
curl https://your-app.railway.app/api/v1/pricing | jq .
```

All endpoints should work identically to local testing!

---

## Troubleshooting

### Build fails?
- Check Logs tab in Railway dashboard
- Ensure `requirements.txt` and `Procfile` exist in repo root
- Ensure `src/lib/utils.ts` exists (already added ✓)

### API won't start?
- Check that all CRITICAL variables are set
- Verify OPENAI_API_KEY starts with `sk-`
- Verify PAYMENT_ADDRESS is 42 characters (0x + 40 hex)
- Check Logs for specific error messages

### Database connection errors?
- Ensure PostgreSQL service was added to Railway
- Or ensure external DATABASE_URL is correct
- Format: `postgresql://user:password@host:port/db`

### Still having issues?
- Check Railway Logs tab for detailed error messages
- Verify all variable values are correct
- Ensure no typos in variable names (case-sensitive!)

---

**Status**: Ready to deploy! 🚀

Once all variables are set in Railway dashboard, click Deploy and your API goes live!
