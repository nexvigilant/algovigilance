'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TrendingUp, Users, MessageSquare, Flame, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getTrendingForums, type TrendingForum } from '../../actions/trending';

interface TrendingForumsProps {
  limit?: number;
  className?: string;
  compact?: boolean;
}

function ActivityBadge({ level }: { level: 'low' | 'medium' | 'high' }) {
  const config = {
    low: { label: 'Steady', className: 'bg-slate-dim/20 text-slate-dim' },
    medium: { label: 'Active', className: 'bg-cyan/20 text-cyan' },
    high: { label: 'Hot', className: 'bg-gold/20 text-gold' },
  };

  const { label, className } = config[level];

  return (
    <Badge variant="secondary" className={cn('text-xs font-medium', className)}>
      {level === 'high' && <Flame className="mr-1 h-3 w-3" />}
      {label}
    </Badge>
  );
}

function ForumCardSkeleton() {
  return (
    <Card className="bg-nex-surface border-nex-border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export function TrendingForums({ limit = 5, className, compact = false }: TrendingForumsProps) {
  const [forums, setForums] = useState<TrendingForum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrending() {
      try {
        const result = await getTrendingForums(limit);
        if (result.success && result.data) {
          setForums(result.data);
        } else {
          setError(result.error || 'Failed to load trending forums');
        }
      } catch (err) {
        setError('Failed to load trending forums');
      } finally {
        setLoading(false);
      }
    }

    fetchTrending();
  }, [limit]);

  if (error) {
    return (
      <Card className={cn('bg-nex-surface border-nex-border', className)}>
        <CardContent className="p-6 text-center">
          <p className="text-slate-dim">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // Compact mode: horizontal scrolling chips
  if (compact) {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-cyan" />
          <span className="text-sm font-medium text-slate-light">Trending Now</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {loading ? (
            <>
              <Skeleton className="h-8 w-32 rounded-full flex-shrink-0" />
              <Skeleton className="h-8 w-28 rounded-full flex-shrink-0" />
              <Skeleton className="h-8 w-36 rounded-full flex-shrink-0" />
              <Skeleton className="h-8 w-24 rounded-full flex-shrink-0" />
            </>
          ) : forums.length === 0 ? (
            <span className="text-sm text-slate-dim">No trending circles yet</span>
          ) : (
            forums.map((forum, index) => (
              <Link
                key={forum.id}
                href={`/nucleus/community/circles/${forum.id}`}
                className="flex-shrink-0"
              >
                <Badge
                  variant="outline"
                  className={cn(
                    'cursor-pointer px-3 py-1.5 text-sm transition-all duration-200',
                    'border-nex-border hover:border-cyan/50 hover:bg-cyan/5',
                    forum.activityLevel === 'high' && 'border-gold/30 hover:border-gold/50'
                  )}
                >
                  <span className="mr-1.5 font-mono text-xs text-cyan/60">
                    #{index + 1}
                  </span>
                  <span className="text-slate-light">{forum.name}</span>
                  {forum.activityLevel === 'high' && (
                    <Flame className="ml-1.5 h-3 w-3 text-gold" />
                  )}
                </Badge>
              </Link>
            ))
          )}
        </div>
      </div>
    );
  }

  // Default mode: vertical cards
  return (
    <div className={cn('space-y-4', className)}>
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-cyan" />
          <h2 className="text-lg font-semibold text-gold">Trending Circles</h2>
        </div>
        <Link
          href="/nucleus/community/circles"
          className="flex items-center gap-1 text-sm text-cyan hover:text-cyan-soft transition-colors"
        >
          View all
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Forum Cards */}
      <div className="grid gap-3">
        {loading ? (
          <>
            <ForumCardSkeleton />
            <ForumCardSkeleton />
            <ForumCardSkeleton />
          </>
        ) : forums.length === 0 ? (
          <Card className="bg-nex-surface border-nex-border">
            <CardContent className="p-6 text-center">
              <p className="text-slate-dim">No trending circles yet. Be the first to start a conversation!</p>
              <Link
                href="/nucleus/community/circles/create"
                className="mt-3 inline-block text-cyan hover:underline"
              >
                Create a circle
              </Link>
            </CardContent>
          </Card>
        ) : (
          forums.map((forum, index) => (
            <Link key={forum.id} href={`/nucleus/community/circles/${forum.id}`}>
              <Card className="group cursor-pointer bg-nex-surface border-nex-border hover:border-cyan/50 hover:shadow-card-hover transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Rank Number */}
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-cyan/10 text-sm font-bold text-cyan">
                      {index + 1}
                    </div>

                    {/* Forum Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-light group-hover:text-cyan transition-colors truncate">
                          {forum.name}
                        </h3>
                        <ActivityBadge level={forum.activityLevel} />
                      </div>

                      <p className="text-sm text-slate-dim line-clamp-1 mb-2">
                        {forum.description}
                      </p>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-xs text-slate-dim">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {forum.memberCount} members
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {forum.postCount} posts
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ArrowRight className="h-5 w-5 text-slate-dim group-hover:text-cyan transition-colors flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
