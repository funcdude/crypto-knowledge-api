"""Database connection management"""

import asyncpg
from typing import Optional
import structlog

logger = structlog.get_logger()


class DatabasePool:
    """Manages AsyncPG connection pool"""
    
    def __init__(self, pool: asyncpg.pool.Pool):
        self.pool = pool
    
    async def acquire(self):
        """Acquire a connection from the pool"""
        return await self.pool.acquire()
    
    async def close(self):
        """Close all connections in the pool"""
        await self.pool.close()


async def get_db_pool(database_url: str) -> DatabasePool:
    """
    Create and return an AsyncPG connection pool
    
    Args:
        database_url: PostgreSQL connection string
        
    Returns:
        DatabasePool instance
    """
    
    try:
        pool = await asyncpg.create_pool(
            database_url,
            min_size=5,
            max_size=20,
            command_timeout=60
        )
        
        logger.info("Database pool created", min_size=5, max_size=20)
        return DatabasePool(pool)
        
    except Exception as e:
        logger.error("Failed to create database pool", error=str(e))
        raise


async def init_db(db_pool: DatabasePool) -> None:
    """
    Initialize database schema

    Args:
        db_pool: Database connection pool
    """

    try:
        async with db_pool.pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS knowledge_chunks (
                    id SERIAL PRIMARY KEY,
                    chapter VARCHAR(255),
                    section VARCHAR(255),
                    content TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS used_payments (
                    tx_hash TEXT PRIMARY KEY,
                    from_address TEXT,
                    to_address TEXT,
                    amount TEXT,
                    currency TEXT,
                    chain_id INTEGER,
                    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS free_queries (
                    id SERIAL PRIMARY KEY,
                    email TEXT NOT NULL,
                    query_count INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                CREATE UNIQUE INDEX IF NOT EXISTS idx_free_queries_email
                    ON free_queries (LOWER(email));
            """)

            logger.info("Database schema initialized")

    except Exception as e:
        logger.error("Failed to initialize database", error=str(e))
        raise
