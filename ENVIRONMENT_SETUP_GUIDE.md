# 🔐 Environment Variables Setup Guide

Complete guide to configure all environment variables for the Car Wash Management System.

---

## 📋 Quick Setup Checklist

- [ ] Backend API environment variables (.env)
- [ ] Web App environment variables (.env)
- [ ] Mobile App environment variables (.env)
- [ ] MongoDB database connection
- [ ] Email service (Gmail/SendGrid)
- [ ] Stripe payment gateway
- [ ] Firebase push notifications
- [ ] Sentry error tracking (optional)

---

## 1️⃣ Backend API Configuration

**File:** `apps/api/.env`

### Step 1: Copy Template
```bash
cd apps/api
cp .env.example .env
```

### Step 2: Fill in Variables

```env
# =============================================================================
# SERVER CONFIGURATION
# =============================================================================
PORT=3000
NODE_ENV=development

# =============================================================================
# DATABASE - MongoDB
# =============================================================================
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/carwash

# Or MongoDB Atlas (Production)
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/carwash?retryWrites=true&w=majority

# =============================================================================
# JWT AUTHENTICATION
# =============================================================================
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_min_32_chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_token_secret_different_from_jwt_secret
JWT_REFRESH_EXPIRES_IN=30d

# =============================================================================
# STRIPE PAYMENT GATEWAY
# =============================================================================
# Get from: https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY=sk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# =============================================================================
# EMAIL SERVICE - Option 1: Gmail
# =============================================================================
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=CarWash Pro <noreply@carwash.com>

# How to get Gmail App Password:
# 1. Go to https://myaccount.google.com/security
# 2. Enable 2-Step Verification
# 3. Go to App Passwords
# 4. Generate password for "Mail"
# 5. Use that 16-character password here

# =============================================================================
# EMAIL SERVICE - Option 2: SendGrid (Recommended for Production)
# =============================================================================
# EMAIL_SERVICE=sendgrid
# SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# EMAIL_FROM=CarWash Pro <noreply@carwash.com>

# =============================================================================
# FIREBASE CLOUD MESSAGING (Push Notifications)
# =============================================================================
# Get from: https://console.firebase.google.com
# 1. Create project
# 2. Go to Project Settings > Service Accounts
# 3. Click "Generate New Private Key"

FIREBASE_PROJECT_ID=carwash-app-xxxxx
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@carwash-app-xxxxx.iam.gserviceaccount.com

# =============================================================================
# WEB PUSH NOTIFICATIONS
# =============================================================================
# Generate VAPID keys:
# npx web-push generate-vapid-keys

VAPID_PUBLIC_KEY=BNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VAPID_PRIVATE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VAPID_SUBJECT=mailto:admin@carwash.com

# =============================================================================
# SENTRY ERROR TRACKING (Optional but Recommended)
# =============================================================================
# Get from: https://sentry.io/
SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@o000000.ingest.sentry.io/0000000

# =============================================================================
# APP URLS
# =============================================================================
WEB_APP_URL=http://localhost:5173
MOBILE_APP_URL=exp://localhost:19000
API_URL=http://localhost:3000

# Production URLs (when deployed)
# WEB_APP_URL=https://app.carwash.com
# MOBILE_APP_URL=https://app.carwash.com
# API_URL=https://api.carwash.com

# =============================================================================
# CORS CONFIGURATION
# =============================================================================
CORS_ORIGIN=http://localhost:5173,http://localhost:19000

# Production: List all allowed origins
# CORS_ORIGIN=https://app.carwash.com,https://www.carwash.com

# =============================================================================
# REDIS (Optional - for caching and queues)
# =============================================================================
# REDIS_HOST=localhost
# REDIS_PORT=6379
# REDIS_PASSWORD=

# =============================================================================
# AWS S3 (Optional - for file uploads)
# =============================================================================
# AWS_ACCESS_KEY_ID=AKIA...
# AWS_SECRET_ACCESS_KEY=...
# AWS_REGION=us-east-1
# AWS_S3_BUCKET=carwash-uploads

# =============================================================================
# TWILIO SMS (Optional - for SMS notifications)
# =============================================================================
# TWILIO_ACCOUNT_SID=AC...
# TWILIO_AUTH_TOKEN=...
# TWILIO_PHONE_NUMBER=+1234567890

# =============================================================================
# RATE LIMITING
# =============================================================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# =============================================================================
# LOGGING
# =============================================================================
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

---

## 2️⃣ Web App Configuration

**File:** `apps/web/.env`

### Step 1: Copy Template
```bash
cd apps/web
cp .env.example .env
```

### Step 2: Fill in Variables

```env
# =============================================================================
# API CONFIGURATION
# =============================================================================
VITE_API_URL=http://localhost:3000

# Production
# VITE_API_URL=https://api.carwash.com

# =============================================================================
# STRIPE (Frontend)
# =============================================================================
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# =============================================================================
# SENTRY ERROR TRACKING (Optional)
# =============================================================================
VITE_SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@o000000.ingest.sentry.io/0000000

# =============================================================================
# FIREBASE (Web Push Notifications)
# =============================================================================
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=carwash-app-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=carwash-app-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=carwash-app-xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=1:000000000000:web:xxxxxxxxxxxxxxxxxxxxxxxx
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_VAPID_PUBLIC_KEY=BNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# =============================================================================
# GOOGLE ANALYTICS (Optional)
# =============================================================================
# VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# =============================================================================
# FEATURE FLAGS
# =============================================================================
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PUSH_NOTIFICATIONS=true
VITE_ENABLE_DARK_MODE=true
```

---

## 3️⃣ Mobile App Configuration

**File:** `apps/mobile/.env`

```env
# =============================================================================
# API CONFIGURATION
# =============================================================================
API_URL=http://localhost:3000

# For Android Emulator, use:
# API_URL=http://10.0.2.2:3000

# For iOS Simulator, use:
# API_URL=http://localhost:3000

# Production
# API_URL=https://api.carwash.com

# =============================================================================
# STRIPE
# =============================================================================
STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# =============================================================================
# EXPO PUSH NOTIFICATIONS
# =============================================================================
EXPO_PROJECT_ID=your-expo-project-id
```

---

## 📝 Service-Specific Setup Instructions

### 🔐 MongoDB Setup

#### Option 1: Local MongoDB
```bash
# Install MongoDB
# macOS: brew install mongodb-community
# Windows: Download from https://www.mongodb.com/try/download/community

# Start MongoDB
mongod --dbpath /path/to/data/db

# Connection String
MONGODB_URI=mongodb://localhost:27017/carwash
```

#### Option 2: MongoDB Atlas (Recommended for Production)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create cluster
4. Get connection string
5. Add to .env:
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/carwash?retryWrites=true&w=majority
```

### 💳 Stripe Setup

1. **Create Account**: https://dashboard.stripe.com/register
2. **Get API Keys**:
   - Go to Developers > API Keys
   - Copy "Publishable key" and "Secret key"
3. **Set up Webhooks**:
   - Go to Developers > Webhooks
   - Add endpoint: `https://your-api.com/api/payments/webhook`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy webhook secret

4. **Test Cards**:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 9995`
   - 3D Secure: `4000 0027 6000 3184`

### 📧 Email Service Setup

#### Option 1: Gmail (Quick Start)
1. Enable 2-Step Verification on your Google Account
2. Go to https://myaccount.google.com/apppasswords
3. Generate app password for "Mail"
4. Use credentials:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=16-char-app-password
```

#### Option 2: SendGrid (Production Recommended)
1. Create account: https://signup.sendgrid.com/
2. Create API key: Settings > API Keys
3. Verify sender email
4. Use:
```env
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@carwash.com
```

### 🔔 Firebase Push Notifications Setup

1. **Create Firebase Project**:
   - Go to https://console.firebase.google.com
   - Click "Add project"
   - Follow setup wizard

2. **Get Service Account Key**:
   - Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Download JSON file

3. **Extract Credentials**:
```json
{
  "project_id": "carwash-app-xxxxx",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@carwash-app-xxxxx.iam.gserviceaccount.com"
}
```

4. **Add to .env** (escape newlines in private key)

5. **Get Web Config**:
   - Project Settings > General
   - Add Web App
   - Copy config to web app .env

### 🔍 Sentry Error Tracking Setup (Optional)

1. Create account: https://sentry.io/signup/
2. Create project
3. Get DSN from Settings > Projects > [Your Project] > Client Keys
4. Add to .env files

### 🔑 Generate VAPID Keys (Web Push)

```bash
npx web-push generate-vapid-keys

# Output:
# Public Key: BNxxxxxxxxx...
# Private Key: xxxxxxxxxxx...
```

Add to apps/api/.env

---

## ✅ Verification Checklist

### Backend API
```bash
cd apps/api

# Check .env file exists
ls -la .env

# Test database connection
node -e "require('dotenv').config(); console.log('DB:', process.env.MONGODB_URI.replace(/:[^:]*@/, ':****@'));"

# Test email configuration
node -e "require('dotenv').config(); console.log('Email:', process.env.EMAIL_USER);"

# Test Stripe
node -e "require('dotenv').config(); console.log('Stripe:', process.env.STRIPE_SECRET_KEY?.substring(0, 20) + '...');"
```

### Web App
```bash
cd apps/web

# Check .env file exists
ls -la .env

# Verify variables load
npm run dev
# Check console for any missing env variable warnings
```

---

## 🚨 Security Best Practices

### ❌ DO NOT:
- Commit .env files to git (they're in .gitignore)
- Share .env files publicly
- Use production keys in development
- Hardcode secrets in code

### ✅ DO:
- Use different keys for development/production
- Rotate keys regularly (every 90 days)
- Use environment-specific .env files
- Store production secrets in secure vaults (AWS Secrets Manager, HashiCorp Vault)
- Enable 2FA on all service accounts
- Use read-only database users where possible

---

## 🔄 Different Environments

### Development (.env.development)
```env
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/carwash
API_URL=http://localhost:3000
```

### Staging (.env.staging)
```env
NODE_ENV=staging
MONGODB_URI=mongodb+srv://...@staging-cluster.mongodb.net/carwash
API_URL=https://api-staging.carwash.com
```

### Production (.env.production)
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...@prod-cluster.mongodb.net/carwash
API_URL=https://api.carwash.com
```

---

## 🆘 Troubleshooting

### Issue: "Cannot connect to MongoDB"
- Check MongoDB is running: `mongosh`
- Verify connection string format
- Check network/firewall settings
- For Atlas: Whitelist your IP address

### Issue: "Email not sending"
- Test SMTP connection: `telnet smtp.gmail.com 587`
- Verify app password (not regular password)
- Check "Less secure app access" settings
- Check spam folder

### Issue: "Stripe webhook not working"
- Use ngrok for local testing: `ngrok http 3000`
- Verify webhook secret matches
- Check webhook URL is publicly accessible
- Review Stripe dashboard for webhook attempts

### Issue: "Push notifications not received"
- Verify Firebase credentials
- Check device token is registered
- Test with Firebase Console > Cloud Messaging
- Review browser notification permissions

---

## 📚 Additional Resources

- [MongoDB Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [SendGrid Documentation](https://docs.sendgrid.com/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Protocol](https://web.dev/push-notifications-overview/)

---

**Last Updated**: 2026-01-12

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
