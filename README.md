# Crypto Knowledge API

An AI-accessible knowledge service built on *Cryptocurrencies Decrypted* by Oskar Hurme. Queries are priced per use and paid with USDC micropayments on Base L2 via the [X402 protocol](https://x402.org).

**GitHub:** [funcdude/crypto-knowledge-api](https://github.com/funcdude/crypto-knowledge-api)

---

## How it works

AI agents and humans query expert crypto knowledge from the book. Each request returns HTTP 402 with payment details. The client pays in USDC on Base, includes a `PAYMENT-SIGNATURE` header, and retries — receiving the answer.

```
Client → POST /api/v1/search
       ← 402 + PAYMENT-REQUIRED header (x402 v2 payload)
Client → pays USDC on Base, constructs PAYMENT-SIGNATURE
       → POST /api/v1/search + PAYMENT-SIGNATURE header
       ← 200 + knowledge content
```

---

## Pricing

| Tier | Param | Price | Response |
|------|-------|-------|----------|
| Snippet | `snippet` | $0.001 | 1–2 sentences, direct passage |
| Explanation | `explanation` | $0.005 | 1–2 paragraphs with context |
| Analysis | `analysis` | $0.01 | Multi-angle, comprehensive |
| Chapter Summary | `chapter_summary` | $0.02 | Full topic overview |

Pricing is also available machine-readably at `GET /api/v1/pricing` (no payment required).

---

## API Reference

### Authentication

All knowledge endpoints require an X402 v2 payment. Free endpoint: `GET /api/v1/pricing`.

**X402 v2 flow:**
1. Make request — receive HTTP 402 with `PAYMENT-REQUIRED` response header
2. Decode the header: base64 → JSON with `accepts[]` (amount, asset, payTo, network)
3. Transfer USDC on Base to the `payTo` address
4. Construct a `PAYMENT-SIGNATURE` header (base64-encoded JSON payload with transaction proof)
5. Retry the request with the `PAYMENT-SIGNATURE` header

**Payment details:**
- Network: Base (chain ID 8453)
- Asset: USDC — `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Recipient: `0x28e6b3e3e32308787f50e6d99e2b98745b381946`
- Facilitator: `https://facilitator.coinbase.com`

### Endpoints

#### `GET /api/v1/pricing`
Returns pricing tiers as JSON. Free, no payment required.

#### `GET /api/v1/search`
```
?q=<query>&tier=<tier>&max_results=<1-10>&topics=<csv>&complexity=<beginner|intermediate|advanced>
```

#### `POST /api/v1/search`
```json
{
  "query": "What is a 51% attack?",
  "tier": "explanation",
  "max_results": 3,
  "topics": ["bitcoin", "security"],
  "complexity": "intermediate"
}
```

#### `GET /api/v1/concepts/{concept}?tier=<tier>`
Get an explanation of a specific crypto concept.

#### `GET /api/v1/compare?concept1=<c1>&concept2=<c2>&tier=<tier>`
Compare two concepts. Requires `analysis` or `chapter_summary` tier.

#### `GET /api/v1/timeline/{topic}?tier=<tier>`
Historical timeline for a crypto topic.

### Response format

```json
{
  "query": "What is Bitcoin?",
  "tier": "snippet",
  "results": [
    {
      "content": "Bitcoin can be best understood as distributed software...",
      "relevance_score": 0.862,
      "chapter": "Cryptocurrencies Decrypted by Oskar Hurme",
      "source": {
        "book": "Cryptocurrencies Decrypted",
        "author": "Oskar Hurme"
      }
    }
  ],
  "total_results": 3,
  "processing_time_ms": 1943,
  "cost_usd": 0.001,
  "book_metadata": {
    "title": "Cryptocurrencies Decrypted: Hope and Economic Freedom for a Broken Financial System",
    "author": "Oskar Hurme",
    "amazon_url": "https://www.amazon.com/dp/B0DQXC7XVJ"
  },
  "citations": ["..."]
}
```

### Python integration example

```python
import httpx
import base64
import json

async def query_crypto_knowledge(query: str, tier: str = "explanation"):
    url = "http://localhost:8000/api/v1/search"
    params = {"q": query, "tier": tier}

    async with httpx.AsyncClient() as client:
        # Step 1: initial request
        response = await client.get(url, params=params)

        if response.status_code == 402:
            # Step 2: decode payment requirement from PAYMENT-REQUIRED header
            encoded = response.headers["PAYMENT-REQUIRED"]
            payment_req = json.loads(base64.b64decode(encoded))
            accepts = payment_req["accepts"][0]

            # Step 3: pay USDC on Base — accepts["payTo"], accepts["amount"], accepts["asset"]
            tx_hash = await pay_usdc_on_base(accepts)

            # Step 4: construct PAYMENT-SIGNATURE header
            payload = {
                "payload": {"transaction": tx_hash},
                "accepted": {"network": accepts["network"]}
            }
            signature = base64.b64encode(json.dumps(payload).encode()).decode()

            # Step 5: retry with payment
            response = await client.get(
                url, params=params,
                headers={"payment-signature": signature}
            )

        return response.json()
```

---

## Stack

**Backend:** FastAPI, asyncpg (PostgreSQL), Redis, OpenAI embeddings, Pinecone, web3.py
**Frontend:** Next.js 14, TypeScript, Tailwind CSS
**Infrastructure:** Docker Compose (local), Railway (production), Base L2

---

## Local development

See [QUICKSTART.md](QUICKSTART.md) for setup instructions.

**Services when running:**
- API: http://localhost:8000
- API docs (Swagger): http://localhost:8000/docs
- Frontend: http://localhost:3000
- Health: http://localhost:8000/health

---

## Deployment

See [docs/deployment.md](docs/deployment.md) for Railway deployment.

---

## The book

*Cryptocurrencies Decrypted: Hope and Economic Freedom for a Broken Financial System*
by Oskar Hurme — available on [Amazon](https://www.amazon.com/dp/B0DQXC7XVJ).
