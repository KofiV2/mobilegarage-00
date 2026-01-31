import React, { createContext, useContext, useState, useEffect } from 'react';

const ManagerAuthContext = createContext();

// Manager credentials - in production, use environment variables or Firestore
const MANAGER_CREDENTIALS = {
  email: import.meta.env.VITE_MANAGER_EMAIL || 'manager@3on.ae',
  password: import.meta.env.VITE_MANAGER_PASSWORD || 'Manager@2024'
};

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
