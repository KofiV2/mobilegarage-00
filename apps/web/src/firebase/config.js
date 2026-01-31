import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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
 *    - Any staging/preview domains
 *
 * Without this configuration, you'll see the error:
 * "Firebase: Hostname match not found (auth/captcha-check-failed)"
 *
 * Configuration is now loaded from environment variables (.env file)
 * for better security and flexibility across environments.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
