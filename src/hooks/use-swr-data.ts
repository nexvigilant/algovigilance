"use client";

import useSWR, { type SWRConfiguration } from "swr";
import { toast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";

const log = logger.scope("useSWRData");

interface UseSWRDataOptions<T> extends Pick<
  SWRConfiguration<T>,
  "refreshInterval" | "revalidateOnFocus" | "dedupingInterval"
> {
  /** Show toast on error (default: true) */
  showToast?: boolean;
  /** Custom error handler */
  onError?: (error: Error) => void;
  /** Fallback data while loading */
  fallback?: T;
}

interface UseSWRDataResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isEmpty: boolean;
  retry: () => void;
  mutate: ReturnType<typeof useSWR<T>>["mutate"];
}

/**
 * SWR-based data hook with cross-page caching and request deduplication.
 *
 * Drop-in improvement over useApiData:
 * - Requests with the same key are deduped (no duplicate fetches)
 * - Data is cached across page navigations (stale-while-revalidate)
 * - Automatic revalidation on window focus
 * - Optimistic updates via mutate()
 *
 * @param key - Unique cache key (null to skip fetching)
 * @param fetcher - Async function that returns data
 * @param options - SWR and error handling options
 *
 * @example
 * ```tsx
 * const { data, isLoading, retry } = useSWRData(
 *   user ? `profile-${user.uid}` : null,
 *   () => fetchUserProfile(user.uid),
 * );
 * ```
 */
export function useSWRData<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  options: UseSWRDataOptions<T> = {},
): UseSWRDataResult<T> {
  const {
    showToast = true,
    onError,
    fallback,
    refreshInterval = 0,
    revalidateOnFocus = true,
    dedupingInterval = 2000,
  } = options;

  const { data, error, isLoading, isValidating, mutate } = useSWR<T>(
    key,
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus,
      dedupingInterval,
      keepPreviousData: true,
      fallbackData: fallback,
      onError: (err: Error) => {
        log.error("SWR fetch failed", { key, error: err.message });
        if (showToast) {
          toast({
            title: "Connection Error",
            description:
              "Unable to reach the service. Please check your connection and try again.",
            variant: "destructive",
          });
        }
        onError?.(err);
      },
    },
  );

  const isEmpty = !data && !error && !isLoading && !isValidating;

  return {
    data: data ?? null,
    error: error ?? null,
    isLoading: isLoading && !data,
    isEmpty,
    retry: () => mutate(),
    mutate,
  };
}
