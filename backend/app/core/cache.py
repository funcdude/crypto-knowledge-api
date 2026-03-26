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
        value = await self.redis.get(key)
        if value:
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                return value
        return None
    
    async def set(self, key: str, value: Any, ex: Optional[int] = None) -> None:
        await self.redis.set(
            key,
            json.dumps(value) if not isinstance(value, (str, bytes)) else value,
            ex=ex
        )
    
    async def setex(self, key: str, time: int, value: Any) -> None:
        await self.redis.setex(
            key,
            time,
            json.dumps(value) if not isinstance(value, (str, bytes)) else value
        )
    
    async def delete(self, key: str) -> int:
        return await self.redis.delete(key)
    
    async def incr(self, key: str) -> int:
        return await self.redis.incr(key)
    
    async def expire(self, key: str, time: int) -> bool:
        return await self.redis.expire(key, time)
    
    async def ping(self) -> bool:
        return await self.redis.ping()
    
    async def close(self) -> None:
        await self.redis.close()


class NullRedisClient:
    """No-op Redis client used when Redis is unavailable.
    All operations silently succeed — caching and rate limiting are disabled."""

    async def get(self, key: str) -> Optional[Any]:
        return None

    async def set(self, key: str, value: Any, ex: Optional[int] = None) -> None:
        pass

    async def setex(self, key: str, time: int, value: Any) -> None:
        pass

    async def delete(self, key: str) -> int:
        return 0

    async def incr(self, key: str) -> int:
        return 0

    async def expire(self, key: str, time: int) -> bool:
        return True

    async def ping(self) -> bool:
        return False

    async def close(self) -> None:
        pass


async def get_redis_client(redis_url: str) -> RedisClient:
    """
    Create and return a Redis async client.
    Falls back to a NullRedisClient if Redis is unavailable.
    """
    try:
        redis_client = await aioredis.from_url(
            redis_url,
            encoding="utf8",
            decode_responses=True,
            socket_connect_timeout=2,
        )
        await redis_client.ping()
        logger.info("Redis client connected", url=redis_url)
        return RedisClient(redis_client)

    except Exception as e:
        logger.warning("Redis unavailable — running without cache/rate limiting", error=str(e))
        return NullRedisClient()
