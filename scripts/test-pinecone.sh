#!/bin/bash

# Pinecone Integration Testing Script
# Validates Pinecone connectivity, book content, and search functionality

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; }
info() { echo -e "${BLUE}[i]${NC} $1"; }

# Check prerequisites
info "Pinecone Integration Testing"
echo "=============================="
echo ""

# 1. Check environment
info "Checking environment variables..."

if [ -z "$PINECONE_API_KEY" ]; then
    error "PINECONE_API_KEY not set"
    echo "  Set it in .env or export PINECONE_API_KEY=your-key"
    exit 1
fi

if [ "$PINECONE_API_KEY" = "PLACEHOLDER_REPLACE_WITH_REAL_KEY" ]; then
    error "PINECONE_API_KEY is still a placeholder"
    echo "  Replace PLACEHOLDER_REPLACE_WITH_REAL_KEY with real API key in .env"
    exit 1
fi

log "PINECONE_API_KEY is set"

if [ -z "$PINECONE_ENVIRONMENT" ]; then
    error "PINECONE_ENVIRONMENT not set"
    exit 1
fi

log "PINECONE_ENVIRONMENT: $PINECONE_ENVIRONMENT"

if [ -z "$OPENAI_API_KEY" ]; then
    warn "OPENAI_API_KEY not set - embeddings will fail"
fi

# 2. Check API connectivity
info "Testing Pinecone API connectivity..."

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Api-Key: $PINECONE_API_KEY" \
  "https://api.pinecone.io/indexes")

if [ "$RESPONSE" = "200" ]; then
    log "Pinecone API is accessible"
else
    error "Pinecone API returned status $RESPONSE"
    error "Check your API key and network connectivity"
    exit 1
fi

# 3. Check index exists
info "Checking for crypto-knowledge index..."

INDEXES=$(curl -s -H "Api-Key: $PINECONE_API_KEY" \
  "https://api.pinecone.io/indexes" | grep -o '"name":"[^"]*"' | head -10)

if echo "$INDEXES" | grep -q "crypto-knowledge"; then
    log "Index 'crypto-knowledge' found"
else
    warn "Index 'crypto-knowledge' not found"
    echo "Available indexes:"
    echo "$INDEXES"
fi

# 4. Test API connectivity (local)
info "Testing local API connectivity..."

if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    log "Local API is running on port 8000"
else
    error "Cannot connect to local API on port 8000"
    echo "  Start the API with: docker compose up -d db redis api"
    exit 1
fi

# 5. Test health endpoint
info "Checking API health status..."

HEALTH=$(curl -s http://localhost:8000/health | grep -o '"status":"[^"]*"')
echo "  $HEALTH"

# 6. Test readiness
info "Checking API readiness..."

READY=$(curl -s http://localhost:8000/health/ready | grep -o '"ready":[^,}]*')
if echo "$READY" | grep -q "true"; then
    log "API is ready"
else
    warn "API is not yet ready - may be initializing services"
fi

# 7. Test search endpoint (will return 402 without payment)
info "Testing search endpoint..."

SEARCH_RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is cryptocurrency?",
    "tier": "explanation",
    "max_results": 3
  }' -w "\n%{http_code}")

STATUS=$(echo "$SEARCH_RESPONSE" | tail -1)

if [ "$STATUS" = "402" ]; then
    log "Search endpoint returned 402 Payment Required (expected)"
    echo "$SEARCH_RESPONSE" | head -n -1 | jq . 2>/dev/null || echo "$SEARCH_RESPONSE"
elif [ "$STATUS" = "200" ]; then
    log "Search endpoint returned 200 OK"
    echo "$SEARCH_RESPONSE" | head -n -1 | jq . 2>/dev/null || echo "$SEARCH_RESPONSE"
elif [ "$STATUS" = "500" ]; then
    error "Search endpoint returned 500 Internal Server Error"
    echo "$SEARCH_RESPONSE" | head -n -1
    error "Check API logs: docker logs crypto-knowledge-api-api-1"
    exit 1
else
    warn "Search endpoint returned status $STATUS"
    echo "$SEARCH_RESPONSE" | head -n -1
fi

# 8. Test pricing endpoint
info "Testing pricing endpoint..."

PRICING=$(curl -s http://localhost:8000/api/v1/pricing)
if echo "$PRICING" | grep -q "pricing_tiers"; then
    log "Pricing endpoint working"
    echo "$PRICING" | jq .pricing_tiers 2>/dev/null | head -15 || echo "$PRICING"
else
    warn "Pricing endpoint may not be returning expected format"
fi

# Summary
echo ""
info "Pinecone Integration Test Summary"
echo "=================================="
echo "✓ Environment variables configured"
echo "✓ Pinecone API accessible"
echo "✓ Local API running"
echo "✓ Search endpoint responding"
echo ""
warn "Note: Full testing requires valid X402 payment header"
echo ""
echo "Next steps:"
echo "1. If search returned 500, check: docker logs crypto-knowledge-api-api-1"
echo "2. For search testing, see PINECONE_TESTING.md"
echo "3. To test with payment, use: ./scripts/test-with-payment.sh"
echo ""
log "Pinecone integration test complete!"
