#!/bin/bash

echo "=== Sage Molly startup ==="

cd /home/runner/workspace/backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &

cd /home/runner/workspace
exec ./node_modules/.bin/next start -p 5000 -H 0.0.0.0
