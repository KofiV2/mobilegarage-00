# Environment Variables Guide

This document describes all environment variables used across the 3ON Mobile Car Wash platform.

## Overview

The project uses multiple `.env` files:

| File | Purpose |
|------|---------|
| `.env` | Root-level shared variables |
| `apps/web/.env` | Web app configuration |
| `apps/mobile/.env` | Mobile app configuration |
| `functions/.env` | Cloud Functions secrets |

## Quick Start

Copy the example files:

```bash
cp .env.example .env
cp apps/web/.env.example apps/web/.env
cp apps/mobile/.env.example apps/mobile/.env
```

---

## Root Environment (`.env`)

### Database (Supabase)

```bash
# Supabase project URL and keys
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Direct database connection (for migrations)
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/INANDOUT

# Individual DB connection params
DB_HOST=db.your-project.supabase.co
DB_PORT=5432
DB_NAME=INANDOUT
DB_USER=postgres
DB_PASSWORD=your-password
```

### Authentication

```bash
# JWT configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Session secret for server-side sessions
SESSION_SECRET=your-session-secret-change-this
```

### Payment Providers

```bash
# Stripe (card payments)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Tabby (MENA BNPL)
TABBY_MERCHANT_CODE=your_tabby_merchant_code
TABBY_PUBLIC_KEY=your_tabby_public_key
TABBY_SECRET_KEY=your_tabby_secret_key
TABBY_WEBHOOK_SECRET=your_tabby_webhook_secret

# Tamara (MENA BNPL)
TAMARA_API_URL=https://api.tamara.co
TAMARA_API_TOKEN=your_tamara_api_token
TAMARA_NOTIFICATION_TOKEN=your_tamara_notification_token
```

### Notifications

```bash
# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-email-password
EMAIL_FROM=noreply@inandout.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### Server Configuration

```bash
# Server
PORT=3000
NODE_ENV=development

# API
API_VERSION=v1
API_PREFIX=/api

# CORS (comma-separated origins)
CORS_ORIGIN=http://localhost:5173,exp://localhost:19000

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Optional Services

```bash
# Redis (caching)
REDIS_URL=redis://localhost:6379

# File uploads
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

### Frontend URLs

```bash
WEB_URL=http://localhost:5173
MOBILE_URL=exp://localhost:19000
```

---

## Web App (`apps/web/.env`)

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

# API endpoints (optional - defaults to Firebase Functions)
VITE_API_BASE_URL=https://your-api.example.com

# Feature flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_SUBSCRIPTIONS=false

# Environment
VITE_APP_ENV=development
```

> **Note**: Vite requires all client-side env vars to start with `VITE_`

---

## Mobile App (`apps/mobile/.env`)

```bash
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:android:abc123

# Stripe
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Google Maps (for location features)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key

# API
EXPO_PUBLIC_API_URL=https://your-api.example.com
```

> **Note**: Expo requires public env vars to start with `EXPO_PUBLIC_`

---

## Cloud Functions (`functions/.env`)

These variables are used by Firebase Cloud Functions:

### Email Notifications

```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=3ON Car Wash

# Recipient for staff order notifications
OWNER_EMAIL=owner@example.com
```

### Telegram Notifications

```bash
# Telegram Bot API
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrSTUvwxYZ
TELEGRAM_CHAT_ID=-1001234567890
```

### Setting Up Telegram

1. Create a bot via [@BotFather](https://t.me/botfather)
2. Get the bot token
3. Add bot to your group/channel
4. Get chat ID via `https://api.telegram.org/bot<TOKEN>/getUpdates`

### Firebase Secrets (Alternative)

For production, use Firebase secrets instead of `.env`:

```bash
# Set secrets via CLI
firebase functions:secrets:set SMTP_PASSWORD
firebase functions:secrets:set TELEGRAM_BOT_TOKEN

# Use in functions
import { defineSecret } from "firebase-functions/params";
const smtpPassword = defineSecret("SMTP_PASSWORD");
```

---

## Production Checklist

Before deploying to production:

### Security

- [ ] Change all `your-*` placeholder values
- [ ] Use strong, unique secrets for JWT/Session
- [ ] Enable HTTPS for all URLs
- [ ] Restrict CORS origins to your domains
- [ ] Use Firebase secrets for Cloud Functions

### Services

- [ ] Set up production Stripe keys (`sk_live_*`, `pk_live_*`)
- [ ] Configure production SMTP (or use SendGrid/SES)
- [ ] Set up production Telegram bot/chat
- [ ] Configure production Supabase project

### Environment-Specific

```bash
# Production .env
NODE_ENV=production
VITE_APP_ENV=production
WEB_URL=https://yourdomain.com

# Staging .env
NODE_ENV=staging
VITE_APP_ENV=staging
WEB_URL=https://staging.yourdomain.com
```

---

## Troubleshooting

### Variables Not Loading

**Vite (Web)**:
- Must start with `VITE_`
- Restart dev server after changes
- Access via `import.meta.env.VITE_*`

**Expo (Mobile)**:
- Must start with `EXPO_PUBLIC_`
- Rebuild app after changes
- Access via `process.env.EXPO_PUBLIC_*`

**Firebase Functions**:
- Local: Uses `functions/.env`
- Deployed: Uses Firebase secrets or environment config
- Run `firebase functions:config:get` to verify

### Gmail SMTP Issues

If using Gmail:
1. Enable 2FA on your Google account
2. Generate an App Password
3. Use the app password in `SMTP_PASSWORD`

### Firebase Configuration

Get your Firebase config from:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Project Settings → General
3. Your apps → Web app → Config

---

## Reference

| Prefix | Platform | Access Method |
|--------|----------|---------------|
| `VITE_` | Web (Vite) | `import.meta.env.VITE_*` |
| `EXPO_PUBLIC_` | Mobile (Expo) | `process.env.EXPO_PUBLIC_*` |
| (none) | Server/Functions | `process.env.*` |
