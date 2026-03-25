# Crypto Knowledge API

## Overview
Full-stack application: Next.js frontend + Python FastAPI backend, serving expert crypto knowledge from "Cryptocurrencies Decrypted" via X402 micropayments on Base L2.

## Stack
- **Frontend**: Next.js 13.5.8 (App Router), TypeScript, Tailwind CSS — port 5000
- **Backend**: FastAPI (Python 3.12) with uvicorn — port 8000
- **Database**: PostgreSQL (Replit managed, `DATABASE_URL` auto-injected)
- **Cache**: Redis 7.2 (local, `redis://localhost:6379/0`)
- **AI**: OpenAI (embeddings) + Pinecone (vector search)
- **Payments**: X402 micropayments on Base L2 via Coinbase facilitator

## Project Structure
```
/
├── src/
│   ├── app/          # Next.js App Router (layout.tsx, page.tsx, globals.css)
│   ├── components/   # React components (SearchDemo, PricingDisplay, ApiDocumentation)
│   └── lib/          # Utilities (cn helper)
├── backend/
│   └── app/
│       ├── main.py          # FastAPI app entrypoint
│       ├── core/            # Config, database, cache, x402 manager
│       ├── api/routes/      # health, knowledge, x402 routes
│       └── services/        # knowledge_service, embedding_service, analytics_service
├── next.config.js
├── package.json
└── requirements.txt
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
| `DEBUG` | Env var | `true` in dev |
| `CORS_ORIGINS` | Env var | `*` in dev |
| `PAYMENT_ADDRESS` | Env var | Ethereum wallet for X402 |
| `SECRET_KEY` | Env var | App secret key |

## Frontend Design System
The frontend uses the "Synthetic Architect" dark design system — Technical Brutalism aesthetic:
- **Theme**: Dark mode always-on (`dark` class on `<html>`); base surface `#121315`
- **Colors**: Full Tailwind token set (`surface`, `surface-container-*`, `primary` #ADC6FF, `primary-container` #4D8EFF, `outline-variant` #424754, etc.)
- **Typography**: Inter (UI headings/body) via `--font-inter` CSS var; Geist Mono (data/code/prices) via `--font-mono` CSS var; Inter loaded via `next/font/google`, Geist Mono loaded via `next/font/local` from `public/fonts/` (Geist Mono is not available in Google Fonts; woff2 files sourced from the `geist` npm package)
- **Gradient CTA**: `engine-gradient` utility class (135° from #ADC6FF to #4D8EFF) defined in globals.css
- **No hard borders**: Tonal layering + ghost borders at low opacity (`border-outline-variant/15`)
- **ApiDocumentation**: Client component with 4 tabs (Endpoints, Code Examples, X402 Flow, Pricing)
- **SearchDemo**: Client component with 4-tile tier selector, dark input, two-column layout (form + results)

## Replit Migration Notes
- **Next.js downgraded 14→13.5.8**: SWC native binary in v14 caused Bus errors; v13.5.8 binary is compatible.
- **Port 5000**: Required for Replit webview proxy.
- **`output: 'standalone'` removed**: Docker-only setting.
- **Redis installed via Nix**: `redis-server` is started by the backend workflow before uvicorn.
- **PostgreSQL**: Provided by Replit's managed database integration (`DATABASE_URL` auto-set).
- **`SKIP_PAYMENT_VERIFY=true` + `DEBUG=true`**: Both must be set for the payment bypass to activate — `require_payment()` returns `True` immediately when both are set, skipping X402 validation in dev.
- **`min_score=0.0`**: Pinecone cosine scores for this index top out at ~0.85; the old threshold of 0.5 blocked all results. Default in `embedding_service.py` is now `0.0`.
- **Next.js proxy rewrites**: `next.config.js` rewrites `/api/v1/*`, `/health/*`, and `/x402/*` to `http://localhost:8000`. `NEXT_PUBLIC_API_URL` is set to `""` (empty) so all frontend API calls are relative URLs, proxied server-side — no direct browser access to port 8000 needed.

## API Pricing Tiers
| Tier | Price | Description |
|---|---|---|
| snippet | $0.001 | Quick answer, 1-2 sentences |
| explanation | $0.005 | Detailed explanation |
| analysis | $0.01 | Comprehensive analysis |
| chapter_summary | $0.02 | Full chapter insights |

## Production Checklist
- Set `SKIP_PAYMENT_VERIFY=false` and `DEBUG=false`
- Tighten `CORS_ORIGINS` to specific allowed origins
- Configure `ALLOWED_HOSTS`
- Pinecone index (`crypto-knowledge`) is pre-populated with 975 vectors from the book
