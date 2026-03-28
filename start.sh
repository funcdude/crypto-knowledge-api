#!/bin/bash
set -x

echo "=== Sage Molly startup ==="
echo "PWD: $(pwd)"
echo "HOME: $HOME"
echo "ls: $(ls)"

echo "--- Testing Python imports ---"
cd backend && python3 -c "from app.main import app; print('Backend imports OK')" 2>&1 || echo "WARNING: Backend import failed"

echo "--- Starting backend ---"
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

cd ..

echo "--- Starting frontend on port 5000 ---"
exec npm run start
