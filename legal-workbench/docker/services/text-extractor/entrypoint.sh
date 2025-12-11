#!/bin/bash
set -e

echo "========================================="
echo "Text Extractor Service Starting..."
echo "========================================="

# Environment info
echo "Environment:"
echo "  - CELERY_BROKER_URL: ${CELERY_BROKER_URL}"
echo "  - CELERY_RESULT_BACKEND: ${CELERY_RESULT_BACKEND}"
echo "  - MAX_CONCURRENT_JOBS: ${MAX_CONCURRENT_JOBS}"
echo "  - JOB_TIMEOUT_SECONDS: ${JOB_TIMEOUT_SECONDS}"
echo "  - MARKER_CACHE_DIR: ${MARKER_CACHE_DIR}"

# Function to gracefully shutdown
shutdown() {
    echo "Shutting down services..."
    kill -TERM "$celery_pid" "$flower_pid" "$uvicorn_pid" 2>/dev/null || true
    wait
    exit 0
}

# Trap SIGTERM and SIGINT
trap shutdown SIGTERM SIGINT

# Wait for Redis to be ready
echo "Waiting for Redis..."
max_retries=30
retry_count=0

while [ $retry_count -lt $max_retries ]; do
    if python -c "import redis; r = redis.from_url('${CELERY_BROKER_URL}'); r.ping()" 2>/dev/null; then
        echo "Redis is ready!"
        break
    fi
    retry_count=$((retry_count + 1))
    echo "Waiting for Redis... ($retry_count/$max_retries)"
    sleep 2
done

if [ $retry_count -eq $max_retries ]; then
    echo "ERROR: Redis is not available after $max_retries attempts"
    exit 1
fi

# Start Celery Worker
echo "Starting Celery Worker..."
celery -A celery_worker worker \
    --loglevel=info \
    --concurrency=${MAX_CONCURRENT_JOBS} \
    --pool=solo \
    --logfile=/dev/stdout &
celery_pid=$!
echo "Celery Worker started (PID: $celery_pid)"

# Start Celery Flower (monitoring)
echo "Starting Celery Flower..."
celery -A celery_worker flower \
    --port=5555 \
    --broker=${CELERY_BROKER_URL} \
    --basic_auth=admin:admin123 \
    --max_tasks=10000 &
flower_pid=$!
echo "Celery Flower started (PID: $flower_pid) - http://localhost:5555"

# Start FastAPI with Uvicorn
echo "Starting FastAPI application..."
uvicorn api.main:app \
    --host 0.0.0.0 \
    --port 8001 \
    --log-level info \
    --access-log &
uvicorn_pid=$!
echo "FastAPI started (PID: $uvicorn_pid) - http://localhost:8001"

echo "========================================="
echo "All services started successfully!"
echo "  - API: http://localhost:8001"
echo "  - API Docs: http://localhost:8001/docs"
echo "  - Flower: http://localhost:5555"
echo "========================================="

# Wait for all processes
wait
