import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
      cacheTime: 10 * 60 * 1000, // Cache stays in memory for 10 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
      onError: (error) => {
        console.error('Query error:', error);
      }
    },
    mutations: {
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
      queryClient.invalidateQueries({ queryKey: [key] });
    });
  } else {
    queryClient.invalidateQueries({ queryKey: [queryKeys] });
  }
};

// Prefetch data for better UX
export const prefetchQuery = (queryKey, queryFn) => {
  return queryClient.prefetchQuery({
    queryKey: [queryKey],
    queryFn
  });
};
