# 🚀 Quick Start - 5 Minutes to Running API

Get the Crypto Knowledge API running locally in 5 minutes.

## ⚡ Super Quick Setup

### 1. Prerequisites Check
```bash
# Verify you have these installed:
docker --version     # Need 20.0+
docker-compose --version  # Need 1.25+
```

### 2. Get API Keys (2 minutes)

#### OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-`)

#### Pinecone API Key  
1. Go to https://app.pinecone.io/ (free tier available)
2. Sign up/login
3. Go to "API Keys" in left sidebar
4. Copy API key and environment name

### 3. Configure & Start (2 minutes)
```bash
# Clone and enter directory
git clone https://github.com/funcdude/crypto-knowledge-api.git
cd crypto-knowledge-api

# Setup environment
cp .env.example .env

# Edit with your API keys (nano/vim/code/etc.)
nano .env
```

**Fill in these 3 required lines:**
```bash
OPENAI_API_KEY=sk-your-key-here
PINECONE_API_KEY=your-pinecone-key  
PINECONE_ENVIRONMENT=us-west1-gcp-free
```

### 4. Deploy & Test (1 minute)
```bash
# Start everything
./scripts/deploy.sh local

# Or run comprehensive tests
./scripts/test-local.sh
```

## ✅ Success Check

Visit these URLs:
- **API Docs**: http://localhost:8000/docs
- **Frontend Demo**: http://localhost:3000  
- **Health Check**: http://localhost:8000/health

### Test Payment Flow
```bash
# Try a query (should return HTTP 402 Payment Required)
curl "http://localhost:8000/api/v1/search?q=bitcoin&tier=snippet"
```

Expected response:
```json
{
  "detail": {
    "error": "Payment required",
    "payment": {
      "chainId": 8453,
      "to": "0x28e6b3e3e32308787f50e6d99e2b98745b381946",
      "amount": "1000",
      "currency": "USDC"
    },
    "price_usd": 0.001
  }
}
```

## 🎉 You're Done!

Your AI-Powered Crypto Knowledge API is now running with:
- ✅ X402 payment system ready
- ✅ Semantic search infrastructure  
- ✅ USDC payment processing on Base L2
- ✅ Interactive API documentation
- ✅ Frontend demo interface

## 🔄 Next Steps

### Add Content (Optional)
```bash
# Add your book PDFs
mkdir -p data
cp /path/to/your-book.pdf data/

# Process content
docker-compose run --rm processor
```

### Test With Real Payments
- Fund your Bankr wallet with USDC on Base
- Use real transaction hashes in X-Payment header
- Verify blockchain payment processing

### Deploy to Production
```bash
# Deploy to Railway, Fly.io, or your server
./scripts/deploy.sh production
```

## 🆘 Troubleshooting

### Services Won't Start
```bash
# Check logs
docker-compose logs -f

# Restart clean
docker-compose down -v
docker-compose up -d --build
```

### API Keys Issues
```bash
# Check environment variables loaded
docker-compose exec api env | grep OPENAI_API_KEY
docker-compose exec api env | grep PINECONE_API_KEY
```

### Need Help?
- See **TESTING.md** for detailed testing guide
- Check **README.md** for complete documentation
- Review Docker logs: `docker-compose logs`

---

**Total Time: 5 minutes** ⏱️  
**Result: Production-ready AI knowledge API** 🚀