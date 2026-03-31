'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { Trophy, Medal, Crown, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getDomainLeaderboard, type LeaderboardEntry } from './domain-leaderboard-actions';

import { logger } from '@/lib/logger';
const log = logger.scope('academy/domain-leaderboard');

interface DomainLeaderboardProps {
  className?: string;
}

const RANK_ICONS = [Crown, Trophy, Medal] as const;
const RANK_COLORS = ['text-gold', 'text-cyan', 'text-amber-600'] as const;

/**
 * Domain leaderboard showing top practitioners by pathway completion.
 * Ranks users by completed pathways, with progress as tiebreaker.
 * Current user is highlighted if present.
 */
export function DomainLeaderboard({ className }: DomainLeaderboardProps) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getDomainLeaderboard(10);
        setEntries(data);
      } catch (err) {
        log.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className={cn('bg-nex-dark/80 border border-nex-light/30 rounded-2xl p-5', className)}>
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className={cn('bg-nex-dark/80 border border-nex-light/30 rounded-2xl p-5', className)}>
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-gold" />
          <h3 className="text-sm font-semibold text-slate-light tracking-wide">
            Leaderboard
          </h3>
        </div>
        <div className="flex items-center justify-center h-24 text-slate-dim text-sm">
          No practitioners ranked yet. Be the first to complete a pathway!
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-nex-dark/80 border border-nex-light/30 rounded-2xl p-5', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-gold" />
          <h3 className="text-sm font-semibold text-slate-light tracking-wide">
            Practitioner Rankings
          </h3>
        </div>
        <span className="text-xs text-slate-dim">
          Top {entries.length} practitioners
        </span>
      </div>

      {/* Leaderboard entries */}
      <div className="space-y-1.5">
        {entries.map((entry, index) => {
          const isCurrentUser = user?.uid === entry.userId;
          const RankIcon = index < 3 ? RANK_ICONS[index] : null;
          const rankColor = index < 3 ? RANK_COLORS[index] : 'text-slate-dim';

          return (
            <div
              key={entry.userId}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                isCurrentUser
                  ? 'bg-cyan/10 border border-cyan/20'
                  : 'hover:bg-nex-light/5',
              )}
            >
              {/* Rank */}
              <div className="w-8 flex-shrink-0 flex items-center justify-center">
                {RankIcon ? (
                  <RankIcon className={cn('h-4.5 w-4.5', rankColor)} />
                ) : (
                  <span className="text-sm font-mono text-slate-dim">
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Avatar + Name */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                    isCurrentUser
                      ? 'bg-cyan/20 text-cyan border border-cyan/30'
                      : 'bg-nex-light/10 text-slate-dim',
                  )}>
                    {entry.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <span className={cn(
                      'text-sm font-medium truncate block',
                      isCurrentUser ? 'text-cyan' : 'text-slate-light',
                    )}>
                      {entry.displayName}
                      {isCurrentUser && (
                        <span className="text-[10px] text-cyan/60 ml-1">(you)</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <span className="text-sm font-bold text-gold">
                    {entry.completedPathways}
                  </span>
                  <span className="text-[10px] text-slate-dim ml-0.5">done</span>
                </div>
                <div className="w-16">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-slate-dim" />
                    <span className="text-xs text-slate-dim">
                      {Math.round(entry.averageProgress)}%
                    </span>
                  </div>
                  <div className="h-1 bg-nex-light/10 rounded-full mt-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan to-gold"
                      style={{ width: `${Math.min(100, entry.averageProgress)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer - user's rank if not in top N */}
      {user && !entries.some(e => e.userId === user.uid) && (
        <div className="mt-3 pt-3 border-t border-nex-light/10 text-center">
          <span className="text-xs text-slate-dim">
            Complete pathways to appear on the leaderboard
          </span>
        </div>
      )}
    </div>
  );
}
