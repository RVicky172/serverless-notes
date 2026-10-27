import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./apiClient";

/** Shared TanStack Query client: caches server data and handles retries. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Retrying a 4xx (bad input, not found, unauthorized) cannot succeed.
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status < 500) && failureCount < 2,
    },
  },
});
