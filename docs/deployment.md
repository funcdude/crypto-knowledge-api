# Deployment — Railway

The simplest production path is Railway with GitHub auto-deploy. It provisions PostgreSQL and Redis automatically.

## Prerequisites

- Railway account (railway.app)
- GitHub repo connected to Railway
- Pinecone index with book content loaded (`crypto-knowledge`)

---

## Option A: GitHub auto-deploy (recommended)

1. Go to railway.app → New Project → Deploy from GitHub
2. Select `funcdude/crypto-knowledge-api`
3. Railway detects `Procfile` and deploys the backend
4. Add PostgreSQL: New → Database → PostgreSQL (sets `DATABASE_URL` automatically)
5. Add Redis: New → Database → Redis (sets `REDIS_URL` automatically)
6. Set environment variables (see below)
7. Redeploy — every push to `main` now auto-deploys

## Option B: Railway CLI

```bash
npm install -g @railway/cli
railway login
cd crypto-knowledge-api
railway init
railway up
```

---

## Required environment variables

Set these in Railway dashboard under **Settings → Variables**:

```
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=pcsk_...
PINECONE_INDEX_NAME=crypto-knowledge
PINECONE_ENVIRONMENT=us-east-1
PAYMENT_ADDRESS=0x28e6b3e3e32308787f50e6d99e2b98745b381946
X402_FACILITATOR_URL=https://facilitator.coinbase.com
SECRET_KEY=<random 32+ char string>
DEBUG=false
ALLOWED_HOSTS=<your-railway-domain>.railway.app
CORS_ORIGINS=https://<your-frontend-domain>
```

`DATABASE_URL` and `REDIS_URL` are set automatically when you add Railway's managed PostgreSQL and Redis.

Do **not** set `SKIP_PAYMENT_VERIFY=true` in production — the app will refuse to start if this is set while `DEBUG=false`.

---

## Verifying a deployment

```bash
RAILWAY_URL="https://your-app.railway.app"

# Health check
curl $RAILWAY_URL/health | jq .

# Confirm 402 enforcement
curl -s -X POST $RAILWAY_URL/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "What is Bitcoin?", "tier": "snippet"}' \
  -o /dev/null -w "%{http_code}"
# Expected: 402

# Pricing (free endpoint)
curl $RAILWAY_URL/api/v1/pricing | jq '.pricing_tiers | keys'
```

---

## Files required by Railway

Both are in the repo root:

- `requirements.txt` — Python dependencies
- `Procfile` — startup command: `web: cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`

---

## Common issues

**`requirements.txt` not found** — must be in repo root, not `backend/`. It's already there.

**Port configuration** — Railway sets `$PORT` automatically. The `Procfile` uses it. Never hardcode a port.

**502 Bad Gateway** — check Railway logs (dashboard → Logs). Usually a missing env variable or failed DB connection.

**First deploy is slow** — 5–10 minutes for the initial build. Subsequent deploys are faster.

**Database connection fails** — use Railway's built-in PostgreSQL (it sets `DATABASE_URL` automatically). If using an external DB, verify the connection string.

---

## Rollback

Dashboard → Deployments tab → select a previous deployment → Redeploy.

---

## Monitoring

- **Logs:** `railway logs` or dashboard → Logs tab
- **Health check:** configure in Railway Settings → Health Check → path `/health`
- **Metrics:** dashboard → Metrics tab (CPU, memory, requests)
