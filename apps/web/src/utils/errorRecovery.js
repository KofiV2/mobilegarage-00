import logger from './logger';

/**
 * Error Recovery Utilities
 *
 * Provides error recovery mechanisms including retry logic,
 * exponential backoff, and error transformation.
 *
 * Usage:
 * import { withRetry, retryWithExponentialBackoff } from './utils/errorRecovery';
 *
 * // Retry a function up to 3 times
 * const result = await withRetry(() => fetchData(), { maxAttempts: 3 });
 *
 * // Retry with exponential backoff
 * const result = await retryWithExponentialBackoff(() => fetchData());
 */

/**
 * Retry a function with configurable options
 *
 * @param {Function} fn - The async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxAttempts - Maximum number of retry attempts (default: 3)
 * @param {number} options.delay - Initial delay between retries in ms (default: 1000)
 * @param {Function} options.shouldRetry - Function to determine if error should trigger retry
 * @param {Function} options.onRetry - Callback called before each retry
 * @returns {Promise} Result of the function or throws final error
 */
export async function withRetry(fn, options = {}) {
  const {
    maxAttempts = 3,
    delay = 1000,
    shouldRetry = () => true,
    onRetry = null
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if we've exhausted attempts
      if (attempt === maxAttempts) {
        break;
      }

      // Check if we should retry this error
      if (!shouldRetry(error, attempt)) {
        throw error;
      }

      // Log the retry attempt
      logger.warn(`Retry attempt ${attempt} of ${maxAttempts}`, {
        error: error.message,
        attempt
      });

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(error, attempt);
      }

      // Wait before retrying
      await sleep(delay);
    }
  }

  // All retries failed
  logger.error('All retry attempts failed', lastError, {
    maxAttempts,
    finalAttempt: maxAttempts
  });

  throw lastError;
}

/**
 * Retry with exponential backoff
 *
 * @param {Function} fn - The async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxAttempts - Maximum retry attempts (default: 5)
 * @param {number} options.initialDelay - Initial delay in ms (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 30000)
 * @param {number} options.factor - Backoff multiplier (default: 2)
 * @returns {Promise} Result of the function or throws final error
 */
export async function retryWithExponentialBackoff(fn, options = {}) {
  const {
    maxAttempts = 5,
    initialDelay = 1000,
    maxDelay = 30000,
    factor = 2
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts) {
        break;
      }

      logger.warn(`Exponential backoff retry ${attempt}/${maxAttempts}`, {
        error: error.message,
        nextDelay: delay
      });

      await sleep(delay);

      // Exponential backoff with jitter
      delay = Math.min(delay * factor + Math.random() * 1000, maxDelay);
    }
  }

  logger.error('Exponential backoff retries exhausted', lastError, {
    maxAttempts
  });

  throw lastError;
}

/**
 * Retry only network errors
 *
 * @param {Function} fn - The async function to retry
 * @param {number} maxAttempts - Maximum retry attempts
 * @returns {Promise} Result of the function or throws final error
 */
export async function retryNetworkErrors(fn, maxAttempts = 3) {
  return withRetry(fn, {
    maxAttempts,
    shouldRetry: (error) => {
      // Retry on network errors, timeouts, and 5xx server errors
      return (
        error.name === 'NetworkError' ||
        error.message?.includes('network') ||
        error.message?.includes('timeout') ||
        error.message?.includes('fetch') ||
        (error.response && error.response.status >= 500)
      );
    }
  });
}

/**
 * Execute function with timeout
 *
 * @param {Function} fn - The async function to execute
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise} Result of the function or throws timeout error
 */
export async function withTimeout(fn, timeoutMs) {
  return Promise.race([
    fn(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    )
  ]);
}

/**
 * Execute function with fallback
 *
 * @param {Function} fn - The primary async function
 * @param {Function} fallbackFn - The fallback async function
 * @returns {Promise} Result of primary or fallback function
 */
export async function withFallback(fn, fallbackFn) {
  try {
    return await fn();
  } catch (error) {
    logger.warn('Primary function failed, using fallback', {
      error: error.message
    });
    return await fallbackFn();
  }
}

/**
 * Transform error to user-friendly message
 *
 * @param {Error} error - The error object
 * @returns {string} User-friendly error message
 */
export function getUserFriendlyError(error) {
  // Network errors
  if (error.message?.includes('Failed to fetch') || error.message?.includes('network')) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }

  // Timeout errors
  if (error.message?.includes('timeout')) {
    return 'The request took too long. Please try again.';
  }

  // Firebase auth errors
  if (error.code) {
    switch (error.code) {
      case 'auth/invalid-phone-number':
        return 'Invalid phone number format.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/invalid-verification-code':
        return 'Invalid verification code.';
      case 'auth/code-expired':
        return 'Verification code has expired. Please request a new one.';
      default:
        if (error.code.startsWith('auth/')) {
          return 'Authentication error. Please try again.';
        }
    }
  }

  // HTTP errors
  if (error.response) {
    const status = error.response.status;
    if (status === 400) return 'Invalid request. Please check your input.';
    if (status === 401) return 'You are not authorized. Please log in again.';
    if (status === 403) return 'You do not have permission to perform this action.';
    if (status === 404) return 'The requested resource was not found.';
    if (status === 429) return 'Too many requests. Please slow down.';
    if (status >= 500) return 'Server error. Please try again later.';
  }

  // Generic error - always return user-friendly message
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Check if error is retryable
 *
 * @param {Error} error - The error object
 * @returns {boolean} True if error should be retried
 */
export function isRetryableError(error) {
  // Network errors are retryable
  if (error.name === 'NetworkError' || error.message?.includes('network')) {
    return true;
  }

  // Timeout errors are retryable
  if (error.message?.includes('timeout')) {
    return true;
  }

  // 5xx server errors are retryable
  if (error.response && error.response.status >= 500) {
    return true;
  }

  // Rate limit errors are retryable (with backoff)
  if (error.response && error.response.status === 429) {
    return true;
  }

  // Too many requests from Firebase
  if (error.code === 'auth/too-many-requests') {
    return true;
  }

  return false;
}

/**
 * Sleep for specified milliseconds
 *
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Circuit breaker pattern implementation
 */
export class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
  }

  async execute(fn) {
    // If circuit is open, check if we should transition to half-open
    if (this.state === 'OPEN') {
      const now = Date.now();
      if (now - this.lastFailureTime >= this.resetTimeout) {
        this.state = 'HALF_OPEN';
        logger.info('Circuit breaker transitioning to HALF_OPEN');
      } else {
        throw new Error('Circuit breaker is OPEN. Service temporarily unavailable.');
      }
    }

    try {
      const result = await fn();

      // Success - reset if we were half-open
      if (this.state === 'HALF_OPEN') {
        this.reset();
        logger.info('Circuit breaker reset to CLOSED after successful call');
      }

      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      logger.error('Circuit breaker opened due to repeated failures', null, {
        failureCount: this.failureCount,
        threshold: this.failureThreshold
      });
    }
  }

  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = null;
  }

  getState() {
    return this.state;
  }
}

export default {
  withRetry,
  retryWithExponentialBackoff,
  retryNetworkErrors,
  withTimeout,
  withFallback,
  getUserFriendlyError,
  isRetryableError,
  CircuitBreaker
};
