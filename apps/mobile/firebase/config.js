import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Firebase Configuration for React Native
 *
 * Uses the same Firebase project as the web app (onae-carwash)
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

// Initialize Auth with React Native persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Storage
export const storage = getStorage(app);

export default app;
