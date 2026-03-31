'use client';


import { logger } from '@/lib/logger';
const log = logger.scope('hooks/use-series-progress');
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { SeriesProgressSerialized } from '@/types/series';

interface UseSeriesProgressOptions {
  seriesSlug: string;
  totalArticles: number;
}

interface UseSeriesProgressReturn {
  /** Current progress data */
  progress: SeriesProgressSerialized | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Mark an article as read */
  markAsRead: (articleSlug: string) => Promise<void>;
  /** Check if a specific article has been read */
  hasRead: (articleSlug: string) => boolean;
  /** Progress percentage (0-100) */
  progressPercent: number;
  /** Number of articles read */
  readCount: number;
}

/**
 * Hook for tracking user progress through a content series.
 * Requires authentication - returns empty progress for unauthenticated users.
 */
export function useSeriesProgress({
  seriesSlug,
  totalArticles,
}: UseSeriesProgressOptions): UseSeriesProgressReturn {
  const { user, loading: authLoading } = useAuth();
  const [progress, setProgress] = useState<SeriesProgressSerialized | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch progress on mount and when user changes
  useEffect(() => {
    async function fetchProgress() {
      if (authLoading) return;

      if (!user) {
        setProgress(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(`/api/series-progress?seriesSlug=${encodeURIComponent(seriesSlug)}`);

        if (!response.ok) {
          if (response.status === 404) {
            // No progress yet - that's fine
            setProgress(null);
          } else {
            throw new Error('Failed to fetch series progress');
          }
        } else {
          const data = await response.json();
          setProgress(data.progress);
        }
      } catch (err) {
        log.error('Error fetching series progress:', err);
        setError(err instanceof Error ? err.message : 'Failed to load progress');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProgress();
  }, [user, authLoading, seriesSlug]);

  // Mark an article as read
  const markAsRead = useCallback(
    async (articleSlug: string) => {
      if (!user) return;

      try {
        const response = await fetch('/api/series-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            seriesSlug,
            articleSlug,
            totalArticles,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to mark article as read');
        }

        const data = await response.json();
        setProgress(data.progress);
      } catch (err) {
        log.error('Error marking article as read:', err);
        setError(err instanceof Error ? err.message : 'Failed to update progress');
      }
    },
    [user, seriesSlug, totalArticles]
  );

  // Check if an article has been read
  const hasRead = useCallback(
    (articleSlug: string): boolean => {
      if (!progress) return false;
      return progress.readSlugs.includes(articleSlug);
    },
    [progress]
  );

  // Calculate progress percentage
  const progressPercent = progress?.progress ?? 0;
  const readCount = progress?.readSlugs.length ?? 0;

  return {
    progress,
    isLoading: authLoading || isLoading,
    error,
    markAsRead,
    hasRead,
    progressPercent,
    readCount,
  };
}
