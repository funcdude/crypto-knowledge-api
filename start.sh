#!/bin/bash
set -e

echo "=== Sage Molly startup ==="

echo "--- Installing Node.js dependencies ---"
npm install

echo "--- Building Next.js ---"
npm run build

echo "--- Installing Python dependencies ---"
cd /home/runner/workspace/backend
pip install -r requirements.txt 2>/dev/null || echo "Python deps already installed"
cd /home/runner/workspace

echo "--- Starting Redis (optional) ---"
redis-server --daemonize yes --logfile /tmp/redis.log 2>/dev/null || echo "Redis not available, continuing without cache"

echo "--- Starting FastAPI backend on port 8000 ---"
cd /home/runner/workspace/backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd /home/runner/workspace

sleep 3

echo "--- Verifying backend is running ---"
if kill -0 $BACKEND_PID 2>/dev/null; then
  echo "Backend started successfully (PID $BACKEND_PID)"
else
  echo "ERROR: Backend failed to start"
  exit 1
fi

echo "--- Starting Next.js frontend on port 5000 ---"
npm run start &
FRONTEND_PID=$!

echo "=== Sage Molly is live ==="
echo "Frontend: port 5000 | Backend: port 8000"

wait $FRONTEND_PID $BACKEND_PID
