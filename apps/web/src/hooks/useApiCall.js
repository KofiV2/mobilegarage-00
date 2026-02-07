import { useState, useCallback, useRef, useEffect } from 'react';
import { apiCallWithRetry, isOnline } from '../utils/apiHelpers';
import { getUserFriendlyError, isRetryableError } from '../utils/errorRecovery';
import logger from '../utils/logger';

/**
 * useApiCall Hook
 * 
 * A custom hook for making API calls with built-in:
 * - Loading states
 * - Error handling with user-friendly messages
 * - Automatic retry for transient failures
 * - Request cancellation on unmount
 * - Online/offline detection
 * 
 * Usage:
 * const { data, loading, error, execute, retry, reset } = useApiCall(fetchData, {
 *   immediate: true,  // Call immediately on mount
 *   onSuccess: (data) => console.log('Success!', data),
 *   onError: (error) => console.error('Failed!', error)
 * });
 * 
 * // Or for manual execution:
 * const { execute, loading } = useApiCall();
 * const handleClick = () => execute(async () => await api.createBooking(data));
 */

export function useApiCall(asyncFunction = null, options = {}) {
  const {
    immediate = false,
    onSuccess,
    onError,
    onLoadingChange,
    retryOnMount = false,
    dependencies = []
  } = options;

  const [state, setState] = useState({
    data: null,
    loading: immediate && asyncFunction !== null,
    error: null,
    errorMessage: null,
    canRetry: false,
    retryCount: 0,
    isOnline: isOnline()
  });

  const mountedRef = useRef(true);
  const abortControllerRef = useRef(null);
  const lastFunctionRef = useRef(asyncFunction);

  // Track online status
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      // Auto-retry if we have a retryable error
      if (state.canRetry && state.error && retryOnMount) {
        retry();
      }
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [state.canRetry, state.error, retryOnMount]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const execute = useCallback(async (fn = null) => {
    const functionToCall = fn || asyncFunction;
    
    if (!functionToCall) {
      logger.warn('useApiCall: No function provided to execute');
      return;
    }

    lastFunctionRef.current = functionToCall;

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      errorMessage: null
    }));

    if (onLoadingChange) onLoadingChange(true);

    try {
      const result = await functionToCall(abortControllerRef.current.signal);

      if (!mountedRef.current) return;

      setState(prev => ({
        ...prev,
        data: result,
        loading: false,
        error: null,
        errorMessage: null,
        canRetry: false,
        retryCount: 0
      }));

      if (onSuccess) onSuccess(result);
      return result;
    } catch (error) {
      if (error.name === 'AbortError') {
        // Request was cancelled, don't update state
        return;
      }

      if (!mountedRef.current) return;

      const friendlyMessage = getUserFriendlyError(error);
      const canRetry = isRetryableError(error);

      setState(prev => ({
        ...prev,
        loading: false,
        error,
        errorMessage: friendlyMessage,
        canRetry,
        retryCount: prev.retryCount + 1
      }));

      logger.error('useApiCall error', error);

      if (onError) onError(error, friendlyMessage);
      throw error;
    } finally {
      if (onLoadingChange) onLoadingChange(false);
    }
  }, [asyncFunction, onSuccess, onError, onLoadingChange]);

  const retry = useCallback(async () => {
    if (lastFunctionRef.current) {
      return execute(lastFunctionRef.current);
    }
  }, [execute]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      errorMessage: null,
      canRetry: false,
      retryCount: 0,
      isOnline: isOnline()
    });
  }, []);

  // Execute immediately if requested
  useEffect(() => {
    if (immediate && asyncFunction) {
      execute();
    }
  }, [immediate, ...dependencies]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    ...state,
    execute,
    retry,
    reset,
    isLoading: state.loading, // Alias for convenience
    hasError: state.error !== null
  };
}

/**
 * useApiCallWithToast Hook
 * 
 * Extended version of useApiCall that integrates with the Toast notification system.
 * 
 * Usage:
 * const { execute, loading } = useApiCallWithToast(fetchData, {
 *   successMessage: 'Data loaded successfully!',
 *   errorTitle: 'Failed to load data'
 * });
 */
export function useApiCallWithToast(asyncFunction = null, options = {}) {
  const {
    successMessage,
    errorTitle = 'Error',
    showSuccessToast = !!successMessage,
    showErrorToast = true,
    useErrorRecovery = false, // If true, uses ErrorRecoveryToast instead
    ...apiCallOptions
  } = options;

  // Import toast hook dynamically to avoid circular dependencies
  const toastRef = useRef(null);

  return useApiCall(asyncFunction, {
    ...apiCallOptions,
    onSuccess: (data) => {
      if (showSuccessToast && successMessage && toastRef.current) {
        toastRef.current.showToast(successMessage, 'success');
      }
      if (apiCallOptions.onSuccess) apiCallOptions.onSuccess(data);
    },
    onError: (error, friendlyMessage) => {
      if (showErrorToast && toastRef.current) {
        toastRef.current.showToast(friendlyMessage, 'error');
      }
      if (apiCallOptions.onError) apiCallOptions.onError(error, friendlyMessage);
    }
  });
}

/**
 * usePaginatedApiCall Hook
 * 
 * Specialized hook for paginated API calls with load more functionality.
 * 
 * Usage:
 * const { items, loading, hasMore, loadMore, refresh } = usePaginatedApiCall(
 *   (page, pageSize) => fetchBookings({ page, pageSize }),
 *   { pageSize: 10 }
 * );
 */
export function usePaginatedApiCall(fetchFunction, options = {}) {
  const {
    pageSize = 10,
    initialPage = 1,
    onSuccess,
    onError
  } = options;

  const [state, setState] = useState({
    items: [],
    loading: false,
    loadingMore: false,
    error: null,
    page: initialPage,
    hasMore: true,
    totalCount: null
  });

  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadPage = useCallback(async (page, isRefresh = false) => {
    setState(prev => ({
      ...prev,
      loading: page === initialPage || isRefresh,
      loadingMore: page > initialPage && !isRefresh,
      error: null
    }));

    try {
      const result = await fetchFunction(page, pageSize);
      
      if (!mountedRef.current) return;

      const newItems = Array.isArray(result) ? result : result.items || result.data || [];
      const hasMore = result.hasMore ?? newItems.length === pageSize;
      const totalCount = result.totalCount ?? result.total ?? null;

      setState(prev => ({
        ...prev,
        items: isRefresh || page === initialPage 
          ? newItems 
          : [...prev.items, ...newItems],
        loading: false,
        loadingMore: false,
        page,
        hasMore,
        totalCount
      }));

      if (onSuccess) onSuccess(newItems, page);
    } catch (error) {
      if (!mountedRef.current) return;

      setState(prev => ({
        ...prev,
        loading: false,
        loadingMore: false,
        error
      }));

      if (onError) onError(error);
    }
  }, [fetchFunction, pageSize, initialPage, onSuccess, onError]);

  const loadMore = useCallback(() => {
    if (!state.loading && !state.loadingMore && state.hasMore) {
      loadPage(state.page + 1);
    }
  }, [state.loading, state.loadingMore, state.hasMore, state.page, loadPage]);

  const refresh = useCallback(() => {
    loadPage(initialPage, true);
  }, [loadPage, initialPage]);

  const reset = useCallback(() => {
    setState({
      items: [],
      loading: false,
      loadingMore: false,
      error: null,
      page: initialPage,
      hasMore: true,
      totalCount: null
    });
  }, [initialPage]);

  return {
    ...state,
    loadMore,
    refresh,
    reset
  };
}

export default useApiCall;
