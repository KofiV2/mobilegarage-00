import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  hashPassword,
  verifyPassword,
  storeSecureSession,
  getSecureSession,
  removeSecureSession,
  isSessionExpired,
  generateSessionId
} from '../utils/secureSession';

const ManagerAuthContext = createContext();

// Manager credentials - MUST be set via environment variables
// Set VITE_MANAGER_EMAIL and VITE_MANAGER_PASSWORD_HASH in your .env file
// Use hashPassword(password, email) to generate the hash
const getManagerCredentials = () => {
  const email = import.meta.env.VITE_MANAGER_EMAIL;
  const passwordHash = import.meta.env.VITE_MANAGER_PASSWORD_HASH;
  // Support legacy plaintext password during migration
  const legacyPassword = import.meta.env.VITE_MANAGER_PASSWORD;

  if (!email) {
    console.warn('VITE_MANAGER_EMAIL not configured. Manager login will be unavailable.');
    return null;
  }

  if (!passwordHash && !legacyPassword) {
    console.warn('VITE_MANAGER_PASSWORD_HASH not configured. Manager login will be unavailable.');
    return null;
  }

  if (legacyPassword && !passwordHash) {
    console.warn('Using legacy plaintext VITE_MANAGER_PASSWORD. Please migrate to VITE_MANAGER_PASSWORD_HASH.');
  }

  return { email, passwordHash, legacyPassword };
};

const MANAGER_CREDENTIALS = getManagerCredentials();

const SESSION_KEY = 'manager_session';
const SESSION_EXPIRY_HOURS = 8; // Reduced from 24 to 8 hours for security

// Rate limiting for login attempts
const LOGIN_ATTEMPTS_KEY = 'manager_login_attempts';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes for manager (longer than staff)

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
          // Verify session integrity
          if (session.manager && session.sessionId) {
            setManager(session.manager);
          } else {
            // Invalid session structure - remove it
            removeSecureSession(SESSION_KEY);
          }
        } else if (session) {
          // Expired session - clean up
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
      const data = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
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
      // Clear attempts on successful login
      localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
      return;
    }

    // Failed attempt
    const now = Date.now();
    const newCount = attempts.count + 1;

    const newAttempts = {
      count: newCount,
      lastAttempt: now,
      lockedUntil: newCount >= MAX_LOGIN_ATTEMPTS ? now + LOCKOUT_DURATION_MS : 0
    };

    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(newAttempts));
  }, [getLoginAttempts]);

  // Check if login is locked out
  const isLockedOut = useCallback(() => {
    const attempts = getLoginAttempts();
    if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
      const remainingSeconds = Math.ceil((attempts.lockedUntil - Date.now()) / 1000);
      return { locked: true, remainingSeconds };
    }
    // Reset attempts if lockout expired
    if (attempts.lockedUntil && Date.now() >= attempts.lockedUntil) {
      localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
    }
    return { locked: false, remainingSeconds: 0 };
  }, [getLoginAttempts]);

  const managerLogin = async (email, password) => {
    setLoginError(null);

    // Check if credentials are configured
    if (!MANAGER_CREDENTIALS) {
      const error = 'Manager login not configured';
      setLoginError(error);
      return { success: false, error };
    }

    // Check for lockout
    const lockout = isLockedOut();
    if (lockout.locked) {
      const error = `Too many failed attempts. Please wait ${Math.ceil(lockout.remainingSeconds / 60)} minutes.`;
      setLoginError(error);
      return { success: false, error, lockedOut: true, remainingSeconds: lockout.remainingSeconds };
    }

    // Verify email first
    if (email.toLowerCase() !== MANAGER_CREDENTIALS.email.toLowerCase()) {
      updateLoginAttempts(false);
      const error = 'Invalid email or password';
      setLoginError(error);
      return { success: false, error };
    }

    // Verify password
    let passwordValid = false;

    if (MANAGER_CREDENTIALS.passwordHash) {
      // New secure format - verify against hash
      passwordValid = await verifyPassword(
        password,
        MANAGER_CREDENTIALS.email.toLowerCase(),
        MANAGER_CREDENTIALS.passwordHash
      );
    } else if (MANAGER_CREDENTIALS.legacyPassword) {
      // Legacy plaintext format - compare directly
      console.warn('Manager using plaintext password. Please migrate to hashed password.');
      passwordValid = password === MANAGER_CREDENTIALS.legacyPassword;
    }

    if (!passwordValid) {
      updateLoginAttempts(false);
      const error = 'Invalid email or password';
      setLoginError(error);
      return { success: false, error };
    }

    // Successful login
    updateLoginAttempts(true);

    const managerData = {
      email,
      name: 'Manager',
      loginTime: new Date().toISOString()
    };

    // Calculate expiry time
    const expiry = Date.now() + (SESSION_EXPIRY_HOURS * 60 * 60 * 1000);

    // Generate unique session ID for this login
    const sessionId = generateSessionId();

    // Store signed session
    await storeSecureSession(SESSION_KEY, {
      manager: managerData,
      sessionId,
      expiry
    });

    setManager(managerData);
    return { success: true };
  };

  const managerLogout = () => {
    removeSecureSession(SESSION_KEY);
    setManager(null);
    setLoginError(null);
  };

  // Periodically verify session integrity
  useEffect(() => {
    if (!manager) return;

    const verifySession = async () => {
      const session = await getSecureSession(SESSION_KEY);
      if (!session || isSessionExpired(session)) {
        // Session invalid or expired - logout
        setManager(null);
        removeSecureSession(SESSION_KEY);
      }
    };

    // Check every 5 minutes
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
