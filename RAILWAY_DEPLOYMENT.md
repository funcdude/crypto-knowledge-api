# Railway Deployment Guide

## Quick Start

### 1. Install Railway CLI (One-time)
```bash
npm install -g @railway/cli
```

Or use Homebrew:
```bash
brew install railway
```

### 2. Login to Railway
```bash
railway login
```
Opens browser for authentication

### 3. Initialize Project
```bash
cd ~/crypto-knowledge-api
railway init
```
Creates `.railway/` directory and configures project

### 4. Deploy
```bash
railway up
```

Railway will:
- Detect Python app from `requirements.txt`
- Read `Procfile` for startup command
- Build Docker image
- Deploy to Railway infrastructure
- Provide public URL

---

## Manual Setup (Alternative to CLI)

### Via GitHub Auto-Deploy (Recommended)
1. Go to https://railway.app/
2. Click "New Project" → "Deploy from GitHub"
3. Connect your GitHub account
4. Select `crypto-knowledge-api` repo
5. Railway auto-deploys on every push
6. Set environment variables in dashboard

---

## Environment Variables Required

Set these in Railway dashboard: **Settings → Variables**

### Required Variables

```
# Pinecone Configuration
PINECONE_API_KEY=your-pinecone-api-key-here
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=crypto-knowledge

# Database (Railway provides PostgreSQL)
DATABASE_URL=postgresql://user:pass@host:5432/crypto_knowledge
# OR use Railway's built-in PostgreSQL

# Redis (Railway provides Redis)
REDIS_URL=redis://user:pass@host:6379/0
# OR use Railway's built-in Redis

# OpenAI (for embeddings)
OPENAI_API_KEY=sk_your_key_here

# Bankr/Payment
BANKR_API_KEY=bk_your_key_here
PAYMENT_ADDRESS=0x28e6b3e3e32308787f50e6d99e2b98745b381946

# X402 Configuration
X402_FACILITATOR_URL=https://facilitator.coinbase.com

# Application
SECRET_KEY=your-random-secret-key
DEBUG=false
```

---

## Setup Steps with Railway Dashboard

### 1. Create Project
```
railway.app → New Project → Deploy from GitHub → Select repo
```

### 2. Connect Services
Railway can auto-provision:
- PostgreSQL database
- Redis cache
- App service for API

Or configure existing:
- Your Pinecone index
- Your Bankr wallet

### 3. Configure Variables
```
Settings → Variables → Add each required variable
```

### 4. Connect GitHub
```
GitHub repo integration → Enable auto-deploy
```

Now every push to main branch auto-deploys!

---

## Adding Railway Services

### PostgreSQL Database
```
New → Database → PostgreSQL
```
Railway automatically sets `DATABASE_URL`

### Redis Cache
```
New → Database → Redis
```
Railway automatically sets `REDIS_URL`

### App Service
```
New → Dockerfile (if not using git auto-deploy)
```

---

## Environment Variables from Railway Services

When you add PostgreSQL and Redis via Railway:

**PostgreSQL:**
```
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]
```

**Redis:**
```
REDIS_URL=redis://[default]:[password]@[host]:[port]
```

These are automatically provided by Railway.

---

## Deployment Checklist

- [ ] `requirements.txt` in repo root
- [ ] `Procfile` in repo root  
- [ ] GitHub repo is public or Railway has access
- [ ] Railway account created
- [ ] Railway CLI installed (if using CLI)
- [ ] Project initialized (`railway init`)
- [ ] All environment variables set
- [ ] PostgreSQL service created (or external configured)
- [ ] Redis service created (or external configured)
- [ ] GitHub auto-deploy enabled (recommended)
- [ ] Test deployment with curl

---

## Testing Deployed App

Once Railway deploys and provides a URL:

### 1. Check It's Running
```bash
curl https://your-app.railway.app/health | jq .
```

Should show:
```json
{
  "status": "healthy",
  "services": {
    "redis": "healthy",
    "database": "healthy"
  }
}
```

### 2. Test Payment Enforcement
```bash
curl -X POST https://your-app.railway.app/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "What is Bitcoin?", "tier": "explanation"}'
```

Should get **HTTP 402** with payment requirement:
```json
{
  "detail": {
    "error": "Payment required",
    "payment": {
      "chainId": 8453,
      "to": "0x28E6b3e3E32308787F50e6D99e2B98745b381946",
      "amount": "5000",
      "currency": "USDC"
    }
  }
}
```

### 3. Check Logs
Railway dashboard → Select your app → Logs tab
Shows live deployment and runtime logs

---

## Common Issues & Solutions

### Issue: `requirements.txt` not found
**Solution:** File must be in repo root (not in `backend/`)
```bash
cp backend/requirements.txt ./
git add requirements.txt
```

### Issue: `Procfile` not recognized
**Solution:** Must be in repo root, correct format:
```
web: cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Issue: Port configuration
**Solution:** Use `$PORT` environment variable (Railway sets this)
Never hardcode port numbers

### Issue: Database connection fails
**Solution:** 
- Use Railway's built-in PostgreSQL
- Or provide full `DATABASE_URL`
- Check variable is set: `echo $DATABASE_URL`

### Issue: Timeout during deployment
**Solution:**
- First deployment may take 5-10 minutes
- Check build logs in Railway dashboard
- Ensure `requirements.txt` is valid

### Issue: 502 Bad Gateway
**Solution:**
- Check app logs: Dashboard → Logs
- Verify all environment variables are set
- Ensure `Procfile` is correct
- Restart service: Dashboard → Redeploy

---

## Auto-Deploy Setup (Recommended)

### GitHub Integration
1. Go to https://railway.app/
2. Click your project
3. Settings → GitHub Integration
4. Connect your GitHub account
5. Select `crypto-knowledge-api` repo
6. Choose branch (main)
7. Enable auto-deploy

**Result:** Every push triggers deployment automatically

### Disable Auto-Deploy
Settings → GitHub Integration → Disconnect

---

## Manual Deploy via CLI

### Step-by-Step

```bash
# 1. Login
railway login

# 2. Navigate to repo
cd ~/crypto-knowledge-api

# 3. Initialize project
railway init

# 4. Set variables (from CLI)
railway variables set PINECONE_API_KEY=pcsk_...
railway variables set PINECONE_ENVIRONMENT=us-east-1
# ... etc for all variables

# 5. Deploy
railway up

# 6. View logs
railway logs

# 7. Get URL
railway status
```

---

## Monitoring & Management

### View Logs
```bash
railway logs
# or in dashboard: Logs tab
```

### View Metrics
Dashboard → Metrics tab
- CPU usage
- Memory usage
- Request count
- Error rate

### Redeploy
```bash
railway up
# or Dashboard → Redeploy button
```

### Environment Variables
```bash
# View
railway variables get PINECONE_API_KEY

# Set
railway variables set KEY=value

# In dashboard: Settings → Variables
```

---

## Cost Estimation

Railway offers free tier with limits:
- 5GB/month bandwidth free
- PostgreSQL 100MB free
- Redis 100MB free
- CPU limits apply

Paid tier starts at $5/month for more resources.

For production:
- Expect ~$20-50/month for typical usage
- Scales up with traffic

---

## Production Best Practices

### 1. Use Health Checks
Railway can auto-restart if health checks fail
```
Settings → Health Check → /health
```

### 2. Enable Auto-Scaling
```
Settings → Scaling → Enable auto-scaling
```

### 3. Set Up Monitoring
- Enable error tracking
- Set up alerts
- Monitor request rates

### 4. Regular Backups
- Enable PostgreSQL backups
- Test recovery procedures

### 5. Security
- Use strong SECRET_KEY
- Never commit secrets
- Use Railway environment variables
- Enable HTTPS (automatic)

---

## Rollback & Recovery

### Rollback to Previous Deployment
```
Dashboard → Deployments tab → Select previous → Redeploy
```

### View Deployment History
```
Dashboard → Deployments tab
```

Shows all past deployments with:
- Deployment time
- Status
- Git commit
- Ability to redeploy

---

## Support & Resources

### Railway Documentation
https://docs.railway.app/

### Common Guides
- Python deployment: https://docs.railway.app/guides/python
- PostgreSQL: https://docs.railway.app/databases/postgresql
- Redis: https://docs.railway.app/databases/redis
- Environment variables: https://docs.railway.app/develop/variables

### Community
- Discord: https://discord.gg/railway
- GitHub: https://github.com/railwayapp

---

## Quick Commands Reference

```bash
# Setup
npm install -g @railway/cli
railway login
cd ~/crypto-knowledge-api
railway init

# Deploy
railway up

# Manage
railway logs
railway variables set KEY=value
railway variables get KEY
railway status

# Rollback
# Use dashboard: Deployments tab

# Clean up
railway down  # Removes all services
```

---

## Files Required

✅ `requirements.txt` — Python dependencies (in repo root)
✅ `Procfile` — Startup command (in repo root)
✅ `.gitignore` — Excludes `.env` and secrets
✅ Environment variables — Set in Railway dashboard

---

## Deployment Complete

Once deployed on Railway:

✅ API running on public HTTPS URL
✅ PostgreSQL database connected
✅ Redis cache configured
✅ Pinecone integration active
✅ X402 payments working
✅ Auto-deploy on GitHub push
✅ Monitoring and logs available
✅ Auto-restart on failures

**Your book knowledge service is live!** 🚀

---

## Testing Deployed Service

```bash
# Replace with your Railway URL
RAILWAY_URL="https://your-app.railway.app"

# Test 1: Health check
curl $RAILWAY_URL/health | jq .

# Test 2: API info
curl $RAILWAY_URL/ | jq .

# Test 3: 402 Payment Required
curl -X POST $RAILWAY_URL/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query":"Bitcoin"}'

# Test 4: Pricing
curl $RAILWAY_URL/api/v1/pricing | jq .
```

All should work identically to local testing!
