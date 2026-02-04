import React, { createContext, useContext, useState, useEffect } from 'react';

const StaffAuthContext = createContext();

// Staff credentials - MUST be set via environment variable
// Format: [{"email":"car1@3on.ae","password":"xxx","name":"Vehicle 1"}, ...]
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

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = () => {
      try {
        const sessionData = localStorage.getItem(SESSION_KEY);
        if (sessionData) {
          const session = JSON.parse(sessionData);
          const now = new Date().getTime();

          // Check if session is expired
          if (session.expiry && now < session.expiry) {
            setStaff(session.staff);
          } else {
            // Clear expired session
            localStorage.removeItem(SESSION_KEY);
          }
        }
      } catch (error) {
        localStorage.removeItem(SESSION_KEY);
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  const staffLogin = async (email, password) => {
    // Find matching staff credentials
    const matchedStaff = STAFF_CREDENTIALS.find(
      cred => cred.email.toLowerCase() === email.toLowerCase() && cred.password === password
    );

    if (matchedStaff) {
      const staffData = {
        email: matchedStaff.email,
        name: matchedStaff.name,
        loginTime: new Date().toISOString()
      };

      // Calculate expiry time
      const expiry = new Date().getTime() + (SESSION_EXPIRY_HOURS * 60 * 60 * 1000);

      // Store session
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        staff: staffData,
        expiry
      }));

      setStaff(staffData);
      return { success: true };
    }

    return { success: false, error: 'Invalid email or password' };
  };

  const staffLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setStaff(null);
  };

  const value = {
    staff,
    loading,
    isStaffAuthenticated: !!staff,
    staffLogin,
    staffLogout
  };

  return (
    <StaffAuthContext.Provider value={value}>
      {children}
    </StaffAuthContext.Provider>
  );
};

export default StaffAuthContext;
