import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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
