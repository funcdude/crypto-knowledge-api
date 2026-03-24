"""AI embedding service for semantic search using OpenAI and Pinecone"""

import asyncio
from typing import List, Dict, Any, Optional
import openai
from pinecone import Pinecone
import numpy as np
import structlog

logger = structlog.get_logger()

class EmbeddingService:
    """Service for generating and managing embeddings for semantic search"""

    def __init__(self, openai_api_key: str, pinecone_api_key: str, index_name: str = "crypto-knowledge"):
        self.openai_client = openai.OpenAI(api_key=openai_api_key)

        # Initialize Pinecone v3 client
        self._pc = Pinecone(api_key=pinecone_api_key)

        self.index_name = index_name
        self.embedding_model = "text-embedding-ada-002"
        self.embedding_dimension = 1536  # matches the Pinecone index dimension

        # Connect to existing index
        self.index = self._get_index()

    def _get_index(self):
        """Connect to existing Pinecone index"""
        try:
            existing = [i.name for i in self._pc.list_indexes()]
            if self.index_name not in existing:
                raise RuntimeError(
                    f"Pinecone index '{self.index_name}' not found. "
                    f"Available indexes: {existing}"
                )
            return self._pc.Index(self.index_name)
        except Exception as e:
            logger.error("Failed to connect to Pinecone index", error=str(e))
            raise
    
    async def get_embedding(self, text: str) -> List[float]:
        """Generate embedding for text using OpenAI"""
        try:
            # Clean and prepare text
            text = text.strip()
            if not text:
                raise ValueError("Empty text provided")
            
            # Generate embedding
            response = self.openai_client.embeddings.create(
                model=self.embedding_model,
                input=text
            )
            
            embedding = response.data[0].embedding
            
            logger.debug("Generated embedding", text_length=len(text), embedding_dim=len(embedding))
            
            return embedding
            
        except Exception as e:
            logger.error("Failed to generate embedding", text=text[:100], error=str(e))
            raise
    
    async def search_similar(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        topics: Optional[List[str]] = None,
        complexity: Optional[str] = None,
        min_score: float = 0.0
    ) -> List[Dict[str, Any]]:
        """Search for similar content using embedding"""
        
        try:
            # Build filter for metadata
            filter_dict = {}
            if topics:
                filter_dict["topics"] = {"$in": topics}
            if complexity:
                filter_dict["complexity"] = complexity
            
            # Query Pinecone
            query_response = self.index.query(
                vector=query_embedding,
                top_k=top_k,
                include_metadata=True,
                filter=filter_dict if filter_dict else None
            )
            
            # Process results
            results = []
            for match in query_response.matches:
                if match.score >= min_score:
                    meta = match.metadata or {}
                    # Log actual metadata keys on first result so we can verify field names
                    if not results:
                        logger.info("Pinecone metadata keys", keys=list(meta.keys()), score=float(match.score))
                    # Try common field name variants for content and chapter
                    content = (
                        meta.get("content")
                        or meta.get("text")
                        or meta.get("page_content")
                        or meta.get("chunk_text")
                        or ""
                    )
                    chapter = (
                        meta.get("chapter")
                        or meta.get("source")
                        or meta.get("source_file")
                        or "Unknown"
                    )
                    result = {
                        "id": match.id,
                        "score": float(match.score),
                        "content": content,
                        "chapter": chapter,
                        "topics": meta.get("topics", []),
                        "complexity": meta.get("complexity", "intermediate"),
                        "word_count": meta.get("word_count", len(content.split()) if content else 0)
                    }
                    results.append(result)
            
            logger.info(
                "Similarity search completed", 
                results_count=len(results),
                min_score=min_score,
                filters=filter_dict
            )
            
            return results
            
        except Exception as e:
            logger.error("Similarity search failed", error=str(e))
            raise
    
    async def upsert_content(
        self,
        content_chunks: List[Dict[str, Any]],
        batch_size: int = 100
    ) -> int:
        """Upsert content chunks with embeddings to Pinecone"""
        
        total_upserted = 0
        
        try:
            # Process in batches
            for i in range(0, len(content_chunks), batch_size):
                batch = content_chunks[i:i + batch_size]
                
                # Generate embeddings for batch
                embeddings = []
                for chunk in batch:
                    embedding = await self.get_embedding(chunk["content"])
                    embeddings.append(embedding)
                
                # Prepare vectors for upsert
                vectors = []
                for j, chunk in enumerate(batch):
                    vector_data = {
                        "id": chunk["id"],
                        "values": embeddings[j],
                        "metadata": {
                            "content": chunk["content"],
                            "chapter": chunk.get("chapter", "Unknown"),
                            "topics": chunk.get("topics", []),
                            "complexity": chunk.get("complexity", "intermediate"),
                            "word_count": len(chunk["content"].split()),
                            "created_at": chunk.get("created_at", "")
                        }
                    }
                    vectors.append(vector_data)
                
                # Upsert to Pinecone
                upsert_response = self.index.upsert(vectors=vectors)
                upserted_count = upsert_response.upserted_count
                total_upserted += upserted_count
                
                logger.info(
                    "Batch upserted",
                    batch_size=len(batch),
                    upserted_count=upserted_count,
                    total_so_far=total_upserted
                )
                
                # Small delay between batches to avoid rate limits
                await asyncio.sleep(0.1)
            
            logger.info(
                "Content upsert completed",
                total_chunks=len(content_chunks),
                total_upserted=total_upserted
            )
            
            return total_upserted
            
        except Exception as e:
            logger.error("Content upsert failed", error=str(e))
            raise
    
    async def delete_content(self, ids: List[str]) -> bool:
        """Delete content from Pinecone by IDs"""
        try:
            self.index.delete(ids=ids)
            logger.info("Content deleted", count=len(ids))
            return True
            
        except Exception as e:
            logger.error("Content deletion failed", ids=ids, error=str(e))
            return False
    
    async def get_index_stats(self) -> Dict[str, Any]:
        """Get Pinecone index statistics"""
        try:
            stats = self.index.describe_index_stats()
            return {
                "total_vectors": stats.total_vector_count,
                "dimension": stats.dimension,
                "index_fullness": stats.index_fullness,
                "namespaces": dict(stats.namespaces) if stats.namespaces else {}
            }
            
        except Exception as e:
            logger.error("Failed to get index stats", error=str(e))
            return {}
    
    def calculate_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """Calculate cosine similarity between two embeddings"""
        try:
            # Convert to numpy arrays
            vec1 = np.array(embedding1)
            vec2 = np.array(embedding2)
            
            # Calculate cosine similarity
            dot_product = np.dot(vec1, vec2)
            norm1 = np.linalg.norm(vec1)
            norm2 = np.linalg.norm(vec2)
            
            similarity = dot_product / (norm1 * norm2)
            return float(similarity)
            
        except Exception as e:
            logger.error("Similarity calculation failed", error=str(e))
            return 0.0
    
    async def batch_search(
        self,
        queries: List[str],
        top_k: int = 5
    ) -> List[List[Dict[str, Any]]]:
        """Perform batch search for multiple queries"""
        
        results = []
        
        try:
            # Generate embeddings for all queries
            embeddings = []
            for query in queries:
                embedding = await self.get_embedding(query)
                embeddings.append(embedding)
            
            # Perform searches
            for embedding in embeddings:
                search_results = await self.search_similar(
                    query_embedding=embedding,
                    top_k=top_k
                )
                results.append(search_results)
            
            logger.info("Batch search completed", query_count=len(queries))
            
            return results
            
        except Exception as e:
            logger.error("Batch search failed", error=str(e))
            raise
    
    async def find_related_content(
        self,
        content_id: str,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """Find content related to a specific piece of content"""
        
        try:
            # Fetch the content vector
            fetch_response = self.index.fetch(ids=[content_id])
            
            if not fetch_response.vectors or content_id not in fetch_response.vectors:
                logger.warning("Content not found for related search", content_id=content_id)
                return []
            
            # Get the embedding
            content_vector = fetch_response.vectors[content_id]
            embedding = content_vector.values
            
            # Search for similar content (excluding the original)
            results = await self.search_similar(
                query_embedding=embedding,
                top_k=top_k + 1  # +1 to account for excluding original
            )
            
            # Filter out the original content
            related_results = [r for r in results if r["id"] != content_id]
            
            return related_results[:top_k]
            
        except Exception as e:
            logger.error("Related content search failed", content_id=content_id, error=str(e))
            return []