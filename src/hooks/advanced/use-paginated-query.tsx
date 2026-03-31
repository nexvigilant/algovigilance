'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface PaginatedQueryConfig<T> {
  /** Unique key for caching */
  queryKey: string;

  /** Function to fetch data for a given page */
  queryFn: (page: number, pageSize: number) => Promise<{ data: T[]; total: number }>;

  /** Number of items per page */
  pageSize?: number;

  /** Cache time in milliseconds (default: 5 minutes) */
  cacheTime?: number;

  /** Enable caching (default: true) */
  enableCache?: boolean;

  /** Initial page (default: 1) */
  initialPage?: number;
}

export interface PaginatedQueryResult<T> {
  /** Current page data */
  data: T[];

  /** Current page number (1-indexed) */
  page: number;

  /** Total number of pages */
  totalPages: number;

  /** Total number of items across all pages */
  totalItems: number;

  /** Navigate to next page */
  nextPage: () => void;

  /** Navigate to previous page */
  prevPage: () => void;

  /** Navigate to specific page */
  goToPage: (page: number) => void;

  /** Whether data is loading for the first time */
  isLoading: boolean;

  /** Whether data is being fetched (including subsequent pages) */
  isFetching: boolean;

  /** Whether there is a next page */
  hasNextPage: boolean;

  /** Whether there is a previous page */
  hasPrevPage: boolean;

  /** Error if fetch failed */
  error: Error | null;

  /** Refetch current page */
  refetch: () => void;
}

interface CacheEntry<T> {
  data: T[];
  total: number;
  timestamp: number;
}

// Global cache storage
const queryCache = new Map<string, Map<number, CacheEntry<any>>>();

/**
 * Advanced pagination hook with caching and optimized re-fetching
 *
 * @example
 * ```tsx
 * const { data, page, totalPages, nextPage, prevPage, isLoading } = usePaginatedQuery({
 *   queryKey: 'posts',
 *   queryFn: async (page, pageSize) => {
 *     const posts = await fetchPosts(page, pageSize);
 *     return { data: posts, total: 100 };
 *   },
 *   pageSize: 20,
 * });
 * ```
 */
export function usePaginatedQuery<T>({
  queryKey,
  queryFn,
  pageSize = 10,
  cacheTime = 5 * 60 * 1000, // 5 minutes
  enableCache = true,
  initialPage = 1,
}: PaginatedQueryConfig<T>): PaginatedQueryResult<T> {
  const [page, setPage] = useState(initialPage);
  const [data, setData] = useState<T[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Get or create cache for this query
  const getCache = useCallback(() => {
    if (!enableCache) return null;

    if (!queryCache.has(queryKey)) {
      queryCache.set(queryKey, new Map());
    }
    return queryCache.get(queryKey)!;
  }, [queryKey, enableCache]);

  // Check if cached data is still valid
  const getCachedData = useCallback((pageNum: number): CacheEntry<T> | null => {
    const cache = getCache();
    if (!cache) return null;

    const entry = cache.get(pageNum);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > cacheTime) {
      cache.delete(pageNum);
      return null;
    }

    return entry;
  }, [getCache, cacheTime]);

  // Cache data for a page
  const setCachedData = useCallback((pageNum: number, data: T[], total: number) => {
    const cache = getCache();
    if (!cache) return;

    cache.set(pageNum, {
      data,
      total,
      timestamp: Date.now(),
    });
  }, [getCache]);

  // Fetch data for current page
  const fetchPage = useCallback(async (pageNum: number) => {
    // Check cache first
    const cached = getCachedData(pageNum);
    if (cached) {
      if (isMounted.current) {
        setData(cached.data);
        setTotalItems(cached.total);
        setIsLoading(false);
        setIsFetching(false);
        setError(null);
      }
      return;
    }

    // Fetch from server
    if (isMounted.current) {
      setIsFetching(true);
      setError(null);
    }

    try {
      const result = await queryFn(pageNum, pageSize);

      if (isMounted.current) {
        setData(result.data);
        setTotalItems(result.total);
        setIsLoading(false);
        setIsFetching(false);

        // Cache the result
        setCachedData(pageNum, result.data, result.total);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err : new Error('Failed to fetch data'));
        setIsLoading(false);
        setIsFetching(false);
      }
    }
  }, [queryFn, pageSize, getCachedData, setCachedData]);

  // Fetch when page changes
  useEffect(() => {
    fetchPage(page);
  }, [page, fetchPage]);

  // Calculate total pages
  const totalPages = Math.ceil(totalItems / pageSize);

  // Navigation functions
  const nextPage = useCallback(() => {
    setPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToPage = useCallback((newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  }, [totalPages]);

  const refetch = useCallback(() => {
    // Clear cache for current page
    const cache = getCache();
    if (cache) {
      cache.delete(page);
    }
    fetchPage(page);
  }, [page, fetchPage, getCache]);

  return {
    data,
    page,
    totalPages,
    totalItems,
    nextPage,
    prevPage,
    goToPage,
    isLoading,
    isFetching,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    error,
    refetch,
  };
}
