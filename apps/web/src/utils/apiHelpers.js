import logger from './logger';
import { 
  withRetry, 
  retryWithExponentialBackoff, 
  withTimeout, 
  withFallback,
  getUserFriendlyError,
  isRetryableError 
} from './errorRecovery';

/**
 * API Helpers
 * 
 * Provides standardized API call utilities with built-in:
 * - Retry mechanisms for transient failures
 * - Timeout handling
 * - Error transformation
 * - Request/response logging
 * - Offline detection
 * 
 * Usage:
 * import { apiCall, apiCallWithRetry, checkOnlineStatus } from './utils/apiHelpers';
 * 
 * // Simple API call with error handling
 * const data = await apiCall('/api/bookings');
 * 
 * // API call with automatic retry
 * const data = await apiCallWithRetry('/api/bookings', { method: 'POST', body: {...} });
 */

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_RETRY_OPTIONS = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000
};

/**
 * Check if the browser is online
 * @returns {boolean}
 */
export function isOnline() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Check online status and throw if offline
 */
export function checkOnlineStatus() {
  if (!isOnline()) {
    const error = new Error('No internet connection. Please check your network and try again.');
    error.name = 'OfflineError';
    error.isOffline = true;
    throw error;
  }
}

/**
 * Create an AbortController with timeout
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {{ controller: AbortController, timeoutId: number }}
 */
function createTimeoutController(timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);
  
  return { controller, timeoutId };
}

/**
 * Standard API call with timeout and error handling
 * 
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @param {number} options.timeout - Request timeout in ms (default: 30000)
 * @returns {Promise<any>} Response data
 */
export async function apiCall(url, options = {}) {
  const { timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options;

  // Check online status first
  checkOnlineStatus();

  const { controller, timeoutId } = createTimeoutController(timeout);

  try {
    logger.debug('API call started', { url, method: fetchOptions.method || 'GET' });

    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      error.response = response;
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    
    logger.debug('API call successful', { url, status: response.status });
    
    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle abort/timeout
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Request timed out. Please try again.');
      timeoutError.name = 'TimeoutError';
      timeoutError.isTimeout = true;
      logger.warn('API call timed out', { url, timeout });
      throw timeoutError;
    }

    // Handle network errors
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      const networkError = new Error('Unable to connect to the server. Please check your internet connection.');
      networkError.name = 'NetworkError';
      networkError.isNetwork = true;
      logger.error('API call network error', error, { url });
      throw networkError;
    }

    logger.error('API call failed', error, { url });
    throw error;
  }
}

/**
 * API call with automatic retry for transient failures
 * 
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options plus retry config
 * @param {Object} options.retryOptions - Retry configuration
 * @returns {Promise<any>} Response data
 */
export async function apiCallWithRetry(url, options = {}) {
  const { retryOptions = {}, onRetry, ...fetchOptions } = options;

  const mergedRetryOptions = {
    ...DEFAULT_RETRY_OPTIONS,
    ...retryOptions,
    shouldRetry: (error) => isRetryableError(error),
    onRetry: (error, attempt) => {
      logger.info('Retrying API call', { url, attempt, error: error.message });
      if (onRetry) onRetry(error, attempt);
    }
  };

  return withRetry(
    () => apiCall(url, fetchOptions),
    mergedRetryOptions
  );
}

/**
 * API call with exponential backoff for rate limiting scenarios
 * 
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options plus backoff config
 * @returns {Promise<any>} Response data
 */
export async function apiCallWithBackoff(url, options = {}) {
  const { backoffOptions = {}, ...fetchOptions } = options;

  const mergedBackoffOptions = {
    maxAttempts: 5,
    initialDelay: 1000,
    maxDelay: 30000,
    factor: 2,
    ...backoffOptions
  };

  return retryWithExponentialBackoff(
    () => apiCall(url, fetchOptions),
    mergedBackoffOptions
  );
}

/**
 * API call with fallback to cached data or default value
 * 
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @param {Function|any} fallback - Fallback function or value
 * @returns {Promise<any>} Response data or fallback
 */
export async function apiCallWithFallback(url, options = {}, fallback) {
  const fallbackFn = typeof fallback === 'function' ? fallback : () => fallback;
  
  return withFallback(
    () => apiCallWithRetry(url, options),
    fallbackFn
  );
}

/**
 * Batch multiple API calls with consolidated error handling
 * 
 * @param {Array<{ url: string, options?: Object }>} requests - Array of request configs
 * @param {Object} options - Batch options
 * @param {boolean} options.stopOnError - Stop on first error (default: false)
 * @returns {Promise<Array<{ success: boolean, data?: any, error?: Error }>>}
 */
export async function batchApiCalls(requests, options = {}) {
  const { stopOnError = false } = options;

  if (stopOnError) {
    // Sequential execution, stop on first error
    const results = [];
    for (const request of requests) {
      try {
        const data = await apiCallWithRetry(request.url, request.options);
        results.push({ success: true, data });
      } catch (error) {
        results.push({ success: false, error });
        break;
      }
    }
    return results;
  }

  // Parallel execution, collect all results
  const promises = requests.map(async (request) => {
    try {
      const data = await apiCallWithRetry(request.url, request.options);
      return { success: true, data };
    } catch (error) {
      return { success: false, error };
    }
  });

  return Promise.all(promises);
}

/**
 * Create a cancelable API call
 * 
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {{ promise: Promise<any>, cancel: Function }}
 */
export function createCancelableApiCall(url, options = {}) {
  const controller = new AbortController();
  
  const promise = apiCall(url, {
    ...options,
    signal: controller.signal
  });

  return {
    promise,
    cancel: () => controller.abort()
  };
}

/**
 * Hook-friendly API state wrapper
 * 
 * @param {Function} apiFunction - Async API function
 * @returns {{ execute: Function, state: { loading: boolean, error: Error|null, data: any } }}
 */
export function createApiState() {
  let state = {
    loading: false,
    error: null,
    data: null
  };

  const setState = (updates) => {
    state = { ...state, ...updates };
    return state;
  };

  return {
    getState: () => state,
    execute: async (apiFunction) => {
      setState({ loading: true, error: null });
      try {
        const data = await apiFunction();
        return setState({ loading: false, data, error: null });
      } catch (error) {
        return setState({ loading: false, error, data: null });
      }
    },
    reset: () => setState({ loading: false, error: null, data: null })
  };
}

/**
 * Debounced API call - useful for search inputs
 * 
 * @param {Function} apiFunction - API function to debounce
 * @param {number} delay - Debounce delay in ms
 * @returns {Function} Debounced function
 */
export function createDebouncedApiCall(apiFunction, delay = 300) {
  let timeoutId = null;
  let currentController = null;

  return (...args) => {
    return new Promise((resolve, reject) => {
      // Cancel previous request
      if (currentController) {
        currentController.abort();
      }
      
      // Clear previous timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(async () => {
        currentController = new AbortController();
        try {
          const result = await apiFunction(...args, { signal: currentController.signal });
          resolve(result);
        } catch (error) {
          if (error.name !== 'AbortError') {
            reject(error);
          }
        }
      }, delay);
    });
  };
}

/**
 * Wrap an API call with loading/error state management for React hooks
 * 
 * @param {Object} options
 * @param {Function} options.onSuccess - Success callback
 * @param {Function} options.onError - Error callback  
 * @param {Function} options.onLoadingChange - Loading state callback
 * @returns {Function} Wrapped API function
 */
export function withApiState(options = {}) {
  const { onSuccess, onError, onLoadingChange } = options;

  return (apiFunction) => async (...args) => {
    if (onLoadingChange) onLoadingChange(true);
    
    try {
      const result = await apiFunction(...args);
      if (onSuccess) onSuccess(result);
      return result;
    } catch (error) {
      const friendlyError = getUserFriendlyError(error);
      if (onError) onError(error, friendlyError);
      throw error;
    } finally {
      if (onLoadingChange) onLoadingChange(false);
    }
  };
}

export default {
  apiCall,
  apiCallWithRetry,
  apiCallWithBackoff,
  apiCallWithFallback,
  batchApiCalls,
  createCancelableApiCall,
  createApiState,
  createDebouncedApiCall,
  withApiState,
  isOnline,
  checkOnlineStatus
};
