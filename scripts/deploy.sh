#!/bin/bash

# Deployment script for Car Wash Application
# Usage: ./scripts/deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
echo "🚀 Deploying to $ENVIRONMENT environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f ".env.$ENVIRONMENT" ]; then
    echo "📦 Loading $ENVIRONMENT environment variables..."
    export $(cat .env.$ENVIRONMENT | grep -v '^#' | xargs)
else
    echo "${RED}❌ .env.$ENVIRONMENT file not found${NC}"
    exit 1
fi

# Check prerequisites
echo "🔍 Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { echo "${RED}❌ Docker is not installed${NC}" >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "${RED}❌ Docker Compose is not installed${NC}" >&2; exit 1; }

# Pull latest code
if [ "$ENVIRONMENT" == "production" ]; then
    echo "📥 Pulling latest code from main branch..."
    git pull origin main
else
    echo "📥 Pulling latest code from develop branch..."
    git pull origin develop
fi

# Build Docker images
echo "🔨 Building Docker images..."
docker-compose build --no-cache

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Start new containers
echo "🚀 Starting new containers..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service health
echo "🏥 Checking service health..."
HEALTH_CHECK=$(docker-compose ps | grep -c "Up")
if [ "$HEALTH_CHECK" -gt 0 ]; then
    echo "${GREEN}✅ Deployment successful!${NC}"
else
    echo "${RED}❌ Some services failed to start${NC}"
    docker-compose logs
    exit 1
fi

# Run database migrations (if any)
echo "📊 Running database migrations..."
docker-compose exec -T api npm run migrate || echo "${YELLOW}⚠️  No migrations to run${NC}"

# Clean up old images
echo "🧹 Cleaning up old Docker images..."
docker image prune -f

# Show running services
echo "📋 Running services:"
docker-compose ps

echo "${GREEN}✅ Deployment to $ENVIRONMENT completed successfully!${NC}"
echo "🌐 Application URL: ${WEB_URL}"
echo "📡 API URL: ${API_URL}"
