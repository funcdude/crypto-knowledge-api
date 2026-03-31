# Sage Molly — MVP v0.3

## Version
**MVP v0.3** — March 31, 2026 (Production deployed & verified)

## Overview
Full-stack application: Next.js frontend + Python FastAPI backend, serving expert crypto education from "Cryptocurrencies Decrypted" by Oskar Hurme. Branded as "Sage Molly" — a crypto education agent for humans and AI agents, powered by X402 micropayments on Base L2.

## MVP v0.3 Changes (from v0.2)
- **Security hardening**: Email normalization (strips +aliases and gmail dots), per-IP rate limiting (30/hr) on free-search, CORS fix (no credentials with wildcard), security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy), 422 response suppression, free-status changed to POST
- **X402 payment flow fixed**: Switched from unreachable `facilitator.coinbase.com` to `facilitator.xpay.sh` (primary) + `x402.org/facilitator` (fallback) + on-chain Base RPC (last resort). Fixed facilitator request body to match x402 v2 spec: `{ x402Version, paymentPayload: <decoded dict>, paymentRequirements: <requirements dict> }`
- **Production stability**: Backend starts with graceful DB degradation (3 retries, 30s timeout); `server.js` polls backend health before starting Next.js to eliminate startup race; reduced DB pool (min=1, max=10)
- **x402 Python SDK** added (`x402>=2.5.0`) to requirements

## MVP v0.2 Features (carried forward)
- **Sage Molly rebrand**: Full rebrand from "Crypto Knowledge API" to "Sage Molly"
- **Freemium gate**: 3 free questions with email signup, then X402 pay-per-query
- **Book CTA**: Soft prompt to buy the book after 2nd response
- **Disclaimer**: "Sage Molly educates, not advises" shown on hero and footer
- Semantic search across 975 vectorized book passages (OpenAI embeddings + Pinecone)
- 3-tier pay-per-query pricing (Explanation $0.01, Summary $0.02, Analysis $0.03)
- X402 micropayment protocol on Base L2 (USDC)
- "Synthetic Architect" dark design system (Technical Brutalism aesthetic)
- Interactive search demo with live results from the knowledge base
- API documentation with tabbed UI (endpoints, code examples, X402 flow, pricing)
- Dedicated docs and pricing pages
- Redis caching layer for API responses (graceful degradation via NullRedisClient)
- PostgreSQL for analytics, session tracking, and email/free-query tracking
- Frontend health check endpoint at `/api/health`

## Stack
- **Frontend**: Next.js 13.5.8 (App Router), TypeScript, Tailwind CSS — port 5000
- **Backend**: FastAPI (Python 3.12) with uvicorn — port 8000
- **Database**: PostgreSQL (Replit managed, `DATABASE_URL` auto-injected)
- **Cache**: Redis 7.2 (local, `redis://localhost:6379/0`, optional)
- **AI**: OpenAI (embeddings) + Pinecone (vector search)
- **Payments**: X402 micropayments on Base L2 via xpay.sh facilitator
- **X402 SDK**: `x402>=2.5.0` Python package

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
├── server.js         # Production launcher (waits for backend health → starts Next.js)
├── build.sh          # Production build script (npm install, next build, pip install)
├── next.config.js    # Rewrites + security headers
├── package.json
└── backend/requirements.txt
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
- **Typography**: Inter (UI headings/body) via `--font-inter` CSS var; Geist Mono (data/code/prices) via `--font-mono` CSS var
- **Gradient CTA**: `engine-gradient` utility class (135° from #ADC6FF to #4D8EFF) defined in globals.css
- **No hard borders**: Tonal layering + ghost borders at low opacity (`border-outline-variant/15`)
- **SearchDemo**: Client component with email gate, free query counter, tier selector (after limit), and book CTA

## CRM Integration
- **Consent popup**: When a user enters their email, a modal asks them to consent to being added to the mailing list with occasional promotional content
- **"I agree"**: Syncs the email to Simple CRM (`simplecrm1.replit.app`) tagged with `sagemolly`, then proceeds to search
- **"No thanks"**: Skips CRM sync, proceeds to search without adding to list
- **Backend route**: `POST /api/v1/crm-sync` — authenticates via JWT (auto-refreshed), creates contact with `sagemolly` tag
- **CRM auth**: Email + password stored in env vars (`CRM_EMAIL`, `CRM_PASSWORD`); JWT cached with 24h expiry

## Freemium System
- **3 free questions** with email signup (stored in `free_queries` PostgreSQL table)
- Email normalized: strips `+` aliases, removes gmail dots, lowercased
- Per-IP rate limit: 30 free searches per hour via Redis
- Email validated via Pydantic `EmailStr`; query count tracked server-side with atomic UPDATE (race-condition safe)
- Frontend reconciles with server on mount via `POST /free-status` (falls back to localStorage)
- After 3 free queries, tier selector appears and X402 pay-per-query kicks in
- Book CTA ("Want to go deeper?") shown after 2nd response and onward
- Backend endpoint: `POST /api/v1/free-search` (email + query)
- Status check: `POST /api/v1/free-status` (email in body, not URL — prevents enumeration)

## Security Headers (next.config.js)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Content-Security-Policy` (self + inline styles/scripts + google fonts)

## CORS Configuration
- Wildcard origins (`*`) → `allow_credentials: false` (spec-compliant)
- Explicit allow-headers: Content-Type, Authorization, X-Request-ID, X-Payment, PAYMENT-SIGNATURE

## X402 Payment Flow
1. Client requests a paid endpoint → server returns HTTP 402 with `PAYMENT-REQUIRED` header (base64 JSON)
2. Client signs EIP-3009 authorization and sends X-Payment header
3. Server decodes X-Payment header (base64 → JSON dict)
4. Server sends to facilitator: `{ x402Version: 2, paymentPayload: <dict>, paymentRequirements: <dict> }`
5. Facilitator settles on-chain and returns tx hash
6. Server validates settlement and serves the resource
- **Facilitator chain**: xpay.sh → x402.org → on-chain Base RPC fallback
- **Payment deduplication**: PostgreSQL `used_payments` table (permanent, not TTL-based)
- **Dev bypass**: `SKIP_PAYMENT_VERIFY=true` + `DEBUG=true` skips verification

## API Pricing Tiers
| Tier | Price | Description |
|---|---|---|
| explanation | $0.01 | Concise explanation, 1-2 paragraphs |
| summary | $0.02 | Detailed summary with full context |
| analysis | $0.03 | Comprehensive multi-concept analysis |

## Deployment (Production — VM)
- **Target**: Reserved VM
- **Build**: `bash build.sh` → npm install, next build, pip install
- **Run**: `node server.js` → spawns uvicorn → polls `/health/live` → starts Next.js only after backend is ready
- **Proxy**: Next.js rewrites `/api/v1/*`, `/health/*`, `/x402/*` to FastAPI on port 8000
- **Lazy loading**: Heavy Python packages (web3, openai, pinecone, numpy) are lazy-loaded for fast startup
- **DB resilience**: 3 retries with 30s timeout each; starts in degraded mode if DB unavailable
- **Redis**: Optional via NullRedisClient — app works without Redis
- `SKIP_PAYMENT_VERIFY=false` in production; `DEBUG=false` in production
- Pinecone index (`crypto-knowledge`) pre-populated with 975 vectors from the book

## Replit Migration Notes
- **Next.js downgraded 14→13.5.8**: SWC native binary in v14 caused Bus errors; v13.5.8 binary is compatible.
- **Port 5000**: Required for Replit webview proxy.
- **Redis installed via Nix**: `redis-server` is started by the backend workflow before uvicorn.
- **PostgreSQL**: Provided by Replit's managed database integration (`DATABASE_URL` auto-set).
- **`SKIP_PAYMENT_VERIFY=true` + `DEBUG=true`**: Both must be set for the payment bypass to activate in dev.
- **`min_score=0.0`**: Pinecone cosine scores top out at ~0.85; default in `embedding_service.py` is `0.0`.
- **Next.js proxy rewrites**: `next.config.js` rewrites `/api/v1/*`, `/health/*`, and `/x402/*` to `http://localhost:8000`.
- **wordninja**: Pinned to v2.0.0 (v1.0.0 doesn't exist on PyPI).
- **Deployment uses `node server.js`**: Bash scripts fail silently in the VM run step; Node.js child_process.spawn works reliably.
- **`facilitator.coinbase.com` unreachable from Replit**: DNS doesn't resolve; use `facilitator.xpay.sh` or `x402.org/facilitator` instead.
