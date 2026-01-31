# Vercel Deployment Guide - Fix Blank Screen Issue

## Problem Summary

The blank screen on your Vercel deployment is caused by **missing environment variables**. Vercel doesn't have access to your local `.env` file, so Firebase receives `undefined` as the API key and crashes the entire app.

## Quick Fix (3 Steps)

### Step 1: Add Environment Variables to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `mobilegarage-00` (or your project name)
3. Click **Settings** → **Environment Variables**
4. Add each of the following variables:

#### Required Environment Variables

Copy these values from your `apps/web/.env` file:

| Variable Name | Value | Environments |
|--------------|-------|--------------|
| `VITE_FIREBASE_API_KEY` | `AIzaSyCDjRmT1TDSDzjQt0mTJCTEfeC7fT5QI2w` | Production, Preview, Development |
| `VITE_FIREBASE_AUTH_DOMAIN` | `onae-carwash.firebaseapp.com` | Production, Preview, Development |
| `VITE_FIREBASE_PROJECT_ID` | `onae-carwash` | Production, Preview, Development |
| `VITE_FIREBASE_STORAGE_BUCKET` | `onae-carwash.firebasestorage.app` | Production, Preview, Development |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `998539218062` | Production, Preview, Development |
| `VITE_FIREBASE_APP_ID` | `1:998539218062:web:13b6ab024d764e54a50ddf` | Production, Preview, Development |
| `VITE_FIREBASE_MEASUREMENT_ID` | `G-YEC2Y5YRN9` | Production, Preview, Development |
| `VITE_DEMO_MODE` | `false` | Production, Preview, Development |
| `VITE_WHATSAPP_NUMBER` | `9710554995611` | Production, Preview, Development |

**How to add each variable:**
- Click "Add Variable"
- Enter the variable name (e.g., `VITE_FIREBASE_API_KEY`)
- Enter the value
- Check all three environment boxes: Production, Preview, Development
- Click "Save"
- Repeat for all variables

### Step 2: Redeploy Your Application

After adding all environment variables:

1. Go to your project's **Deployments** tab
2. Click the **•••** menu on the latest deployment
3. Select **Redeploy**
4. Wait for the deployment to complete (usually 1-2 minutes)

**Alternative:** Push a new commit to your repository to trigger automatic deployment.

### Step 3: Verify the Deployment

1. Open your deployed URL: `https://mobilegarage-00-gy9pc46xo-saeed-alsuwaidis-projects.vercel.app`
2. Open Browser DevTools (F12) → Console tab
3. Check for errors:
   - ✅ No "invalid-api-key" errors
   - ✅ No blank white screen
   - ✅ App loads successfully
   - ✅ You should see "Firebase initialized successfully" in console

---

## Firebase Console Configuration

After fixing the Vercel deployment, configure Firebase to allow authentication from your domain:

### Add Authorized Domains in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **onae-carwash**
3. Click **Authentication** in the left sidebar
4. Click the **Settings** tab
5. Scroll down to **Authorized domains**
6. Click **Add domain**
7. Add these domains one by one:
   - `mobilegarage-00-gy9pc46xo-saeed-alsuwaidis-projects.vercel.app` (your current deployment)
   - `*.vercel.app` (covers all Vercel preview deployments)
   - Your custom domain (if you have one)

### Enable Phone Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Find **Phone** in the list
3. Click on it and toggle **Enable**
4. Save the changes

### Verify Firebase Billing (Important!)

Phone Authentication may require a **Blaze (Pay-as-you-go)** plan:

1. In Firebase Console, click the gear icon → **Project Settings**
2. Go to the **Usage and billing** tab
3. Check your current plan
4. If needed, upgrade to Blaze plan (you only pay for what you use)

---

## Troubleshooting

### Issue: Still seeing blank screen after adding env vars

**Solution:**
1. Verify all environment variables are saved in Vercel Dashboard
2. Check that you selected all 3 environments (Production, Preview, Development)
3. Trigger a fresh deployment (not just redeploy)
4. Clear your browser cache (Ctrl+Shift+Delete)
5. Try in incognito/private browsing mode

### Issue: Firebase auth errors on production

**Solution:**
1. Verify your Vercel domain is in Firebase authorized domains list
2. Wait 5-10 minutes for Firebase changes to propagate
3. Check Firebase Console → Authentication → Settings

### Issue: CSP (Content Security Policy) violations

**Solution:**
This has been fixed in the code. The CSP headers in `vercel.json` now allow Vercel's live feedback scripts.

### Issue: 401 error on manifest.json

**Solution:**
This should resolve automatically once Firebase initializes correctly. The manifest.json file exists and is properly configured.

---

## Understanding the Fix

### What was wrong?

1. **Environment variables weren't in Vercel**: The `.env` file is gitignored and never reaches Vercel
2. **Firebase crashed without env vars**: When `VITE_FIREBASE_API_KEY` is `undefined`, Firebase throws "invalid-api-key"
3. **No error handling**: The crash happened at module load time, before React could show error messages
4. **Entire app crashed**: A single Firebase error took down the whole application

### What did we fix?

1. **Added error handling in `firebase/config.js`**:
   - Validates environment variables exist
   - Shows helpful error messages in console
   - Prevents cascading failures
   - Creates stub objects if Firebase fails

2. **Updated CSP in `vercel.json`**:
   - Added `https://vercel.live` to allowed script sources
   - Fixes Vercel tooling/feedback widget

3. **Created this deployment guide**:
   - Step-by-step instructions for Vercel environment variables
   - Firebase Console configuration steps
   - Troubleshooting tips

---

## Verification Checklist

After deployment, verify everything works:

- [ ] Vercel deployment completes successfully
- [ ] No blank white screen when visiting deployed URL
- [ ] Browser console shows no Firebase errors
- [ ] Can navigate to different pages (/, /auth, /dashboard)
- [ ] Phone authentication works (can send OTP)
- [ ] Can receive and verify OTP code
- [ ] User login persists across page refreshes
- [ ] No CSP violations in console
- [ ] manifest.json loads without 401 error

---

## Next Steps

### For Production Deployment

1. **Use a custom domain**: Configure a custom domain in Vercel for better branding
2. **Environment-specific configs**: Use different Firebase projects for dev/staging/prod
3. **Monitor errors**: Set up error tracking (Sentry) in production
4. **Performance**: Consider code splitting to reduce the 822KB bundle size

### For Development

1. **Keep demo mode locally**: Set `VITE_DEMO_MODE=true` in local `.env` for faster development
2. **Test Firebase locally**: Set to `false` when testing phone auth
3. **Use environment files**: Create `.env.local` for personal overrides (gitignored)

---

## Important Notes

- **Security**: Firebase API keys are public by design - they're meant to be in client-side code
- **Billing**: Monitor Firebase usage to avoid unexpected charges (free tier is generous)
- **Domains**: Always add new domains to Firebase authorized list before deploying
- **Variables**: Vite only exposes variables prefixed with `VITE_` to the client
- **Build time**: Environment variables are injected at BUILD time, not runtime

---

## Need Help?

If issues persist after following this guide:

1. Check Vercel deployment logs for build errors
2. Check browser console for detailed error messages
3. Verify Firebase project status: https://status.firebase.google.com/
4. Review the updated error messages in `apps/web/src/firebase/config.js`

The new error handling will show exactly which environment variables are missing!
