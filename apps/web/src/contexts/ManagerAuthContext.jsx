import React, { createContext, useContext, useState, useEffect } from 'react';

const ManagerAuthContext = createContext();

// Manager credentials - MUST be set via environment variables
// Set VITE_MANAGER_EMAIL and VITE_MANAGER_PASSWORD in your .env file
const getManagerCredentials = () => {
  const email = import.meta.env.VITE_MANAGER_EMAIL;
  const password = import.meta.env.VITE_MANAGER_PASSWORD;

  if (!email || !password) {
    console.warn('VITE_MANAGER_EMAIL or VITE_MANAGER_PASSWORD not configured. Manager login will be unavailable.');
    return null;
  }

  return { email, password };
};

const MANAGER_CREDENTIALS = getManagerCredentials();

const SESSION_KEY = 'manager_session';
const SESSION_EXPIRY_HOURS = 24;

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
            setManager(session.manager);
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

  const managerLogin = async (email, password) => {
    // Check if credentials are configured
    if (!MANAGER_CREDENTIALS) {
      return { success: false, error: 'Manager login not configured' };
    }

    // Validate credentials
    if (email === MANAGER_CREDENTIALS.email && password === MANAGER_CREDENTIALS.password) {
      const managerData = {
        email,
        name: 'Manager',
        loginTime: new Date().toISOString()
      };

      // Calculate expiry time
      const expiry = new Date().getTime() + (SESSION_EXPIRY_HOURS * 60 * 60 * 1000);

      // Store session
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        manager: managerData,
        expiry
      }));

      setManager(managerData);
      return { success: true };
    }

    return { success: false, error: 'Invalid email or password' };
  };

  const managerLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setManager(null);
  };

  const value = {
    manager,
    loading,
    isManagerAuthenticated: !!manager,
    managerLogin,
    managerLogout
  };

  return (
    <ManagerAuthContext.Provider value={value}>
      {children}
    </ManagerAuthContext.Provider>
  );
};

export default ManagerAuthContext;
