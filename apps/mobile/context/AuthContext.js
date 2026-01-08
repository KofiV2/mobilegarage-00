import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [pendingOTP, setPendingOTP] = useState(null);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      const storedGuestMode = await AsyncStorage.getItem('guestMode');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      } else if (storedGuestMode === 'true') {
        setIsGuest(true);
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: userData, token: authToken } = response.data;

      await AsyncStorage.setItem('token', authToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      setToken(authToken);
      setUser(userData);
      api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { user: newUser, token: authToken } = response.data;

      await AsyncStorage.setItem('token', authToken);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));

      setToken(authToken);
      setUser(newUser);
      api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed'
      };
    }
  };

  const loginWithPhone = async (phoneNumber) => {
    try {
      const response = await api.post('/auth/send-otp', { phoneNumber });
      setPendingOTP(phoneNumber);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to send OTP'
      };
    }
  };

  const verifyOTP = async (phoneNumber, otp) => {
    try {
      const response = await api.post('/auth/verify-otp', { phoneNumber, otp });
      const { user: userData, token: authToken } = response.data;

      await AsyncStorage.setItem('token', authToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.removeItem('guestMode');

      setToken(authToken);
      setUser(userData);
      setIsGuest(false);
      setPendingOTP(null);
      api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Invalid OTP'
      };
    }
  };

  const continueAsGuest = async () => {
    try {
      await AsyncStorage.setItem('guestMode', 'true');
      setIsGuest(true);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to continue as guest'
      };
    }
  };

  const convertGuestToUser = async (authData) => {
    try {
      // This will be called at checkout when guest needs to login
      const { user: userData, token: authToken } = authData;

      await AsyncStorage.setItem('token', authToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.removeItem('guestMode');

      setToken(authToken);
      setUser(userData);
      setIsGuest(false);
      api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to convert guest account'
      };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('guestMode');
      delete api.defaults.headers.common['Authorization'];
      setToken(null);
      setUser(null);
      setIsGuest(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const updateUser = async (updates) => {
    try {
      const response = await api.put('/users/profile', updates);
      const updatedUser = response.data.user;

      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Update failed'
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isGuest,
        login,
        register,
        loginWithPhone,
        verifyOTP,
        continueAsGuest,
        convertGuestToUser,
        logout,
        updateUser,
        isAuthenticated: !!token || isGuest
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
