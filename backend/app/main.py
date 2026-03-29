"""
Sage Molly - X402 Enabled
Expert crypto education from "Cryptocurrencies Decrypted" by Oskar Hurme
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
from app.core.database import get_db_pool, init_db
from app.core.cache import get_redis_client
from app.core.x402 import X402Manager
from app.api.routes import knowledge, health, x402, freemium
from app.api.routes.knowledge import _PaymentRequired
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
    logger.info("Starting up Sage Molly...")

    # Initialize core services
    settings = get_settings()

    # C-2: Block startup if payment verification is disabled in production
    if settings.SKIP_PAYMENT_VERIFY and not settings.DEBUG:
        raise RuntimeError(
            "SKIP_PAYMENT_VERIFY=true is not allowed when DEBUG=false. "
            "This setting must only be used in local development."
        )
    
    # Initialize database connection pool and schema (with graceful degradation)
    try:
        app.state.db_pool = await get_db_pool(settings.DATABASE_URL)
        await init_db(app.state.db_pool)
        logger.info("Database connection pool initialized")
    except Exception as e:
        logger.error("Database initialization failed — running in degraded mode", error=str(e))
        app.state.db_pool = None

    # Initialize Redis cache
    app.state.redis_client = await get_redis_client(settings.REDIS_URL)
    logger.info("Redis cache client initialized")
    
    # Initialize X402 manager
    app.state.x402_manager = X402Manager(
        payment_address=settings.PAYMENT_ADDRESS,
        chain_id=8453,
        facilitator_url=settings.X402_FACILITATOR_URL
    )
    logger.info("X402 payment manager initialized")
    
    # Initialize AI services (with graceful degradation)
    try:
        app.state.embedding_service = EmbeddingService(
            openai_api_key=settings.OPENAI_API_KEY,
            pinecone_api_key=settings.PINECONE_API_KEY,
            index_name=settings.PINECONE_INDEX_NAME
        )
        logger.info("AI embedding service initialized")
    except Exception as e:
        logger.warning("AI embedding service initialization failed (will retry on use)", error=str(e))
        app.state.embedding_service = None
    
    # Initialize knowledge service (with graceful degradation)
    try:
        db_pool = app.state.db_pool
        app.state.knowledge_service = KnowledgeService(
            db_pool=db_pool,
            embedding_service=app.state.embedding_service,
            redis_client=app.state.redis_client
        ) if db_pool else None
        if app.state.knowledge_service:
            logger.info("Knowledge service initialized")
        else:
            logger.warning("Knowledge service unavailable — no database connection")
    except Exception as e:
        logger.warning("Knowledge service initialization failed (will retry on use)", error=str(e))
        app.state.knowledge_service = None
    
    logger.info("🚀 Sage Molly startup complete!")
    
    yield
    
    # Shutdown tasks
    logger.info("Shutting down Sage Molly...")
    
    if hasattr(app.state, 'db_pool') and app.state.db_pool is not None:
        await app.state.db_pool.close()
        logger.info("Database connections closed")
    
    if hasattr(app.state, 'redis_client'):
        await app.state.redis_client.close()
        logger.info("Redis connections closed")
    
    logger.info("✅ Sage Molly shutdown complete")

# Create FastAPI application
app = FastAPI(
    title="Sage Molly",
    description="Expert crypto education from 'Cryptocurrencies Decrypted' with X402 micropayments",
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

cors_origins = settings.CORS_ORIGINS.split(",") if settings.CORS_ORIGINS else ["*"]
is_wildcard = "*" in cors_origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=not is_wildcard,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Request-ID", "PAYMENT-SIGNATURE"],
)

# x402 Payment Required handler — x402 v2: PAYMENT-REQUIRED header is base64-encoded JSON
import json as _json
import base64 as _base64
@app.exception_handler(_PaymentRequired)
async def payment_required_handler(request: Request, exc: _PaymentRequired):
    accepts = exc.body.get("accepts", [])
    payload = {"x402Version": 2, "accepts": accepts, "error": "Payment Required"}
    encoded = _base64.b64encode(_json.dumps(payload).encode()).decode()
    return JSONResponse(
        status_code=402,
        content={"error": "Payment Required"},
        headers={"PAYMENT-REQUIRED": encoded}
    )

from fastapi.exceptions import RequestValidationError

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "error": "Validation error",
            "message": "Invalid request parameters. Please check your input and try again.",
        },
    )

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

# Rate limiting middleware — H-3: atomic INCR + conditional EXPIRE avoids race condition
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Rate limiting - 100 requests per minute per IP"""
    try:
        client_ip = request.client.host
        redis_client = request.app.state.redis_client

        key = f"rate_limit:{client_ip}"
        count = await redis_client.incr(key)
        if count == 1:
            await redis_client.expire(key, 60)

        if count > 100:
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Rate limit exceeded",
                    "message": "Too many requests. Please try again in a minute."
                }
            )
    except Exception:
        pass

    return await call_next(request)

# Include API routes
app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(x402.router, prefix="/x402", tags=["x402"])
app.include_router(knowledge.router, prefix="/api/v1", tags=["knowledge"])
app.include_router(freemium.router, prefix="/api/v1", tags=["freemium"])

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Sage Molly - Expert crypto education for humans and AI agents",
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
        title="Sage Molly",
        version="1.0.0",
        description="""
        # Sage Molly — Expert Crypto Education
        
        Expert crypto education from "Cryptocurrencies Decrypted" by Oskar Hurme, powered by X402 micropayments.
        
        ## Features
        - 🧠 **Expert Knowledge**: Content from "Cryptocurrencies Decrypted" by Oskar Hurme
        - 🙋 **3 Free Questions**: Start learning with just your email
        - ⚡ **X402 Payments**: Pay-per-query with USDC on Base L2
        - 🤖 **For Everyone**: Normies and devs alike
        
        ## Pricing
        - **Explanation** ($0.01): Concise explanation, 1-2 paragraphs
        - **Summary** ($0.02): Detailed summary with full context
        - **Analysis** ($0.03): Comprehensive multi-concept analysis
        
        ## Free Tier
        3 free questions with email signup. After that, X402 micropayments kick in.
        
        Sage Molly educates, not advises. Nothing here is financial advice.
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