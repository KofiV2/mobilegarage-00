#!/bin/bash

# Health check script for monitoring
# Usage: ./scripts/health-check.sh

set -e

API_URL=${API_URL:-"http://localhost:3000"}
WEB_URL=${WEB_URL:-"http://localhost:5173"}

echo "🏥 Running health checks..."

# Check API health
echo "🔍 Checking API..."
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/health || echo "000")

if [ "$API_RESPONSE" == "200" ]; then
    echo "✅ API is healthy"
else
    echo "❌ API health check failed (HTTP $API_RESPONSE)"
    exit 1
fi

# Check Web health
echo "🔍 Checking Web..."
WEB_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $WEB_URL || echo "000")

if [ "$WEB_RESPONSE" == "200" ]; then
    echo "✅ Web is healthy"
else
    echo "❌ Web health check failed (HTTP $WEB_RESPONSE)"
    exit 1
fi

# Check Database connection
echo "🔍 Checking Database..."
docker-compose exec -T api node -e "
  const { pool } = require('./src/config/database');
  pool.query('SELECT 1')
    .then(() => { console.log('✅ Database is healthy'); process.exit(0); })
    .catch((err) => { console.error('❌ Database health check failed:', err.message); process.exit(1); });
"

# Check Redis (if configured)
if command -v redis-cli &> /dev/null; then
    echo "🔍 Checking Redis..."
    REDIS_RESPONSE=$(redis-cli ping 2>/dev/null || echo "FAILED")
    if [ "$REDIS_RESPONSE" == "PONG" ]; then
        echo "✅ Redis is healthy"
    else
        echo "⚠️  Redis is not responding"
    fi
fi

echo "✅ All health checks passed!"
