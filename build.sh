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
echo "--- Verifying Python imports ---"
python3 -c "from app.main import app; print('Backend imports verified')"

echo "=== Build complete ==="
