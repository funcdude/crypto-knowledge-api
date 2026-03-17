"""Application configuration using Pydantic settings"""

from functools import lru_cache
from typing import Optional, List
from pydantic import BaseSettings, validator
import os

class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # API Configuration
    APP_NAME: str = "Crypto Knowledge API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALLOWED_HOSTS: Optional[str] = None
    CORS_ORIGINS: str = "*"
    
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost/crypto_knowledge"
    
    # Redis Cache
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # AI Services
    OPENAI_API_KEY: str
    PINECONE_API_KEY: str
    PINECONE_ENVIRONMENT: str = "us-west1-gcp-free"
    PINECONE_INDEX_NAME: str = "crypto-knowledge"
    
    # X402 Payment Configuration
    PAYMENT_ADDRESS: str = "0x28e6b3e3e32308787f50e6d99e2b98745b381946"  # Our Bankr wallet
    X402_FACILITATOR_URL: str = "https://facilitator.coinbase.com"
    
    # Bankr Integration
    BANKR_API_KEY: Optional[str] = None
    BANKR_API_URL: str = "https://api.bankr.bot"
    
    # Pricing Configuration (in USDC, 6 decimals)
    PRICE_SNIPPET: float = 0.001      # $0.001
    PRICE_EXPLANATION: float = 0.005  # $0.005  
    PRICE_ANALYSIS: float = 0.01      # $0.01
    PRICE_CHAPTER_SUMMARY: float = 0.02  # $0.02
    
    # Content Configuration
    BOOK_TITLE: str = "Cryptocurrencies Decrypted: Hope and Economic Freedom for a Broken Financial System"
    BOOK_AUTHOR: str = "Oskar Hurme"
    BOOK_AMAZON_URL: str = "https://www.amazon.com/Cryptocurrencies-Decrypted-Economic-Freedom-Financial-ebook/dp/B0DQXC7XVJ"
    
    # Performance
    MAX_CHUNK_SIZE: int = 1000
    MAX_QUERY_LENGTH: int = 500
    CACHE_TTL: int = 3600  # 1 hour
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 100
    RATE_LIMIT_BURST: int = 10
    
    @validator("DATABASE_URL")
    def validate_database_url(cls, v):
        if not v.startswith(("postgresql://", "postgresql+asyncpg://")):
            raise ValueError("DATABASE_URL must be a valid PostgreSQL URL")
        return v
    
    @validator("REDIS_URL") 
    def validate_redis_url(cls, v):
        if not v.startswith("redis://"):
            raise ValueError("REDIS_URL must be a valid Redis URL")
        return v
    
    @validator("OPENAI_API_KEY")
    def validate_openai_key(cls, v):
        if not v.startswith("sk-"):
            raise ValueError("OPENAI_API_KEY must start with 'sk-'")
        return v
    
    @validator("PAYMENT_ADDRESS")
    def validate_payment_address(cls, v):
        if not v.startswith("0x") or len(v) != 42:
            raise ValueError("PAYMENT_ADDRESS must be a valid Ethereum address")
        return v
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

# Pricing tiers with descriptions
PRICING_TIERS = {
    "snippet": {
        "price": 0.001,
        "description": "Quick answer, 1-2 sentences",
        "max_tokens": 100,
        "use_case": "Simple fact checking"
    },
    "explanation": {
        "price": 0.005, 
        "description": "Detailed explanation, 1-2 paragraphs",
        "max_tokens": 300,
        "use_case": "Concept understanding"
    },
    "analysis": {
        "price": 0.01,
        "description": "Multi-concept analysis, comprehensive",
        "max_tokens": 800,
        "use_case": "Complex analysis and comparison"
    },
    "chapter_summary": {
        "price": 0.02,
        "description": "Full chapter insights and context", 
        "max_tokens": 1500,
        "use_case": "Deep dive into specific topics"
    }
}

@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()

def get_pricing_config():
    """Get pricing configuration"""
    return PRICING_TIERS

def format_price_for_usdc(price_usd: float) -> str:
    """Convert USD price to USDC wei format (6 decimals)"""
    return str(int(price_usd * 1_000_000))

def get_book_metadata():
    """Get book metadata for responses"""
    settings = get_settings()
    return {
        "title": settings.BOOK_TITLE,
        "author": settings.BOOK_AUTHOR,
        "amazon_url": settings.BOOK_AMAZON_URL,
        "description": "Expert crypto knowledge from a fintech practitioner and fractional CPO"
    }