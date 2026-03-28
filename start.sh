#!/bin/bash

echo "Starting Sage Molly..."

cd /home/runner/workspace/backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 2>&1 &

cd /home/runner/workspace
exec ./node_modules/.bin/next start -p 5000 -H 0.0.0.0
