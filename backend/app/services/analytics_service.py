"""Analytics service for tracking knowledge API usage"""

from datetime import datetime, timedelta
import json
from typing import Dict, Any, Optional
import structlog

logger = structlog.get_logger()


class AnalyticsService:
    """Track and aggregate knowledge API usage analytics"""
    
    def __init__(self, redis_client):
        """Initialize analytics service with Redis client"""
        self.redis = redis_client
        self.prefix = "analytics"
    
    async def track_query(
        self,
        query: str,
        tier: str,
        client_ip: str,
        user_agent: str
    ) -> None:
        """
        Track a knowledge query with metadata
        
        Args:
            query: The search query string
            tier: The pricing tier used (snippet, explanation, analysis, chapter_summary)
            client_ip: Client IP address
            user_agent: Client user agent string
        """
        
        try:
            timestamp = datetime.utcnow().isoformat()
            
            # Create analytics event
            event = {
                "query": query[:100],  # Truncate long queries
                "tier": tier,
                "client_ip": client_ip,
                "user_agent": user_agent[:200],  # Truncate user agent
                "timestamp": timestamp
            }
            
            # Store in Redis with TTL (keep analytics for 30 days)
            key = f"{self.prefix}:query:{timestamp}:{client_ip}"
            await self.redis.setex(
                key,
                30 * 24 * 60 * 60,  # 30 days in seconds
                json.dumps(event)
            )
            
            # Update daily counters
            today = datetime.utcnow().strftime("%Y-%m-%d")
            counter_key = f"{self.prefix}:daily:{today}:count"
            await self.redis.incr(counter_key)
            
            # Update tier counters
            tier_key = f"{self.prefix}:daily:{today}:tier:{tier}"
            await self.redis.incr(tier_key)
            
            # Set TTL on counter keys (keep for 60 days)
            await self.redis.expire(counter_key, 60 * 24 * 60 * 60)
            await self.redis.expire(tier_key, 60 * 24 * 60 * 60)
            
            logger.info(
                "Query tracked",
                query_preview=query[:30],
                tier=tier,
                timestamp=timestamp
            )
            
        except Exception as e:
            # Don't fail the request if analytics tracking fails
            logger.warning(
                "Analytics tracking failed",
                error=str(e),
                query=query[:30],
                tier=tier
            )
    
    async def get_daily_stats(self, date: Optional[str] = None) -> Dict[str, Any]:
        """
        Get analytics for a specific day
        
        Args:
            date: Date in YYYY-MM-DD format (defaults to today)
            
        Returns:
            Dictionary with daily statistics
        """
        
        if date is None:
            date = datetime.utcnow().strftime("%Y-%m-%d")
        
        try:
            count_key = f"{self.prefix}:daily:{date}:count"
            total_queries = await self.redis.get(count_key) or 0
            
            # Get tier breakdown
            tiers = ["snippet", "explanation", "analysis", "chapter_summary"]
            tier_counts = {}
            
            for tier in tiers:
                tier_key = f"{self.prefix}:daily:{date}:tier:{tier}"
                count = await self.redis.get(tier_key) or 0
                tier_counts[tier] = int(count)
            
            return {
                "date": date,
                "total_queries": int(total_queries),
                "by_tier": tier_counts
            }
            
        except Exception as e:
            logger.error("Failed to get daily stats", date=date, error=str(e))
            return {
                "date": date,
                "total_queries": 0,
                "by_tier": {}
            }
    
    async def get_weekly_stats(self, start_date: Optional[str] = None) -> Dict[str, Any]:
        """
        Get analytics for the past week
        
        Args:
            start_date: Start date in YYYY-MM-DD format (defaults to 7 days ago)
            
        Returns:
            Dictionary with weekly statistics aggregated by day
        """
        
        if start_date is None:
            end_date = datetime.utcnow()
            start_date = (end_date - timedelta(days=7)).strftime("%Y-%m-%d")
        else:
            end_date = datetime.strptime(start_date, "%Y-%m-%d") + timedelta(days=7)
        
        try:
            daily_stats = []
            total_queries = 0
            total_by_tier = {
                "snippet": 0,
                "explanation": 0,
                "analysis": 0,
                "chapter_summary": 0
            }
            
            current_date = datetime.strptime(start_date, "%Y-%m-%d")
            
            while current_date < end_date:
                date_str = current_date.strftime("%Y-%m-%d")
                stats = await self.get_daily_stats(date_str)
                
                daily_stats.append(stats)
                total_queries += stats["total_queries"]
                
                for tier, count in stats["by_tier"].items():
                    total_by_tier[tier] += count
                
                current_date += timedelta(days=1)
            
            return {
                "start_date": start_date,
                "end_date": end_date.strftime("%Y-%m-%d"),
                "total_queries": total_queries,
                "by_tier": total_by_tier,
                "daily_breakdown": daily_stats
            }
            
        except Exception as e:
            logger.error("Failed to get weekly stats", start_date=start_date, error=str(e))
            return {
                "start_date": start_date,
                "total_queries": 0,
                "by_tier": {},
                "daily_breakdown": []
            }
