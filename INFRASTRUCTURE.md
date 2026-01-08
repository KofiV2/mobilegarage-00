# Infrastructure & Deployment Guide

## Overview

This document provides comprehensive guidance for deploying and managing the In and Out Car Wash application infrastructure.

---

## Table of Contents

1. [Docker Setup](#docker-setup)
2. [CI/CD Pipeline](#cicd-pipeline)
3. [Monitoring & Logging](#monitoring--logging)
4. [Security Features](#security-features)
5. [Deployment](#deployment)
6. [Backup & Restore](#backup--restore)
7. [Scaling](#scaling)

---

## Docker Setup

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

### Quick Start

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild specific service
docker-compose up -d --build api
```

### Services

- **API**: Node.js backend (Port 3000)
- **Web**: React frontend (Port 80)
- **Redis**: Cache and rate limiting (Port 6379)

### Environment Files

Create `.env` file in the root directory:

```bash
cp .env.production.example .env
# Edit .env with your configuration
```

---

## CI/CD Pipeline

### GitHub Actions Workflows

#### 1. **CI Pipeline** (`.github/workflows/ci.yml`)

Runs on every push to `main` and `develop`:

- ✅ Linting
- ✅ Testing
- ✅ Build verification
- ✅ Security scanning
- ✅ Docker image build
- ✅ Auto-deployment to production (main branch)

#### 2. **Staging Deployment** (`.github/workflows/deploy-staging.yml`)

Deploys to staging environment on push to `develop`

### Required GitHub Secrets

```
DOCKER_USERNAME          # Docker Hub username
DOCKER_PASSWORD          # Docker Hub password/token
DEPLOY_HOST             # Production server IP/domain
DEPLOY_USER             # SSH user for deployment
DEPLOY_KEY              # SSH private key
SNYK_TOKEN              # Snyk security scanning token
VITE_API_URL            # Frontend API URL
VERCEL_TOKEN            # Vercel deployment token
VERCEL_ORG_ID           # Vercel organization ID
VERCEL_PROJECT_ID       # Vercel project ID
```

### Setup Instructions

1. Add secrets to GitHub repository:
   - Go to Settings → Secrets and variables → Actions
   - Add each secret listed above

2. Enable GitHub Actions:
   - Go to Actions tab
   - Enable workflows

3. Push to trigger deployment:
   ```bash
   git push origin main  # Deploy to production
   git push origin develop  # Deploy to staging
   ```

---

## Monitoring & Logging

### Winston Logger

Centralized logging with multiple transports:

```javascript
const logger = require('./src/utils/logger');

logger.info('User logged in', { userId: user.id });
logger.error('Payment failed', { error: error.message });
logger.warn('Slow request detected', { responseTime: '1500ms' });
```

### Log Files

- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- `logs/exceptions.log` - Uncaught exceptions
- `logs/rejections.log` - Unhandled promise rejections

### Performance Monitoring

Automatic monitoring includes:

- Request/response times
- Slow request detection (>1000ms)
- Error rate tracking
- Memory usage
- CPU usage

### Health Check Endpoint

```bash
GET /health

Response:
{
  "status": "healthy",
  "uptime": 3600,
  "timestamp": 1234567890,
  "checks": {
    "database": "healthy"
  },
  "memory": {...},
  "cpu": {...}
}
```

### External Monitoring (Optional)

**Sentry Integration** - Error tracking:
```bash
# Set SENTRY_DSN in .env
SENTRY_DSN=https://your-sentry-dsn
```

**Datadog/New Relic** - APM monitoring:
- Follow their documentation for Node.js integration

---

## Security Features

### 1. **Two-Factor Authentication (2FA)**

```javascript
// Enable 2FA
POST /api/auth-security/2fa/enable
Response: { secret, qrCode }

// Verify and activate
POST /api/auth-security/2fa/verify
Body: { token }

// Disable 2FA
POST /api/auth-security/2fa/disable
Body: { password }
```

### 2. **Email Verification**

```javascript
// Send verification email
POST /api/auth-security/send-verification-email

// Verify email
POST /api/auth-security/verify-email
Body: { token }
```

### 3. **Password Reset**

```javascript
// Request reset
POST /api/auth-security/forgot-password
Body: { email }

// Reset password
POST /api/auth-security/reset-password
Body: { token, newPassword }
```

### 4. **Rate Limiting**

- **API**: 100 requests per 15 minutes
- **Auth**: 5 attempts per 15 minutes
- **Payment**: 3 attempts per minute
- **Password Reset**: 3 requests per hour
- **Bookings**: 5 per minute

### 5. **Session Management**

```javascript
// Get active sessions
GET /api/auth-security/sessions

// Revoke session
DELETE /api/auth-security/sessions/:sessionId
```

### 6. **Account Lockout**

- Automatic lockout after 5 failed login attempts
- Locked for 15 minutes
- Email notification on lockout

### 7. **Security Headers**

Implemented via Helmet.js:
- Content Security Policy
- XSS Protection
- Frame Options
- HTTPS enforcement
- NoSniff
- HSTS

### 8. **Input Sanitization**

- NoSQL injection prevention
- XSS attack prevention
- SQL injection prevention
- HTTP parameter pollution prevention

---

## Deployment

### Production Deployment

```bash
# Using deployment script
./scripts/deploy.sh production

# Manual deployment
git pull origin main
docker-compose build
docker-compose up -d
```

### Staging Deployment

```bash
./scripts/deploy.sh staging
```

### Deploy to Specific Server

```bash
# SSH into server
ssh user@your-server.com

# Clone repository
git clone https://github.com/yourorg/carwash.git
cd carwash

# Setup environment
cp .env.production.example .env
nano .env  # Edit configuration

# Deploy
./scripts/deploy.sh production
```

### Environment-Specific Configs

- `.env.development` - Local development
- `.env.staging` - Staging environment
- `.env.production` - Production environment

---

## Backup & Restore

### Automatic Backups

Set up cron job for daily backups:

```bash
# Add to crontab
crontab -e

# Run backup daily at 2 AM
0 2 * * * /path/to/carwash/scripts/backup.sh
```

### Manual Backup

```bash
./scripts/backup.sh
```

Backup files stored in `./backups/`:
- `backup_20240101_020000.sql.gz`
- Automatically compressed
- Old backups (>30 days) auto-deleted

### Restore Database

```bash
./scripts/restore.sh ./backups/backup_20240101_020000.sql.gz
```

---

## Scaling

### Horizontal Scaling

```yaml
# docker-compose.yml
services:
  api:
    deploy:
      replicas: 3
```

### Load Balancing

Use Nginx or cloud load balancer:

```nginx
upstream api_backend {
    least_conn;
    server api1:3000;
    server api2:3000;
    server api3:3000;
}

server {
    location /api {
        proxy_pass http://api_backend;
    }
}
```

### Redis Cluster

For high availability:

```yaml
services:
  redis-master:
    image: redis:7-alpine

  redis-replica-1:
    image: redis:7-alpine
    command: redis-server --replicaof redis-master 6379

  redis-replica-2:
    image: redis:7-alpine
    command: redis-server --replicaof redis-master 6379
```

### Database Scaling

Use Supabase read replicas or connection pooling:

```javascript
const pool = new Pool({
  max: 100,  // Increase pool size
  idleTimeoutMillis: 30000
});
```

---

## Maintenance

### Health Checks

```bash
# Run health check
./scripts/health-check.sh

# Check specific service
docker-compose exec api wget -qO- http://localhost:3000/health
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api

# Last 100 lines
docker-compose logs --tail=100 api
```

### Update Dependencies

```bash
npm audit fix
npm update
```

### Clean Up

```bash
# Remove old images
docker system prune -a

# Remove old logs
find logs -name "*.log" -mtime +30 -delete
```

---

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose logs api

# Restart service
docker-compose restart api

# Rebuild if needed
docker-compose up -d --build api
```

### Database Connection Issues

```bash
# Test connection
docker-compose exec api node -e "
  const { pool } = require('./src/config/database');
  pool.query('SELECT NOW()').then(console.log).catch(console.error);
"
```

### High Memory Usage

```bash
# Check container stats
docker stats

# Restart services
docker-compose restart
```

### Performance Issues

1. Check slow requests in logs
2. Monitor database queries
3. Review cache hit rates
4. Check Redis performance
5. Analyze error rates

---

## Production Checklist

Before deploying to production:

- [ ] Update all environment variables
- [ ] Change default secrets and passwords
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure firewall rules
- [ ] Set up automated backups
- [ ] Configure monitoring and alerting
- [ ] Test disaster recovery procedures
- [ ] Review and update security policies
- [ ] Enable rate limiting
- [ ] Configure CDN for static assets
- [ ] Set up log rotation
- [ ] Document runbook procedures

---

## Support

For deployment issues or questions:

- GitHub Issues: https://github.com/yourorg/carwash/issues
- Documentation: See other markdown files in the repository
- Email: support@yourcarwash.com

---

**Last Updated**: December 2024
