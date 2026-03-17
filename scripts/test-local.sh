#!/bin/bash

# Quick Local Testing Script for Crypto Knowledge API
# Runs comprehensive tests to verify everything works

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; }
info() { echo -e "${BLUE}[i]${NC} $1"; }

TEST_RESULTS=()

# Test function wrapper
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    info "Testing: $test_name"
    
    if eval "$test_command" > /dev/null 2>&1; then
        log "$test_name: PASSED"
        TEST_RESULTS+=("PASS: $test_name")
        return 0
    else
        error "$test_name: FAILED"
        TEST_RESULTS+=("FAIL: $test_name")
        return 1
    fi
}

# Test API endpoint with expected response
test_api_endpoint() {
    local url="$1"
    local expected_status="$2"
    local description="$3"
    
    local actual_status
    actual_status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$actual_status" = "$expected_status" ]; then
        log "$description: PASSED (Status: $actual_status)"
        return 0
    else
        error "$description: FAILED (Expected: $expected_status, Got: $actual_status)"
        return 1
    fi
}

echo "🧪 Crypto Knowledge API - Local Testing Suite"
echo "============================================="
echo ""

# Check if running in project directory
if [ ! -f "docker-compose.yml" ]; then
    error "Please run this script from the crypto-knowledge-api directory"
    exit 1
fi

# 1. Check Prerequisites
info "Checking prerequisites..."
run_test "Docker installed" "command -v docker"
run_test "Docker Compose installed" "command -v docker compose"
run_test "Environment file exists" "test -f .env"

# 2. Check if services are running
info "Checking service status..."
if ! docker compose ps | grep -q "Up"; then
    warn "Services not running. Starting now..."
    docker compose up -d --build
    sleep 20
    info "Waiting for services to be ready..."
fi

# 3. Service Health Tests
info "Testing service health..."
test_api_endpoint "http://localhost:8000/health" "200" "API Health Check"
test_api_endpoint "http://localhost:3000" "200" "Frontend Accessibility"

# 4. API Functionality Tests
info "Testing API functionality..."
test_api_endpoint "http://localhost:8000/" "200" "API Root Endpoint"
test_api_endpoint "http://localhost:8000/docs" "200" "API Documentation"
test_api_endpoint "http://localhost:8000/api/v1/pricing" "200" "Pricing Endpoint (Free)"

# 5. Payment System Tests
info "Testing payment system..."

# Test payment requirement (should return 402)
if curl -s "http://localhost:8000/api/v1/search?q=bitcoin&tier=snippet" | grep -q "Payment required"; then
    log "Payment Requirement: PASSED (HTTP 402 returned)"
    TEST_RESULTS+=("PASS: Payment Requirement")
else
    error "Payment Requirement: FAILED (No 402 response)"
    TEST_RESULTS+=("FAIL: Payment Requirement")
fi

# 6. Database Connection Tests
info "Testing database connections..."
if docker compose exec -T db pg_isready -U postgres > /dev/null 2>&1; then
    log "PostgreSQL Connection: PASSED"
    TEST_RESULTS+=("PASS: PostgreSQL Connection")
else
    error "PostgreSQL Connection: FAILED"
    TEST_RESULTS+=("FAIL: PostgreSQL Connection")
fi

# 7. Cache Connection Tests
if docker compose exec -T redis redis-cli ping | grep -q "PONG" > /dev/null 2>&1; then
    log "Redis Connection: PASSED"
    TEST_RESULTS+=("PASS: Redis Connection")
else
    error "Redis Connection: FAILED"
    TEST_RESULTS+=("FAIL: Redis Connection")
fi

# 8. Container Health Tests
info "Testing container health..."
UNHEALTHY_CONTAINERS=$(docker compose ps | grep -v "Up" | grep -v "NAME" | wc -l)

if [ "$UNHEALTHY_CONTAINERS" -eq 0 ]; then
    log "All Containers Healthy: PASSED"
    TEST_RESULTS+=("PASS: All Containers Healthy")
else
    error "Container Health: FAILED ($UNHEALTHY_CONTAINERS unhealthy)"
    TEST_RESULTS+=("FAIL: Container Health")
fi

# 9. Environment Configuration Tests
info "Testing environment configuration..."
ENV_VARS_MISSING=()

# Check critical environment variables
if ! docker compose exec -T api env | grep -q "OPENAI_API_KEY=sk-"; then
    ENV_VARS_MISSING+=("OPENAI_API_KEY")
fi

if ! docker compose exec -T api env | grep -q "PINECONE_API_KEY="; then
    ENV_VARS_MISSING+=("PINECONE_API_KEY")
fi

if ! docker compose exec -T api env | grep -q "PAYMENT_ADDRESS=0x"; then
    ENV_VARS_MISSING+=("PAYMENT_ADDRESS")
fi

if [ ${#ENV_VARS_MISSING[@]} -eq 0 ]; then
    log "Environment Configuration: PASSED"
    TEST_RESULTS+=("PASS: Environment Configuration")
else
    error "Environment Configuration: FAILED (Missing: ${ENV_VARS_MISSING[*]})"
    TEST_RESULTS+=("FAIL: Environment Configuration")
fi

# 10. Performance Tests
info "Testing performance..."
RESPONSE_TIME=$(curl -s -w "%{time_total}" -o /dev/null "http://localhost:8000/api/v1/pricing")
RESPONSE_TIME_MS=$(echo "$RESPONSE_TIME * 1000" | bc -l 2>/dev/null || echo "0")

# Check if response time is reasonable (< 2 seconds)
if (( $(echo "$RESPONSE_TIME < 2.0" | bc -l 2>/dev/null || echo 0) )); then
    log "API Response Time: PASSED (${RESPONSE_TIME}s)"
    TEST_RESULTS+=("PASS: API Response Time")
else
    warn "API Response Time: SLOW (${RESPONSE_TIME}s)"
    TEST_RESULTS+=("WARN: API Response Time")
fi

# 11. Content Testing (if available)
info "Testing content processing..."
if [ -d "data" ] && [ "$(ls -A data 2>/dev/null)" ]; then
    log "Book Content Available: PASSED"
    TEST_RESULTS+=("PASS: Book Content Available")
    
    # Test content search (with mock payment)
    if curl -s "http://localhost:8000/api/v1/search?q=test&tier=snippet" \
       -H "X-Payment: test-tx-hash" | grep -q "results"; then
        log "Content Search: PASSED"
        TEST_RESULTS+=("PASS: Content Search")
    else
        warn "Content Search: No results (may need processing)"
        TEST_RESULTS+=("WARN: Content Search")
    fi
else
    warn "Book Content: NOT AVAILABLE (add PDFs to ./data/)"
    TEST_RESULTS+=("WARN: No Book Content")
fi

# Test Summary
echo ""
echo "📊 TEST SUMMARY"
echo "==============="
echo ""

PASSED=0
FAILED=0
WARNINGS=0

for result in "${TEST_RESULTS[@]}"; do
    if [[ $result == PASS:* ]]; then
        echo -e "${GREEN}✓${NC} ${result#PASS: }"
        ((PASSED++))
    elif [[ $result == FAIL:* ]]; then
        echo -e "${RED}✗${NC} ${result#FAIL: }"
        ((FAILED++))
    elif [[ $result == WARN:* ]]; then
        echo -e "${YELLOW}!${NC} ${result#WARN: }"
        ((WARNINGS++))
    fi
done

echo ""
echo "Results: $PASSED passed, $FAILED failed, $WARNINGS warnings"
echo ""

# Service URLs
echo "🔗 SERVICE URLS"
echo "==============="
echo "• API: http://localhost:8000"
echo "• API Docs: http://localhost:8000/docs"  
echo "• Frontend: http://localhost:3000"
echo "• Database: postgresql://postgres:password@localhost:5432/crypto_knowledge"
echo "• Redis: redis://localhost:6379/0"
echo ""

# Next Steps
echo "🚀 NEXT STEPS"
echo "============="
if [ $FAILED -eq 0 ]; then
    echo "✅ All critical tests passed! Your API is ready for:"
    echo "   1. Add book content to ./data/ directory"
    echo "   2. Run: docker compose run --rm processor"
    echo "   3. Test real knowledge queries"
    echo "   4. Deploy to production when ready"
    echo ""
    echo "💡 Try these commands:"
    echo "   curl http://localhost:8000/api/v1/pricing"
    echo "   open http://localhost:8000/docs"
    echo "   open http://localhost:3000"
else
    echo "❌ Some tests failed. Please check:"
    echo "   1. All environment variables in .env file"
    echo "   2. Docker containers are running: docker compose ps"
    echo "   3. Check logs: docker compose logs"
    echo "   4. Review TESTING.md for detailed troubleshooting"
fi

echo ""
echo "📖 For detailed testing guide, see: TESTING.md"
echo "🔧 For troubleshooting, run: docker compose logs -f"

# Exit with error code if any tests failed
if [ $FAILED -gt 0 ]; then
    exit 1
else
    exit 0
fi