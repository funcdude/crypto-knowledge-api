"""Knowledge service for semantic search and content retrieval"""

import json
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
import structlog

from app.core.config import get_settings, get_pricing_config
from app.services.embedding_service import EmbeddingService
from app.services.text_utils import fix_concatenated_text, should_fix, clean_punctuation

logger = structlog.get_logger()

class KnowledgeService:
    """Service for managing crypto knowledge retrieval and processing"""
    
    def __init__(self, db_pool, embedding_service: EmbeddingService, redis_client):
        self.db_pool = db_pool
        self.embedding_service = embedding_service
        self.redis = redis_client
        self.settings = get_settings()
        
        # Predefined concepts for optimized responses
        self.concept_map = {
            "bitcoin": ["bitcoin", "btc", "satoshi", "proof of work", "digital gold"],
            "ethereum": ["ethereum", "eth", "smart contracts", "vitalik", "gas fees"],
            "defi": ["defi", "decentralized finance", "uniswap", "compound", "liquidity"],
            "stablecoins": ["stablecoin", "usdc", "tether", "usdt", "dai", "algorithmic"],
            "cantillon_effect": ["cantillon", "cantillon effect", "asset owners", "monetary policy"],
            "cbdc": ["cbdc", "central bank digital currency", "digital dollar", "digital yuan"],
            "blockchain": ["blockchain", "distributed ledger", "consensus", "immutable"],
            "mining": ["mining", "miners", "hash rate", "difficulty", "asic"],
            "nft": ["nft", "non-fungible token", "opensea", "digital collectibles"],
            "web3": ["web3", "decentralization", "ownership", "middleware"]
        }
    
    async def search_knowledge(
        self,
        query: str,
        tier: str,
        topics: Optional[List[str]] = None,
        complexity: Optional[str] = None,
        max_results: int = 3
    ) -> List[Dict[str, Any]]:
        """Search knowledge base using semantic search"""
        
        # Get cache key
        cache_key = f"search:{hash(query)}:{tier}:{topics}:{complexity}:{max_results}"
        
        # Check cache first
        cached = await self.redis.get(cache_key)
        if cached:
            logger.info("Returning cached search results", query=query)
            return json.loads(cached)
        
        try:
            # Generate query embedding
            query_embedding = await self.embedding_service.get_embedding(query)
            
            # Search vector database
            search_results = await self.embedding_service.search_similar(
                query_embedding=query_embedding,
                top_k=max_results * 3,  # Get more to filter
                topics=topics,
                complexity=complexity
            )
            
            # Process and format results based on tier
            formatted_results = await self._format_search_results(
                results=search_results,
                tier=tier,
                query=query,
                max_results=max_results
            )
            
            # Cache results
            await self.redis.setex(
                cache_key, 
                self.settings.CACHE_TTL, 
                json.dumps(formatted_results)
            )
            
            logger.info(
                "Knowledge search completed",
                query=query,
                tier=tier,
                results_count=len(formatted_results)
            )
            
            return formatted_results
            
        except Exception as e:
            logger.error("Knowledge search failed", query=query, error=str(e))
            raise
    
    async def get_concept_explanation(
        self, 
        concept: str,
        tier: str
    ) -> Optional[Dict[str, Any]]:
        """Get explanation for a specific concept"""
        
        # Check if it's a known concept
        concept_lower = concept.lower()
        matched_concept = None
        
        for key, synonyms in self.concept_map.items():
            if concept_lower in synonyms or any(syn in concept_lower for syn in synonyms):
                matched_concept = key
                break
        
        if matched_concept:
            # Use optimized search for known concepts
            return await self._get_optimized_concept(matched_concept, tier)
        else:
            # Fallback to general search
            results = await self.search_knowledge(
                query=f"explain {concept}",
                tier=tier,
                max_results=1
            )
            return results[0] if results else None
    
    async def compare_concepts(
        self,
        concept1: str,
        concept2: str,
        tier: str
    ) -> Dict[str, Any]:
        """Compare two concepts side-by-side"""
        
        # Generate comparison query
        query = f"compare {concept1} and {concept2}, differences and similarities"
        
        # Search for relevant content
        results = await self.search_knowledge(
            query=query,
            tier=tier,
            max_results=5
        )
        
        # Synthesize comparison
        comparison = await self._synthesize_comparison(
            concept1=concept1,
            concept2=concept2,
            search_results=results,
            tier=tier
        )
        
        return comparison
    
    async def get_topic_timeline(
        self,
        topic: str,
        tier: str
    ) -> Optional[Dict[str, Any]]:
        """Get historical timeline for a topic"""
        
        # Search for historical content
        query = f"{topic} history timeline evolution development"
        
        results = await self.search_knowledge(
            query=query,
            tier=tier,
            max_results=5
        )
        
        if not results:
            return None
        
        # Extract and organize timeline information
        timeline = await self._extract_timeline(
            topic=topic,
            search_results=results,
            tier=tier
        )
        
        return timeline
    
    async def _format_search_results(
        self,
        results: List[Dict[str, Any]],
        tier: str,
        query: str,
        max_results: int
    ) -> List[Dict[str, Any]]:
        """Format search results based on tier"""
        
        pricing_config = get_pricing_config()
        tier_config = pricing_config[tier]
        max_tokens = tier_config["max_tokens"]
        
        formatted_results = []
        total_tokens = 0
        
        for result in results[:max_results]:
            # Extract content based on tier
            content = result.get("content", "")

            if should_fix(content):
                fixed_lines = [
                    fix_concatenated_text(line) if line.strip() else line
                    for line in content.splitlines()
                ]
                content = "\n".join(fixed_lines)

            content = clean_punctuation(content)

            if tier == "explanation":
                sentences = content.split(". ")
                content = ". ".join(sentences[:3]) + ("." if len(sentences) > 3 else "")
            
            formatted_result = {
                "content": content,
                "relevance_score": result.get("score", 0),
                "chapter": result.get("chapter", "Unknown"),
                "topics": result.get("topics", []),
                "complexity": result.get("complexity", "intermediate"),
                "word_count": len(content.split()),
                "source": {
                    "book": self.settings.BOOK_TITLE,
                    "author": self.settings.BOOK_AUTHOR,
                    "chapter": result.get("chapter", "Unknown")
                }
            }
            
            formatted_results.append(formatted_result)
        
        return formatted_results
    
    async def _get_optimized_concept(
        self,
        concept: str,
        tier: str
    ) -> Dict[str, Any]:
        """Get optimized response for known concepts"""
        
        # These would be pre-processed and optimized explanations
        # For now, use semantic search with concept-specific queries
        
        concept_queries = {
            "bitcoin": "Bitcoin digital money peer-to-peer electronic cash system Satoshi",
            "ethereum": "Ethereum smart contracts programmable blockchain Vitalik Buterin",
            "defi": "DeFi decentralized finance protocols Uniswap Compound lending",
            "stablecoins": "stablecoins USDC Tether price stability peg dollar",
            "cantillon_effect": "Cantillon effect asset owners money printing inequality",
            "cbdc": "CBDC central bank digital currency government money control",
        }
        
        query = concept_queries.get(concept, concept)
        
        results = await self.search_knowledge(
            query=query,
            tier=tier,
            max_results=1
        )
        
        return results[0] if results else None
    
    async def _synthesize_comparison(
        self,
        concept1: str,
        concept2: str,
        search_results: List[Dict[str, Any]],
        tier: str
    ) -> Dict[str, Any]:
        """Synthesize comparison from search results"""
        
        # Extract relevant content about both concepts
        concept1_content = []
        concept2_content = []
        general_content = []
        
        for result in search_results:
            content = result["content"].lower()
            if concept1.lower() in content:
                concept1_content.append(result)
            elif concept2.lower() in content:
                concept2_content.append(result)
            else:
                general_content.append(result)
        
        # Create structured comparison
        comparison = {
            "concept1": {
                "name": concept1,
                "key_points": self._extract_key_points(concept1_content),
                "characteristics": self._extract_characteristics(concept1_content)
            },
            "concept2": {
                "name": concept2,
                "key_points": self._extract_key_points(concept2_content),
                "characteristics": self._extract_characteristics(concept2_content)
            },
            "similarities": self._find_similarities(concept1_content, concept2_content),
            "differences": self._find_differences(concept1_content, concept2_content),
            "use_cases": self._compare_use_cases(concept1_content, concept2_content),
            "conclusion": self._generate_comparison_conclusion(
                concept1, concept2, concept1_content, concept2_content
            )
        }
        
        return comparison
    
    async def _extract_timeline(
        self,
        topic: str,
        search_results: List[Dict[str, Any]],
        tier: str
    ) -> Dict[str, Any]:
        """Extract timeline information from search results"""
        
        # This is a simplified implementation
        # In production, you'd have more sophisticated timeline extraction
        
        events = []
        for result in search_results:
            content = result["content"]
            
            # Extract date patterns and associated events
            # This is a placeholder - would need proper NLP
            if any(year in content for year in ["2009", "2008", "2010", "2011", "2012"]):
                events.append({
                    "period": "Early Period (2008-2012)",
                    "description": content[:200] + "...",
                    "significance": "Foundation and early development"
                })
            elif any(year in content for year in ["2017", "2018", "2019", "2020"]):
                events.append({
                    "period": "Growth Period (2017-2020)",
                    "description": content[:200] + "...",
                    "significance": "Mainstream adoption begins"
                })
        
        return {
            "topic": topic,
            "events": events[:5],  # Limit to 5 key events
            "summary": f"Timeline of key developments in {topic}",
            "source_chapters": list(set(r.get("chapter", "Unknown") for r in search_results))
        }
    
    def _extract_key_points(self, content_list: List[Dict[str, Any]]) -> List[str]:
        """Extract key points from content"""
        # Simplified implementation
        points = []
        for item in content_list[:3]:
            sentences = item["content"].split(". ")
            if sentences:
                points.append(sentences[0] + ".")
        return points
    
    def _extract_characteristics(self, content_list: List[Dict[str, Any]]) -> List[str]:
        """Extract characteristics from content"""
        # Simplified implementation
        characteristics = []
        for item in content_list[:2]:
            # Look for descriptive phrases
            content = item["content"]
            if "is" in content or "are" in content:
                sentences = content.split(". ")
                for sentence in sentences[:2]:
                    if any(word in sentence.lower() for word in ["is", "are", "provides", "enables"]):
                        characteristics.append(sentence + ".")
                        break
        return characteristics[:3]
    
    def _find_similarities(self, content1: List[Dict], content2: List[Dict]) -> List[str]:
        """Find similarities between concepts"""
        # Simplified implementation
        return ["Both are blockchain-based technologies", "Both aim to improve financial systems"]
    
    def _find_differences(self, content1: List[Dict], content2: List[Dict]) -> List[str]:
        """Find differences between concepts"""
        # Simplified implementation
        return ["Different consensus mechanisms", "Different primary use cases"]
    
    def _compare_use_cases(self, content1: List[Dict], content2: List[Dict]) -> Dict[str, List[str]]:
        """Compare use cases"""
        # Simplified implementation
        return {
            "concept1_use_cases": ["Digital payments", "Store of value"],
            "concept2_use_cases": ["Smart contracts", "DeFi applications"],
            "shared_use_cases": ["Alternative to traditional banking"]
        }
    
    def _generate_comparison_conclusion(self, concept1: str, concept2: str, content1: List[Dict], content2: List[Dict]) -> str:
        """Generate comparison conclusion"""
        return f"While {concept1} and {concept2} share some foundational principles, they serve different primary purposes in the cryptocurrency ecosystem and offer distinct advantages for different use cases."