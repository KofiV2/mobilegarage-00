# Firebase Phone Authentication Setup Guide

## Problem: "Hostname match not found (auth/captcha-check-failed)"

This error occurs when the domain/hostname you're using is not authorized in Firebase Console. Firebase requires explicit authorization of domains that can use Phone Authentication with reCAPTCHA.

## Quick Fix Steps

### 1. Access Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Sign in with your Google account
3. Select the project: **onae-carwash**

### 2. Navigate to Authorized Domains
1. In the left sidebar, click **Authentication**
2. Click the **Settings** tab at the top
3. Scroll down to **Authorized domains** section

### 3. Add Your Domains

Add the following domains based on your environment:

#### For Local Development:
- `localhost` (should be auto-included, but verify it's there)
- If using IP address: add your IP (e.g., `192.168.1.100`)

#### For Production:
- Your production domain (e.g., `your-app.com`)
- Include both www and non-www versions if applicable:
  - `your-app.com`
  - `www.your-app.com`

#### For Staging/Preview Deployments:
If using platforms like Vercel, Netlify, or similar:
- Add your preview domain pattern
- Example for Vercel: `your-app-*.vercel.app`
- Example for Netlify: `your-app-*.netlify.app`

### 4. Save and Wait
1. Click **Add domain** for each entry
2. Wait 5-10 minutes for changes to propagate through Firebase's systems
3. Clear your browser cache if needed

## Verification

After adding domains, test the phone authentication:

1. Open your web application
2. Navigate to the login/auth page
3. Enter a phone number with country code (e.g., +971501234567)
4. Click "Send OTP"
5. Check if OTP is sent successfully without captcha errors

## Common Issues and Solutions

### Issue 1: Still getting captcha error after adding domain
**Solution:**
- Wait 10 more minutes (Firebase changes can take time to propagate)
- Clear browser cache and cookies
- Hard refresh the page (Ctrl + Shift + R or Cmd + Shift + R)
- Verify the domain in Firebase Console exactly matches what you see in browser URL

### Issue 2: Error persists on localhost
**Solution:**
- Ensure `localhost` (not `127.0.0.1`) is in authorized domains
- Try adding `127.0.0.1` as well if using that in browser
- Check if you're using a non-standard port and add it: `localhost:5173`

### Issue 3: Works on localhost but not on deployed domain
**Solution:**
- Add your exact deployed domain to authorized domains
- Check for www prefix issues
- For preview deployments, add the base pattern (e.g., `*.vercel.app`)

### Issue 4: Browser blocks reCAPTCHA
**Solution:**
- Disable ad blockers or browser extensions that might block Google services
- Check browser console for additional error messages
- Try a different browser or incognito mode

## Testing After Fix

### 1. Check Browser Console
Open Developer Tools (F12) and check the Console tab for:
- No reCAPTCHA errors
- Successful phone auth initialization logs
- Any network errors

### 2. Network Tab
In Developer Tools > Network tab:
- Look for calls to `identitytoolkit.googleapis.com`
- Verify they return 200 status codes
- Check response for error messages

### 3. Test Multiple Scenarios
- Different phone numbers
- Different browsers
- Different devices on your network
- Production vs. development environments

## Additional Configuration (Optional)

### Enable Phone Authentication in Firebase
If phone auth isn't enabled yet:
1. Go to **Authentication** > **Sign-in method**
2. Click on **Phone** provider
3. Click **Enable** toggle
4. Save changes

### Set Up reCAPTCHA v3 (Optional)
For better user experience:
1. Go to **Authentication** > **Settings**
2. Find **reCAPTCHA enforcement**
3. Configure reCAPTCHA v3 for invisible verification

### Security Rules
Ensure your Firebase Security Rules are properly configured:
1. Go to **Firestore Database** > **Rules**
2. Verify authentication is required for protected operations
3. Test rules don't block legitimate authenticated requests

## Environment Variables (Future Improvement)

Currently, Firebase configuration is hardcoded in `src/firebase/config.js`. For better security:

1. Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

2. Uncomment and fill Firebase variables in `.env`:
   ```
   VITE_FIREBASE_API_KEY=your_actual_api_key
   VITE_FIREBASE_AUTH_DOMAIN=onae-carwash.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=onae-carwash
   # ... etc
   ```

3. Update `src/firebase/config.js` to read from environment variables:
   ```javascript
   const firebaseConfig = {
     apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
     authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
     // ... etc
   };
   ```

## Support

If you continue experiencing issues:

1. Check Firebase status: https://status.firebase.google.com/
2. Review Firebase Auth documentation: https://firebase.google.com/docs/auth/web/phone-auth
3. Check the browser console for detailed error messages
4. Verify your Firebase project billing status (Phone Auth may require Blaze plan)

## Demo Mode Note

The application currently has `DEMO_MODE = true` in `AuthContext.jsx`. When demo mode is enabled, Firebase authentication is bypassed entirely. To test Firebase fixes:

1. Open `apps/web/src/contexts/AuthContext.jsx`
2. Find line 14: `const DEMO_MODE = true;`
3. Change to: `const DEMO_MODE = false;`
4. Save and restart development server

Remember to set it back to `true` if you want to use demo mode again.
