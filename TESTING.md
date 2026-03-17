# 🧪 Local Testing Guide

Complete guide to test the Crypto Knowledge API locally before production deployment.

## 📋 Prerequisites

### 1. System Requirements
```bash
# Check required tools
docker --version          # Should be 20.0+
docker-compose --version  # Should be 1.25+
node --version            # Should be 18.0+
python3 --version         # Should be 3.11+
```

### 2. API Keys Required

#### **OpenAI API Key**
1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Copy key starting with `sk-`

#### **Pinecone API Key**
1. Go to https://app.pinecone.io/
2. Create account (free tier available)
3. Go to API Keys section
4. Copy API key and environment

#### **Optional: Bankr API Key**
```bash
# If you have Bankr CLI set up
bankr whoami

# Get API key from stored config
cat ~/.bankr/config.json
```

## 🛠️ Setup Process

### Step 1: Configure Environment

```bash
cd crypto-knowledge-api

# Copy environment template
cp .env.example .env

# Edit configuration (use your preferred editor)
nano .env
```

**Fill in these required values:**
```bash
# Required for basic functionality
OPENAI_API_KEY=sk-your-key-here
PINECONE_API_KEY=your-pinecone-key
PINECONE_ENVIRONMENT=us-west1-gcp-free

# Your payment wallet (use your Bankr wallet)
PAYMENT_ADDRESS=0x28e6b3e3e32308787f50e6d99e2b98745b381946

# Optional but recommended
BANKR_API_KEY=bk_your-bankr-key-if-available
```

### Step 2: Start Services

```bash
# Make deployment script executable
chmod +x scripts/deploy.sh

# Deploy locally with full logging
./scripts/deploy.sh local 2>&1 | tee deployment.log

# OR manually step by step:
docker-compose up -d --build
```

### Step 3: Wait for Services

```bash
# Monitor startup (should take 2-3 minutes)
docker-compose logs -f

# Check when all services are healthy
docker-compose ps
```

Expected output:
```
NAME                           STATUS
crypto-knowledge-api-api-1     Up (healthy)
crypto-knowledge-api-db-1      Up (healthy)  
crypto-knowledge-api-redis-1   Up (healthy)
crypto-knowledge-api-frontend-1 Up
```

## ✅ Testing Checklist

### 1. Service Health Checks

```bash
# API health check
curl http://localhost:8000/health
# Expected: {"status": "healthy", "timestamp": "..."}

# Database connection
curl http://localhost:8000/health/db
# Expected: {"database": "connected"}

# Redis connection  
curl http://localhost:8000/health/cache
# Expected: {"cache": "connected"}

# Frontend accessibility
curl -I http://localhost:3000
# Expected: HTTP/1.1 200 OK
```

### 2. API Documentation

```bash
# Open API docs in browser
open http://localhost:8000/docs

# Or test with curl
curl http://localhost:8000/
```

**Manual verification:**
- Go to http://localhost:8000/docs
- Should see interactive Swagger UI
- Try the "GET /" endpoint
- Should return API information

### 3. Payment System Testing

#### A. Test Payment Requirements (No Payment)
```bash
# Try querying without payment
curl "http://localhost:8000/api/v1/search?q=bitcoin&tier=snippet"
```

**Expected Response (HTTP 402):**
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

#### B. Test Pricing Endpoint (Free)
```bash
curl http://localhost:8000/api/v1/pricing
```

**Expected Response:**
```json
{
  "pricing_tiers": {
    "snippet": {"price": 0.001, "description": "Quick answer, 1-2 sentences"},
    "explanation": {"price": 0.005, "description": "Detailed explanation, 1-2 paragraphs"},
    "analysis": {"price": 0.01, "description": "Multi-concept analysis, comprehensive"},
    "chapter_summary": {"price": 0.02, "description": "Full chapter insights and context"}
  }
}
```

### 4. Knowledge Search (With Mock Content)

Since we don't have book content yet, the API will work but return empty results:

```bash
# Test search endpoint structure
curl "http://localhost:8000/api/v1/search?q=test&tier=snippet" \
  -H "X-Payment: mock-tx-hash"
```

Expected: Should process but return no results until content is added.

### 5. Frontend Testing

```bash
# Open frontend
open http://localhost:3000
```

**Manual Checklist:**
- [ ] Homepage loads correctly
- [ ] Header with API Docs link works
- [ ] Hero section displays properly
- [ ] Search demo interface appears
- [ ] Pricing display shows all tiers
- [ ] Footer links are functional
- [ ] Responsive design works on mobile

### 6. Container Testing

```bash
# Check container health
docker-compose ps

# Check logs for errors
docker-compose logs api | grep ERROR
docker-compose logs frontend | grep ERROR

# Resource usage
docker stats
```

### 7. Rate Limiting Test

```bash
# Test rate limiting (100 requests/minute)
for i in {1..5}; do
  curl -w "Status: %{http_code} Time: %{time_total}s\n" \
    "http://localhost:8000/api/v1/pricing"
done
```

Should all return status 200. Beyond 100 requests/minute should return 429.

## 🔧 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using ports 8000, 3000, 5432, 6379
sudo lsof -i :8000
sudo lsof -i :3000

# Stop conflicting services
sudo systemctl stop postgresql  # If system PostgreSQL running
sudo systemctl stop redis       # If system Redis running
```

#### 2. Docker Issues
```bash
# Clean up Docker
docker-compose down -v
docker system prune -f

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d
```

#### 3. Environment Variable Issues
```bash
# Check if environment loaded correctly
docker-compose exec api env | grep OPENAI_API_KEY
docker-compose exec api env | grep PINECONE_API_KEY

# If empty, check .env file syntax
cat .env | grep -E "^[^#].*="
```

#### 4. Database Connection Issues
```bash
# Connect to database directly
docker-compose exec db psql -U postgres -d crypto_knowledge

# Check if tables exist (will be empty initially)
\dt

# Exit PostgreSQL
\q
```

#### 5. Network Issues
```bash
# Check Docker network
docker network ls | grep crypto

# Check container connectivity
docker-compose exec api ping db
docker-compose exec api ping redis
```

### Detailed Debugging

#### Check API Logs
```bash
# Real-time API logs
docker-compose logs -f api

# Look for startup errors
docker-compose logs api | grep -E "(ERROR|CRITICAL|Failed)"

# Check specific service initialization
docker-compose logs api | grep -E "(Database|Redis|X402|Pinecone)"
```

#### Check Frontend Logs
```bash
# Frontend build logs
docker-compose logs frontend

# Check for Next.js errors
docker-compose logs frontend | grep -E "(error|Error|ERROR)"
```

#### Test Individual Services
```bash
# Test database directly
docker-compose exec db pg_isready -U postgres

# Test Redis
docker-compose exec redis redis-cli ping

# Test API without frontend
curl -v http://localhost:8000/health
```

## 📊 Performance Testing

### Basic Performance
```bash
# Test response times
time curl http://localhost:8000/api/v1/pricing

# Test concurrent requests
for i in {1..10}; do
  curl http://localhost:8000/health &
done
wait
```

### Memory Usage
```bash
# Monitor container resources
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Check individual service memory
docker-compose exec api free -h
```

## 🚀 Content Testing (When You Have Book PDFs)

### 1. Add Test Content
```bash
# Create data directory
mkdir -p data

# Add your book PDF (replace with actual filename)
cp /path/to/cryptocurrencies-decrypted.pdf data/

# Or create a test text file
echo "Bitcoin is a decentralized digital currency that operates without a central authority." > data/test-content.txt
```

### 2. Process Content
```bash
# Run content processor
docker-compose run --rm processor

# Check processing logs
docker-compose logs processor
```

### 3. Test Real Knowledge Search
```bash
# Test with real content (mock payment for testing)
curl "http://localhost:8000/api/v1/search?q=bitcoin&tier=explanation" \
  -H "X-Payment: test-tx-hash" \
  -w "\nStatus: %{http_code}\n"
```

Should return actual content from your book!

## ✨ Success Criteria

### ✅ All Tests Passing
- [ ] All services healthy (api, db, redis, frontend)
- [ ] API docs accessible at http://localhost:8000/docs
- [ ] Frontend loads at http://localhost:3000
- [ ] Payment requirements working (HTTP 402 responses)
- [ ] Pricing endpoint returns correct tiers
- [ ] No errors in logs
- [ ] Rate limiting functional
- [ ] All Docker containers running

### ✅ Ready for Production
- [ ] Environment variables configured
- [ ] Services restart cleanly (`docker-compose restart`)
- [ ] Performance acceptable (< 2s response times)
- [ ] Memory usage reasonable (< 1GB total)
- [ ] Can process book content successfully
- [ ] Payment verification logic works

## 🎉 Next Steps After Successful Testing

1. **Add Real Content**: Process your book PDFs
2. **Test with Real Payments**: Use actual USDC transactions
3. **Deploy to Production**: Use Railway, Fly.io, or your server
4. **Monitor Performance**: Set up logging and analytics
5. **Launch Marketing**: Blog posts, social media, developer outreach

---

**Need Help?** Check the logs, review this guide, and don't hesitate to debug step by step. The system is designed to be robust and recoverable.