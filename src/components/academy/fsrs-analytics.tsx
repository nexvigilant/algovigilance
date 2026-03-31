'use client';

/**
 * FSRS Analytics Components
 *
 * Visualization components for FSRS spaced repetition data.
 * Includes retention trends, mastery stats, and streak tracking.
 */

import { useEffect, useState } from 'react';

import { logger } from '@/lib/logger';
const log = logger.scope('components/fsrs-analytics');
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Brain,
  Flame,
  TrendingUp,
  Calendar,
  Target,
  Zap,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import {
  getFSRSStats,
  getStreakData,
  getRetentionTrend,
  getDomainMastery,
  type FSRSStats,
  type StreakData,
  type RetentionTrendPoint,
  type DomainMastery,
} from '@/lib/actions/fsrs';
import { cn } from '@/lib/utils';

// ==================== FSRS Stats Card ====================

interface FSRSStatsCardProps {
  className?: string;
}

export function FSRSStatsCard({ className }: FSRSStatsCardProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<FSRSStats | null>(null);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear loading state if no user
    const userId = user?.uid;
    if (!userId) {
      setLoading(false);
      return;
    }
    // Capture in explicitly typed variable for nested function closure
    const uid: string = userId;

    async function loadData() {
      try {
        const [statsData, streakData] = await Promise.all([
          getFSRSStats(uid),
          getStreakData(uid),
        ]);
        setStats(statsData);
        setStreak(streakData);
      } catch (error) {
        log.error('Failed to load FSRS stats:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user?.uid]);

  if (loading) {
    return (
      <Card className={cn('bg-nex-surface border-nex-light', className)}>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <Card className={cn('bg-nex-surface border-nex-light', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gold">
          <Brain className="h-5 w-5" />
          Spaced Repetition Stats
        </CardTitle>
        <CardDescription className="text-slate-dim">
          Your memory retention and review performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Cards */}
          <div className="p-4 rounded-xl bg-nex-deep border border-nex-border">
            <div className="flex items-center gap-2 text-slate-dim mb-1">
              <Target className="h-4 w-4 text-cyan" />
              <span className="text-xs uppercase tracking-wide">Total Cards</span>
            </div>
            <div className="text-2xl font-mono font-bold text-cyan">{stats.totalCards}</div>
            <div className="text-xs text-slate-dim mt-1">KSBs tracked</div>
          </div>

          {/* Due Today */}
          <div className="p-4 rounded-xl bg-nex-deep border border-nex-border">
            <div className="flex items-center gap-2 text-slate-dim mb-1">
              <Calendar className="h-4 w-4 text-gold" />
              <span className="text-xs uppercase tracking-wide">Due Today</span>
            </div>
            <div className="text-2xl font-mono font-bold text-gold">{stats.dueToday}</div>
            <div className="text-xs text-slate-dim mt-1">reviews pending</div>
          </div>

          {/* Retention */}
          <div className="p-4 rounded-xl bg-nex-deep border border-nex-border">
            <div className="flex items-center gap-2 text-slate-dim mb-1">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span className="text-xs uppercase tracking-wide">Retention</span>
            </div>
            <div className="text-2xl font-mono font-bold text-emerald-400">
              {Math.round(stats.averageRetention * 100)}%
            </div>
            <div className="text-xs text-slate-dim mt-1">memory strength</div>
          </div>

          {/* Streak */}
          <div className="p-4 rounded-xl bg-nex-deep border border-nex-border">
            <div className="flex items-center gap-2 text-slate-dim mb-1">
              <Flame className="h-4 w-4 text-orange-400" />
              <span className="text-xs uppercase tracking-wide">Streak</span>
            </div>
            <div className="text-2xl font-mono font-bold text-orange-400">
              {streak?.currentStreak ?? 0}
            </div>
            <div className="text-xs text-slate-dim mt-1">
              days (best: {streak?.longestStreak ?? 0})
            </div>
          </div>
        </div>

        {/* Card State Breakdown */}
        <div className="mt-6 pt-6 border-t border-nex-border">
          <div className="text-sm font-medium text-slate-light mb-3">Card States</div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-slate-dim">{stats.learningCount} Learning</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-sm text-slate-dim">{stats.reviewCount} Review</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-orange-400" />
              <span className="text-sm text-slate-dim">{stats.relearningCount} Relearning</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== Retention Trend Chart ====================

interface RetentionTrendChartProps {
  className?: string;
}

export function RetentionTrendChart({ className }: RetentionTrendChartProps) {
  const { user } = useAuth();
  const [data, setData] = useState<RetentionTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear loading state if no user
    const userId = user?.uid;
    if (!userId) {
      setLoading(false);
      return;
    }
    // Capture in explicitly typed variable for nested function closure
    const uid: string = userId;

    async function loadData() {
      try {
        const trendData = await getRetentionTrend(uid, 12);
        setData(trendData);
      } catch (error) {
        log.error('Failed to load retention trend:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user?.uid]);

  if (loading) {
    return (
      <Card className={cn('bg-nex-surface border-nex-light', className)}>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('bg-nex-surface border-nex-light', className)}>
      <CardHeader>
        <CardTitle className="text-gold">Retention Trend</CardTitle>
        <CardDescription className="text-slate-dim">
          Memory retention over the past 12 weeks
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="retentionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#e2e8f0' }}
                formatter={(value: number) => [`${value}%`, 'Retention']}
              />
              <Area
                type="monotone"
                dataKey="retention"
                stroke="#22d3ee"
                strokeWidth={2}
                fill="url(#retentionGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-dim">
            No retention data yet. Complete some reviews to see your trend!
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ==================== Domain Mastery Grid ====================

interface DomainMasteryGridProps {
  className?: string;
}

export function DomainMasteryGrid({ className }: DomainMasteryGridProps) {
  const { user } = useAuth();
  const [domains, setDomains] = useState<DomainMastery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear loading state if no user
    const userId = user?.uid;
    if (!userId) {
      setLoading(false);
      return;
    }
    // Capture in explicitly typed variable for nested function closure
    const uid: string = userId;

    async function loadData() {
      try {
        const domainData = await getDomainMastery(uid);
        setDomains(domainData);
      } catch (error) {
        log.error('Failed to load domain mastery:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user?.uid]);

  if (loading) {
    return (
      <Card className={cn('bg-nex-surface border-nex-light', className)}>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (domains.length === 0) {
    return (
      <Card className={cn('bg-nex-surface border-nex-light', className)}>
        <CardHeader>
          <CardTitle className="text-gold">Domain Mastery</CardTitle>
          <CardDescription className="text-slate-dim">
            Your mastery level across PV domains
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-dim">
            No domain data yet. Start learning KSBs to see your mastery!
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('bg-nex-surface border-nex-light', className)}>
      <CardHeader>
        <CardTitle className="text-gold">Domain Mastery</CardTitle>
        <CardDescription className="text-slate-dim">
          Your mastery level across PV domains
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {domains.map((domain) => {
            const masteryPercent =
              domain.totalKSBs > 0
                ? Math.round((domain.masteredKSBs / domain.totalKSBs) * 100)
                : 0;
            const retentionPercent = Math.round(domain.averageRetention * 100);

            return (
              <div
                key={domain.domainId}
                className="p-3 rounded-xl bg-nex-deep border border-nex-border hover:border-cyan/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="font-mono text-xs text-cyan border-cyan/30">
                    {domain.domainId}
                  </Badge>
                  <span className="text-xs text-slate-dim">{domain.totalKSBs} KSBs</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-dim">Mastery</span>
                      <span className="text-cyan">{masteryPercent}%</span>
                    </div>
                    <Progress value={masteryPercent} className="h-1.5 bg-nex-surface" />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-dim">Retention</span>
                    <span className="text-emerald-400">{retentionPercent}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== Streak Calendar ====================

interface StreakCalendarProps {
  className?: string;
}

export function StreakCalendar({ className }: StreakCalendarProps) {
  const { user } = useAuth();
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear loading state if no user
    const userId = user?.uid;
    if (!userId) {
      setLoading(false);
      return;
    }
    // Capture in explicitly typed variable for nested function closure
    const uid: string = userId;

    async function loadData() {
      try {
        const streakData = await getStreakData(uid);
        setStreak(streakData);
      } catch (error) {
        log.error('Failed to load streak data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user?.uid]);

  if (loading) {
    return (
      <Card className={cn('bg-nex-surface border-nex-light', className)}>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('bg-nex-surface border-nex-light', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gold">
          <Flame className="h-5 w-5 text-orange-400" />
          Review Streak
        </CardTitle>
        <CardDescription className="text-slate-dim">
          Keep your streak alive by reviewing daily
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-xl bg-nex-deep border border-nex-border">
            <div className="text-3xl font-mono font-bold text-orange-400">
              {streak?.currentStreak ?? 0}
            </div>
            <div className="text-xs text-slate-dim mt-1">Current Streak</div>
          </div>
          <div className="text-center p-4 rounded-xl bg-nex-deep border border-nex-border">
            <div className="text-3xl font-mono font-bold text-gold">
              {streak?.longestStreak ?? 0}
            </div>
            <div className="text-xs text-slate-dim mt-1">Longest Streak</div>
          </div>
          <div className="text-center p-4 rounded-xl bg-nex-deep border border-nex-border">
            <div className="text-3xl font-mono font-bold text-cyan">
              {streak?.totalReviewDays ?? 0}
            </div>
            <div className="text-xs text-slate-dim mt-1">Total Days</div>
          </div>
          <div className="text-center p-4 rounded-xl bg-nex-deep border border-nex-border">
            <div className="text-sm font-medium text-slate-light">
              {streak?.lastReviewDate
                ? new Date(streak.lastReviewDate).toLocaleDateString()
                : 'Never'}
            </div>
            <div className="text-xs text-slate-dim mt-1">Last Review</div>
          </div>
        </div>

        {/* Streak Status Message */}
        <div className="mt-4 p-3 rounded-lg bg-nex-deep border border-nex-border text-center">
          {(streak?.currentStreak ?? 0) > 0 ? (
            <p className="text-sm text-emerald-400">
              <Flame className="h-4 w-4 inline mr-1" />
              You&apos;re on a {streak?.currentStreak}-day streak! Keep it up!
            </p>
          ) : (
            <p className="text-sm text-slate-dim">
              Complete a review today to start your streak!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Named exports above are preferred for tree-shaking
