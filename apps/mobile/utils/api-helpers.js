/**
 * API Error Handling Utilities
 * Provides consistent error handling and retry logic for API calls
 */

/**
 * Error types for better error categorization
 */
export const ErrorType = {
  NETWORK: 'network',
  TIMEOUT: 'timeout',
  SERVER: 'server',
  AUTH: 'auth',
  VALIDATION: 'validation',
  UNKNOWN: 'unknown',
};

/**
 * Categorize an error based on its properties
 */
export function categorizeError(error) {
  if (!error) return ErrorType.UNKNOWN;

  // Network errors
  if (error.message === 'Network Error' || !error.response) {
    return ErrorType.NETWORK;
  }

  // Timeout errors
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return ErrorType.TIMEOUT;
  }

  // Auth errors
  if (error.response?.status === 401 || error.response?.status === 403) {
    return ErrorType.AUTH;
  }

  // Validation errors
  if (error.response?.status === 400 || error.response?.status === 422) {
    return ErrorType.VALIDATION;
  }

  // Server errors
  if (error.response?.status >= 500) {
    return ErrorType.SERVER;
  }

  return ErrorType.UNKNOWN;
}

/**
 * Get user-friendly error message based on error type
 */
export function getErrorMessage(error, context = 'Operation') {
  const errorType = categorizeError(error);

  const messages = {
    [ErrorType.NETWORK]: {
      title: 'Connection Error',
      message: 'Please check your internet connection and try again.',
      actionable: true,
    },
    [ErrorType.TIMEOUT]: {
      title: 'Request Timeout',
      message: 'The request took too long. Please try again.',
      actionable: true,
    },
    [ErrorType.AUTH]: {
      title: 'Session Expired',
      message: 'Please log in again to continue.',
      actionable: true,
    },
    [ErrorType.VALIDATION]: {
      title: 'Invalid Data',
      message: error.response?.data?.error || 'Please check your input and try again.',
      actionable: false,
    },
    [ErrorType.SERVER]: {
      title: 'Server Error',
      message: 'Something went wrong on our end. Please try again later.',
      actionable: true,
    },
    [ErrorType.UNKNOWN]: {
      title: `${context} Failed`,
      message: error.response?.data?.error || error.message || 'An unexpected error occurred.',
      actionable: true,
    },
  };

  return messages[errorType] || messages[ErrorType.UNKNOWN];
}

/**
 * Create a wrapper for API calls with error handling
 */
export function createApiCall(apiFunction, options = {}) {
  const {
    context = 'Request',
    retries = 3,
    retryDelay = 1000,
    shouldRetry = (error) => {
      const type = categorizeError(error);
      return type === ErrorType.NETWORK || type === ErrorType.TIMEOUT;
    },
  } = options;

  return async (...args) => {
    let lastError;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await apiFunction(...args);
        return { success: true, data: result.data, status: result.status };
      } catch (error) {
        lastError = error;

        // Don't retry if it's not a retryable error
        if (!shouldRetry(error) || attempt === retries) {
          break;
        }

        // Wait before retrying (exponential backoff)
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * Math.pow(2, attempt - 1))
        );
      }
    }

    const errorInfo = getErrorMessage(lastError, context);
    return {
      success: false,
      error: errorInfo,
      errorType: categorizeError(lastError),
      originalError: __DEV__ ? lastError : undefined,
    };
  };
}

/**
 * Hook helper to manage loading, error, and data states
 */
export function createAsyncState(initialData = null) {
  return {
    data: initialData,
    loading: true,
    error: null,
    refreshing: false,
  };
}

/**
 * Arabic-aware error messages
 */
export const ErrorMessages = {
  en: {
    network: 'Please check your internet connection and try again.',
    timeout: 'The request took too long. Please try again.',
    auth: 'Please log in again to continue.',
    server: 'Something went wrong on our end. Please try again later.',
    validation: 'Please check your input and try again.',
    unknown: 'An unexpected error occurred.',
    retry: 'Retry',
    dismiss: 'Dismiss',
  },
  ar: {
    network: 'يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.',
    timeout: 'استغرق الطلب وقتًا طويلاً. يرجى المحاولة مرة أخرى.',
    auth: 'يرجى تسجيل الدخول مرة أخرى للمتابعة.',
    server: 'حدث خطأ ما. يرجى المحاولة مرة أخرى لاحقًا.',
    validation: 'يرجى التحقق من بياناتك والمحاولة مرة أخرى.',
    unknown: 'حدث خطأ غير متوقع.',
    retry: 'إعادة المحاولة',
    dismiss: 'تجاهل',
  },
};
