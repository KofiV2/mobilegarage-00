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

// Demo mode flag - set to true to bypass Firebase auth
const DEMO_MODE = true;

// Demo user data for testing
const DEMO_USER = {
  uid: 'demo-user-123',
  phoneNumber: '+971501234567',
  displayName: 'Demo User'
};

const DEMO_USER_DATA = {
  phone: '+971501234567',
  name: 'Ahmed',
  email: 'demo@3on.ae',
  emailVerified: false,
  language: 'en',
  theme: 'light',
  createdAt: new Date()
};

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
    // In demo mode, skip Firebase auth listener
    if (DEMO_MODE) {
      setLoading(false);
      return;
    }

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

  // Demo login - bypass Firebase auth
  const demoLogin = () => {
    setUser(DEMO_USER);
    setUserData(DEMO_USER_DATA);
    return { success: true };
  };

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

      // Clean up reCAPTCHA verifier on error
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (clearError) {
          console.warn('Error clearing reCAPTCHA:', clearError);
        }
        window.recaptchaVerifier = null;
      }

      // Provide user-friendly error messages
      let errorMessage = error.message;

      if (error.code === 'auth/captcha-check-failed') {
        errorMessage = 'reCAPTCHA verification failed. This may be due to:\n' +
                      '1. Your domain not being authorized in Firebase Console\n' +
                      '2. Network connectivity issues\n' +
                      '3. Browser blocking reCAPTCHA\n\n' +
                      'Please check your Firebase Console authorized domains or try again.';
        console.error('CAPTCHA ERROR: Current hostname may not be authorized in Firebase Console.');
        console.error('To fix: Add your domain to Firebase Console > Authentication > Settings > Authorized domains');
      } else if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format. Please include country code (e.g., +971501234567)';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Please try again later.';
      }

      return { success: false, error: errorMessage };
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

      // Validate Firebase user object
      if (!firebaseUser || !firebaseUser.uid) {
        console.error('Invalid Firebase user object received');
        return { success: false, error: 'Invalid user data received' };
      }

      // Set the authenticated user immediately
      // This makes isAuthenticated = true and prevents redirect loops
      setUser(firebaseUser);

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

      let isNewUser = false;

      if (!userDoc.exists()) {
        isNewUser = true;

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

        try {
          await setDoc(doc(db, 'users', firebaseUser.uid), newUserData);
          setUserData(newUserData);
          console.log('New user document created successfully');
        } catch (firestoreError) {
          console.error('Error creating user document:', firestoreError);
          // User is still authenticated even if Firestore fails
          // They can complete their profile later
          setUserData(newUserData);
        }

        // Initialize loyalty document
        try {
          await setDoc(doc(db, 'loyalty', firebaseUser.uid), {
            washCount: 0,
            freeWashAvailable: false,
            lastUpdated: serverTimestamp()
          });
          console.log('Loyalty document initialized successfully');
        } catch (loyaltyError) {
          console.error('Error initializing loyalty document:', loyaltyError);
          // Non-critical error, user can still proceed
        }
      } else {
        // Existing user - fetch their data
        try {
          const existingUserData = userDoc.data();
          setUserData(existingUserData);
          console.log('Existing user data loaded successfully');
        } catch (fetchError) {
          console.error('Error loading user data:', fetchError);
          // Set minimal user data to allow login
          setUserData({
            phone: firebaseUser.phoneNumber,
            name: '',
            email: '',
            emailVerified: false,
            language: 'en',
            theme: 'light'
          });
        }
      }

      setConfirmationResult(null);
      return { success: true, isNewUser };
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
    // In demo mode, just clear state
    if (DEMO_MODE) {
      setUser(null);
      setUserData(null);
      return { success: true };
    }

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
    demoLogin,
    isAuthenticated: !!user,
    isDemoMode: DEMO_MODE
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
