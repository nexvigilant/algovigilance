'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

const log = logger.scope('useApiData');

interface UseApiDataOptions {
  onError?: (error: Error) => void;
}

interface UseApiDataResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isEmpty: boolean;
  retry: () => void;
}

/**
 * Hook for loading data from API endpoints with error handling, toast
 * notifications, and retry support.
 *
 * Wraps a fetcher function (typically containing Promise.all for multiple
 * endpoints) and handles catastrophic failures (network down, server
 * unreachable) by surfacing a toast and exposing the error for UI rendering.
 *
 * Per-endpoint `res.ok` checks remain in the fetcher — partial data is fine.
 * This hook only catches the outer failure case.
 */
export function useApiData<T>(
  fetcher: () => Promise<T>,
  options?: UseApiDataOptions
): UseApiDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      setData(result);
    } catch (err: unknown) {
      const normalized =
        err instanceof Error ? err : new Error('Failed to load data');
      setError(normalized);
      log.error('API data fetch failed', normalized);
      toast({
        title: 'Connection Error',
        description:
          'Unable to reach the service. Please check your connection and try again.',
        variant: 'destructive',
      });
      options?.onError?.(normalized);
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  useEffect(() => {
    void load();
    // Load once on mount — fetcher identity changes are captured via ref
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retry = useCallback(() => {
    void load();
  }, [load]);

  const isEmpty = data === null && error === null && !isLoading;

  return { data, error, isLoading, isEmpty, retry };
}
