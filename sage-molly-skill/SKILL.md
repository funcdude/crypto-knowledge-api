---
name: sage-molly
description: >
  Use this skill when the user asks about cryptocurrencies, Bitcoin, Ethereum,
  DeFi, stablecoins, CBDCs, blockchain, money, or monetary systems. Provides
  expert answers from "Cryptocurrencies Decrypted" by Oskar Hurme via semantic
  search across 975 knowledge passages. Supports search, concept explanations,
  concept comparisons, and pricing info. Paid via X402 micropayments
  (USDC on Base L2).
version: 1.0.0
author: Oskar Hurme
category: education
---

# Sage Molly — Crypto Education Skill

## Overview

Sage Molly is a crypto education agent that provides expert knowledge from
"Cryptocurrencies Decrypted" by Oskar Hurme. It uses semantic search across
975 vectorized book passages to answer questions about Bitcoin, Ethereum, DeFi,
stablecoins, CBDCs, blockchain technology, and monetary systems.

## When to Use

- User asks about cryptocurrency concepts (Bitcoin, Ethereum, DeFi, etc.)
- User wants to understand blockchain, consensus mechanisms, or tokenomics
- User wants to compare two crypto concepts (e.g., Bitcoin vs Ethereum)
- User needs expert-level explanations of monetary policy, CBDCs, or stablecoins
- User asks "what is money?" or about the nature of value and exchange

## API Endpoints

Base URL: `https://sagemolly.net`

All endpoints except `/api/v1/pricing` require X402 payment (USDC on Base L2).
If no payment header is provided, the server returns HTTP 402 with payment
instructions in the `PAYMENT-REQUIRED` header.

### 1. Search Knowledge

```
GET /api/v1/search?q={query}&tier={tier}&max_results={n}
```

Parameters:
- `q` (required): Search query, max 500 characters
- `tier`: `explanation` ($0.01) | `summary` ($0.02) | `analysis` ($0.03)
- `max_results`: 1-10 (default 3)
- `topics`: Comma-separated topic filter
- `complexity`: `beginner` | `intermediate` | `advanced`

### 2. Concept Explanation

```
GET /api/v1/concepts/{concept}?tier={tier}
```

Returns a detailed explanation of a specific crypto concept. Optimized for
common terms: bitcoin, ethereum, defi, stablecoins, cbdc, blockchain, nft, web3.

### 3. Compare Concepts

```
GET /api/v1/compare?concept1={a}&concept2={b}&tier={tier}
```

Side-by-side comparison of two concepts. Tier must be `summary` or `analysis`.

### 4. Pricing (Free)

```
GET /api/v1/pricing
```

Returns current pricing tiers, payment method, and book metadata. No payment
required.

## MCP Connection

Sage Molly exposes an MCP (Model Context Protocol) server for direct tool
access from Claude, Cursor, and other MCP-compatible agents:

```bash
# Claude Code
claude mcp add sagemolly https://sagemolly.net/mcp/

# Or configure in your MCP client
{
  "mcpServers": {
    "sagemolly": {
      "url": "https://sagemolly.net/mcp/"
    }
  }
}
```

Available MCP tools:
- `search_crypto_knowledge` — Semantic search across 975 book passages
- `get_concept` — Detailed explanation of a specific crypto concept
- `compare_concepts` — Side-by-side comparison of two concepts
- `get_pricing` — Current pricing tiers and payment info

## X402 Payment Flow

1. Make a request to any paid endpoint
2. Server returns HTTP 402 with `PAYMENT-REQUIRED` header (base64 JSON)
3. Decode the header to get payment details (amount, wallet, chain)
4. Sign a USDC payment on Base L2
5. Retry the request with `X-Payment` or `PAYMENT-SIGNATURE` header
6. Server verifies payment and returns the knowledge

## Example

```bash
# Check pricing (free)
curl "https://sagemolly.net/api/v1/pricing"

# Search (returns 402 without payment)
curl "https://sagemolly.net/api/v1/search?q=how+does+bitcoin+mining+work&tier=explanation"

# Search with payment
curl "https://sagemolly.net/api/v1/search?q=how+does+bitcoin+mining+work&tier=explanation" \
  -H "X-Payment: <base64-encoded-payment-proof>"
```

## Agent Card

Sage Molly publishes an ERC-8004 agent card for directory listing:

```
https://sagemolly.net/.well-known/agent.json
```

## Source

- Book: "Cryptocurrencies Decrypted: Hope and Economic Freedom for a Broken Financial System"
- Author: Oskar Hurme
- Knowledge base: 975 vectorized passages
- Website: https://sagemolly.net
