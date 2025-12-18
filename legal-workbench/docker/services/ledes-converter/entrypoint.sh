#!/bin/bash

# Start Uvicorn server on port 8003 (matching docker-compose)
exec uvicorn api.main:app --host 0.0.0.0 --port 8003
