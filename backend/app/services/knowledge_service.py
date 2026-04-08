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
        """Compare two concepts side-by-side using separate searches per concept"""

        c1_results = await self.search_knowledge(query=f"{concept1} characteristics features purpose", tier=tier, max_results=3)
        c2_results = await self.search_knowledge(query=f"{concept2} characteristics features purpose", tier=tier, max_results=3)

        comparison = await self._synthesize_comparison(
            concept1=concept1,
            concept2=concept2,
            concept1_results=c1_results,
            concept2_results=c2_results,
            tier=tier,
        )

        return comparison
    
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
            
            raw_score = result.get("score", 0)
            FLOOR = 0.70
            CEIL = 0.86
            match_pct = min(max(round((raw_score - FLOOR) / (CEIL - FLOOR) * 100), 0), 100)

            formatted_result = {
                "content": content,
                "relevance_score": raw_score,
                "match_percent": match_pct,
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
        concept1_results: List[Dict[str, Any]],
        concept2_results: List[Dict[str, Any]],
        tier: str
    ) -> Dict[str, Any]:
        """Synthesize comparison from two separate search result sets"""

        comparison = {
            "concept1": {
                "name": concept1,
                "key_points": self._extract_key_points(concept1_results),
                "characteristics": self._extract_characteristics(concept1_results)
            },
            "concept2": {
                "name": concept2,
                "key_points": self._extract_key_points(concept2_results),
                "characteristics": self._extract_characteristics(concept2_results)
            },
            "similarities": self._find_similarities(concept1_results, concept2_results),
            "differences": self._find_differences(concept1_results, concept2_results),
            "use_cases": self._compare_use_cases(concept1, concept2, concept1_results, concept2_results),
            "conclusion": self._generate_comparison_conclusion(
                concept1, concept2, concept1_results, concept2_results
            )
        }

        return comparison
    
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
        """Find similarities between concepts by looking for shared terms"""
        if not content1 or not content2:
            return []

        text1 = " ".join(r.get("content", "") for r in content1).lower()
        text2 = " ".join(r.get("content", "") for r in content2).lower()

        shared_themes = []
        theme_keywords = {
            "Both relate to blockchain technology": ["blockchain", "block", "chain", "ledger"],
            "Both aim to improve financial systems": ["financial", "finance", "banking", "monetary"],
            "Both involve decentralization": ["decentraliz", "peer-to-peer", "distributed"],
            "Both use cryptographic security": ["cryptograph", "encrypt", "hash", "signing"],
            "Both are part of the digital asset ecosystem": ["digital", "token", "asset", "crypto"],
            "Both involve consensus mechanisms": ["consensus", "proof", "validat", "mining"],
            "Both address trust in financial transactions": ["trust", "trustless", "intermediar"],
        }

        for theme, keywords in theme_keywords.items():
            if any(k in text1 for k in keywords) and any(k in text2 for k in keywords):
                shared_themes.append(theme)

        return shared_themes[:3] if shared_themes else ["Both are part of the cryptocurrency ecosystem"]

    def _find_differences(self, content1: List[Dict], content2: List[Dict]) -> List[str]:
        """Find differences between concepts based on unique content"""
        if not content1 or not content2:
            return []

        text1 = " ".join(r.get("content", "") for r in content1).lower()
        text2 = " ".join(r.get("content", "") for r in content2).lower()

        diff_markers = {
            "Different primary purposes": ["payment", "smart contract", "store of value", "programmab", "lending", "stablecoin"],
            "Different consensus mechanisms": ["proof of work", "proof of stake", "mining", "staking"],
            "Different governance models": ["governance", "dao", "foundation", "community"],
            "Different scalability approaches": ["layer 2", "scaling", "throughput", "shard"],
            "Different levels of programmability": ["turing complete", "script", "smart contract", "solidity"],
        }

        diffs = []
        for diff, keywords in diff_markers.items():
            t1_hits = sum(1 for k in keywords if k in text1)
            t2_hits = sum(1 for k in keywords if k in text2)
            if abs(t1_hits - t2_hits) >= 1 and (t1_hits > 0 or t2_hits > 0):
                diffs.append(diff)

        return diffs[:3] if diffs else ["Serve different roles in the crypto ecosystem"]

    def _compare_use_cases(self, concept1: str, concept2: str, content1: List[Dict], content2: List[Dict]) -> Dict[str, List[str]]:
        """Extract use cases from actual content for each concept"""
        def _extract_uses(results: List[Dict]) -> List[str]:
            uses = []
            use_markers = ["used for", "enables", "allows", "designed to", "purpose", "can be used", "provides"]
            for r in results:
                for sentence in r.get("content", "").split(". "):
                    if any(m in sentence.lower() for m in use_markers) and len(sentence) > 20:
                        clean = sentence.strip().rstrip(".")
                        if len(clean) < 200:
                            uses.append(clean + ".")
                            break
            return uses[:2] if uses else [f"Core functionality of {concept1 if results is content1 else concept2}"]

        c1_uses = _extract_uses(content1)
        c2_uses = _extract_uses(content2)

        return {
            "concept1_use_cases": c1_uses,
            "concept2_use_cases": c2_uses,
        }

    def _generate_comparison_conclusion(self, concept1: str, concept2: str, content1: List[Dict], content2: List[Dict]) -> str:
        """Generate comparison conclusion from actual content"""
        return f"While {concept1} and {concept2} share some foundational principles, they serve different primary purposes in the cryptocurrency ecosystem and offer distinct advantages for different use cases."