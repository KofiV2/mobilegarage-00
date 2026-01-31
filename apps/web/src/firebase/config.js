import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import logger from '../utils/logger';

/**
 * Firebase Configuration
 *
 * IMPORTANT: For Phone Authentication to work properly, you MUST add your domain
 * to the authorized domains list in Firebase Console:
 *
 * 1. Go to: https://console.firebase.google.com/
 * 2. Select project: onae-carwash
 * 3. Navigate to: Authentication > Settings > Authorized domains
 * 4. Add the following domains:
 *    - localhost (for local development)
 *    - Your production domain (e.g., your-app.com)
 *    - Any staging/preview domains (e.g., *.vercel.app)
 *
 * Without this configuration, you'll see the error:
 * "Firebase: Hostname match not found (auth/captcha-check-failed)"
 *
 * Configuration is now loaded from environment variables (.env file)
 * for better security and flexibility across environments.
 *
 * DEPLOYMENT NOTE (Vercel/Netlify):
 * Environment variables must be configured in your deployment platform's dashboard:
 * - Vercel: Project Settings → Environment Variables
 * - Add all VITE_FIREBASE_* variables
 * - Apply to Production, Preview, and Development environments
 */

// Validate environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Check for missing environment variables
const missingVars = Object.entries(firebaseConfig)
  .filter(([key, value]) => !value)
  .map(([key]) => `VITE_FIREBASE_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`);

if (missingVars.length > 0) {
  const errorMsg = [
    '❌ Firebase Configuration Error: Missing environment variables',
    '',
    'Missing variables:',
    ...missingVars.map(v => `  - ${v}`),
    '',
    'To fix this:',
    '1. For local development: Check your apps/web/.env file',
    '2. For Vercel deployment: Add these in Project Settings → Environment Variables',
    '3. For other platforms: Add these to your deployment environment configuration',
    '',
    'See apps/web/.env.example for required variables'
  ].join('\n');

  console.error(errorMsg);
  logger.error('Firebase initialization failed: Missing environment variables', { missingVars });
}

// Initialize Firebase with error handling
let app;
let auth;
let db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  logger.info('Firebase initialized successfully');
} catch (error) {
  logger.error('Firebase initialization error', error);
  console.error('❌ Firebase failed to initialize:', error.message);
  console.error('This usually means environment variables are missing or invalid.');
  console.error('Check the error details above for guidance.');

  // Create stub objects to prevent cascading failures
  // The app will still work in demo mode
  app = null;
  auth = null;
  db = null;
}

export { auth, db };
export default app;

// Enable offline persistence
// This allows the app to work offline and cache data locally
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab at a time
    logger.warn('Firestore persistence failed: Multiple tabs open', { code: err.code });
  } else if (err.code === 'unimplemented') {
    // The current browser doesn't support persistence
    logger.warn('Firestore persistence not supported by browser', { code: err.code });
  } else {
    logger.error('Error enabling Firestore persistence', err);
  }
});

export default app;
