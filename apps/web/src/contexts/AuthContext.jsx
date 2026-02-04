import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import logger from '../utils/logger';

const AuthContext = createContext();

// Demo mode flag - only enabled in development AND when explicitly set
// This prevents demo mode from accidentally being enabled in production
const isDevelopment = import.meta.env.MODE === 'development';
const DEMO_MODE = isDevelopment && import.meta.env.VITE_DEMO_MODE === 'true';

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

// Guest session expiry time (24 hours in milliseconds)
const GUEST_SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000;

// Check if guest session is still valid
const isGuestSessionValid = () => {
  const guestData = localStorage.getItem('guestMode');
  if (!guestData) return false;

  try {
    const { expiry } = JSON.parse(guestData);
    if (expiry && Date.now() < expiry) {
      return true;
    }
    // Session expired, clean up
    localStorage.removeItem('guestMode');
    return false;
  } catch {
    // Legacy format (just 'true') - migrate or expire
    localStorage.removeItem('guestMode');
    return false;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [isGuest, setIsGuest] = useState(() => {
    // Check if guest session is valid (not expired)
    return isGuestSessionValid();
  });

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

  // Guest mode - allows browsing and booking without auth (expires after 24 hours)
  const enterGuestMode = () => {
    const guestSession = {
      active: true,
      expiry: Date.now() + GUEST_SESSION_EXPIRY_MS
    };
    setIsGuest(true);
    localStorage.setItem('guestMode', JSON.stringify(guestSession));
    return { success: true };
  };

  const exitGuestMode = () => {
    setIsGuest(false);
    localStorage.removeItem('guestMode');
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
      logger.error('Error sending OTP', error, { phoneNumber });

      // Clean up reCAPTCHA verifier on error
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (clearError) {
          logger.warn('Error clearing reCAPTCHA', { error: clearError });
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
        logger.error('CAPTCHA ERROR: Current hostname may not be authorized in Firebase Console');
        logger.info('To fix: Add your domain to Firebase Console > Authentication > Settings > Authorized domains');
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
        logger.error('Invalid Firebase user object received', null, { firebaseUser });
        return { success: false, error: 'Invalid user data received' };
      }

      // Clear guest mode if user was browsing as guest
      if (isGuest) {
        setIsGuest(false);
        localStorage.removeItem('guestMode');
      }

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

      let isNewUser = false;
      let finalUserData = null;

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

        // Create user document - this MUST succeed for new users
        await setDoc(doc(db, 'users', firebaseUser.uid), newUserData);
        finalUserData = newUserData;
        logger.info('New user document created successfully', { uid: firebaseUser.uid });

        // Initialize loyalty document (non-critical)
        try {
          await setDoc(doc(db, 'loyalty', firebaseUser.uid), {
            washCount: 0,
            freeWashAvailable: false,
            lastUpdated: serverTimestamp()
          });
          logger.info('Loyalty document initialized successfully', { uid: firebaseUser.uid });
        } catch (loyaltyError) {
          logger.error('Error initializing loyalty document', loyaltyError, { uid: firebaseUser.uid });
          // Non-critical error, user can still proceed
        }
      } else {
        // Existing user - fetch their data
        finalUserData = userDoc.data();
        logger.info('Existing user data loaded successfully', { uid: firebaseUser.uid });
      }

      // NOW set user state - after all critical Firestore operations succeeded
      // This prevents inconsistent state where user is authenticated but has no profile
      setUser(firebaseUser);
      setUserData(finalUserData);
      setConfirmationResult(null);

      return { success: true, isNewUser };
    } catch (error) {
      logger.error('Error verifying OTP', error, { code });
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
      logger.error('Error updating profile', error, { uid: user.uid, data });
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
      logger.error('Error logging out', error);
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
    isDemoMode: DEMO_MODE,
    isGuest,
    enterGuestMode,
    exitGuestMode
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
