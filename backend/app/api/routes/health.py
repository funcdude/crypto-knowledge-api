"""Health check endpoints for system monitoring"""

from fastapi import APIRouter, Request, HTTPException
from datetime import datetime
import structlog

logger = structlog.get_logger()
router = APIRouter()


@router.get("")
async def health_check(request: Request):
    """
    Basic health check endpoint
    
    Returns:
        Health status and service information
    """
    
    try:
        # Check Redis connection
        redis_client = request.app.state.redis_client
        await redis_client.ping()
        redis_status = "healthy"
    except Exception as e:
        logger.warning("Redis health check failed", error=str(e))
        redis_status = "unhealthy"
    
    try:
        # Check database connection
        db_pool = request.app.state.db_pool
        conn = await db_pool.acquire()
        try:
            await conn.fetchval("SELECT 1")
            db_status = "healthy"
        finally:
            await conn.close()
    except Exception as e:
        logger.warning("Database health check failed", error=str(e))
        db_status = "unhealthy"
    
    # Overall status
    overall_status = "healthy" if redis_status == "healthy" and db_status == "healthy" else "degraded"
    
    return {
        "status": overall_status,
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "redis": redis_status,
            "database": db_status
        },
        "version": "1.0.0",
        "name": "Crypto Knowledge API"
    }


@router.get("/ready")
async def readiness_check(request: Request):
    """
    Readiness check - ensures all services are ready for requests
    
    Returns 200 only if all critical services are operational
    """
    
    try:
        # Check Redis
        redis_client = request.app.state.redis_client
        await redis_client.ping()
        
        # Check database
        db_pool = request.app.state.db_pool
        conn = await db_pool.acquire()
        try:
            await conn.fetchval("SELECT 1")
        finally:
            await conn.close()
        
        # Check embeddings service
        if not hasattr(request.app.state, 'embedding_service'):
            raise Exception("Embedding service not initialized")
        
        # Check knowledge service
        if not hasattr(request.app.state, 'knowledge_service'):
            raise Exception("Knowledge service not initialized")
        
        return {
            "ready": True,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error("Readiness check failed", error=str(e))
        raise HTTPException(
            status_code=503,
            detail={
                "ready": False,
                "error": "Service not ready",
                "message": str(e)
            }
        )


@router.get("/live")
async def liveness_check(request: Request):
    """
    Liveness check - indicates if service is running (even if degraded)
    
    Returns 200 if the service is running, even if partially degraded
    """
    
    return {
        "alive": True,
        "timestamp": datetime.utcnow().isoformat(),
        "service": "Crypto Knowledge API"
    }
