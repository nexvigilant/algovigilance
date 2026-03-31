'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSeriesProgress } from '@/hooks/use-series-progress';

interface ArticleReadTrackerProps {
  seriesSlug: string;
  articleSlug: string;
  totalArticles: number;
}

/**
 * Invisible component that tracks when a user reads an article.
 * Marks the article as read after 30 seconds of viewing.
 */
export function ArticleReadTracker({
  seriesSlug,
  articleSlug,
  totalArticles,
}: ArticleReadTrackerProps) {
  const { user } = useAuth();
  const { markAsRead, hasRead } = useSeriesProgress({
    seriesSlug,
    totalArticles,
  });
  const hasMarkedRef = useRef(false);

  useEffect(() => {
    // Only track for authenticated users
    if (!user) return;

    // Don't track if already read
    if (hasRead(articleSlug)) return;

    // Don't mark twice
    if (hasMarkedRef.current) return;

    // Mark as read after 30 seconds of viewing
    const timer = setTimeout(() => {
      if (!hasMarkedRef.current) {
        hasMarkedRef.current = true;
        markAsRead(articleSlug);
      }
    }, 30000); // 30 seconds

    return () => clearTimeout(timer);
  }, [user, articleSlug, hasRead, markAsRead]);

  // This component renders nothing
  return null;
}
