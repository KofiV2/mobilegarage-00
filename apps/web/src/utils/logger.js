/**
 * Logging Utility
 *
 * Provides structured logging with different levels.
 * In production, errors are sent to error tracking service (future: Sentry integration).
 * In development, logs are output to console with formatting.
 */

const isDevelopment = import.meta.env.MODE === 'development';
const isDebugMode = import.meta.env.VITE_DEBUG === 'true';

const LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

class Logger {
  constructor() {
    this.enabledLevels = isDevelopment
      ? [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG]
      : [LogLevel.ERROR, LogLevel.WARN];
  }

  /**
   * Log error message
   */
  error(message, error = null, context = {}) {
    if (!this.enabledLevels.includes(LogLevel.ERROR)) return;

    const logData = {
      level: LogLevel.ERROR,
      message,
      error: error ? {
        message: error.message,
        stack: error.stack,
        code: error.code
      } : null,
      context,
      timestamp: new Date().toISOString()
    };

    if (isDevelopment) {
      console.error(`[ERROR] ${message}`, error, context);
    } else {
      // In production, send to error tracking service
      this._sendToErrorTracking(logData);
    }
  }

  /**
   * Log warning message
   */
  warn(message, context = {}) {
    if (!this.enabledLevels.includes(LogLevel.WARN)) return;

    const logData = {
      level: LogLevel.WARN,
      message,
      context,
      timestamp: new Date().toISOString()
    };

    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, context);
    } else {
      this._sendToErrorTracking(logData);
    }
  }

  /**
   * Log info message
   */
  info(message, context = {}) {
    if (!this.enabledLevels.includes(LogLevel.INFO)) return;

    if (isDevelopment) {
      console.info(`[INFO] ${message}`, context);
    }
  }

  /**
   * Log debug message (only in debug mode)
   */
  debug(message, context = {}) {
    if (!isDebugMode && !this.enabledLevels.includes(LogLevel.DEBUG)) return;

    if (isDevelopment || isDebugMode) {
      console.debug(`[DEBUG] ${message}`, context);
    }
  }

  /**
   * Send error data to tracking service
   * Future: Integrate with Sentry, LogRocket, or similar
   */
  _sendToErrorTracking(logData) {
    // TODO: Integrate with Sentry or similar service
    // For now, just use console in production too
    console.error('[ERROR]', logData);
  }
}

// Export singleton instance
export const logger = new Logger();
export default logger;
