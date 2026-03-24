# Crypto Knowledge API — Next.js Frontend

## Overview
Next.js frontend for the Crypto Knowledge API — an AI-monetized book service using X402 micropayments on Base L2.

## Stack
- **Framework**: Next.js 13.5.8 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Package Manager**: npm

## Project Structure
```
/
├── src/
│   ├── app/          # Next.js App Router pages (layout.tsx, page.tsx, globals.css)
│   ├── components/   # React components (SearchDemo, PricingDisplay, ApiDocumentation)
│   └── lib/          # Utilities (utils.ts - cn helper)
├── backend/          # Python FastAPI backend (separate service)
├── next.config.js    # Next.js configuration
├── tailwind.config.js
└── tsconfig.json
```

## Running the App
The app runs on **port 5000** (required for Replit preview):
- **Dev**: `npm run dev` → `next dev -p 5000 -H 0.0.0.0`
- **Build**: `npm run build`
- **Start**: `npm start` → `next start -p 5000 -H 0.0.0.0`

## Environment Variables
See `.env.example` for all required variables:
- `NEXT_PUBLIC_API_URL` — Backend API URL (default: `http://localhost:8000`)
- `NEXT_PUBLIC_PAYMENT_ADDRESS` — X402 payment wallet address
- `NEXT_PUBLIC_CHAIN_ID` — Base L2 chain ID (8453)

Backend also needs: `DATABASE_URL`, `REDIS_URL`, `OPENAI_API_KEY`, `PINECONE_API_KEY`

## Replit Migration Notes
- **Next.js downgraded from 14 to 13.5.8**: The SWC native binary bundled with Next.js 14 caused Bus errors (CPU compatibility issue with Replit's container). Next.js 13.5.8's SWC binary is compatible.
- **Port updated to 5000**: Required for Replit's webview proxy.
- **`output: 'standalone'` removed**: Docker-only setting, not needed on Replit.
- **`experimental.serverComponentsExternalPackages` removed**: Invalid config key for this version.

## Backend
The Python FastAPI backend lives in `backend/`. It requires PostgreSQL, Redis, OpenAI, and Pinecone. Run separately on port 8000.
