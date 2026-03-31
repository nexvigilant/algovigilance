'use client';

import { useSeriesProgress } from '@/hooks/use-series-progress';
import { useAuth } from '@/hooks/use-auth';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, BookOpen, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SeriesProgressProps {
  seriesSlug: string;
  totalArticles: number;
  className?: string;
}

/**
 * Displays the user's reading progress through a content series.
 * Only shows for authenticated users.
 */
export function SeriesProgress({
  seriesSlug,
  totalArticles,
  className,
}: SeriesProgressProps) {
  const { user, loading: authLoading } = useAuth();
  const { progress, isLoading, progressPercent, readCount } = useSeriesProgress({
    seriesSlug,
    totalArticles,
  });

  // Don't show anything while loading auth
  if (authLoading) return null;

  // Don't show for unauthenticated users
  if (!user) return null;

  // Show skeleton while loading progress
  if (isLoading) {
    return (
      <div className={cn('p-4 rounded-lg bg-nex-surface/50 border border-nex-light animate-pulse', className)}>
        <div className="h-4 bg-nex-light rounded w-1/3 mb-2" />
        <div className="h-2 bg-nex-light rounded w-full" />
      </div>
    );
  }

  // User hasn't started yet
  if (!progress || readCount === 0) {
    return (
      <div className={cn('p-4 rounded-lg bg-nex-surface/50 border border-nex-light', className)}>
        <div className="flex items-center gap-2 text-slate-dim">
          <BookOpen className="h-4 w-4" />
          <span className="text-sm">
            Sign in to track your progress through this series
          </span>
        </div>
      </div>
    );
  }

  // Show progress
  return (
    <div className={cn('p-4 rounded-lg bg-gradient-to-r from-cyan/10 via-nex-surface to-nex-surface border border-cyan/20', className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {progress.isCompleted ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-sm font-medium text-green-400">Series Completed!</span>
            </>
          ) : (
            <>
              <Clock className="h-4 w-4 text-cyan" />
              <span className="text-sm font-medium text-cyan">Your Progress</span>
            </>
          )}
        </div>
        <Badge
          variant="outline"
          className={cn(
            'text-xs',
            progress.isCompleted
              ? 'border-green-500/30 text-green-400'
              : 'border-cyan/30 text-cyan'
          )}
        >
          {readCount} of {totalArticles} articles
        </Badge>
      </div>

      <Progress
        value={progressPercent}
        className="h-2"
      />

      <p className="text-xs text-slate-dim mt-2">
        {progress.isCompleted
          ? 'You\'ve completed all articles in this series.'
          : `${totalArticles - readCount} more to go. Keep reading!`}
      </p>
    </div>
  );
}

interface ArticleReadIndicatorProps {
  seriesSlug: string;
  articleSlug: string;
  totalArticles: number;
}

/**
 * Small indicator showing if a specific article has been read.
 * Used in series article lists.
 */
export function ArticleReadIndicator({
  seriesSlug,
  articleSlug,
  totalArticles,
}: ArticleReadIndicatorProps) {
  const { user } = useAuth();
  const { hasRead, isLoading } = useSeriesProgress({
    seriesSlug,
    totalArticles,
  });

  // Don't show for unauthenticated users
  if (!user) return null;

  // Don't show while loading
  if (isLoading) return null;

  // Show read indicator
  if (hasRead(articleSlug)) {
    return (
      <Badge
        variant="outline"
        className="border-green-500/30 bg-green-500/10 text-green-400 text-xs"
      >
        <CheckCircle className="h-3 w-3 mr-1" />
        Read
      </Badge>
    );
  }

  return null;
}
