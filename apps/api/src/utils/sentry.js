/**
 * Sentry Integration for Backend API
 *
 * This file provides Sentry error tracking for the Express API.
 * To enable Sentry:
 *
 * 1. Set SENTRY_DSN in your .env file
 * 2. Import this file in your index.js BEFORE creating express app
 * 3. Add error handler middleware AFTER all routes
 */

const Sentry = require('@sentry/node');

// Check if Sentry should be initialized
const SENTRY_DSN = process.env.SENTRY_DSN;
const ENABLE_SENTRY = process.env.ENABLE_SENTRY === 'true' || process.env.NODE_ENV === 'production';

let sentryInitialized = false;

if (SENTRY_DSN && ENABLE_SENTRY) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Integrations
    integrations: [
      // Capture HTTP requests
      new Sentry.Integrations.Http({ tracing: true }),
      // Capture Express requests
      new Sentry.Integrations.Express({ app: null }), // App will be set later
    ],

    // Before sending events
    beforeSend(event, hint) {
      // Don't send events in development unless explicitly enabled
      if (process.env.NODE_ENV === 'development' && process.env.ENABLE_SENTRY !== 'true') {
        console.log('Sentry event (development - not sent):', event);
        return null;
      }

      // Filter out known errors you don't want to track
      const error = hint.originalException;
      if (error && error.message) {
        // Don't track JWT errors (these are normal)
        if (error.message.includes('jwt') || error.message.includes('token')) {
          return null;
        }
        // Don't track validation errors (these are normal)
        if (error.message.includes('ValidationError')) {
          return null;
        }
      }

      return event;
    },
  });

  sentryInitialized = true;
  console.log('✅ Sentry initialized successfully');
} else {
  if (!SENTRY_DSN) {
    console.log('ℹ️  Sentry DSN not configured. Error tracking disabled.');
  } else {
    console.log('ℹ️  Sentry disabled in development. Set ENABLE_SENTRY=true to enable.');
  }
}

/**
 * Request handler middleware - Add this BEFORE all routes
 */
const requestHandler = () => {
  if (sentryInitialized) {
    return Sentry.Handlers.requestHandler({
      user: ['id', 'email', 'name'],
      ip: true,
    });
  }
  return (req, res, next) => next();
};

/**
 * Tracing middleware - Add this BEFORE all routes (after requestHandler)
 */
const tracingHandler = () => {
  if (sentryInitialized) {
    return Sentry.Handlers.tracingHandler();
  }
  return (req, res, next) => next();
};

/**
 * Error handler middleware - Add this AFTER all routes
 */
const errorHandler = () => {
  if (sentryInitialized) {
    return Sentry.Handlers.errorHandler({
      shouldHandleError(error) {
        // Capture all errors with status code >= 500
        if (error.status && error.status >= 500) {
          return true;
        }
        // Also capture specific error types
        if (error.name === 'UnhandledError' || error.name === 'DatabaseError') {
          return true;
        }
        return false;
      },
    });
  }
  return (err, req, res, next) => next(err);
};

/**
 * Helper function to manually capture errors
 */
const captureError = (error, context = {}) => {
  if (sentryInitialized) {
    Sentry.captureException(error, {
      contexts: {
        custom: context,
      },
    });
  } else {
    console.error('Error:', error, context);
  }
};

/**
 * Helper function to capture messages
 */
const captureMessage = (message, level = 'info') => {
  if (sentryInitialized) {
    Sentry.captureMessage(message, level);
  } else {
    console.log(`[${level.toUpperCase()}] ${message}`);
  }
};

/**
 * Helper function to set user context
 */
const setUser = (user) => {
  if (sentryInitialized) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.name || user.email,
      role: user.role,
    });
  }
};

/**
 * Helper function to add breadcrumb
 */
const addBreadcrumb = (message, category = 'custom', level = 'info', data = {}) => {
  if (sentryInitialized) {
    Sentry.addBreadcrumb({
      message,
      category,
      level,
      data,
      timestamp: Date.now() / 1000,
    });
  } else {
    console.log(`[BREADCRUMB][${category}] ${message}`, data);
  }
};

/**
 * Middleware to capture user info for Sentry
 */
const captureUserMiddleware = (req, res, next) => {
  if (sentryInitialized && req.user) {
    setUser(req.user);
  }
  next();
};

module.exports = {
  Sentry,
  requestHandler,
  tracingHandler,
  errorHandler,
  captureError,
  captureMessage,
  setUser,
  addBreadcrumb,
  captureUserMiddleware,
  isInitialized: () => sentryInitialized,
};
