/**
 * API Service Configuration
 * Provides axios instance with interceptors for error handling and token management
 */
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebase/config';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

// Create axios instance with defaults
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000, // 15 second timeout
});

// Track if we're currently refreshing the token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Request interceptor - adds auth token to requests
 */
api.interceptors.request.use(
  async (config) => {
    try {
      // Get the current user's ID token from Firebase
      const currentUser = auth.currentUser;
      if (currentUser) {
        const token = await currentUser.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add request timestamp for debugging
      config.metadata = { startTime: new Date() };

      // Log request in development
      if (__DEV__) {
        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - handles errors and token refresh
 */
api.interceptors.response.use(
  (response) => {
    // Log response time in development
    if (__DEV__ && response.config.metadata) {
      const endTime = new Date();
      const duration = endTime - response.config.metadata.startTime;
      console.log(`✅ API Response: ${response.config.url} (${duration}ms)`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Log error in development
    if (__DEV__) {
      console.error(`❌ API Error: ${error.config?.url}`, error.message);
    }

    // Handle 401 Unauthorized - token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Force refresh the Firebase token
        const currentUser = auth.currentUser;
        if (currentUser) {
          const newToken = await currentUser.getIdToken(true);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);
          return api(originalRequest);
        } else {
          // No user logged in, redirect to login
          processQueue(new Error('No user logged in'), null);
          return Promise.reject(error);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle network errors
    if (!error.response) {
      error.isNetworkError = true;
      error.userMessage = 'Unable to connect. Please check your internet connection.';
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      error.isTimeout = true;
      error.userMessage = 'Request timed out. Please try again.';
    }

    // Handle server errors
    if (error.response?.status >= 500) {
      error.isServerError = true;
      error.userMessage = 'Server error. Please try again later.';
    }

    // Handle validation errors
    if (error.response?.status === 400 || error.response?.status === 422) {
      error.isValidationError = true;
      error.userMessage = error.response?.data?.error || 'Invalid request. Please check your input.';
    }

    return Promise.reject(error);
  }
);

/**
 * Helper to cancel a request
 */
export const createCancelToken = () => {
  return axios.CancelToken.source();
};

/**
 * Check if error was a cancellation
 */
export const isCancel = (error) => {
  return axios.isCancel(error);
};

/**
 * Set a custom header for all requests
 */
export const setHeader = (key, value) => {
  api.defaults.headers.common[key] = value;
};

/**
 * Remove a custom header
 */
export const removeHeader = (key) => {
  delete api.defaults.headers.common[key];
};

export default api;
