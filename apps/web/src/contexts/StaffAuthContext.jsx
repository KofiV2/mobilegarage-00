import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { signInWithEmailAndPassword, signOut, getIdTokenResult } from 'firebase/auth';
import { auth } from '../firebase/config';
import {
  storeSecureSession,
  getSecureSession,
  removeSecureSession,
  isSessionExpired,
  generateSessionId
} from '../utils/secureSession';

const StaffAuthContext = createContext();

const SESSION_KEY = 'staff_session';
const SESSION_EXPIRY_HOURS = 8;

// Rate limiting for login attempts
const LOGIN_ATTEMPTS_KEY = 'staff_login_attempts';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export const useStaffAuth = () => {
  const context = useContext(StaffAuthContext);
  if (!context) {
    throw new Error('useStaffAuth must be used within a StaffAuthProvider');
  }
  return context;
};

export const StaffAuthProvider = ({ children }) => {
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await getSecureSession(SESSION_KEY);

        if (session && !isSessionExpired(session)) {
          if (session.staff && session.sessionId) {
            setStaff(session.staff);
          } else {
            removeSecureSession(SESSION_KEY);
          }
        } else if (session) {
          removeSecureSession(SESSION_KEY);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        removeSecureSession(SESSION_KEY);
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  // Get login attempts from storage
  const getLoginAttempts = useCallback(() => {
    try {
      const data = sessionStorage.getItem(LOGIN_ATTEMPTS_KEY);
      if (!data) return { count: 0, lastAttempt: 0, lockedUntil: 0 };
      return JSON.parse(data);
    } catch {
      return { count: 0, lastAttempt: 0, lockedUntil: 0 };
    }
  }, []);

  // Update login attempts
  const updateLoginAttempts = useCallback((success) => {
    const attempts = getLoginAttempts();

    if (success) {
      sessionStorage.removeItem(LOGIN_ATTEMPTS_KEY);
      return;
    }

    const now = Date.now();
    const newCount = attempts.count + 1;

    const newAttempts = {
      count: newCount,
      lastAttempt: now,
      lockedUntil: newCount >= MAX_LOGIN_ATTEMPTS ? now + LOCKOUT_DURATION_MS : 0
    };

    sessionStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(newAttempts));
  }, [getLoginAttempts]);

  // Check if login is locked out
  const isLockedOut = useCallback(() => {
    const attempts = getLoginAttempts();
    if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
      const remainingSeconds = Math.ceil((attempts.lockedUntil - Date.now()) / 1000);
      return { locked: true, remainingSeconds };
    }
    if (attempts.lockedUntil && Date.now() >= attempts.lockedUntil) {
      sessionStorage.removeItem(LOGIN_ATTEMPTS_KEY);
    }
    return { locked: false, remainingSeconds: 0 };
  }, [getLoginAttempts]);

  const staffLogin = async (email, password) => {
    setLoginError(null);

    // Check for lockout
    const lockout = isLockedOut();
    if (lockout.locked) {
      const error = `Too many failed attempts. Please wait ${lockout.remainingSeconds} seconds.`;
      setLoginError(error);
      return { success: false, error, lockedOut: true, remainingSeconds: lockout.remainingSeconds };
    }

    const normalizedEmail = email.toLowerCase().trim();

    try {
      // Authenticate via Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      const user = userCredential.user;

      // Check custom claims for staff role
      const tokenResult = await getIdTokenResult(user);
      if (tokenResult.claims.role !== 'staff') {
        // Not staff — sign out and reject
        await signOut(auth);
        updateLoginAttempts(false);
        const error = 'Invalid email or password';
        setLoginError(error);
        return { success: false, error };
      }

      // Successful login
      updateLoginAttempts(true);

      // Extract staff name from email (e.g., car1@3on.ae -> Vehicle 1)
      const emailPrefix = normalizedEmail.split('@')[0];
      const staffNumber = emailPrefix.replace(/\D/g, '') || '1';
      const staffName = `Vehicle ${staffNumber}`;

      const staffData = {
        email: user.email,
        name: staffName,
        uid: user.uid,
        loginTime: new Date().toISOString()
      };

      // Calculate expiry time
      const expiry = Date.now() + (SESSION_EXPIRY_HOURS * 60 * 60 * 1000);
      const sessionId = generateSessionId();

      // Store signed session
      await storeSecureSession(SESSION_KEY, {
        staff: staffData,
        sessionId,
        expiry
      });

      setStaff(staffData);

      // Keep Firebase Auth session alive for callable functions
      // (Do NOT sign out — needed for httpsCallable auth context)

      return { success: true };
    } catch (error) {
      updateLoginAttempts(false);

      let errorMessage = 'Invalid email or password';
      if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection.';
      }

      setLoginError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const staffLogout = async () => {
    removeSecureSession(SESSION_KEY);
    setStaff(null);
    setLoginError(null);
    // Sign out of Firebase Auth
    try {
      await signOut(auth);
    } catch {
      // Ignore sign-out errors
    }
  };

  // Periodically verify session integrity
  useEffect(() => {
    if (!staff) return;

    const verifySession = async () => {
      const session = await getSecureSession(SESSION_KEY);
      if (!session || isSessionExpired(session)) {
        setStaff(null);
        removeSecureSession(SESSION_KEY);
      }
    };

    const interval = setInterval(verifySession, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [staff]);

  const value = {
    staff,
    loading,
    loginError,
    isStaffAuthenticated: !!staff,
    staffLogin,
    staffLogout,
    isLockedOut
  };

  return (
    <StaffAuthContext.Provider value={value}>
      {children}
    </StaffAuthContext.Provider>
  );
};

export default StaffAuthContext;
