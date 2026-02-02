import React, { createContext, useContext, useState, useEffect } from 'react';

const StaffAuthContext = createContext();

// Staff credentials - supports multiple vehicle accounts
// Format: [{"email":"car1@3on.ae","password":"Car1@2024","name":"Vehicle 1"}, ...]
const getStaffCredentials = () => {
  try {
    const credentialsJson = import.meta.env.VITE_STAFF_CREDENTIALS;
    if (credentialsJson) {
      return JSON.parse(credentialsJson);
    }
  } catch (error) {
    console.error('Error parsing staff credentials:', error);
  }
  // Default credentials for development
  return [
    { email: 'car1@3on.ae', password: 'Car1@2024', name: 'Vehicle 1' },
    { email: 'car2@3on.ae', password: 'Car2@2024', name: 'Vehicle 2' },
    { email: 'car3@3on.ae', password: 'Car3@2024', name: 'Vehicle 3' }
  ];
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
