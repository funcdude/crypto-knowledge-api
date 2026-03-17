#!/bin/bash

# Fix Docker Compose and Test Crypto Knowledge API
# Run this script after logging out and back in

set -e

echo "🔧 Fixing Docker Compose compatibility and testing Crypto Knowledge API"
echo "======================================================================"
echo ""

# Check if we can use docker without sudo
if ! docker ps >/dev/null 2>&1; then
    echo "❌ Docker permission denied. Please run these commands first:"
    echo ""
    echo "Option 1 (Recommended): Log out and back in to refresh group membership"
    echo "Option 2: Run: newgrp docker"
    echo "Option 3: Reboot your system"
    echo ""
    exit 1
fi

echo "✅ Docker permissions OK"

# Test docker compose
if ! docker compose version >/dev/null 2>&1; then
    echo "❌ Docker Compose V2 not working"
    exit 1
fi

echo "✅ Docker Compose V2 working"

# Remove broken old docker-compose if it exists
if command -v docker-compose >/dev/null 2>&1; then
    echo "🗑️  Found old docker-compose, checking if it works..."
    if docker-compose --version >/dev/null 2>&1; then
        echo "✅ Old docker-compose works"
    else
        echo "⚠️  Old docker-compose broken (will use 'docker compose' instead)"
        # Create alias for this session
        alias docker-compose='docker compose'
    fi
fi

# Update scripts to use correct docker compose command
echo "📝 Updating scripts to use Docker Compose V2..."

# Fix test script
sed -i 's/docker-compose/docker compose/g' scripts/test-local.sh
sed -i 's/docker-compose/docker compose/g' scripts/deploy.sh

echo "✅ Scripts updated"

# Run the test
echo "🧪 Running Crypto Knowledge API tests..."
echo ""
./scripts/test-local.sh

echo ""
echo "🎉 Test completed! Check the results above."