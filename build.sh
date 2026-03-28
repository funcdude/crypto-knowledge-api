#!/bin/bash
set -e

echo "=== Sage Molly build ==="

echo "--- Installing Node.js dependencies ---"
npm install

echo "--- Building Next.js ---"
npm run build

echo "--- Installing Python dependencies ---"
cd backend
pip install -r requirements.txt
echo "--- Verifying Python setup ---"
python3 -c "import structlog; import fastapi; print('Core Python imports OK')"

echo "=== Build complete ==="
