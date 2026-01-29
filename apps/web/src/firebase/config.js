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
 * Note: Consider moving these credentials to environment variables (.env file)
 * for better security and flexibility across environments.
 */
const firebaseConfig = {
  apiKey: "AIzaSyCDjRmT1TDSDzjQt0mTJCTEfeC7fT5QI2w",
  authDomain: "onae-carwash.firebaseapp.com",
  projectId: "onae-carwash",
  storageBucket: "onae-carwash.firebasestorage.app",
  messagingSenderId: "998539218062",
  appId: "1:998539218062:web:13b6ab024d764e54a50ddf",
  measurementId: "G-YEC2Y5YRN9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
