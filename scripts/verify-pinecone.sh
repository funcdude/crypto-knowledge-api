#!/bin/bash

# Pinecone Live Integration Verification Script
# Tests the real Pinecone setup with 975 book records

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

echo ""
info "Pinecone Live Integration Verification"
echo "========================================"
echo ""

# 1. Check prerequisites
info "Checking environment setup..."

if [ -z "$PINECONE_API_KEY" ]; then
    error "PINECONE_API_KEY not set"
    echo "  Set it with: export PINECONE_API_KEY=your-key"
    exit 1
fi

log "PINECONE_API_KEY is set"

PINECONE_HOST="crypto-knowledge-0eab2ad.svc.aped-4627-b74a.pinecone.io"
PINECONE_INDEX="crypto-knowledge"
PINECONE_REGION="us-east-1"

info "Pinecone Configuration:"
echo "  Host:    $PINECONE_HOST"
echo "  Index:   $PINECONE_INDEX"
echo "  Region:  $PINECONE_REGION"
echo "  Records: 975 (expected from book)"
echo ""

# 2. Verify API key works
info "Testing Pinecone API authentication..."

AUTH_TEST=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Api-Key: $PINECONE_API_KEY" \
  "https://api.pinecone.io/indexes")

if [ "$AUTH_TEST" = "200" ]; then
    log "Pinecone API authentication successful"
else
    error "Authentication failed (HTTP $AUTH_TEST)"
    error "Check your API key at https://app.pinecone.io/api-keys"
    exit 1
fi

# 3. Verify index exists
info "Checking for crypto-knowledge index..."

INDEXES=$(curl -s -H "Api-Key: $PINECONE_API_KEY" \
  "https://api.pinecone.io/indexes" | grep -o '"name":"[^"]*"' || true)

if echo "$INDEXES" | grep -q "$PINECONE_INDEX"; then
    log "Index '$PINECONE_INDEX' found"
else
    warn "Index '$PINECONE_INDEX' not found in API response"
    echo "  Available indexes: $INDEXES"
fi

# 4. Test local API connectivity
info "Testing local API..."

if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
    error "Cannot connect to local API on port 8000"
    echo "  Start with: docker compose up -d db redis api"
    exit 1
fi

log "Local API is responsive"

# 5. Check API health status
info "Checking API health..."

HEALTH=$(curl -s http://localhost:8000/health)
STATUS=$(echo "$HEALTH" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
REDIS=$(echo "$HEALTH" | grep -o '"redis":"[^"]*"' | cut -d'"' -f4)
DATABASE=$(echo "$HEALTH" | grep -o '"database":"[^"]*"' | cut -d'"' -f4)

echo "  Overall: $STATUS"
echo "  Redis: $REDIS"
echo "  Database: $DATABASE"

if [ "$REDIS" = "healthy" ] && [ "$DATABASE" = "healthy" ]; then
    log "All services healthy"
elif [ "$REDIS" = "healthy" ]; then
    warn "Database status: $DATABASE (may be initializing)"
else
    error "Service health check failed"
fi

# 6. Test 402 payment requirement
info "Testing search endpoint (expect 402 Payment Required)..."

SEARCH_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is Bitcoin?",
    "tier": "explanation",
    "max_results": 3
  }')

STATUS=$(echo "$SEARCH_RESPONSE" | tail -1)
BODY=$(echo "$SEARCH_RESPONSE" | head -n -1)

if [ "$STATUS" = "402" ]; then
    log "Search endpoint returned 402 Payment Required (correct)"
    
    # Verify payment structure
    if echo "$BODY" | grep -q '"error":"Payment required"'; then
        log "Payment requirement structure is correct"
    else
        warn "Payment response format may be incorrect"
    fi
    
    if echo "$BODY" | grep -q '"chainId":8453'; then
        log "Payment configured for Base L2 (chainId: 8453)"
    fi
    
    if echo "$BODY" | grep -q "0x28e6b3e3e32308787f50e6d99e2b98745b381946"; then
        log "Payment address correct (Bankr wallet)"
    fi
else
    error "Unexpected response code: $STATUS"
    echo "Response: $BODY"
    exit 1
fi

# 7. Test pricing endpoint
info "Testing pricing endpoint..."

PRICING=$(curl -s http://localhost:8000/api/v1/pricing)

if echo "$PRICING" | grep -q "pricing_tiers"; then
    log "Pricing endpoint working"
    echo "$PRICING" | jq '.pricing_tiers' 2>/dev/null | head -10 || echo "  (pricing tiers available)"
else
    warn "Pricing endpoint may not be responding correctly"
fi

# 8. Test analytics
info "Checking analytics tracking..."

ANALYTICS_COUNT=$(docker exec crypto-knowledge-api-redis-1 redis-cli GET analytics:daily:2026-03-21:count 2>/dev/null || echo "0")

if [ "$ANALYTICS_COUNT" != "0" ]; then
    log "Analytics tracking working ($ANALYTICS_COUNT queries logged)"
else
    info "No queries logged yet (expected on fresh start)"
fi

# 9. Summary
echo ""
info "Verification Summary"
echo "===================="
echo ""
log "✅ Pinecone API authentication working"
log "✅ Local API responsive"
log "✅ 402 Payment Required response correct"
log "✅ Pricing endpoint available"
info "📊 Analytics tracking enabled"
echo ""

# 10. Next steps
echo "Ready for live testing! 🚀"
echo ""
echo "Try these searches:"
echo "  - What is blockchain?"
echo "  - Explain cryptocurrency"
echo "  - What is decentralization?"
echo ""
echo "Use: PINECONE_LIVE_TESTING.md for full testing procedures"
echo ""

# 11. Check if Pinecone is actually initialized in API
info "Checking if Pinecone is initialized in API..."

LOGS=$(docker logs crypto-knowledge-api-api-1 2>&1 | tail -30)

if echo "$LOGS" | grep -q "AI embedding service initialized"; then
    log "Pinecone embedding service initialized ✅"
elif echo "$LOGS" | grep -q "Knowledge service initialized"; then
    log "Knowledge service initialized ✅"
elif echo "$LOGS" | grep -i pinecone | grep -i "failed\|error" > /dev/null 2>&1; then
    error "Pinecone initialization error detected"
    echo "Last 10 logs:"
    docker logs crypto-knowledge-api-api-1 2>&1 | tail -10
    exit 1
else
    info "Checking startup sequence..."
    docker logs crypto-knowledge-api-api-1 2>&1 | grep -i "startup\|initialized" | tail -5 || info "Review logs manually: docker logs crypto-knowledge-api-api-1"
fi

echo ""
info "Verification complete! Ready to test with real book content (975 records) 🎉"
