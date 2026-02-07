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

const ManagerAuthContext = createContext();

const SESSION_KEY = 'manager_session';
const SESSION_EXPIRY_HOURS = 2;

// Rate limiting for login attempts
const LOGIN_ATTEMPTS_KEY = 'manager_login_attempts';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export const useManagerAuth = () => {
  const context = useContext(ManagerAuthContext);
  if (!context) {
    throw new Error('useManagerAuth must be used within a ManagerAuthProvider');
  }
  return context;
};

export const ManagerAuthProvider = ({ children }) => {
  const [manager, setManager] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await getSecureSession(SESSION_KEY);

        if (session && !isSessionExpired(session)) {
          if (session.manager && session.sessionId) {
            setManager(session.manager);
          } else {
            removeSecureSession(SESSION_KEY);
          }
        } else if (session) {
          removeSecureSession(SESSION_KEY);
        }
      } catch (error) {
        console.error('Error checking manager session:', error);
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

  const managerLogin = async (email, password) => {
    setLoginError(null);

    // Check for lockout
    const lockout = isLockedOut();
    if (lockout.locked) {
      const error = `Too many failed attempts. Please wait ${Math.ceil(lockout.remainingSeconds / 60)} minutes.`;
      setLoginError(error);
      return { success: false, error, lockedOut: true, remainingSeconds: lockout.remainingSeconds };
    }

    const normalizedEmail = email.toLowerCase().trim();

    try {
      // Authenticate via Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      const user = userCredential.user;

      // Check custom claims for manager role
      const tokenResult = await getIdTokenResult(user);
      if (tokenResult.claims.role !== 'manager') {
        // Not a manager — sign out and reject
        await signOut(auth);
        updateLoginAttempts(false);
        const error = 'Invalid email or password';
        setLoginError(error);
        return { success: false, error };
      }

      // Successful manager login
      updateLoginAttempts(true);

      const managerData = {
        email: user.email,
        name: 'Manager',
        uid: user.uid,
        loginTime: new Date().toISOString()
      };

      // Calculate expiry time
      const expiry = Date.now() + (SESSION_EXPIRY_HOURS * 60 * 60 * 1000);
      const sessionId = generateSessionId();

      // Store signed session
      await storeSecureSession(SESSION_KEY, {
        manager: managerData,
        sessionId,
        expiry
      });

      setManager(managerData);

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

  const managerLogout = async () => {
    removeSecureSession(SESSION_KEY);
    setManager(null);
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
    if (!manager) return;

    const verifySession = async () => {
      const session = await getSecureSession(SESSION_KEY);
      if (!session || isSessionExpired(session)) {
        setManager(null);
        removeSecureSession(SESSION_KEY);
      }
    };

    const interval = setInterval(verifySession, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [manager]);

  const value = {
    manager,
    loading,
    loginError,
    isManagerAuthenticated: !!manager,
    managerLogin,
    managerLogout,
    isLockedOut
  };

  return (
    <ManagerAuthContext.Provider value={value}>
      {children}
    </ManagerAuthContext.Provider>
  );
};

export default ManagerAuthContext;
