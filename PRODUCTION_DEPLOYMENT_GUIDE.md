# 🚀 Production Deployment Guide

Complete guide to deploy the Car Wash Management System to production.

---

## 📋 Pre-Deployment Checklist

### Code & Configuration
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] API documentation updated
- [ ] Error monitoring setup (Sentry)
- [ ] Security audit completed
- [ ] Performance testing done
- [ ] Backup strategy in place

### Services & Accounts
- [ ] MongoDB Atlas account (production cluster)
- [ ] Stripe account (production mode)
- [ ] Email service (SendGrid/AWS SES)
- [ ] Firebase project (push notifications)
- [ ] Domain name purchased
- [ ] SSL certificates
- [ ] CDN account (CloudFlare)
- [ ] Hosting platform account

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         CloudFlare CDN                      │
│                    (SSL, DDoS Protection)                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
┌───────▼────────┐         ┌────────▼────────┐
│   Web App      │         │    API Server   │
│   (Vercel)     │         │   (Railway)     │
│  React + Vite  │◄────────┤   Node.js       │
└────────────────┘         │   + Express     │
                           └────────┬────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
           ┌────────▼────┐  ┌──────▼──────┐  ┌────▼─────┐
           │  MongoDB    │  │   Redis     │  │  AWS S3  │
           │   Atlas     │  │   Cloud     │  │  Bucket  │
           │  (Database) │  │  (Cache)    │  │  (Files) │
           └─────────────┘  └─────────────┘  └──────────┘

┌────────────────────────────────────────────────────────────┐
│  Mobile App (React Native)                                  │
│  • Expo EAS Build                                           │
│  • App Store + Google Play                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ Database Setup (MongoDB Atlas)

### Step 1: Create Cluster

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign in or create account
3. Click "Build a Database"
4. Choose plan:
   - **Development**: M0 Free (512MB storage)
   - **Production**: M10+ ($0.08/hour+)
5. Select region closest to users
6. Create cluster (takes 3-5 minutes)

### Step 2: Configure Security

```bash
# 1. Database Access
- Create database user
- Username: carwash_admin
- Password: Generate strong password
- Role: Atlas admin or readWrite@carwash

# 2. Network Access
- Add IP whitelist
- For testing: 0.0.0.0/0 (allow all)
- Production: Add your server IPs only
```

### Step 3: Get Connection String

```
mongodb+srv://carwash_admin:<password>@cluster0.xxxxx.mongodb.net/carwash?retryWrites=true&w=majority
```

### Step 4: Apply Migrations

```bash
# Connect to your production database
export MONGODB_URI="mongodb+srv://..."

# Run migrations
cd apps/api
node apply-migration.js

# Seed initial data (admin user, services)
node seed-complete-data.js
```

### Step 5: Configure Backups

- Go to Cluster > Backup tab
- Enable Continuous Backup (M10+)
- Or use Cloud Provider Snapshots (Free tier)
- Set backup schedule (daily recommended)

---

## 2️⃣ API Deployment (Railway / Heroku / DigitalOcean)

### Option A: Railway (Recommended - Easiest)

#### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
railway login
```

#### Step 2: Initialize Project
```bash
cd apps/api
railway init

# Follow prompts
# Name: carwash-api
```

#### Step 3: Configure Environment Variables
```bash
# Add all variables from .env
railway variables set MONGODB_URI="mongodb+srv://..."
railway variables set JWT_SECRET="your-secret"
railway variables set STRIPE_SECRET_KEY="sk_live_..."
railway variables set EMAIL_SERVICE="sendgrid"
railway variables set SENDGRID_API_KEY="SG...."
# ... (add all variables)

# Or upload .env file
railway variables set --from-env-file .env.production
```

#### Step 4: Deploy
```bash
# Deploy
railway up

# Your API will be available at:
# https://carwash-api-production.up.railway.app

# Set custom domain (optional)
railway domain add api.carwash.com
```

#### Step 5: Configure Health Checks
```javascript
// apps/api/src/index.js
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

### Option B: Heroku

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create app
cd apps/api
heroku create carwash-api

# Add MongoDB
heroku addons:create mongolab:sandbox

# Set environment variables
heroku config:set JWT_SECRET="your-secret"
heroku config:set STRIPE_SECRET_KEY="sk_live_..."
# ... (set all variables)

# Deploy
git push heroku master

# View logs
heroku logs --tail
```

### Option C: DigitalOcean App Platform

1. Go to https://cloud.digitalocean.com/apps
2. Click "Create App"
3. Connect GitHub repository
4. Select `apps/api` as root directory
5. Environment: Node.js
6. Run Command: `npm start`
7. Add environment variables
8. Deploy

---

## 3️⃣ Web App Deployment (Vercel / Netlify)

### Option A: Vercel (Recommended)

#### Step 1: Install Vercel CLI
```bash
npm install -g vercel
vercel login
```

#### Step 2: Deploy
```bash
cd apps/web

# First deployment
vercel

# Follow prompts:
# Set up and deploy? Yes
# Which scope? Your account
# Link to existing project? No
# Project name: carwash-web
# In which directory is your code? ./
# Want to override settings? No

# Production deployment
vercel --prod
```

#### Step 3: Configure Environment Variables
```bash
# Via CLI
vercel env add VITE_API_URL production
# Enter: https://api.carwash.com

vercel env add VITE_STRIPE_PUBLISHABLE_KEY production
# Enter: pk_live_...

# Or via dashboard: https://vercel.com/dashboard
# Settings > Environment Variables
```

#### Step 4: Custom Domain
```
1. Go to Vercel Dashboard
2. Select project
3. Settings > Domains
4. Add domain: app.carwash.com
5. Update DNS records as instructed
```

### Option B: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd apps/web
netlify deploy --prod

# Follow prompts
# Build command: npm run build
# Publish directory: dist
```

---

## 4️⃣ Mobile App Deployment (Expo EAS)

### Step 1: Setup EAS

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure
cd apps/mobile
eas build:configure
```

### Step 2: Build for iOS

```bash
# Build
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

### Step 3: Build for Android

```bash
# Build
eas build --platform android --profile production

# Submit to Google Play
eas submit --platform android
```

### Step 4: App Store Setup

#### Apple App Store:
1. Create account: https://developer.apple.com/
2. Create App ID in App Store Connect
3. Fill in app information
4. Upload screenshots
5. Submit for review

#### Google Play Store:
1. Create account: https://play.google.com/console
2. Create new app
3. Fill in store listing
4. Upload APK/AAB
5. Submit for review

---

## 5️⃣ DNS & SSL Configuration

### Step 1: Purchase Domain

Recommended registrars:
- Namecheap
- Google Domains
- Cloudflare Registrar

### Step 2: Configure DNS

```
A Record:
@ → Your API server IP

CNAME Records:
api → your-api.railway.app
app → your-project.vercel.app
www → your-project.vercel.app
```

### Step 3: SSL Certificates

#### Option 1: CloudFlare (Recommended - Free)
1. Add site to CloudFlare
2. Update nameservers at registrar
3. SSL/TLS > Full (strict)
4. Auto-enabled for all subdomains

#### Option 2: Let's Encrypt (Manual)
```bash
# Install certbot
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d api.carwash.com

# Auto-renew
sudo certbot renew --dry-run
```

---

## 6️⃣ Monitoring & Error Tracking

### Sentry Setup

```bash
# Install
npm install @sentry/node @sentry/react

# Configure API
// apps/api/src/index.js
const Sentry = require('@sentry/node');
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0
});

# Configure Web
// apps/web/src/main.jsx
import * as Sentry from '@sentry/react';
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0
});
```

### Application Monitoring

```bash
# Railway
- Built-in metrics dashboard
- View CPU, memory, network usage
- Log streaming

# Alternative: New Relic
npm install newrelic

# Alternative: Datadog
npm install dd-trace
```

### Uptime Monitoring

Free services:
- UptimeRobot (https://uptimerobot.com)
- Pingdom (https://pingdom.com)
- StatusCake (https://statuscake.com)

Monitor endpoints:
- `https://api.carwash.com/health`
- `https://app.carwash.com`

---

## 7️⃣ Performance Optimization

### CDN Setup (CloudFlare)

```
1. Add site to CloudFlare
2. Enable "Auto Minify" (CSS, JS, HTML)
3. Enable "Brotli" compression
4. Set cache rules:
   - Static assets: 1 month
   - API responses: Do not cache
5. Enable "Rocket Loader"
```

### Database Optimization

```javascript
// Add indexes
db.bookings.createIndex({ user_id: 1, created_at: -1 });
db.bookings.createIndex({ status: 1, scheduled_date: 1 });
db.users.createIndex({ email: 1 }, { unique: true });
db.services.createIndex({ is_active: 1, name: 1 });
```

### API Caching (Redis)

```bash
# Add Redis on Railway
railway add redis

# Update code
const redis = require('redis');
const client = redis.createClient({
  url: process.env.REDIS_URL
});

// Cache expensive queries
app.get('/api/admin/dashboard-stats', async (req, res) => {
  const cached = await client.get('dashboard-stats');
  if (cached) return res.json(JSON.parse(cached));

  const stats = await fetchStats();
  await client.setEx('dashboard-stats', 300, JSON.stringify(stats)); // 5 min
  res.json(stats);
});
```

---

## 8️⃣ Backup & Disaster Recovery

### Database Backups

```bash
# MongoDB Atlas
- Automatic continuous backups (M10+)
- Or cloud provider snapshots (all tiers)
- Retention: 7 days default

# Manual backup
mongodump --uri="mongodb+srv://..." --out=/backup/$(date +%Y%m%d)

# Restore
mongorestore --uri="mongodb+srv://..." /backup/20260112
```

### Application Backups

```bash
# Git tags for releases
git tag -a v1.0.0 -m "Production release 1.0.0"
git push origin v1.0.0

# Railway snapshots
railway snapshot create

# Vercel rollback
vercel rollback
```

### Disaster Recovery Plan

1. **Database corruption**: Restore from latest backup
2. **API server down**: Railway auto-restarts, or deploy backup instance
3. **DDoS attack**: CloudFlare protection active
4. **Data breach**: Revoke API keys, rotate secrets, notify users
5. **Complete failure**: Restore from backups, redeploy from git

---

## 9️⃣ CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          cd apps/api
          npm install

      - name: Run tests
        run: |
          cd apps/api
          npm test

      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway up --service api
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  deploy-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: apps/web
```

---

## 🔟 Security Checklist

### Before Going Live:

- [ ] Change all default passwords
- [ ] Use strong JWT secrets (min 32 chars)
- [ ] Enable HTTPS everywhere
- [ ] Set secure cookie flags
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Validate all inputs
- [ ] Sanitize user-generated content
- [ ] Use parameterized queries (prevent SQL injection)
- [ ] Hash passwords (bcrypt)
- [ ] Implement CSRF protection
- [ ] Set security headers (helmet.js)
- [ ] Review and minimize IAM permissions
- [ ] Enable 2FA on all admin accounts
- [ ] Regular security audits
- [ ] Keep dependencies updated

### Security Headers

```javascript
// apps/api/src/index.js
const helmet = require('helmet');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true
  }
}));
```

---

## 📊 Post-Deployment Monitoring

### Key Metrics to Track:

1. **Uptime**: Target 99.9%+
2. **Response Time**: API < 200ms, Web < 2s
3. **Error Rate**: < 0.1%
4. **Database Performance**: Query time < 100ms
5. **User Growth**: Daily/weekly active users
6. **Conversion Rate**: Bookings per visitor
7. **Revenue**: Daily/monthly tracking

### Dashboards:

- Sentry: Errors and performance
- Railway: Server metrics
- Vercel: Web analytics
- MongoDB Atlas: Database performance
- Google Analytics: User behavior

---

## 🚨 Troubleshooting Common Issues

### Issue: "502 Bad Gateway"
**Cause**: API server crashed or unreachable
**Fix**:
```bash
# Check logs
railway logs

# Restart service
railway restart

# Check health endpoint
curl https://api.carwash.com/health
```

### Issue: "Database connection timeout"
**Cause**: IP not whitelisted or wrong connection string
**Fix**:
1. MongoDB Atlas > Network Access
2. Add current IP
3. Verify connection string
4. Test: `mongosh "mongodb+srv://..."`

### Issue: "CORS error"
**Cause**: Frontend domain not allowed
**Fix**:
```javascript
// apps/api/src/index.js
app.use(cors({
  origin: ['https://app.carwash.com', 'https://www.carwash.com'],
  credentials: true
}));
```

### Issue: "Environment variable not found"
**Cause**: Not set in production
**Fix**:
```bash
# Railway
railway variables set VARIABLE_NAME="value"

# Vercel
vercel env add VARIABLE_NAME production
```

---

## ✅ Final Verification

```bash
# 1. Test API health
curl https://api.carwash.com/health

# 2. Test API authentication
curl -X POST https://api.carwash.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@carwash.com","password":"admin123"}'

# 3. Test web app
open https://app.carwash.com

# 4. Test mobile app
# Install from App Store / Google Play

# 5. Create test booking end-to-end
# 6. Verify email notifications sent
# 7. Test payment with real card
# 8. Check Sentry for any errors
# 9. Monitor logs for 24 hours
# 10. Load test with 100+ concurrent users
```

---

## 📈 Scaling Strategy

### When to Scale:

- CPU usage consistently > 70%
- Memory usage > 80%
- Response time > 500ms
- Database connections maxed out

### Vertical Scaling:
```
Railway: Upgrade plan
MongoDB Atlas: Upgrade tier (M10 → M20 → M30)
```

### Horizontal Scaling:
```
- Add more API instances (load balancer)
- Use Redis for session storage
- Implement database read replicas
- Use CDN for static assets
- Queue background jobs (Bull/BullMQ)
```

---

## 🎉 Launch Day Checklist

- [ ] All tests passing
- [ ] Production database seeded
- [ ] DNS propagated (check: https://dnschecker.org)
- [ ] SSL certificates active
- [ ] Monitoring dashboards configured
- [ ] Error tracking enabled
- [ ] Backups configured and tested
- [ ] Team trained on admin panel
- [ ] Customer support ready
- [ ] Marketing materials prepared
- [ ] Social media announced
- [ ] Press release (if applicable)
- [ ] Monitor for first 24 hours

---

## 📞 Support & Resources

- Railway Status: https://status.railway.app/
- Vercel Status: https://www.vercel-status.com/
- MongoDB Atlas Status: https://status.cloud.mongodb.com/
- CloudFlare Status: https://www.cloudflarestatus.com/

---

**🎊 Congratulations on your production deployment!**

Your Car Wash Management System is now live and serving customers!

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
