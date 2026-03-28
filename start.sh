#!/bin/bash

cd /home/runner/workspace/backend && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
cd /home/runner/workspace && exec npm run start
