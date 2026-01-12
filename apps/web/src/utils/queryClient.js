import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // Data is fresh for 2 minutes (default for lists)
      gcTime: 10 * 60 * 1000, // Cache stays in memory for 10 minutes (replaces cacheTime in v5)
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
      retry: (failureCount, error) => {
        // Don't retry on 401/403 errors
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          return false;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: false,
      // Global error handling for mutations
      onError: (error) => {
        console.error('Mutation error:', error);
      }
    }
  }
});

// Helper function to invalidate specific queries
export const invalidateQueries = (queryKeys) => {
  if (Array.isArray(queryKeys)) {
    queryKeys.forEach(key => {
      queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] });
    });
  } else {
    queryClient.invalidateQueries({ queryKey: Array.isArray(queryKeys) ? queryKeys : [queryKeys] });
  }
};

// Prefetch data for better UX
export const prefetchQuery = (queryKey, queryFn, options = {}) => {
  return queryClient.prefetchQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn,
    ...options
  });
};

// Set query data manually
export const setQueryData = (queryKey, data) => {
  queryClient.setQueryData(Array.isArray(queryKey) ? queryKey : [queryKey], data);
};

// Get query data
export const getQueryData = (queryKey) => {
  return queryClient.getQueryData(Array.isArray(queryKey) ? queryKey : [queryKey]);
};

// Cache time presets for different data types
export const CACHE_TIMES = {
  DASHBOARD_STATS: 5 * 60 * 1000, // 5 minutes for dashboard stats
  LISTS: 2 * 60 * 1000, // 2 minutes for lists (users, bookings, etc.)
  DETAILS: 3 * 60 * 1000, // 3 minutes for detail pages
  STATIC: 10 * 60 * 1000, // 10 minutes for static data (services, categories)
  REAL_TIME: 30 * 1000, // 30 seconds for real-time data
};
