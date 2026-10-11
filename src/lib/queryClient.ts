import { QueryClient } from '@tanstack/react-query';
import { shouldRetryQuery } from './client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 15_000, retry: shouldRetryQuery, refetchOnWindowFocus: true },
  },
});
