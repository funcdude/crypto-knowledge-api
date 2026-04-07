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
        "When a tool returns a result with 'status': 'payment_required', the caller must "
        "obtain a USDC payment proof and pass it as the 'payment_proof' parameter on retry."
    ),
)


async def _make_request(method: str, url: str, params: dict = None, payment_proof: str = None) -> dict:
    import httpx

    headers = {}
    if payment_proof:
        headers["X-Payment"] = payment_proof

    async with httpx.AsyncClient(timeout=30.0) as client:
        if method == "GET":
            resp = await client.get(url, params=params, headers=headers)
        else:
            resp = await client.post(url, json=params, headers=headers)

    if resp.status_code == 402:
        payment_header = resp.headers.get("payment-required", "")
        try:
            body = resp.json()
        except Exception:
            body = {}
        return {
            "status": "payment_required",
            "http_status": 402,
            "message": "X402 payment required. Send USDC on Base L2 to access this knowledge.",
            "payment_requirements": payment_header,
            "details": body,
        }

    try:
        return {"status": "ok", "http_status": resp.status_code, "data": resp.json()}
    except Exception:
        return {"status": "ok", "http_status": resp.status_code, "data": resp.text}


@mcp.tool()
async def search_crypto_knowledge(
    query: str,
    tier: str = "explanation",
    max_results: int = 3,
    topics: Optional[str] = None,
    complexity: Optional[str] = None,
    payment_proof: Optional[str] = None,
) -> dict:
    """Search crypto knowledge from 'Cryptocurrencies Decrypted' using semantic matching.

    Args:
        query: Your question about crypto (max 500 chars). Examples: 'How does Bitcoin mining work?', 'What is DeFi?'
        tier: Response depth — 'explanation' ($0.01, 1-2 paragraphs), 'summary' ($0.02, detailed), 'analysis' ($0.03, comprehensive)
        max_results: Number of results (1-10, default 3)
        topics: Comma-separated topic filter (e.g. 'bitcoin,defi')
        complexity: Filter by complexity — 'beginner', 'intermediate', or 'advanced'
        payment_proof: Base64-encoded X402 payment proof. Required for paid requests. Obtain from the payment_requirements field of a 402 response.
    """
    params = {"q": query, "tier": tier, "max_results": str(max_results)}
    if topics:
        params["topics"] = topics
    if complexity:
        params["complexity"] = complexity

    return await _make_request("GET", "http://localhost:8000/api/v1/search", params=params, payment_proof=payment_proof)


@mcp.tool()
async def get_concept(
    concept: str,
    tier: str = "explanation",
    payment_proof: Optional[str] = None,
) -> dict:
    """Get a detailed explanation of a specific crypto concept.

    Args:
        concept: The concept to explain. Examples: 'bitcoin', 'ethereum', 'defi', 'stablecoins', 'cbdc', 'blockchain', 'nft', 'web3'
        tier: Response depth — 'explanation' ($0.01), 'summary' ($0.02), 'analysis' ($0.03)
        payment_proof: Base64-encoded X402 payment proof. Required for paid requests.
    """
    return await _make_request(
        "GET",
        f"http://localhost:8000/api/v1/concepts/{concept}",
        params={"tier": tier},
        payment_proof=payment_proof,
    )


@mcp.tool()
async def compare_concepts(
    concept1: str,
    concept2: str,
    tier: str = "analysis",
    payment_proof: Optional[str] = None,
) -> dict:
    """Compare two crypto concepts side-by-side, highlighting similarities and differences.

    Args:
        concept1: First concept (e.g. 'bitcoin')
        concept2: Second concept (e.g. 'ethereum')
        tier: Must be 'summary' ($0.02) or 'analysis' ($0.03)
        payment_proof: Base64-encoded X402 payment proof. Required for paid requests.
    """
    return await _make_request(
        "GET",
        "http://localhost:8000/api/v1/compare",
        params={"concept1": concept1, "concept2": concept2, "tier": tier},
        payment_proof=payment_proof,
    )


@mcp.tool()
async def get_timeline(
    topic: str,
    tier: str = "analysis",
    payment_proof: Optional[str] = None,
) -> dict:
    """Get historical timeline of key developments for a crypto topic.

    Args:
        topic: The topic to trace (e.g. 'bitcoin', 'defi', 'stablecoins')
        tier: Response depth — 'summary' ($0.02) or 'analysis' ($0.03)
        payment_proof: Base64-encoded X402 payment proof. Required for paid requests.
    """
    return await _make_request(
        "GET",
        f"http://localhost:8000/api/v1/timeline/{topic}",
        params={"tier": tier},
        payment_proof=payment_proof,
    )


@mcp.tool()
async def get_pricing() -> dict:
    """Get current pricing tiers for Sage Molly's crypto knowledge API. This is a free endpoint — no payment required."""
    return await _make_request("GET", "http://localhost:8000/api/v1/pricing")
