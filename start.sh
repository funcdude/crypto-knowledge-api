#!/bin/bash

echo "=== Sage Molly startup ==="
echo "Working directory: $(pwd)"
echo "Node: $(node --version 2>&1 || echo 'not found')"
echo "Python: $(python3 --version 2>&1 || echo 'not found')"
echo "Checking .next build: $(ls .next/BUILD_ID 2>/dev/null && echo 'exists' || echo 'MISSING')"

redis-server --daemonize yes --logfile /tmp/redis.log 2>/dev/null || echo "Redis not available"

echo "--- Starting FastAPI backend on port 8000 ---"
cd /home/runner/workspace/backend 2>/dev/null || cd backend 2>/dev/null || echo "WARNING: backend dir not found"
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

cd /home/runner/workspace 2>/dev/null || cd /home/runner 2>/dev/null || true

sleep 3

if kill -0 $BACKEND_PID 2>/dev/null; then
  echo "Backend running (PID $BACKEND_PID)"
else
  echo "WARNING: Backend may have crashed"
fi

echo "--- Starting Next.js frontend on port 5000 ---"
exec ./node_modules/.bin/next start -p 5000 -H 0.0.0.0
