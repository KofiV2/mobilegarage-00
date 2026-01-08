# 🔧 Environment Setup Guide

**How to configure your .env file for database migrations**

---

## 📋 Quick Setup

### Step 1: Create .env file

```bash
# Copy the example file
cp .env.example .env
```

Or on Windows:
```bash
copy .env.example .env
```

### Step 2: Get Your Supabase Credentials

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project** (or create one if you don't have it)
3. **Go to Settings** → **Database**
4. **Copy the connection string**

---

## 🔑 Required Credentials

You need to update these values in your `.env` file:

### 1. Supabase URL
```env
SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
```

**Where to find:**
- Supabase Dashboard → Settings → API
- Look for "Project URL"

### 2. Supabase Keys

```env
SUPABASE_ANON_KEY=your-actual-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key-here
```

**Where to find:**
- Supabase Dashboard → Settings → API
- Look for "anon public" and "service_role" keys

### 3. Database URL

```env
DATABASE_URL=postgresql://postgres:YOUR-PASSWORD@db.YOUR-PROJECT-REF.supabase.co:5432/postgres
```

**Where to find:**
- Supabase Dashboard → Settings → Database
- Look for "Connection string" → URI
- Select "Transaction" mode
- Copy the entire string

**Example:**
```env
DATABASE_URL=postgresql://postgres.abcdefghijk:mypassword123@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

---

## 📝 Complete .env Example

Here's what your `.env` should look like with real values:

```env
# Supabase Configuration
SUPABASE_URL=https://abcdefghijk.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres.abcdefghijk:mypassword123@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# Database Configuration (from connection string)
DB_HOST=aws-0-us-east-1.pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres
DB_USER=postgres.abcdefghijk
DB_PASSWORD=mypassword123

# JWT Configuration (can keep as-is for now)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Stripe Configuration (optional - for payments later)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# ... rest of the file
```

---

## ✅ Verify Your Setup

After creating your `.env` file, test the connection:

```bash
cd apps/api
node -e "require('dotenv').config({ path: '../../.env' }); console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Found' : '❌ Not found');"
```

**Expected output:**
```
DATABASE_URL: ✅ Found
```

---

## 🚀 Apply Migrations

Once your `.env` is configured:

### Database Schema Update
```bash
cd apps/api
node apply-migration.js
```

### RLS Security Fix
```bash
cd apps/api
node apply-rls-security.js
```

---

## 🆘 Don't Have Supabase Yet?

### Create a Free Supabase Project

1. **Go to**: https://supabase.com
2. **Click**: "Start your project"
3. **Sign up** with GitHub or email
4. **Create a new project**:
   - Organization: Your name
   - Project name: carwash-00
   - Database password: (create a strong password - save it!)
   - Region: Choose closest to you
5. **Wait** 2-3 minutes for project creation
6. **Get credentials** as described above

**Free tier includes:**
- ✅ 500MB database
- ✅ 1GB file storage
- ✅ 50,000 monthly active users
- ✅ 2GB bandwidth
- ✅ Perfect for development!

---

## 📋 Alternative: Apply Without .env

If you don't want to configure `.env` right now, you can apply migrations directly in Supabase Dashboard:

### Method 1: Copy to Clipboard

**Windows:**
```bash
# Double-click this file:
copy-rls-migration.bat
```

Then paste in Supabase SQL Editor.

### Method 2: Manual Copy

1. Open: `apps/api/database/migrations/007_enable_row_level_security.sql`
2. Select all (Ctrl+A)
3. Copy (Ctrl+C)
4. Go to Supabase Dashboard → SQL Editor
5. Paste (Ctrl+V)
6. Click "Run"

---

## 🔍 Verify Migrations Applied

After running migrations, check:

```sql
-- Check schema version
SELECT * FROM schema_version ORDER BY applied_at DESC;

-- Should show:
-- 2.2.0 - Database schema completion
-- 2.3.0 - RLS security (if applied)
```

---

## 🎯 Quick Checklist

- [ ] Created `.env` file from `.env.example`
- [ ] Got Supabase credentials from dashboard
- [ ] Updated `SUPABASE_URL`
- [ ] Updated `SUPABASE_ANON_KEY`
- [ ] Updated `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Updated `DATABASE_URL`
- [ ] Tested connection
- [ ] Applied database schema migration
- [ ] Applied RLS security migration
- [ ] Verified in Supabase Dashboard

---

## 💡 Pro Tips

### Use Environment Variables in Production

For production, use environment variables from your hosting provider:
- Vercel: Add in project settings
- Railway: Add in project variables
- Heroku: Add via `heroku config:set`

### Never Commit .env

Your `.gitignore` should include:
```
.env
.env.local
.env.production
```

Only commit `.env.example` with placeholder values.

### Backup Your Credentials

Save your Supabase credentials in a password manager:
- 1Password
- LastPass
- Bitwarden

---

## 🆘 Troubleshooting

### "DATABASE_URL not found"
- ✅ Make sure `.env` file exists in project root
- ✅ Make sure it's named `.env` not `.env.txt`
- ✅ Make sure `DATABASE_URL=` line has actual value

### "Connection refused"
- ✅ Check Supabase project is running (not paused)
- ✅ Check DATABASE_URL is correct
- ✅ Check firewall isn't blocking Supabase

### "Invalid credentials"
- ✅ Re-copy credentials from Supabase Dashboard
- ✅ Make sure no extra spaces in .env file
- ✅ Try resetting database password in Supabase

---

**Need help?** Check the migration files - they have detailed inline comments!
