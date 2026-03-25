import { QueryClient } from '@tanstack/react-query';
import { LibraryError } from '@jellysync/shared';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof LibraryError && (error.type === 'unauthorized' || error.type === 'not-found')) {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
    },
  },
});
