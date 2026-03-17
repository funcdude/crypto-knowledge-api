"""
Crypto Knowledge API - X402 Enabled
Transform "Cryptocurrencies Decrypted" into an AI-accessible knowledge service
"""

import os
import logging
from contextlib import asynccontextmanager
from typing import Dict, Any

from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import structlog

from app.core.config import get_settings
from app.core.database import get_db_pool
from app.core.cache import get_redis_client
from app.core.x402 import X402Manager
from app.api.routes import knowledge, health, x402
from app.services.knowledge_service import KnowledgeService
from app.services.embedding_service import EmbeddingService

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup/shutdown tasks"""
    logger.info("Starting up Crypto Knowledge API...")
    
    # Initialize core services
    settings = get_settings()
    
    # Initialize database connection pool
    app.state.db_pool = await get_db_pool(settings.DATABASE_URL)
    logger.info("Database connection pool initialized")
    
    # Initialize Redis cache
    app.state.redis_client = await get_redis_client(settings.REDIS_URL)
    logger.info("Redis cache client initialized")
    
    # Initialize X402 manager
    app.state.x402_manager = X402Manager(
        payment_address=settings.PAYMENT_ADDRESS,
        chain_id=8453,  # Base chain
        facilitator_url=settings.X402_FACILITATOR_URL
    )
    logger.info("X402 payment manager initialized")
    
    # Initialize AI services
    app.state.embedding_service = EmbeddingService(
        openai_api_key=settings.OPENAI_API_KEY,
        pinecone_api_key=settings.PINECONE_API_KEY,
        pinecone_environment=settings.PINECONE_ENVIRONMENT
    )
    logger.info("AI embedding service initialized")
    
    # Initialize knowledge service
    app.state.knowledge_service = KnowledgeService(
        db_pool=app.state.db_pool,
        embedding_service=app.state.embedding_service,
        redis_client=app.state.redis_client
    )
    logger.info("Knowledge service initialized")
    
    logger.info("🚀 Crypto Knowledge API startup complete!")
    
    yield
    
    # Shutdown tasks
    logger.info("Shutting down Crypto Knowledge API...")
    
    if hasattr(app.state, 'db_pool'):
        await app.state.db_pool.close()
        logger.info("Database connections closed")
    
    if hasattr(app.state, 'redis_client'):
        await app.state.redis_client.close()
        logger.info("Redis connections closed")
    
    logger.info("✅ Crypto Knowledge API shutdown complete")

# Create FastAPI application
app = FastAPI(
    title="Crypto Knowledge API",
    description="AI-accessible crypto expertise from 'Cryptocurrencies Decrypted' with X402 micropayments",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Security middleware
settings = get_settings()
if settings.ALLOWED_HOSTS:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.ALLOWED_HOSTS.split(",")
    )

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(",") if settings.CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        "Unhandled exception occurred",
        error=str(exc),
        path=request.url.path,
        method=request.method
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred. Please try again later.",
            "request_id": getattr(request.state, 'request_id', None)
        }
    )

# Request ID middleware
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    import uuid
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response

# Rate limiting middleware (basic implementation)
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Basic rate limiting - 100 requests per minute per IP"""
    client_ip = request.client.host
    redis_client = request.app.state.redis_client
    
    key = f"rate_limit:{client_ip}"
    current = await redis_client.get(key)
    
    if current is None:
        await redis_client.setex(key, 60, 1)
    else:
        count = int(current)
        if count >= 100:
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Rate limit exceeded",
                    "message": "Too many requests. Please try again in a minute."
                }
            )
        await redis_client.incr(key)
    
    return await call_next(request)

# Include API routes
app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(x402.router, prefix="/x402", tags=["x402"])
app.include_router(knowledge.router, prefix="/api/v1", tags=["knowledge"])

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Crypto Knowledge API - First AI-accessible expert crypto knowledge",
        "version": "1.0.0",
        "book": "Cryptocurrencies Decrypted: Hope and Economic Freedom for a Broken Financial System",
        "author": "Oskar Hurme",
        "features": [
            "X402 micropayments",
            "AI-powered semantic search",
            "Expert crypto knowledge",
            "Real-time payments on Base L2"
        ],
        "docs": "/docs",
        "status": "/health"
    }

# OpenAPI schema customization
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    from fastapi.openapi.utils import get_openapi
    
    openapi_schema = get_openapi(
        title="Crypto Knowledge API",
        version="1.0.0",
        description="""
        # The First AI-Monetized Book
        
        Transform expert crypto knowledge into an AI-accessible service using X402 micropayments.
        
        ## Features
        - 🧠 **Expert Knowledge**: Content from "Cryptocurrencies Decrypted" by Oskar Hurme
        - ⚡ **X402 Payments**: Micropayments on Base L2 (USDC)
        - 🤖 **AI-Native**: Designed for AI agents and applications
        - 🔍 **Semantic Search**: Vector-based knowledge retrieval
        - ⚡ **Real-Time**: 2-second payment settlement
        
        ## Pricing Tiers
        - **Snippet** ($0.001): Quick answer, 1-2 sentences
        - **Explanation** ($0.005): Detailed explanation, 1-2 paragraphs  
        - **Analysis** ($0.01): Multi-concept analysis, comprehensive
        - **Chapter Summary** ($0.02): Full chapter insights and context
        
        ## X402 Integration
        All knowledge endpoints support X402 micropayments. AI agents can:
        1. Query any endpoint
        2. Receive HTTP 402 Payment Required
        3. Pay with USDC on Base
        4. Access expert crypto knowledge
        
        No API keys. No subscriptions. Just pay-per-use knowledge.
        """,
        routes=app.routes,
    )
    
    # Add X402 payment schemas
    openapi_schema["components"]["schemas"]["PaymentRequired"] = {
        "type": "object",
        "properties": {
            "error": {"type": "string", "example": "Payment required"},
            "payment": {
                "type": "object",
                "properties": {
                    "chainId": {"type": "integer", "example": 8453},
                    "to": {"type": "string", "example": "0x..."},
                    "amount": {"type": "string", "example": "5000"},
                    "currency": {"type": "string", "example": "USDC"}
                }
            },
            "price_usd": {"type": "number", "example": 0.005}
        }
    }
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        access_log=True
    )