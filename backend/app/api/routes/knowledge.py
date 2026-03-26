"""Knowledge API routes with X402 payment integration"""

from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Request, HTTPException, Depends, Query
from fastapi.responses import JSONResponse
from starlette.responses import Response
from pydantic import BaseModel, validator
import structlog

from app.core.config import get_settings, get_pricing_config, get_book_metadata
from app.core.x402 import X402Manager, PaymentCache
from app.services.knowledge_service import KnowledgeService
from app.services.analytics_service import AnalyticsService

logger = structlog.get_logger()
router = APIRouter()

class _PaymentRequired(Exception):
    """Raised to return a bare HTTP 402 with x402-spec JSON body (no FastAPI detail wrapper)."""
    def __init__(self, body: dict):
        self.body = body

# Request/Response Models
class KnowledgeQuery(BaseModel):
    """Knowledge query request"""
    query: str
    tier: str = "explanation"
    topics: Optional[List[str]] = None
    complexity: Optional[str] = None
    max_results: int = 3
    
    @validator("query")
    def validate_query(cls, v):
        if not v.strip():
            raise ValueError("Query cannot be empty")
        if len(v) > 500:
            raise ValueError("Query too long (max 500 characters)")
        return v.strip()
    
    @validator("tier")
    def validate_tier(cls, v):
        pricing = get_pricing_config()
        if v not in pricing:
            raise ValueError(f"Invalid tier. Choose from: {list(pricing.keys())}")
        return v
    
    @validator("complexity")
    def validate_complexity(cls, v):
        if v and v not in ["beginner", "intermediate", "advanced"]:
            raise ValueError("Complexity must be: beginner, intermediate, or advanced")
        return v

class KnowledgeResponse(BaseModel):
    """Knowledge API response"""
    query: str
    tier: str
    results: List[Dict[str, Any]]
    total_results: int
    processing_time_ms: int
    cost_usd: float
    book_metadata: Dict[str, str]
    citations: List[str]

class ConceptRequest(BaseModel):
    """Specific concept request"""
    concept: str
    tier: str = "explanation"
    
    @validator("concept")
    def validate_concept(cls, v):
        if not v.strip():
            raise ValueError("Concept cannot be empty")
        return v.strip()

# Dependency injection
def get_x402_manager(request: Request) -> X402Manager:
    return request.app.state.x402_manager

def get_knowledge_service(request: Request) -> KnowledgeService:
    return request.app.state.knowledge_service

def get_payment_cache(request: Request) -> PaymentCache:
    return PaymentCache(request.app.state.db_pool)

def get_analytics_service(request: Request) -> AnalyticsService:
    return AnalyticsService(request.app.state.redis_client)

async def require_payment(
    request: Request,
    tier: str,
    description: str
) -> bool:
    """Check for X402 payment or return 402 Payment Required"""
    
    settings = get_settings()

    # In dev/test mode with SKIP_PAYMENT_VERIFY=true, bypass the payment check entirely
    if settings.SKIP_PAYMENT_VERIFY and settings.DEBUG:
        logger.info("SKIP_PAYMENT_VERIFY=true — bypassing payment requirement (dev mode)", tier=tier)
        return True

    # Resolve dependencies manually since this is called directly, not as route dependency
    x402_manager = request.app.state.x402_manager
    payment_cache = PaymentCache(request.app.state.db_pool)
    
    # x402 v2 uses PAYMENT-SIGNATURE; also accept legacy x-payment header
    payment_header = (
        request.headers.get("payment-signature")
        or request.headers.get("x-payment")
    )

    if not payment_header:
        # No payment - return 402 Payment Required
        payment_req = x402_manager.create_payment_requirement(
            tier=tier,
            description=description,
            request_id=getattr(request.state, 'request_id', None)
        )
        
        resource = str(request.url)
        response_data = x402_manager.format_402_response(payment_req, resource=resource)

        logger.info(
            "Payment required",
            tier=tier,
            price=payment_req.price_usd,
            client_ip=request.client.host
        )

        raise _PaymentRequired(response_data)
    
    # Parse and verify payment
    try:
        payment_data = x402_manager.parse_payment_header(payment_header)
        tx_hash = payment_data.get("transaction_hash")

        # Only deduplicate when we have a real tx hash
        if tx_hash and await payment_cache.is_payment_used(tx_hash):
            raise HTTPException(
                status_code=400,
                detail={"error": "Payment already used", "transaction": tx_hash}
            )

        # Get expected payment amount
        pricing = get_pricing_config()
        expected_amount = str(int(pricing[tier]["price"] * 1_000_000))  # USDC has 6 decimals

        # Verify payment on blockchain / facilitator
        payment_proof = await x402_manager.verify_payment(
            payment_data=payment_data,
            expected_amount=expected_amount
        )

        # Only cache when we have a real tx hash
        if tx_hash:
            await payment_cache.mark_payment_used(tx_hash, payment_proof)
        
        logger.info(
            "Payment verified",
            tx_hash=tx_hash,
            amount=payment_proof.amount,
            from_address=payment_proof.from_address,
            tier=tier
        )
        
        return True
        
    except ValueError as e:
        logger.warning("Payment verification failed", error=str(e))
        raise HTTPException(
            status_code=400,
            detail={"error": "Payment verification failed", "message": str(e)}
        )

@router.get("/search")
async def search_knowledge(
    request: Request,
    q: str = Query(..., description="Search query"),
    tier: str = Query("explanation", description="Response tier (explanation|summary|analysis)"),
    topics: Optional[str] = Query(None, description="Comma-separated topics to filter by"),
    complexity: Optional[str] = Query(None, description="Complexity level (beginner|intermediate|advanced)"),
    max_results: int = Query(3, ge=1, le=10, description="Maximum number of results"),
    knowledge_service: KnowledgeService = Depends(get_knowledge_service),
    analytics_service: AnalyticsService = Depends(get_analytics_service)
):
    """
    Search crypto knowledge with X402 micropayments
    
    Returns expert analysis from "Cryptocurrencies Decrypted" based on semantic search.
    Supports different response tiers with corresponding pricing.
    """
    
    # Validate and parse inputs
    query_obj = KnowledgeQuery(
        query=q,
        tier=tier,
        topics=topics.split(",") if topics else None,
        complexity=complexity,
        max_results=max_results
    )
    
    # Require payment
    await require_payment(
        request=request,
        tier=tier,
        description=f"Crypto knowledge search: {q[:50]}..."
    )
    
    # Track analytics
    await analytics_service.track_query(
        query=q,
        tier=tier,
        client_ip=request.client.host,
        user_agent=request.headers.get("user-agent", "")
    )
    
    # Execute search
    import time
    start_time = time.time()
    
    try:
        results = await knowledge_service.search_knowledge(
            query=query_obj.query,
            tier=query_obj.tier,
            topics=query_obj.topics,
            complexity=query_obj.complexity,
            max_results=query_obj.max_results
        )
        
        processing_time = int((time.time() - start_time) * 1000)
        
        # Format response
        pricing = get_pricing_config()
        book_metadata = get_book_metadata()
        
        # Generate citations
        citations = [
            f"{book_metadata['title']} by {book_metadata['author']} - Chapter {result.get('chapter', 'Unknown')}"
            for result in results
        ]
        
        response = KnowledgeResponse(
            query=query_obj.query,
            tier=query_obj.tier,
            results=results,
            total_results=len(results),
            processing_time_ms=processing_time,
            cost_usd=pricing[tier]["price"],
            book_metadata=book_metadata,
            citations=list(set(citations))  # Remove duplicates
        )
        
        logger.info(
            "Knowledge search completed",
            query=q,
            tier=tier,
            results_count=len(results),
            processing_time_ms=processing_time
        )
        
        return response
        
    except Exception as e:
        logger.error("Knowledge search failed", query=q, error=str(e))
        raise HTTPException(
            status_code=500,
            detail={"error": "Search failed", "message": "Please try again later"}
        )

@router.post("/search")
async def search_knowledge_post(
    request: Request,
    query: KnowledgeQuery,
    knowledge_service: KnowledgeService = Depends(get_knowledge_service),
    analytics_service: AnalyticsService = Depends(get_analytics_service)
):
    """
    Search crypto knowledge (POST version)
    
    Same as GET /search but accepts JSON payload for complex queries.
    """
    
    # Require payment
    await require_payment(
        request=request,
        tier=query.tier,
        description=f"Crypto knowledge search: {query.query[:50]}..."
    )
    
    # Track analytics
    await analytics_service.track_query(
        query=query.query,
        tier=query.tier,
        client_ip=request.client.host,
        user_agent=request.headers.get("user-agent", "")
    )
    
    # Execute search (same logic as GET version)
    import time
    start_time = time.time()
    
    try:
        results = await knowledge_service.search_knowledge(
            query=query.query,
            tier=query.tier,
            topics=query.topics,
            complexity=query.complexity,
            max_results=query.max_results
        )
        
        processing_time = int((time.time() - start_time) * 1000)
        
        # Format response
        pricing = get_pricing_config()
        book_metadata = get_book_metadata()
        
        citations = [
            f"{book_metadata['title']} by {book_metadata['author']} - Chapter {result.get('chapter', 'Unknown')}"
            for result in results
        ]
        
        response = KnowledgeResponse(
            query=query.query,
            tier=query.tier,
            results=results,
            total_results=len(results),
            processing_time_ms=processing_time,
            cost_usd=pricing[query.tier]["price"],
            book_metadata=book_metadata,
            citations=list(set(citations))
        )
        
        return response
        
    except Exception as e:
        logger.error("Knowledge search failed", query=query.query, error=str(e))
        raise HTTPException(
            status_code=500,
            detail={"error": "Search failed", "message": "Please try again later"}
        )

@router.get("/concepts/{concept}")
async def get_concept_explanation(
    request: Request,
    concept: str,
    tier: str = Query("explanation", description="Response tier"),
    knowledge_service: KnowledgeService = Depends(get_knowledge_service)
):
    """
    Get detailed explanation of a specific crypto concept
    
    Pre-defined concepts with optimized responses for common crypto terms.
    """
    
    concept_request = ConceptRequest(concept=concept, tier=tier)
    
    # Require payment
    await require_payment(
        request=request,
        tier=tier,
        description=f"Crypto concept: {concept}"
    )
    
    try:
        result = await knowledge_service.get_concept_explanation(
            concept=concept_request.concept,
            tier=concept_request.tier
        )
        
        if not result:
            raise HTTPException(
                status_code=404,
                detail={"error": "Concept not found", "concept": concept}
            )
        
        pricing = get_pricing_config()
        book_metadata = get_book_metadata()
        
        return {
            "concept": concept,
            "tier": tier,
            "explanation": result,
            "cost_usd": pricing[tier]["price"],
            "book_metadata": book_metadata
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Concept explanation failed", concept=concept, error=str(e))
        raise HTTPException(
            status_code=500,
            detail={"error": "Failed to get concept explanation"}
        )

@router.get("/compare")
async def compare_concepts(
    request: Request,
    concept1: str = Query(..., description="First concept to compare"),
    concept2: str = Query(..., description="Second concept to compare"), 
    tier: str = Query("analysis", description="Response tier (summary or analysis recommended)"),
    knowledge_service: KnowledgeService = Depends(get_knowledge_service)
):
    """
    Compare two crypto concepts side-by-side
    
    Provides detailed comparison analysis between different crypto concepts,
    highlighting similarities, differences, and use cases.
    """
    
    # Validate tier (comparisons need detailed analysis)
    if tier not in ["analysis", "summary"]:
        raise HTTPException(
            status_code=400,
            detail={"error": "Comparison requires 'summary' or 'analysis' tier"}
        )
    
    # Require payment  
    await require_payment(
        request=request,
        tier=tier,
        description=f"Compare: {concept1} vs {concept2}"
    )
    
    try:
        result = await knowledge_service.compare_concepts(
            concept1=concept1,
            concept2=concept2,
            tier=tier
        )
        
        pricing = get_pricing_config()
        book_metadata = get_book_metadata()
        
        return {
            "concept1": concept1,
            "concept2": concept2,
            "tier": tier,
            "comparison": result,
            "cost_usd": pricing[tier]["price"],
            "book_metadata": book_metadata
        }
        
    except Exception as e:
        logger.error(
            "Concept comparison failed", 
            concept1=concept1, 
            concept2=concept2, 
            error=str(e)
        )
        raise HTTPException(
            status_code=500,
            detail={"error": "Failed to compare concepts"}
        )

@router.get("/timeline/{topic}")
async def get_topic_timeline(
    request: Request,
    topic: str,
    tier: str = Query("analysis", description="Response tier"),
    knowledge_service: KnowledgeService = Depends(get_knowledge_service)
):
    """
    Get historical timeline for a crypto topic
    
    Traces the evolution and key milestones of crypto topics like Bitcoin, 
    DeFi, regulations, etc. based on book content.
    """
    
    # Require payment
    await require_payment(
        request=request,
        tier=tier,
        description=f"Timeline: {topic}"
    )
    
    try:
        result = await knowledge_service.get_topic_timeline(
            topic=topic,
            tier=tier
        )
        
        if not result:
            raise HTTPException(
                status_code=404,
                detail={"error": "Topic timeline not found", "topic": topic}
            )
        
        pricing = get_pricing_config()
        book_metadata = get_book_metadata()
        
        return {
            "topic": topic,
            "tier": tier,
            "timeline": result,
            "cost_usd": pricing[tier]["price"],
            "book_metadata": book_metadata
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Topic timeline failed", topic=topic, error=str(e))
        raise HTTPException(
            status_code=500,
            detail={"error": "Failed to get topic timeline"}
        )

@router.get("/pricing")
async def get_pricing_info():
    """
    Get current pricing tiers and information
    
    Free endpoint that returns pricing structure for the knowledge API.
    """
    
    pricing = get_pricing_config()
    book_metadata = get_book_metadata()
    
    return {
        "pricing_tiers": pricing,
        "payment_method": "X402 micropayments",
        "currency": "USDC on Base L2",
        "settlement_time": "~2 seconds",
        "book_metadata": book_metadata,
        "api_info": {
            "no_api_keys": True,
            "no_subscriptions": True,
            "pay_per_use": True,
            "ai_agent_friendly": True
        }
    }