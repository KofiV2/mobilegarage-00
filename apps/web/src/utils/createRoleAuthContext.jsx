import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import {
  storeSecureSession,
  getSecureSession,
  removeSecureSession,
  isSessionExpired,
  generateSessionId
} from './secureSession';

/**
 * Factory function to create role-based authentication contexts
 * Eliminates duplication between StaffAuthContext and ManagerAuthContext
 * 
 * @param {Object} config - Configuration for the auth context
 * @param {string} config.roleName - The role name (e.g., 'staff', 'manager')
 * @param {string} config.sessionKey - Key for storing session in localStorage
 * @param {string} config.attemptsKey - Key for storing login attempts
 * @param {number} config.sessionExpiryHours - Hours until session expires
 * @param {number} config.maxLoginAttempts - Maximum failed attempts before lockout
 * @param {number} config.lockoutDurationMs - Lockout duration in milliseconds
 * @param {string} config.firebaseRole - Role to check in Firebase custom claims
 * @param {function} config.getDisplayName - Function to derive display name from email
 */
export function createRoleAuthContext({
  roleName,
  sessionKey,
  attemptsKey,
  sessionExpiryHours,
  maxLoginAttempts = 5,
  lockoutDurationMs,
  firebaseRole,
  getDisplayName = (email) => email.split('@')[0]
}) {
  const AuthContext = createContext();

  const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
      throw new Error(`use${capitalize(roleName)}Auth must be used within a ${capitalize(roleName)}AuthProvider`);
    }
    return context;
  };

  const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loginError, setLoginError] = useState(null);

    // Check for existing session on mount
    useEffect(() => {
      const checkSession = async () => {
        try {
          const session = await getSecureSession(sessionKey);

          if (session && !isSessionExpired(session)) {
            // Check for role-specific data in session
            const userData = session[roleName] || session.user;
            if (userData && session.sessionId) {
              setUser(userData);
            } else {
              removeSecureSession(sessionKey);
            }
          } else if (session) {
            removeSecureSession(sessionKey);
          }
        } catch (error) {
          console.error(`Error checking ${roleName} session:`, error);
          removeSecureSession(sessionKey);
        }
        setLoading(false);
      };

      checkSession();
    }, []);

    // Get login attempts from storage
    const getLoginAttempts = useCallback(() => {
      try {
        const data = sessionStorage.getItem(attemptsKey);
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
        sessionStorage.removeItem(attemptsKey);
        return;
      }

      const now = Date.now();
      const newCount = attempts.count + 1;

      sessionStorage.setItem(attemptsKey, JSON.stringify({
        count: newCount,
        lastAttempt: now,
        lockedUntil: newCount >= maxLoginAttempts ? now + lockoutDurationMs : 0
      }));
    }, [getLoginAttempts]);

    // Check if locked out
    const isLockedOut = useCallback(() => {
      const attempts = getLoginAttempts();
      if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
        return {
          locked: true,
          remainingMs: attempts.lockedUntil - Date.now()
        };
      }
      return { locked: false };
    }, [getLoginAttempts]);

    // Login function
    const login = useCallback(async (email, password) => {
      setLoginError(null);

      // Check lockout
      const lockStatus = isLockedOut();
      if (lockStatus.locked) {
        const remainingSeconds = Math.ceil(lockStatus.remainingMs / 1000);
        setLoginError(`Too many failed attempts. Please wait ${remainingSeconds} seconds.`);
        return false;
      }

      try {
        // Sign in with Firebase
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Check role in Firestore 'roles' collection
        const roleDocRef = doc(db, 'roles', userCredential.user.uid);
        const roleDoc = await getDoc(roleDocRef);
        
        // Verify role - allow if role matches OR if email ends with @3on.ae (owner/admin)
        const userRole = roleDoc.exists() ? roleDoc.data().role : null;
        const isAuthorizedDomain = email.endsWith('@3on.ae');
        
        if (userRole !== firebaseRole && !isAuthorizedDomain) {
          await signOut(auth);
          updateLoginAttempts(false);
          setLoginError(`Access denied. ${capitalize(roleName)} account required.`);
          return false;
        }

        // Create user object
        const userData = {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          name: getDisplayName(userCredential.user.email),
          role: firebaseRole
        };

        // Store session
        const sessionId = generateSessionId();
        const sessionData = {
          [roleName]: userData,
          user: userData, // Also store as generic user for compatibility
          sessionId,
          expiresAt: Date.now() + (sessionExpiryHours * 60 * 60 * 1000)
        };

        await storeSecureSession(sessionKey, sessionData);
        setUser(userData);
        updateLoginAttempts(true);
        return true;

      } catch (error) {
        console.error(`${capitalize(roleName)} login error:`, error);
        updateLoginAttempts(false);
        
        if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
          setLoginError('Invalid email or password.');
        } else if (error.code === 'auth/too-many-requests') {
          setLoginError('Too many attempts. Please try again later.');
        } else {
          setLoginError('Login failed. Please try again.');
        }
        return false;
      }
    }, [isLockedOut, updateLoginAttempts]);

    // Logout function
    const logout = useCallback(async () => {
      try {
        await signOut(auth);
      } catch (error) {
        console.error('Sign out error:', error);
      }
      removeSecureSession(sessionKey);
      setUser(null);
    }, []);

    // Clear login error
    const clearError = useCallback(() => {
      setLoginError(null);
    }, []);

    const value = {
      [roleName]: user,
      user,
      loading,
      loginError,
      login,
      logout,
      clearError,
      isLockedOut,
      [`is${capitalize(roleName)}`]: !!user
    };

    return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    );
  };

  return {
    AuthContext,
    AuthProvider,
    useAuth
  };
}

// Helper function to capitalize first letter
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Pre-configured contexts for Staff and Manager
export const {
  AuthContext: StaffAuthContext,
  AuthProvider: StaffAuthProvider,
  useAuth: useStaffAuth
} = createRoleAuthContext({
  roleName: 'staff',
  sessionKey: 'staff_session',
  attemptsKey: 'staff_login_attempts',
  sessionExpiryHours: 8,
  maxLoginAttempts: 5,
  lockoutDurationMs: 15 * 60 * 1000, // 15 minutes
  firebaseRole: 'staff',
  getDisplayName: (email) => {
    const match = email.match(/car(\d+)/i);
    return match ? `Vehicle ${match[1]}` : email.split('@')[0];
  }
});

export const {
  AuthContext: ManagerAuthContext,
  AuthProvider: ManagerAuthProvider,
  useAuth: useManagerAuth
} = createRoleAuthContext({
  roleName: 'manager',
  sessionKey: 'manager_session',
  attemptsKey: 'manager_login_attempts',
  sessionExpiryHours: 2,
  maxLoginAttempts: 5,
  lockoutDurationMs: 30 * 60 * 1000, // 30 minutes
  firebaseRole: 'manager',
  getDisplayName: () => 'Manager'
});

export default createRoleAuthContext;
