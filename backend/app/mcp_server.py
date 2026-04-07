"""MCP Server for Sage Molly — exposes crypto knowledge tools via Model Context Protocol"""

import json
from typing import Optional
from fastmcp import FastMCP

mcp = FastMCP(
    "Sage Molly",
    instructions=(
        "Sage Molly provides expert crypto education from 'Cryptocurrencies Decrypted' "
        "by Oskar Hurme. It searches 975 vectorized book passages using semantic search. "
        "All knowledge tools except get_pricing require X402 micropayment (USDC on Base L2). "
        "When a tool returns a 402 status, the caller must make a USDC payment and retry."
    ),
)


@mcp.tool()
async def search_crypto_knowledge(
    query: str,
    tier: str = "explanation",
    max_results: int = 3,
    topics: Optional[str] = None,
    complexity: Optional[str] = None,
) -> str:
    """Search crypto knowledge from 'Cryptocurrencies Decrypted' using semantic matching.

    Args:
        query: Your question about crypto (max 500 chars). Examples: 'How does Bitcoin mining work?', 'What is DeFi?'
        tier: Response depth — 'explanation' ($0.01, 1-2 paragraphs), 'summary' ($0.02, detailed), 'analysis' ($0.03, comprehensive)
        max_results: Number of results (1-10, default 3)
        topics: Comma-separated topic filter (e.g. 'bitcoin,defi')
        complexity: Filter by complexity — 'beginner', 'intermediate', or 'advanced'
    """
    import httpx

    params = {"q": query, "tier": tier, "max_results": str(max_results)}
    if topics:
        params["topics"] = topics
    if complexity:
        params["complexity"] = complexity

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get("http://localhost:8000/api/v1/search", params=params)

    if resp.status_code == 402:
        return json.dumps({
            "status": "payment_required",
            "message": "X402 payment required. Send USDC on Base L2 to access this knowledge.",
            "payment_details": resp.json(),
            "payment_header": resp.headers.get("payment-required", ""),
        })

    return resp.text


@mcp.tool()
async def get_concept(concept: str, tier: str = "explanation") -> str:
    """Get a detailed explanation of a specific crypto concept.

    Args:
        concept: The concept to explain. Examples: 'bitcoin', 'ethereum', 'defi', 'stablecoins', 'cbdc', 'blockchain', 'nft', 'web3'
        tier: Response depth — 'explanation' ($0.01), 'summary' ($0.02), 'analysis' ($0.03)
    """
    import httpx

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(
            f"http://localhost:8000/api/v1/concepts/{concept}",
            params={"tier": tier},
        )

    if resp.status_code == 402:
        return json.dumps({
            "status": "payment_required",
            "message": "X402 payment required. Send USDC on Base L2 to access this knowledge.",
            "payment_details": resp.json(),
            "payment_header": resp.headers.get("payment-required", ""),
        })

    return resp.text


@mcp.tool()
async def compare_concepts(
    concept1: str, concept2: str, tier: str = "analysis"
) -> str:
    """Compare two crypto concepts side-by-side, highlighting similarities and differences.

    Args:
        concept1: First concept (e.g. 'bitcoin')
        concept2: Second concept (e.g. 'ethereum')
        tier: Must be 'summary' ($0.02) or 'analysis' ($0.03)
    """
    import httpx

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(
            "http://localhost:8000/api/v1/compare",
            params={"concept1": concept1, "concept2": concept2, "tier": tier},
        )

    if resp.status_code == 402:
        return json.dumps({
            "status": "payment_required",
            "message": "X402 payment required. Send USDC on Base L2 to access this knowledge.",
            "payment_details": resp.json(),
            "payment_header": resp.headers.get("payment-required", ""),
        })

    return resp.text


@mcp.tool()
async def get_timeline(topic: str, tier: str = "analysis") -> str:
    """Get historical timeline of key developments for a crypto topic.

    Args:
        topic: The topic to trace (e.g. 'bitcoin', 'defi', 'stablecoins')
        tier: Response depth — 'summary' ($0.02) or 'analysis' ($0.03)
    """
    import httpx

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(
            f"http://localhost:8000/api/v1/timeline/{topic}",
            params={"tier": tier},
        )

    if resp.status_code == 402:
        return json.dumps({
            "status": "payment_required",
            "message": "X402 payment required. Send USDC on Base L2 to access this knowledge.",
            "payment_details": resp.json(),
            "payment_header": resp.headers.get("payment-required", ""),
        })

    return resp.text


@mcp.tool()
async def get_pricing() -> str:
    """Get current pricing tiers for Sage Molly's crypto knowledge API. This is a free endpoint — no payment required."""
    import httpx

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get("http://localhost:8000/api/v1/pricing")

    return resp.text
