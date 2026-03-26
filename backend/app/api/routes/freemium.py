"""Freemium query endpoints — 3 free questions with email"""

from fastapi import APIRouter, Request, HTTPException, Query, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
import structlog

from app.core.config import get_settings
from app.services.knowledge_service import KnowledgeService

logger = structlog.get_logger()
router = APIRouter()


class FreeSearchRequest(BaseModel):
    email: EmailStr
    query: str
    tier: str = "explanation"
    max_results: int = 2


def get_knowledge_service(request: Request) -> KnowledgeService:
    if not hasattr(request.app.state, 'knowledge_service') or request.app.state.knowledge_service is None:
        raise HTTPException(status_code=503, detail="Knowledge service not available")
    return request.app.state.knowledge_service


@router.post("/free-search")
async def free_search(
    body: FreeSearchRequest,
    request: Request,
    knowledge_service: KnowledgeService = Depends(get_knowledge_service),
):
    settings = get_settings()
    email = body.email.strip().lower()

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

    return {
        "status": "success",
        "results": results,
        "queries_used": new_count,
        "queries_limit": settings.FREE_QUERY_LIMIT,
        "queries_remaining": settings.FREE_QUERY_LIMIT - new_count,
    }


@router.get("/free-status")
async def free_status(
    email: str = Query(..., description="Email to check"),
    request: Request = None,
):
    settings = get_settings()
    email = email.strip().lower()

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
