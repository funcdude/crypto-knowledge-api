# Sage Molly — MVP v0.2

## Version
**MVP v0.2** — March 28, 2026 (Production deployed)

## Overview
Full-stack application: Next.js frontend + Python FastAPI backend, serving expert crypto education from "Cryptocurrencies Decrypted" by Oskar Hurme. Branded as "Sage Molly" — a crypto education agent for humans and AI agents, powered by X402 micropayments on Base L2.

## MVP v0.2 Features
- **Sage Molly rebrand**: Full rebrand from "Crypto Knowledge API" to "Sage Molly"
- **Freemium gate**: 3 free questions with email signup, then X402 pay-per-query
- **Book CTA**: Soft prompt to buy the book after 2nd response
- **Disclaimer**: "Sage Molly educates, not advises" shown on hero and footer
- Semantic search across 975 vectorized book passages (OpenAI embeddings + Pinecone)
- 3-tier pay-per-query pricing (Explanation $0.01, Summary $0.02, Analysis $0.03)
- X402 micropayment protocol on Base L2 (USDC) with dev-mode bypass
- "Synthetic Architect" dark design system (Technical Brutalism aesthetic)
- Interactive search demo with live results from the knowledge base
- API documentation with tabbed UI (endpoints, code examples, X402 flow, pricing)
- Dedicated docs and pricing pages
- Redis caching layer for API responses (graceful degradation via NullRedisClient)
- PostgreSQL for analytics, session tracking, and email/free-query tracking
- Frontend health check endpoint at `/api/health`
- Production deployed on Replit VM

## Stack
- **Frontend**: Next.js 13.5.8 (App Router), TypeScript, Tailwind CSS — port 5000
- **Backend**: FastAPI (Python 3.12) with uvicorn — port 8000
- **Database**: PostgreSQL (Replit managed, `DATABASE_URL` auto-injected)
- **Cache**: Redis 7.2 (local, `redis://localhost:6379/0`, optional)
- **AI**: OpenAI (embeddings) + Pinecone (vector search)
- **Payments**: X402 micropayments on Base L2 via Coinbase facilitator

## Project Structure
```
/
├── src/
│   ├── app/          # Next.js App Router (layout.tsx, page.tsx, globals.css)
│   │   └── api/health/  # Frontend health check endpoint
│   ├── components/   # React components (SearchDemo, PricingDisplay, ApiDocumentation)
│   └── lib/          # Utilities (cn helper)
├── backend/
│   └── app/
│       ├── main.py          # FastAPI app entrypoint
│       ├── core/            # Config, database, cache (NullRedisClient), x402 manager
│       ├── api/routes/      # health, knowledge, x402, freemium routes
│       └── services/        # knowledge_service, embedding_service, analytics_service, text_utils
├── server.js         # Production launcher (spawns uvicorn + next start)
├── build.sh          # Production build script (npm install, next build, pip install)
├── start.sh          # Alternative startup script
├── next.config.js    # Rewrites /api/v1/* to backend
├── package.json
└── backend/requirements.txt  # Only Python deps file
```

## Workflows
- **Start application**: `npm run dev` — Next.js frontend on port 5000 (webview)
- **Start Backend**: Redis daemon + `uvicorn app.main:app` on port 8000 (console)

## Environment Variables / Secrets
| Variable | Type | Notes |
|---|---|---|
| `DATABASE_URL` | Secret (runtime) | Replit PostgreSQL, auto-managed |
| `OPENAI_API_KEY` | Secret | For embeddings |
| `PINECONE_API_KEY` | Secret | For vector search |
| `REDIS_URL` | Env var | `redis://localhost:6379/0` |
| `PINECONE_INDEX_NAME` | Env var | `crypto-knowledge` |
| `SKIP_PAYMENT_VERIFY` | Env var | `true` in dev, `false` in prod |
| `DEBUG` | Env var | `true` in dev, `false` in prod |
| `CORS_ORIGINS` | Env var | `*` in dev |
| `PAYMENT_ADDRESS` | Env var | Ethereum wallet for X402 |
| `SECRET_KEY` | Env var | App secret key |

## Frontend Design System
The frontend uses the "Synthetic Architect" dark design system — Technical Brutalism aesthetic:
- **Theme**: Dark mode always-on (`dark` class on `<html>`); base surface `#121315`
- **Colors**: Full Tailwind token set (`surface`, `surface-container-*`, `primary` #ADC6FF, `primary-container` #4D8EFF, `outline-variant` #424754, etc.)
- **Typography**: Inter (UI headings/body) via `--font-inter` CSS var; Geist Mono (data/code/prices) via `--font-mono` CSS var; Inter loaded via `next/font/google`, Geist Mono loaded via `next/font/local` from `public/fonts/`
- **Gradient CTA**: `engine-gradient` utility class (135° from #ADC6FF to #4D8EFF) defined in globals.css
- **No hard borders**: Tonal layering + ghost borders at low opacity (`border-outline-variant/15`)
- **SearchDemo**: Client component with email gate, free query counter, tier selector (after limit), and book CTA

## Freemium System
- **3 free questions** with email signup (stored in `free_queries` PostgreSQL table)
- Email validated via Pydantic `EmailStr`; query count tracked server-side with atomic UPDATE (race-condition safe)
- Frontend reconciles with server on mount via `GET /free-status` (falls back to localStorage)
- After 3 free queries, tier selector appears and X402 pay-per-query kicks in
- Book CTA ("Want to go deeper?") shown after 2nd response and onward
- Backend endpoint: `POST /api/v1/free-search` (email + query)
- Status check: `GET /api/v1/free-status?email=...`

## API Documentation (For AI Agents)
- Tabbed UI: Endpoints, Code Examples, X402 Flow, Pricing
- Code examples: cURL, JavaScript/TypeScript, Python (all use `https://sagemolly.com`)
- 6 endpoints documented: search (GET/POST), concepts, compare, timeline, pricing

## API Pricing Tiers
| Tier | Price | Description |
|---|---|---|
| explanation | $0.01 | Concise explanation, 1-2 paragraphs |
| summary | $0.02 | Detailed summary with full context |
| analysis | $0.03 | Comprehensive multi-concept analysis |

## Deployment (Production — VM)
- **Target**: Reserved VM
- **Build**: `bash build.sh` → npm install, next build, pip install
- **Run**: `node server.js` → spawns uvicorn (port 8000) + next start (port 5000)
- **Proxy**: Next.js rewrites `/api/v1/*`, `/health/*`, `/x402/*` to FastAPI on port 8000
- **Lazy loading**: Heavy Python packages (web3, openai, pinecone, numpy) are lazy-loaded to ensure fast backend startup (<5s instead of 2+ minutes)
- **Redis**: Optional via NullRedisClient — app works without Redis
- `SKIP_PAYMENT_VERIFY=false` in production; `DEBUG=false` in production
- Rate limiter gracefully degrades if Redis is unavailable
- Pinecone index (`crypto-knowledge`) pre-populated with 975 vectors from the book
- Frontend health endpoint: `GET /api/health`

## Replit Migration Notes
- **Next.js downgraded 14→13.5.8**: SWC native binary in v14 caused Bus errors; v13.5.8 binary is compatible.
- **Port 5000**: Required for Replit webview proxy.
- **`output: 'standalone'` removed**: Docker-only setting.
- **Redis installed via Nix**: `redis-server` is started by the backend workflow before uvicorn.
- **PostgreSQL**: Provided by Replit's managed database integration (`DATABASE_URL` auto-set).
- **`SKIP_PAYMENT_VERIFY=true` + `DEBUG=true`**: Both must be set for the payment bypass to activate in dev.
- **`min_score=0.0`**: Pinecone cosine scores top out at ~0.85; default in `embedding_service.py` is `0.0`.
- **Next.js proxy rewrites**: `next.config.js` rewrites `/api/v1/*`, `/health/*`, and `/x402/*` to `http://localhost:8000`. `NEXT_PUBLIC_API_URL` is `""` (empty) so all frontend API calls are relative, proxied server-side.
- **wordninja**: Pinned to v2.0.0 (v1.0.0 doesn't exist on PyPI).
- **Deployment uses `node server.js`**: Bash scripts fail silently in the VM run step; Node.js child_process.spawn works reliably.
