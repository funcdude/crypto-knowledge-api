#!/bin/bash
set -e

echo "=== Sage Molly startup ==="

echo "--- Installing Node.js dependencies ---"
npm install

echo "--- Building Next.js ---"
npm run build

echo "--- Starting Redis (optional) ---"
redis-server --daemonize yes --logfile /tmp/redis.log 2>/dev/null || echo "Redis not available, continuing without cache"

echo "--- Starting FastAPI backend on port 8000 ---"
cd /home/runner/workspace/backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 &
UVICORN_PID=$!

sleep 3

echo "--- Starting Next.js frontend on port 5000 ---"
cd /home/runner/workspace
npm run start
