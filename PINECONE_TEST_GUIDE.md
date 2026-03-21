# Pinecone Direct Testing Guide

## Quick Test (No API Key Needed)

```bash
cd ~/crypto-knowledge-api
export PINECONE_API_KEY=$(pass api/pinecone/api-key)

# Run the test script
python3 scripts/test-pinecone-direct.py
```

### What You'll See

✅ Connection status to Pinecone  
✅ Index information (crypto-knowledge with 975 vectors)  
✅ 3 sample vectors from your book with actual content  
✅ Metadata showing book chunks  

---

## Full Test WITH Search (Requires OpenAI Key)

```bash
export PINECONE_API_KEY=$(pass api/pinecone/api-key)
export OPENAI_API_KEY=sk_your_openai_key

python3 scripts/test-pinecone-direct.py
```

### What You'll Get Extra

When you provide an OpenAI key, the script will:
- Generate embeddings for 5 test queries
- Search Pinecone for each query
- Show top 3 results with relevance scores
- Display matching content from your book

---

## Example Queries Tested

When embeddings are enabled, the script tests:
- "What is Bitcoin?"
- "blockchain technology"
- "decentralization and economic freedom"
- "cryptocurrency security"
- "smart contracts"

---

## Using the Script in Docker

Already included above! The script runs in a clean Python environment and installs dependencies automatically.

---

## Manual Testing with curl/Python

### Test 1: List Indexes
```python
from pinecone import Pinecone

pc = Pinecone(api_key="your-key")
indexes = pc.list_indexes()

for idx in indexes.indexes:
    print(f"Index: {idx.name}")
    print(f"  Vectors: {idx.dimension}")
    print(f"  Host: {idx.host}")
```

### Test 2: Query Index
```python
from pinecone import Pinecone
from openai import OpenAI

pc = Pinecone(api_key="pinecone-key")
openai = OpenAI(api_key="openai-key")

# Create embedding for query
response = openai.embeddings.create(
    model="text-embedding-3-small",
    input="What is decentralization?"
)
query_embedding = response.data[0].embedding

# Search index
index = pc.Index("crypto-knowledge")
results = index.query(
    vector=query_embedding,
    top_k=3,
    include_metadata=True
)

# Print results
for match in results['matches']:
    print(f"Score: {match['score']:.4f}")
    print(f"Metadata: {match['metadata']}")
```

---

## What the Test Script Does

1. **Initialize Pinecone** - Connects with your API key
2. **List Indexes** - Shows available indexes
3. **Connect to Index** - Attaches to 'crypto-knowledge'
4. **Get Stats** - Confirms 975 vectors are present
5. **Create Embeddings** - Generates test queries (if OpenAI key provided)
6. **Search Index** - Runs semantic search queries
7. **Fetch Samples** - Gets actual content from your book

---

## Expected Output

```
[✓] Pinecone connection: OK
[✓] Index 'crypto-knowledge': OK
[✓] Vector count: 975 records loaded
[✓] Semantic search: Working

Sample Vectors from Index:

Sample 1:
  ID: chunk_0193
  Score: -0.0234
  Metadata:
    chunk_index: 193
    source: Cryptocurrencies Decrypted by Oskar Hurme
    text: "It strengthened the economic and political ties between..."
```

---

## Troubleshooting

### "No indexes found"
- Check your Pinecone API key
- Verify crypto-knowledge index exists in Pinecone console
- Check region is us-east-1

### "No results found"
- Provide an OpenAI key to generate embeddings
- Query might not match book content well
- Try different search terms

### Connection timeout
- Check internet connection
- Verify Pinecone service status
- Check firewall/network settings

---

## What's in Your Index

Your book "Cryptocurrencies Decrypted" is split into **975 chunks**, each:
- Embedded with OpenAI's text-embedding-3-large model
- Stored with metadata (chunk index, source, text)
- Searchable via semantic similarity
- Ready for API queries (with X402 payment)

---

## Next Steps

1. ✅ Verify index connectivity (this script)
2. ✅ Confirm book content is searchable
3. ⏳ Test API with payment headers
4. ⏳ Deploy frontend for user queries
5. ⏳ Monitor analytics and revenue

---

## Script Location

`~/crypto-knowledge-api/scripts/test-pinecone-direct.py`

Run anytime to verify Pinecone is working!
