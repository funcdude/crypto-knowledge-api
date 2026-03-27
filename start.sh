#!/bin/bash
set -e

echo "=== Sage Molly startup ==="

redis-server --daemonize yes --logfile /tmp/redis.log 2>/dev/null || echo "Redis not available, continuing without cache"

echo "--- Starting FastAPI backend on port 8000 ---"
cd /home/runner/workspace/backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd /home/runner/workspace

sleep 2

echo "--- Starting Next.js frontend on port 5000 ---"
exec npm run start
