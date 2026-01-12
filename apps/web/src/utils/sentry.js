/**
 * Sentry Integration for Error Boundaries
 *
 * This file provides optional Sentry integration for the application.
 * To enable Sentry:
 *
 * 1. Install Sentry: npm install @sentry/react
 * 2. Set VITE_SENTRY_DSN in your .env file
 * 3. Import this file in your main.jsx BEFORE importing App
 *
 * Example in main.jsx:
 * import './utils/sentry'; // Add this line
 * import React from 'react';
 * import ReactDOM from 'react-dom/client';
 * import App from './App';
 */

// Check if Sentry should be initialized
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const ENABLE_SENTRY = import.meta.env.VITE_ENABLE_SENTRY === 'true' || import.meta.env.MODE === 'production';

if (SENTRY_DSN && ENABLE_SENTRY) {
  // Dynamically import Sentry to avoid errors if not installed
  import('@sentry/react')
    .then((Sentry) => {
      Sentry.init({
        dsn: SENTRY_DSN,
        environment: import.meta.env.MODE,

        // Performance Monitoring
        integrations: [
          new Sentry.BrowserTracing({
            // Set sampling rate for performance monitoring
            tracePropagationTargets: ['localhost', import.meta.env.VITE_API_URL],
          }),
          // Session Replay
          new Sentry.Replay({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],

        // Sample rate for performance monitoring (1.0 = 100%)
        tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,

        // Sample rate for session replay
        replaysSessionSampleRate: 0.1, // 10% of sessions
        replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

        // Before sending events to Sentry
        beforeSend(event, hint) {
          // Don't send events in development unless explicitly enabled
          if (import.meta.env.MODE === 'development' && import.meta.env.VITE_ENABLE_SENTRY !== 'true') {
            console.log('Sentry event (development - not sent):', event);
            return null;
          }

          // Filter out known errors you don't want to track
          const error = hint.originalException;
          if (error && error.message) {
            // Example: Don't track network errors
            if (error.message.includes('Network Error')) {
              return null;
            }
            // Example: Don't track specific errors
            if (error.message.includes('ResizeObserver loop')) {
              return null;
            }
          }

          return event;
        },

        // Add custom tags
        initialScope: {
          tags: {
            app_version: import.meta.env.VITE_APP_VERSION || '1.0.0',
          },
        },
      });

      // Make Sentry available globally for error boundaries
      window.Sentry = Sentry;

      console.log('Sentry initialized successfully');
    })
    .catch((error) => {
      console.error('Failed to initialize Sentry:', error);
      console.warn('Error boundaries will work without Sentry');
    });
} else {
  if (!SENTRY_DSN) {
    console.log('Sentry DSN not configured. Sentry integration disabled.');
  } else {
    console.log('Sentry disabled in development. Set VITE_ENABLE_SENTRY=true to enable.');
  }
}

// Helper function to manually capture errors
export const captureError = (error, context = {}) => {
  if (window.Sentry && typeof window.Sentry.captureException === 'function') {
    window.Sentry.captureException(error, {
      contexts: {
        custom: context,
      },
    });
  } else {
    console.error('Error (Sentry not available):', error, context);
  }
};

// Helper function to capture messages
export const captureMessage = (message, level = 'info') => {
  if (window.Sentry && typeof window.Sentry.captureMessage === 'function') {
    window.Sentry.captureMessage(message, level);
  } else {
    console.log(`Message (${level}):`, message);
  }
};

// Helper function to set user context
export const setUser = (user) => {
  if (window.Sentry && typeof window.Sentry.setUser === 'function') {
    window.Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.name,
    });
  }
};

// Helper function to clear user context
export const clearUser = () => {
  if (window.Sentry && typeof window.Sentry.setUser === 'function') {
    window.Sentry.setUser(null);
  }
};

// Helper function to add breadcrumb
export const addBreadcrumb = (message, category = 'custom', level = 'info', data = {}) => {
  if (window.Sentry && typeof window.Sentry.addBreadcrumb === 'function') {
    window.Sentry.addBreadcrumb({
      message,
      category,
      level,
      data,
    });
  } else {
    console.log(`Breadcrumb (${category}):`, message, data);
  }
};

export default {
  captureError,
  captureMessage,
  setUser,
  clearUser,
  addBreadcrumb,
};
