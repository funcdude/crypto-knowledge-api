"""Freemium query endpoints — 3 free questions with email"""

import re
from fastapi import APIRouter, Request, HTTPException, Query, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from typing import Optional
import structlog

from app.core.config import get_settings
from app.services.knowledge_service import KnowledgeService

logger = structlog.get_logger()
router = APIRouter()

FREE_SEARCH_IP_LIMIT = 30
FREE_SEARCH_IP_WINDOW = 3600


def normalize_email(raw: str) -> str:
    raw = raw.strip().lower()
    local, domain = raw.split("@", 1)
    local = local.split("+")[0]
    if domain in ("gmail.com", "googlemail.com"):
        local = local.replace(".", "")
        domain = "gmail.com"
    return f"{local}@{domain}"


class FreeSearchRequest(BaseModel):
    email: EmailStr
    query: str
    tier: str = "explanation"
    max_results: int = 2


def get_knowledge_service(request: Request) -> KnowledgeService:
    if not hasattr(request.app.state, 'knowledge_service') or request.app.state.knowledge_service is None:
        raise HTTPException(status_code=503, detail="Knowledge service not available")
    return request.app.state.knowledge_service


async def _check_ip_rate_limit(request: Request) -> None:
    try:
        client_ip = request.client.host
        redis_client = request.app.state.redis_client
        key = f"free_search_ip:{client_ip}"
        count = await redis_client.incr(key)
        if count == 1:
            await redis_client.expire(key, FREE_SEARCH_IP_WINDOW)
        if count > FREE_SEARCH_IP_LIMIT:
            raise HTTPException(
                status_code=429,
                detail="Too many free search requests from this address. Please try again later.",
            )
    except HTTPException:
        raise
    except Exception:
        pass


@router.post("/free-search")
async def free_search(
    body: FreeSearchRequest,
    request: Request,
    knowledge_service: KnowledgeService = Depends(get_knowledge_service),
):
    await _check_ip_rate_limit(request)
    settings = get_settings()
    email = normalize_email(body.email)

    db_pool = request.app.state.db_pool
    async with db_pool.pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO free_queries (email, query_count)
            VALUES ($1, 0)
            ON CONFLICT ((LOWER(email))) DO NOTHING
            RETURNING id, query_count
            """,
            email,
        )
        if row is None:
            row = await conn.fetchrow(
                "SELECT id, query_count FROM free_queries WHERE LOWER(email) = $1",
                email,
            )

        query_count = row["query_count"]

        if query_count >= settings.FREE_QUERY_LIMIT:
            return {
                "status": "limit_reached",
                "message": f"You've used all {settings.FREE_QUERY_LIMIT} free questions. Upgrade to X402 pay-per-query for unlimited access.",
                "queries_used": query_count,
                "queries_limit": settings.FREE_QUERY_LIMIT,
            }

        updated = await conn.fetchrow(
            """
            UPDATE free_queries
            SET query_count = query_count + 1, updated_at = CURRENT_TIMESTAMP
            WHERE LOWER(email) = $1 AND query_count < $2
            RETURNING query_count
            """,
            email,
            settings.FREE_QUERY_LIMIT,
        )

        if updated is None:
            return {
                "status": "limit_reached",
                "message": f"You've used all {settings.FREE_QUERY_LIMIT} free questions. Upgrade to X402 pay-per-query for unlimited access.",
                "queries_used": query_count,
                "queries_limit": settings.FREE_QUERY_LIMIT,
            }

        new_count = updated["query_count"]

        results = await knowledge_service.search_knowledge(
            query=body.query,
            tier=body.tier,
            max_results=body.max_results,
        )

        LOW_MATCH_THRESHOLD = 50
        above = [r for r in results if r.get("match_percent", 100) >= LOW_MATCH_THRESHOLD]

        if not above:
            return {
                "status": "low_match",
                "message": "This question doesn't appear to be covered in the book. Try asking about cryptocurrencies, blockchain, DeFi, money, or related topics.",
                "queries_used": new_count,
                "queries_limit": settings.FREE_QUERY_LIMIT,
                "queries_remaining": settings.FREE_QUERY_LIMIT - new_count,
                "top_match_percent": results[0].get("match_percent", 0) if results else 0,
            }

    return {
        "status": "success",
        "results": above,
        "queries_used": new_count,
        "queries_limit": settings.FREE_QUERY_LIMIT,
        "queries_remaining": settings.FREE_QUERY_LIMIT - new_count,
    }


class FreeStatusRequest(BaseModel):
    email: EmailStr


@router.post("/free-status")
async def free_status(
    body: FreeStatusRequest,
    request: Request = None,
):
    settings = get_settings()
    email = normalize_email(body.email)

    db_pool = request.app.state.db_pool
    async with db_pool.pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT query_count FROM free_queries WHERE LOWER(email) = $1",
            email,
        )

    query_count = row["query_count"] if row else 0

    return {
        "queries_used": query_count,
        "queries_limit": settings.FREE_QUERY_LIMIT,
        "queries_remaining": max(0, settings.FREE_QUERY_LIMIT - query_count),
        "has_free_queries": query_count < settings.FREE_QUERY_LIMIT,
    }
