import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, writeBatch, deleteField } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import logger from '../utils/logger';
import {
  storeSecureSession,
  getSecureSession,
  removeSecureSession,
  isSessionExpired,
  generateSessionId
} from '../utils/secureSession';

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

// Guest session configuration
const GUEST_SESSION_KEY = 'guest_session';
const GUEST_SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// Rate limit cooldown time (2 minutes in milliseconds)
const RATE_LIMIT_COOLDOWN_MS = 2 * 60 * 1000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [guestSessionId, setGuestSessionId] = useState(null);
  const [rateLimitedUntil, setRateLimitedUntil] = useState(null);

  // Check for existing guest session on mount
  useEffect(() => {
    const checkGuestSession = async () => {
      try {
        const session = await getSecureSession(GUEST_SESSION_KEY);

        if (session && !isSessionExpired(session) && session.sessionId) {
          setIsGuest(true);
          setGuestSessionId(session.sessionId);
        } else if (session) {
          // Expired or invalid session - clean up
          removeSecureSession(GUEST_SESSION_KEY);
        }
      } catch (error) {
        logger.error('Error checking guest session', error);
        removeSecureSession(GUEST_SESSION_KEY);
      }
    };

    checkGuestSession();
  }, []);

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
        // Clear guest mode when authenticated
        if (isGuest) {
          setIsGuest(false);
          setGuestSessionId(null);
          removeSecureSession(GUEST_SESSION_KEY);
        }
        // Fetch user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        } catch (error) {
          logger.error('Error fetching user data', error);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [isGuest]);

  // Demo login - bypass Firebase auth
  const demoLogin = () => {
    setUser(DEMO_USER);
    setUserData(DEMO_USER_DATA);
    return { success: true };
  };

  // Guest mode - allows browsing and booking without auth (expires after 24 hours)
  // Now uses signed sessions to prevent self-elevation
  const enterGuestMode = async () => {
    const sessionId = generateSessionId();
    const expiry = Date.now() + GUEST_SESSION_EXPIRY_MS;

    await storeSecureSession(GUEST_SESSION_KEY, {
      sessionId,
      expiry,
      createdAt: Date.now()
    });

    setIsGuest(true);
    setGuestSessionId(sessionId);
    return { success: true, sessionId };
  };

  const exitGuestMode = () => {
    setIsGuest(false);
    setGuestSessionId(null);
    removeSecureSession(GUEST_SESSION_KEY);
  };

  // Validate current guest session (can be called from protected routes)
  const validateGuestSession = async () => {
    if (!isGuest) return { valid: false, reason: 'not_guest' };

    try {
      const session = await getSecureSession(GUEST_SESSION_KEY);

      if (!session) {
        setIsGuest(false);
        setGuestSessionId(null);
        return { valid: false, reason: 'no_session' };
      }

      if (isSessionExpired(session)) {
        setIsGuest(false);
        setGuestSessionId(null);
        removeSecureSession(GUEST_SESSION_KEY);
        return { valid: false, reason: 'expired' };
      }

      // Verify session ID matches
      if (session.sessionId !== guestSessionId) {
        setIsGuest(false);
        setGuestSessionId(null);
        removeSecureSession(GUEST_SESSION_KEY);
        return { valid: false, reason: 'session_mismatch' };
      }

      return { valid: true };
    } catch (error) {
      logger.error('Error validating guest session', error);
      setIsGuest(false);
      setGuestSessionId(null);
      return { valid: false, reason: 'error' };
    }
  };

  // Get the current guest session ID for booking attribution
  const getGuestSessionId = () => {
    return guestSessionId;
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

  // Check remaining rate limit cooldown time
  const getRateLimitRemaining = () => {
    if (!rateLimitedUntil) return 0;
    const remaining = rateLimitedUntil - Date.now();
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  };

  // Send OTP to phone number
  const sendOTP = async (phoneNumber, elementId = 'recaptcha-container') => {
    // Check if currently rate limited
    const remainingSeconds = getRateLimitRemaining();
    if (remainingSeconds > 0) {
      return {
        success: false,
        error: `Too many attempts. Please wait ${remainingSeconds} seconds.`,
        rateLimitRemaining: remainingSeconds
      };
    }

    try {
      const recaptchaVerifier = setupRecaptcha(elementId);
      const result = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      setConfirmationResult(result);
      // Clear any previous rate limit on success
      setRateLimitedUntil(null);
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
      let rateLimitRemaining = null;

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
        // Set rate limit cooldown
        const cooldownUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS;
        setRateLimitedUntil(cooldownUntil);
        rateLimitRemaining = Math.ceil(RATE_LIMIT_COOLDOWN_MS / 1000);
        errorMessage = `Too many attempts. Please wait ${rateLimitRemaining} seconds before trying again.`;
      }

      return { success: false, error: errorMessage, rateLimitRemaining };
    }
  };

  // Migrate guest bookings to authenticated user
  const migrateGuestBookings = async (userId, phoneNumber) => {
    if (!phoneNumber || !userId) return 0;

    try {
      const bookingsRef = collection(db, 'bookings');
      // Query for guest bookings with matching phone number
      const guestQuery = query(
        bookingsRef,
        where('userId', '==', 'guest'),
        where('guestPhone', '==', phoneNumber)
      );

      const snapshot = await getDocs(guestQuery);

      if (snapshot.empty) {
        logger.info('No guest bookings found to migrate', { phoneNumber });
        return 0;
      }

      // Batch update all matching bookings
      const batch = writeBatch(db);
      snapshot.docs.forEach((docSnapshot) => {
        batch.update(docSnapshot.ref, {
          userId: userId,
          guestPhone: deleteField(), // Remove guestPhone field to mark as migrated
          migratedAt: serverTimestamp()
        });
      });

      await batch.commit();
      logger.info('Guest bookings migrated successfully', {
        phoneNumber,
        userId,
        count: snapshot.size
      });

      return snapshot.size;
    } catch (error) {
      logger.error('Error migrating guest bookings', error, { phoneNumber, userId });
      // Non-critical error - don't fail the login
      return 0;
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
        setGuestSessionId(null);
        removeSecureSession(GUEST_SESSION_KEY);
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

      // Migrate any guest bookings made with this phone number
      const migratedCount = await migrateGuestBookings(firebaseUser.uid, firebaseUser.phoneNumber);
      if (migratedCount > 0) {
        logger.info(`Migrated ${migratedCount} guest booking(s) to user account`, {
          uid: firebaseUser.uid
        });
      }

      // NOW set user state - after all critical Firestore operations succeeded
      // This prevents inconsistent state where user is authenticated but has no profile
      setUser(firebaseUser);
      setUserData(finalUserData);
      setConfirmationResult(null);

      return { success: true, isNewUser, migratedBookings: migratedCount };
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
    exitGuestMode,
    validateGuestSession,
    getGuestSessionId,
    getRateLimitRemaining
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
