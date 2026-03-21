"""Redis cache management"""

import redis.asyncio as aioredis
from typing import Optional, Any
import json
import structlog

logger = structlog.get_logger()


class RedisClient:
    """Wrapper around aioredis client"""
    
    def __init__(self, redis_client):
        self.redis = redis_client
    
    async def get(self, key: str) -> Optional[Any]:
        """Get a value from cache"""
        value = await self.redis.get(key)
        if value:
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                return value
        return None
    
    async def set(self, key: str, value: Any, ex: Optional[int] = None) -> None:
        """Set a value in cache"""
        await self.redis.set(
            key,
            json.dumps(value) if not isinstance(value, (str, bytes)) else value,
            ex=ex
        )
    
    async def setex(self, key: str, time: int, value: Any) -> None:
        """Set a value with expiration in seconds"""
        await self.redis.setex(
            key,
            time,
            json.dumps(value) if not isinstance(value, (str, bytes)) else value
        )
    
    async def delete(self, key: str) -> int:
        """Delete a key"""
        return await self.redis.delete(key)
    
    async def incr(self, key: str) -> int:
        """Increment a counter"""
        return await self.redis.incr(key)
    
    async def expire(self, key: str, time: int) -> bool:
        """Set key expiration"""
        return await self.redis.expire(key, time)
    
    async def ping(self) -> bool:
        """Test Redis connection"""
        return await self.redis.ping()
    
    async def close(self) -> None:
        """Close Redis connection"""
        await self.redis.close()


async def get_redis_client(redis_url: str) -> RedisClient:
    """
    Create and return a Redis async client
    
    Args:
        redis_url: Redis connection string (redis://localhost:6379/0)
        
    Returns:
        RedisClient wrapper instance
    """
    
    try:
        redis_client = await aioredis.from_url(
            redis_url,
            encoding="utf8",
            decode_responses=True
        )
        
        # Test connection
        await redis_client.ping()
        
        logger.info("Redis client connected", url=redis_url)
        return RedisClient(redis_client)
        
    except Exception as e:
        logger.error("Failed to connect to Redis", error=str(e), url=redis_url)
        raise
