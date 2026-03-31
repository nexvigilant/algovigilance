'use client';

/**
 * Due Cards Indicator Component
 *
 * Shows the number of cards due for review with optional detailed breakdown.
 * Can be used in sidebars, dashboards, or navigation.
 *
 * @example
 * ```tsx
 * // Simple badge
 * <DueCardsIndicator variant="badge" />
 *
 * // Full card with breakdown
 * <DueCardsIndicator variant="card" onClick={() => setShowReview(true)} />
 * ```
 */

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Zap, CheckCircle2, RotateCcw, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getDueCardsGrouped, getFSRSStats, type FSRSStats } from '@/lib/actions/fsrs';
import { cn } from '@/lib/utils';

import { logger } from '@/lib/logger';
const log = logger.scope('components/due-cards-indicator');

interface DueCardsIndicatorProps {
  /** Display variant */
  variant?: 'badge' | 'compact' | 'card';
  /** Click handler (for starting review session) */
  onClick?: () => void;
  /** Show even if no cards are due */
  showWhenEmpty?: boolean;
  /** Additional CSS classes */
  className?: string;
}

interface DueCardsData {
  learning: number;
  review: number;
  relearning: number;
  total: number;
}

export function DueCardsIndicator({
  variant = 'badge',
  onClick,
  showWhenEmpty = false,
  className,
}: DueCardsIndicatorProps) {
  const { user, loading: authLoading } = useAuth();
  const [dueData, setDueData] = useState<DueCardsData | null>(null);
  const [stats, setStats] = useState<FSRSStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If auth is still loading, wait
    if (authLoading) return;

    // If user is not logged in, clear loading state
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }

    async function fetchDueCards(attempt = 1) {
      if (!user) return; // Explicit null check for safety

      try {
        setIsLoading(true);
        const [grouped, statsData] = await Promise.all([
          getDueCardsGrouped(user.uid),
          getFSRSStats(user.uid),
        ]);

        setDueData({
          learning: grouped.learning.length,
          review: grouped.review.length,
          relearning: grouped.relearning.length,
          total: grouped.total,
        });
        setStats(statsData);
      } catch (error) {
        // Retry once on transient server action failures (e.g., Turbopack HMR)
        if (attempt < 2) {
          log.debug('Retrying due cards fetch after transient failure');
          setTimeout(() => fetchDueCards(attempt + 1), 1500);
          return;
        }
        const message = error instanceof Error ? error.message : String(error);
        log.error(`Failed to fetch due cards: ${message}`, error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDueCards();

    // Refresh every 5 minutes
    const interval = setInterval(fetchDueCards, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, authLoading]);

  // Loading state
  if (authLoading || isLoading) {
    if (variant === 'badge') return null;
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="h-4 w-16 bg-nex-surface rounded" />
      </div>
    );
  }

  // Not logged in
  if (!user) return null;

  // No cards due
  if (!dueData || dueData.total === 0) {
    if (!showWhenEmpty) return null;

    if (variant === 'badge') {
      return (
        <Badge variant="outline" className={cn('text-emerald-400 border-emerald-400/30', className)}>
          <CheckCircle2 className="h-3 w-3 mr-1" />
          All caught up
        </Badge>
      );
    }

    if (variant === 'compact') {
      return (
        <div className={cn('flex items-center gap-2 text-xs text-slate-dim', className)}>
          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
          <span>No reviews due</span>
        </div>
      );
    }

    return (
      <Card className={cn('bg-emerald-500/10 border-emerald-500/30', className)}>
        <CardContent className="py-3 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <span className="text-sm text-emerald-400">All caught up!</span>
        </CardContent>
      </Card>
    );
  }

  // Badge variant
  if (variant === 'badge') {
    const badgeContent = (
      <Badge
        variant="default"
        className={cn(
          'bg-cyan text-nex-deep transition-colors',
          onClick && 'hover:bg-cyan-glow',
          className
        )}
      >
        <Brain className="h-3 w-3 mr-1" />
        {dueData.total} due
      </Badge>
    );

    // Wrap in button for keyboard accessibility when clickable
    if (onClick) {
      return (
        <button
          type="button"
          onClick={onClick}
          className="appearance-none bg-transparent border-none p-0 cursor-pointer"
        >
          {badgeContent}
        </button>
      );
    }

    return badgeContent;
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg',
          'bg-cyan/10 border border-cyan/30 hover:bg-cyan/20',
          'transition-colors cursor-pointer',
          className
        )}
      >
        <Brain className="h-4 w-4 text-cyan" />
        <span className="text-sm font-medium text-cyan">{dueData.total}</span>
        <span className="text-xs text-slate-dim">due</span>
        {onClick && <ChevronRight className="h-3 w-3 text-slate-dim ml-1" />}
      </button>
    );
  }

  // Card variant
  return (
    <Card className={cn('bg-nex-surface border-nex-border', className)}>
      <CardContent className="py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-cyan" />
            <span className="font-semibold text-slate-light">Spaced Reviews</span>
          </div>
          <Badge className="bg-cyan text-nex-deep">
            {dueData.total} due
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="p-2 rounded-lg bg-nex-deep border border-nex-border text-center">
            <div className="flex items-center justify-center gap-1 text-blue-400">
              <Zap className="h-3 w-3" />
              <span className="font-mono text-sm">{dueData.learning}</span>
            </div>
            <span className="text-[10px] text-slate-dim">Learning</span>
          </div>
          <div className="p-2 rounded-lg bg-nex-deep border border-nex-border text-center">
            <div className="flex items-center justify-center gap-1 text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              <span className="font-mono text-sm">{dueData.review}</span>
            </div>
            <span className="text-[10px] text-slate-dim">Review</span>
          </div>
          <div className="p-2 rounded-lg bg-nex-deep border border-nex-border text-center">
            <div className="flex items-center justify-center gap-1 text-orange-400">
              <RotateCcw className="h-3 w-3" />
              <span className="font-mono text-sm">{dueData.relearning}</span>
            </div>
            <span className="text-[10px] text-slate-dim">Relearning</span>
          </div>
        </div>

        {onClick && (
          <Button onClick={onClick} className="w-full" size="sm">
            Start Review Session
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}

        {stats && (
          <div className="mt-3 pt-3 border-t border-nex-border flex items-center justify-between text-xs text-slate-dim">
            <span>{stats.totalCards} total cards</span>
            <span>{Math.round(stats.averageRetention * 100)}% retention</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DueCardsIndicator;
