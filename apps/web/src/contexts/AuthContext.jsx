import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmationResult, setConfirmationResult] = useState(null);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Fetch user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Setup reCAPTCHA verifier
  const setupRecaptcha = (elementId) => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
          // Reset reCAPTCHA
          window.recaptchaVerifier = null;
        }
      });
    }
    return window.recaptchaVerifier;
  };

  // Send OTP to phone number
  const sendOTP = async (phoneNumber, elementId = 'recaptcha-container') => {
    try {
      const recaptchaVerifier = setupRecaptcha(elementId);
      const result = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      setConfirmationResult(result);
      return { success: true };
    } catch (error) {
      console.error('Error sending OTP:', error);
      // Reset recaptcha on error
      window.recaptchaVerifier = null;
      return { success: false, error: error.message };
    }
  };

  // Verify OTP code
  const verifyOTP = async (code) => {
    if (!confirmationResult) {
      return { success: false, error: 'No confirmation result' };
    }

    try {
      const result = await confirmationResult.confirm(code);
      const firebaseUser = result.user;

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

      if (!userDoc.exists()) {
        // Create new user document
        const newUserData = {
          phone: firebaseUser.phoneNumber,
          name: '',
          email: '',
          emailVerified: false,
          language: 'en',
          theme: 'light',
          createdAt: serverTimestamp()
        };
        await setDoc(doc(db, 'users', firebaseUser.uid), newUserData);
        setUserData(newUserData);

        // Initialize loyalty
        await setDoc(doc(db, 'loyalty', firebaseUser.uid), {
          washCount: 0,
          freeWashAvailable: false,
          lastUpdated: serverTimestamp()
        });
      } else {
        setUserData(userDoc.data());
      }

      setConfirmationResult(null);
      return { success: true, isNewUser: !userDoc.exists() };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return { success: false, error: error.message };
    }
  };

  // Update user profile
  const updateUserProfile = async (data) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      await setDoc(doc(db, 'users', user.uid), data, { merge: true });
      setUserData(prev => ({ ...prev, ...data }));
      return { success: true };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserData(null);
      return { success: true };
    } catch (error) {
      console.error('Error logging out:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    userData,
    loading,
    sendOTP,
    verifyOTP,
    updateUserProfile,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
