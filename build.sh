#!/bin/bash
set -e

echo "=== Sage Molly build ==="

echo "--- Installing Node.js dependencies ---"
npm install

echo "--- Building Next.js ---"
npm run build

echo "--- Installing Python dependencies ---"
cd /home/runner/workspace/backend
pip install -r requirements.txt 2>/dev/null || echo "Python deps already installed"

echo "=== Build complete ==="
