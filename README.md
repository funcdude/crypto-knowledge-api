# Crypto Knowledge API 🚀

> **The First AI-Monetized Book**  
> Transform "Cryptocurrencies Decrypted" into an AI-accessible knowledge service using X402 micropayments

## 🎯 Overview

This project creates an AI-powered API that monetizes expert crypto knowledge from Oskar Hurme's book "Cryptocurrencies Decrypted" using X402 micropayments. AI agents can access expert analysis for $0.001-0.02 USDC per query, paid instantly on Base L2.

### Key Features

- 🧠 **Expert Knowledge**: Content from a fintech practitioner, not AI-generated responses
- ⚡ **X402 Micropayments**: Pay-per-use with USDC on Base L2 (~2s settlement)
- 🤖 **AI-Native**: Designed for autonomous AI agents (no API keys required)
- 🔍 **Semantic Search**: Vector-based knowledge retrieval with Pinecone
- 📊 **Tiered Pricing**: From $0.001 snippets to $0.02 chapter summaries
- 🚀 **Production Ready**: Docker deployment, monitoring, caching, rate limiting

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   AI Agent      │───▶│  X402 Payment    │───▶│   Knowledge     │
│   (Client)      │    │   Gateway        │    │   Service       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │  Base L2        │    │   Vector DB     │
                       │  (USDC)         │    │  (Pinecone)     │
                       └─────────────────┘    └─────────────────┘
```

### Tech Stack

**Backend:**
- FastAPI with async Python
- PostgreSQL + Redis
- OpenAI embeddings + Pinecone vector DB
- Web3.py for blockchain integration
- X402 payment verification

**Frontend:**
- Next.js 14 with TypeScript
- Tailwind CSS for styling
- Interactive API demo

**Infrastructure:**
- Docker containers
- Docker Compose for local development
- Railway/Fly.io deployment ready

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- OpenAI API key
- Pinecone account
- USDC wallet on Base L2 (for receiving payments)

### 1. Clone & Setup

```bash
git clone https://github.com/yourusername/crypto-knowledge-api.git
cd crypto-knowledge-api

# Copy environment template
cp .env.example .env

# Edit configuration
nano .env  # Add your API keys and wallet address
```

### 2. Configure Environment

```bash
# Required API Keys
OPENAI_API_KEY=sk-your-openai-key
PINECONE_API_KEY=your-pinecone-key
PINECONE_ENVIRONMENT=us-west1-gcp-free

# Payment Configuration  
PAYMENT_ADDRESS=0x28e6b3e3e32308787f50e6d99e2b98745b381946  # Your Base wallet
X402_FACILITATOR_URL=https://facilitator.coinbase.com

# Optional: Bankr Integration
BANKR_API_KEY=bk_your-bankr-key  # For enhanced payment processing
```

### 3. Deploy Locally

```bash
# Run deployment script
./scripts/deploy.sh local

# Or manually with Docker Compose
docker-compose up -d --build
```

### 4. Access Services

- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Frontend Demo**: http://localhost:3000
- **Health Check**: http://localhost:8000/health

## 📖 Book Content Setup

To populate the knowledge base with your book content:

### 1. Prepare Content

```bash
# Create data directory
mkdir -p data

# Add your book PDF(s)
cp /path/to/cryptocurrencies-decrypted.pdf data/

# Optional: Add additional content files
cp /path/to/supplementary-content.pdf data/
```

### 2. Process Content

```bash
# Run content processing
docker-compose run --rm processor

# Or run directly if you have the environment set up
python -m app.scripts.process_book
```

### 3. Verify Content

```bash
# Check Pinecone index stats
curl http://localhost:8000/api/v1/search?q="bitcoin"&tier=snippet

# Should return relevant content with pricing
```

## 💰 X402 Payment Flow

### How It Works

1. **AI Agent Query**: Agent makes API request
2. **Payment Required**: API returns HTTP 402 with payment details
3. **USDC Payment**: Agent pays on Base L2 using X402 protocol
4. **Content Delivery**: API verifies payment and returns knowledge
5. **Settlement**: Payment settles in ~2 seconds

### Example Integration

```python
import httpx
import asyncio

async def query_crypto_knowledge(query: str, tier: str = "explanation"):
    """Query the Crypto Knowledge API with X402 payments"""
    
    url = "http://localhost:8000/api/v1/search"
    params = {"q": query, "tier": tier}
    
    async with httpx.AsyncClient() as client:
        # Initial request
        response = await client.get(url, params=params)
        
        if response.status_code == 402:
            # Payment required
            payment_info = response.json()
            
            # Make USDC payment (using your preferred method)
            tx_hash = await pay_with_usdc(payment_info["payment"])
            
            # Retry with payment proof
            headers = {"X-Payment": tx_hash}
            response = await client.get(url, params=params, headers=headers)
        
        return response.json()

# Usage
result = await query_crypto_knowledge("How does Bitcoin mining work?")
print(result["results"][0]["content"])
```

### MCP Server Integration

```bash
# Install the MCP server for Claude Desktop
npm install crypto-knowledge-mcp

# Add to Claude Desktop config
{
  "mcpServers": {
    "crypto-knowledge": {
      "command": "npx",
      "args": ["crypto-knowledge-mcp"],
      "env": {
        "API_URL": "http://localhost:8000",
        "WALLET_PRIVATE_KEY": "your-private-key"
      }
    }
  }
}
```

## 🛠️ Development

### Local Development Setup

```bash
# Install backend dependencies
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Install frontend dependencies
cd ..
npm install

# Run services separately
# Terminal 1: Backend
uvicorn app.main:app --reload

# Terminal 2: Frontend  
npm run dev

# Terminal 3: Database & Redis
docker-compose up -d db redis
```

### Code Quality

```bash
# Setup linting (using tech-lead skill)
./tech-lead/scripts/setup-linting.sh

# Run code analysis
./tech-lead/scripts/analyze-codebase.py ./backend

# Format code
cd backend
black . && isort .

cd ..
npm run format
```

### Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd ..
npm test

# Integration tests
npm run test:e2e
```

## 📊 API Reference

### Pricing Tiers

| Tier | Price | Description | Max Tokens | Use Case |
|------|--------|-------------|------------|----------|
| `snippet` | $0.001 | Quick answer, 1-2 sentences | 100 | Fact checking |
| `explanation` | $0.005 | Detailed explanation, 1-2 paragraphs | 300 | Concept understanding |
| `analysis` | $0.01 | Multi-concept analysis | 800 | Complex analysis |
| `chapter_summary` | $0.02 | Full chapter insights | 1500 | Deep research |

### Endpoints

#### Search Knowledge
```http
GET /api/v1/search?q={query}&tier={tier}&topics={topics}&complexity={level}
POST /api/v1/search
```

#### Specific Concepts
```http
GET /api/v1/concepts/{concept}?tier={tier}
```

#### Compare Concepts
```http
GET /api/v1/compare?concept1={c1}&concept2={c2}&tier={tier}
```

#### Topic Timeline
```http
GET /api/v1/timeline/{topic}?tier={tier}
```

#### Pricing Info (Free)
```http
GET /api/v1/pricing
```

### Response Format

```json
{
  "query": "How does Bitcoin mining work?",
  "tier": "explanation", 
  "results": [
    {
      "content": "Bitcoin mining is the process...",
      "relevance_score": 0.95,
      "chapter": "Part 3: Crypto Solutions",
      "topics": ["bitcoin", "mining", "proof-of-work"],
      "source": {
        "book": "Cryptocurrencies Decrypted",
        "author": "Oskar Hurme"
      }
    }
  ],
  "cost_usd": 0.005,
  "processing_time_ms": 245,
  "book_metadata": {
    "title": "Cryptocurrencies Decrypted",
    "amazon_url": "https://amazon.com/dp/B0DQXC7XVJ"
  }
}
```

## 🚀 Deployment

### Production Deployment

#### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway up
```

#### Fly.io
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Deploy
flyctl launch
flyctl deploy
```

#### Manual Server
```bash
# Build production images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Deploy to your server
scp -r . user@your-server:/opt/crypto-knowledge-api
ssh user@your-server "cd /opt/crypto-knowledge-api && ./scripts/deploy.sh production"
```

### Environment Configuration

```bash
# Production environment variables
export DATABASE_URL="postgresql://user:pass@prod-db:5432/crypto_knowledge"
export REDIS_URL="redis://prod-redis:6379/0"
export ALLOWED_HOSTS="yourdomain.com,api.yourdomain.com"
export CORS_ORIGINS="https://yourdomain.com"
export DEBUG=false

# Monitoring
export SENTRY_DSN="your-sentry-dsn"
```

## 📈 Monitoring & Analytics

### Health Monitoring
```bash
# Service health
curl http://localhost:8000/health

# Database status
curl http://localhost:8000/health/db

# Payment system status  
curl http://localhost:8000/health/payments
```

### Analytics Dashboard

The API includes built-in analytics for:
- Query volume and revenue
- Popular topics and concepts
- User agent analysis (AI vs human)
- Payment success rates
- Response times

Access at: `http://localhost:8000/admin/analytics`

## 💡 Business Model

### Revenue Streams

1. **Direct API Revenue**: $0.001-0.02 per query
2. **Book Sales Attribution**: Drive sales to Amazon
3. **Enterprise Licensing**: Bulk usage agreements
4. **Consulting Leads**: From API users needing custom solutions

### Projected Economics

**Conservative (Year 1):**
- 10K queries/month × $0.005 avg = $50/month
- Book attribution: +50 sales/month = +$500/month
- **Total: ~$6.6K/year**

**Moderate (Year 2):**  
- 100K queries/month × $0.005 avg = $500/month
- Book attribution: +200 sales/month = +$2K/month
- Enterprise deals: $5K/quarter
- **Total: ~$50K/year**

**Optimistic (Year 3):**
- 1M queries/month × $0.005 avg = $5K/month
- Book + consulting pipeline: $20K/month
- Platform partnerships: $50K/quarter
- **Total: ~$500K/year**

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and test
4. Run code quality checks: `./scripts/quality-check.sh`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

## 📞 Support

- **Documentation**: [API Docs](http://localhost:8000/docs)
- **Issues**: [GitHub Issues](https://github.com/yourusername/crypto-knowledge-api/issues)
- **Email**: support@crypto-knowledge-api.com
- **Twitter**: [@CryptoKnowledgeAPI](https://twitter.com/CryptoKnowledgeAPI)

## 🎯 Roadmap

### Phase 1 (Current) ✅
- [x] Core API with X402 payments
- [x] Semantic search with Pinecone
- [x] Docker deployment
- [x] Frontend demo

### Phase 2 (Q2 2026) 🚧
- [ ] MCP server for Claude Desktop
- [ ] Advanced analytics dashboard
- [ ] Multi-book support
- [ ] Enterprise API keys

### Phase 3 (Q3 2026) 📋
- [ ] Mobile app integration
- [ ] Advanced payment features (subscriptions, credits)
- [ ] AI agent marketplace listing
- [ ] Real-time collaboration features

### Phase 4 (Q4 2026) 🔮
- [ ] Multi-language support
- [ ] Voice interface
- [ ] Custom model fine-tuning
- [ ] White-label platform

---

**Built with ❤️ using the tech-lead skill and Bankr integration**

*Transforming expert knowledge into the AI economy, one micropayment at a time.*
