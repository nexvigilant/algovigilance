'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface InfiniteScrollConfig<T> {
  /** Function to fetch data for a given page */
  queryFn: (page: number, pageSize: number) => Promise<{ data: T[]; hasMore: boolean }>;

  /** Number of items per page */
  pageSize?: number;

  /** Intersection observer threshold (0-1) */
  threshold?: number;

  /** Root margin for intersection observer */
  rootMargin?: string;

  /** Enable infinite scroll (default: true) */
  enabled?: boolean;

  /** Initial data (optional) */
  initialData?: T[];
}

export interface InfiniteScrollResult<T> {
  /** All loaded data across pages */
  data: T[];

  /** Load more data */
  loadMore: () => void;

  /** Whether more data is available */
  hasMore: boolean;

  /** Whether data is loading */
  isLoading: boolean;

  /** Whether loading more data (not initial load) */
  isFetchingMore: boolean;

  /** Error if fetch failed */
  error: Error | null;

  /** Current page number */
  page: number;

  /** Ref to attach to sentinel element */
  sentinelRef: (node: HTMLElement | null) => void;

  /** Reset to initial state */
  reset: () => void;
}

/**
 * Hook for infinite scrolling with automatic loading via intersection observer
 *
 * @example
 * ```tsx
 * const { data, loadMore, hasMore, isLoading, sentinelRef } = useInfiniteScroll({
 *   queryFn: async (page, pageSize) => {
 *     const posts = await fetchPosts(page, pageSize);
 *     return {
 *       data: posts,
 *       hasMore: posts.length === pageSize
 *     };
 *   },
 *   pageSize: 20,
 *   threshold: 0.8,
 * });
 *
 * return (
 *   <div>
 *     {data.map(post => <PostCard key={post.id} post={post} />)}
 *     {hasMore && <div ref={sentinelRef}>Loading...</div>}
 *   </div>
 * );
 * ```
 */
export function useInfiniteScroll<T>({
  queryFn,
  pageSize = 20,
  threshold = 0.8,
  rootMargin = '100px',
  enabled = true,
  initialData = [],
}: InfiniteScrollConfig<T>): InfiniteScrollResult<T> {
  const [data, setData] = useState<T[]>(initialData);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Observer instance
  const observer = useRef<IntersectionObserver | null>(null);

  // Track if component is mounted
  const isMounted = useRef(true);

  // Track if we're currently fetching to prevent duplicate requests
  const isFetching = useRef(false);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Fetch data for current page
  const fetchPage = useCallback(
    async (pageNum: number) => {
      // Prevent duplicate requests
      if (isFetching.current || !enabled) return;

      isFetching.current = true;

      if (isMounted.current) {
        if (pageNum === 1) {
          setIsLoading(true);
        } else {
          setIsFetchingMore(true);
        }
        setError(null);
      }

      try {
        const result = await queryFn(pageNum, pageSize);

        if (isMounted.current) {
          setData((prev) => (pageNum === 1 ? result.data : [...prev, ...result.data]));
          setHasMore(result.hasMore);
          setIsLoading(false);
          setIsFetchingMore(false);
        }
      } catch (err) {
        if (isMounted.current) {
          setError(err instanceof Error ? err : new Error('Failed to fetch data'));
          setIsLoading(false);
          setIsFetchingMore(false);
        }
      } finally {
        isFetching.current = false;
      }
    },
    [queryFn, pageSize, enabled]
  );

  // Load initial data on mount
  // NOTE: Config (queryFn, pageSize, initialData) is treated as immutable.
  // If config changes, call reset() to re-fetch with new config.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (initialData.length === 0) {
      fetchPage(1);
    }
  }, []);

  // Load more data
  const loadMore = useCallback(() => {
    if (!hasMore || isFetching.current || !enabled) return;

    const nextPage = page + 1;
    setPage(nextPage);
    fetchPage(nextPage);
  }, [page, hasMore, fetchPage, enabled]);

  // Sentinel ref callback for intersection observer
  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      // Cleanup previous observer
      if (observer.current) {
        observer.current.disconnect();
      }

      // Don't observe if we don't have more data or infinite scroll is disabled
      if (!hasMore || !enabled) return;

      // Create new observer
      observer.current = new IntersectionObserver(
        (entries) => {
          // Load more when sentinel is visible
          if (entries[0].isIntersecting && entries[0].intersectionRatio >= threshold) {
            loadMore();
          }
        },
        {
          threshold,
          rootMargin,
        }
      );

      // Observe the sentinel element
      if (node) {
        observer.current.observe(node);
      }
    },
    [hasMore, loadMore, threshold, rootMargin, enabled]
  );

  // Reset to initial state
  const reset = useCallback(() => {
    setData(initialData);
    setPage(1);
    setHasMore(true);
    setError(null);
    setIsLoading(false);
    setIsFetchingMore(false);
    isFetching.current = false;

    if (initialData.length === 0) {
      fetchPage(1);
    }
  }, [initialData, fetchPage]);

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  return {
    data,
    loadMore,
    hasMore,
    isLoading,
    isFetchingMore,
    error,
    page,
    sentinelRef,
    reset,
  };
}
