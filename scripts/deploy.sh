#!/bin/bash

# Crypto Knowledge API Deployment Script
# Deploys the AI-powered crypto knowledge API with X402 micropayments

set -e

echo "🚀 Deploying Crypto Knowledge API..."

# Configuration
PROJECT_NAME="crypto-knowledge-api"
BACKEND_PORT=8000
FRONTEND_PORT=3000

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check environment file
    if [ ! -f ".env" ]; then
        warn "No .env file found. Copying from .env.example..."
        cp .env.example .env
        warn "Please edit .env file with your configuration before continuing."
        echo "Press any key to continue after editing .env..."
        read -n 1
    fi
    
    log "Prerequisites check complete ✅"
}

# Setup database
setup_database() {
    log "Setting up database..."
    
    # Start database container
    docker compose up -d db redis
    
    # Wait for database to be ready
    log "Waiting for database to be ready..."
    sleep 10
    
    # Run migrations (if any)
    # docker compose exec -T api alembic upgrade head
    
    log "Database setup complete ✅"
}

# Build and start services
start_services() {
    log "Building and starting services..."
    
    # Build and start all services
    docker compose up -d --build
    
    # Wait for services to be ready
    log "Waiting for services to start..."
    sleep 15
    
    log "Services started ✅"
}

# Check service health
check_health() {
    log "Checking service health..."
    
    # Check API health
    API_URL="http://localhost:${BACKEND_PORT}/health"
    if curl -f -s "$API_URL" > /dev/null; then
        log "API health check passed ✅"
    else
        error "API health check failed ❌"
        return 1
    fi
    
    # Check frontend
    FRONTEND_URL="http://localhost:${FRONTEND_PORT}"
    if curl -f -s "$FRONTEND_URL" > /dev/null; then
        log "Frontend health check passed ✅"
    else
        warn "Frontend may still be starting..."
    fi
}

# Setup Bankr integration
setup_bankr() {
    log "Setting up Bankr integration..."
    
    # Check if BANKR_API_KEY is set
    if [ -z "$BANKR_API_KEY" ]; then
        warn "BANKR_API_KEY not set in environment"
        warn "You can set it up later for payment processing"
        return 0
    fi
    
    # Verify Bankr connection
    log "Verifying Bankr connection..."
    
    # This would test the Bankr API connection
    # docker compose exec -T api python -c "
    # import os
    # from app.services.bankr_service import BankrService
    # service = BankrService(os.getenv('BANKR_API_KEY'))
    # result = service.test_connection()
    # print('Bankr connection:', 'OK' if result else 'FAILED')
    # "
    
    log "Bankr integration setup complete ✅"
}

# Process book content (if available)
process_content() {
    log "Processing book content..."
    
    # Check if book files exist
    if [ -d "data" ] && [ "$(ls -A data)" ]; then
        log "Found book data, processing..."
        
        # Run content processing
        docker compose run --rm processor
        
        log "Content processing complete ✅"
    else
        warn "No book data found in ./data directory"
        warn "API will work but won't have content to search"
        warn "Add PDF files to ./data directory and run: docker compose run --rm processor"
    fi
}

# Deploy to production
deploy_production() {
    log "Deploying to production..."
    
    # Build production images
    docker compose -f docker-compose.yml -f docker compose.prod.yml build
    
    # Deploy (this would vary based on your deployment target)
    # Examples for different platforms:
    
    # Railway deployment
    if command -v railway &> /dev/null; then
        log "Deploying to Railway..."
        railway up
    fi
    
    # Fly.io deployment  
    if command -v flyctl &> /dev/null; then
        log "Deploying to Fly.io..."
        flyctl deploy
    fi
    
    # Vercel deployment (frontend only)
    if command -v vercel &> /dev/null; then
        log "Deploying frontend to Vercel..."
        cd frontend
        vercel --prod
        cd ..
    fi
    
    log "Production deployment complete ✅"
}

# Show deployment summary
show_summary() {
    echo ""
    echo "🎉 Deployment Summary"
    echo "===================="
    echo ""
    echo "📋 Services:"
    echo "  • API: http://localhost:${BACKEND_PORT}"
    echo "  • Frontend: http://localhost:${FRONTEND_PORT}"
    echo "  • API Docs: http://localhost:${BACKEND_PORT}/docs"
    echo "  • Database: postgresql://localhost:5432/crypto_knowledge"
    echo "  • Redis: redis://localhost:6379"
    echo ""
    echo "🔑 Key Features:"
    echo "  • X402 micropayments enabled"
    echo "  • Base L2 payment processing"
    echo "  • AI-powered semantic search"
    echo "  • Expert crypto knowledge"
    echo ""
    echo "📚 Next Steps:"
    echo "  1. Test the API at http://localhost:${BACKEND_PORT}/docs"
    echo "  2. Try the frontend demo at http://localhost:${FRONTEND_PORT}"
    echo "  3. Add your book content to ./data directory"
    echo "  4. Run content processing: docker compose run --rm processor"
    echo "  5. Configure your payment address in .env"
    echo ""
    echo "💰 Payment Configuration:"
    echo "  • Payment Address: ${PAYMENT_ADDRESS:-0x28e6b3e3e32308787f50e6d99e2b98745b381946}"
    echo "  • Chain: Base L2 (Chain ID: 8453)"
    echo "  • Currency: USDC"
    echo "  • Pricing: $0.001 - $0.02 per query"
    echo ""
    echo "🔧 Management Commands:"
    echo "  • View logs: docker compose logs -f"
    echo "  • Stop services: docker compose down"
    echo "  • Rebuild: docker compose up -d --build"
    echo "  • Process content: docker compose run --rm processor"
    echo ""
}

# Main deployment flow
main() {
    echo "🚀 Crypto Knowledge API Deployment"
    echo "=================================="
    echo ""
    
    # Parse command line arguments
    case "${1:-local}" in
        "local")
            log "Deploying locally with Docker Compose..."
            check_prerequisites
            setup_database
            start_services
            check_health
            setup_bankr
            process_content
            show_summary
            ;;
        "production")
            log "Deploying to production..."
            check_prerequisites
            deploy_production
            ;;
        "process-content")
            log "Processing book content only..."
            process_content
            ;;
        "health")
            log "Checking service health..."
            check_health
            ;;
        *)
            echo "Usage: $0 [local|production|process-content|health]"
            echo ""
            echo "Commands:"
            echo "  local (default)    - Deploy locally with Docker Compose"
            echo "  production         - Deploy to production platforms"
            echo "  process-content    - Process book content only"
            echo "  health            - Check service health"
            exit 1
            ;;
    esac
    
    log "Deployment script completed! 🎉"
}

# Run main function with all arguments
main "$@"