# Quickstart — Local Development

## Prerequisites

- Docker Desktop
- Git

## Setup

```bash
git clone https://github.com/funcdude/crypto-knowledge-api.git
cd crypto-knowledge-api

cp .env.example .env
# Edit .env — add your OPENAI_API_KEY and PINECONE_API_KEY
```

## Start the backend

```bash
docker compose up -d db redis api
```

Check it's running:

```bash
curl http://localhost:8000/health
```

Expected:
```json
{"status": "healthy", "services": {"redis": "healthy", "database": "healthy"}}
```

## Start the frontend

```bash
docker compose up frontend
```

Or without Docker (faster for development):
```bash
npm run dev
```

Frontend: http://localhost:3000

## Verify the payment flow

Without a payment header — should return 402:
```bash
curl -s -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "What is Bitcoin?", "tier": "snippet"}' \
  -o /dev/null -w "%{http_code}"
```
Expected: `402`

The 402 response includes a `PAYMENT-REQUIRED` header containing the full x402 v2 payment specification (base64-encoded JSON).

With a dev payment header (`SKIP_PAYMENT_VERIFY=true` in `.env`):
```bash
PAYLOAD=$(echo '{"payload":{"transaction":"dev-test-001"},"accepted":{"network":"eip155:8453"}}' | base64)
curl -s -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -H "payment-signature: $PAYLOAD" \
  -d '{"query": "What is Bitcoin?", "tier": "snippet"}' | jq .query
```
Expected: `"What is Bitcoin?"`

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | For generating query embeddings |
| `PINECONE_API_KEY` | Yes | Vector DB with book content |
| `PINECONE_INDEX_NAME` | Yes | Default: `crypto-knowledge` |
| `PAYMENT_ADDRESS` | Yes | Your Base wallet to receive USDC |
| `POSTGRES_PASSWORD` | Yes | Local DB password |
| `REDIS_PASSWORD` | Yes | Local Redis password |
| `SKIP_PAYMENT_VERIFY` | Dev only | Set `true` to bypass payment checks locally |
| `DEBUG` | Dev only | Set `true` for verbose logging |

`SKIP_PAYMENT_VERIFY=true` is blocked when `DEBUG=false` — it cannot be used in production.

## Useful commands

```bash
# View API logs
docker compose logs -f api

# Restart just the API
docker compose restart api

# Stop everything
docker compose down

# Stop and wipe volumes (full reset)
docker compose down -v
```

## Troubleshooting

**API won't start:** Check `docker compose logs api` — usually a missing env variable.

**Pinecone errors:** Verify `PINECONE_API_KEY` and `PINECONE_INDEX_NAME` are correct in `.env`.

**Frontend `next: not found`:** The frontend container installs dependencies on first start — wait ~60 seconds for `npm ci` to complete.

**Database unhealthy:** Run `docker compose restart db` then `docker compose restart api`.
