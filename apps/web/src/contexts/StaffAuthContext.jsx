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

const StaffAuthContext = createContext();

// Staff credentials - MUST be set via environment variable
// Format: [{"email":"car1@3on.ae","passwordHash":"<sha256-hash>","name":"Vehicle 1"}, ...]
// Use hashPassword(password, email) to generate hashes for .env file
// Set VITE_STAFF_CREDENTIALS in your .env file
const getStaffCredentials = () => {
  try {
    const credentialsJson = import.meta.env.VITE_STAFF_CREDENTIALS;
    if (credentialsJson) {
      return JSON.parse(credentialsJson);
    }
  } catch (error) {
    console.error('Error parsing staff credentials:', error);
  }
  // Return empty array if no credentials configured - staff login will fail
  console.warn('VITE_STAFF_CREDENTIALS not configured. Staff login will be unavailable.');
  return [];
};

const STAFF_CREDENTIALS = getStaffCredentials();
const SESSION_KEY = 'staff_session';
const SESSION_EXPIRY_HOURS = 8; // Shorter session for staff

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
          // Verify session integrity
          if (session.staff && session.sessionId) {
            setStaff(session.staff);
          } else {
            // Invalid session structure - remove it
            removeSecureSession(SESSION_KEY);
          }
        } else if (session) {
          // Expired session - clean up
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

  const staffLogin = async (email, password) => {
    setLoginError(null);

    // Check for lockout
    const lockout = isLockedOut();
    if (lockout.locked) {
      const error = `Too many failed attempts. Please wait ${lockout.remainingSeconds} seconds.`;
      setLoginError(error);
      return { success: false, error, lockedOut: true, remainingSeconds: lockout.remainingSeconds };
    }

    // Find matching staff by email
    const matchedStaff = STAFF_CREDENTIALS.find(
      cred => cred.email.toLowerCase() === email.toLowerCase()
    );

    if (!matchedStaff) {
      updateLoginAttempts(false);
      const error = 'Invalid email or password';
      setLoginError(error);
      return { success: false, error };
    }

    // Verify password
    let passwordValid = false;

    // Support both hashed (new) and plaintext (legacy) passwords during migration
    if (matchedStaff.passwordHash) {
      // New secure format - verify against hash
      passwordValid = await verifyPassword(password, matchedStaff.email.toLowerCase(), matchedStaff.passwordHash);
    } else if (matchedStaff.password) {
      // Legacy plaintext format - compare directly but log warning
      console.warn('Staff credentials using plaintext password. Please migrate to hashed passwords.');
      passwordValid = matchedStaff.password === password;
    }

    if (!passwordValid) {
      updateLoginAttempts(false);
      const error = 'Invalid email or password';
      setLoginError(error);
      return { success: false, error };
    }

    // Successful login
    updateLoginAttempts(true);

    const staffData = {
      email: matchedStaff.email,
      name: matchedStaff.name,
      loginTime: new Date().toISOString()
    };

    // Calculate expiry time
    const expiry = Date.now() + (SESSION_EXPIRY_HOURS * 60 * 60 * 1000);

    // Generate unique session ID for this login
    const sessionId = generateSessionId();

    // Store signed session
    await storeSecureSession(SESSION_KEY, {
      staff: staffData,
      sessionId,
      expiry
    });

    setStaff(staffData);
    return { success: true };
  };

  const staffLogout = () => {
    removeSecureSession(SESSION_KEY);
    setStaff(null);
    setLoginError(null);
  };

  // Periodically verify session integrity
  useEffect(() => {
    if (!staff) return;

    const verifySession = async () => {
      const session = await getSecureSession(SESSION_KEY);
      if (!session || isSessionExpired(session)) {
        // Session invalid or expired - logout
        setStaff(null);
        removeSecureSession(SESSION_KEY);
      }
    };

    // Check every 5 minutes
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
