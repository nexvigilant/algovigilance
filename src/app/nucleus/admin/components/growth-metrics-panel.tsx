'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Users, GraduationCap, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getGrowthMetrics, type GrowthMetrics } from '../platform-stats-actions';
import { cn } from '@/lib/utils';

import { logger } from '@/lib/logger';
const log = logger.scope('components/growth-metrics-panel');

interface TrendIndicatorProps {
  label: string;
  icon: typeof Users;
  thisWeek: number;
  lastWeek: number;
  growthPercent: number;
  loading: boolean;
}

function TrendIndicator({ label, icon: Icon, thisWeek, lastWeek, growthPercent, loading }: TrendIndicatorProps) {
  const isPositive = growthPercent > 0;
  const isNeutral = growthPercent === 0;

  const TrendIcon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
  const trendColor = isNeutral
    ? 'text-slate-dim'
    : isPositive
      ? 'text-emerald-400'
      : 'text-rose-400';
  const trendBg = isNeutral
    ? 'bg-slate-500/10'
    : isPositive
      ? 'bg-emerald-400/10'
      : 'bg-rose-400/10';

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-nex-light/30">
      <div className="p-2 rounded-lg bg-nex-light/50">
        <Icon className="h-5 w-5 text-cyan" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-dim">{label}</p>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-slate-dim mt-1" />
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold font-mono text-slate-light">{thisWeek}</span>
            <span className="text-xs text-slate-dim">vs {lastWeek} last week</span>
          </div>
        )}
      </div>
      {!loading && (
        <div className={cn('flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium', trendBg, trendColor)}>
          <TrendIcon className="h-3 w-3" />
          <span>{isNeutral ? '0%' : `${isPositive ? '+' : ''}${growthPercent}%`}</span>
        </div>
      )}
    </div>
  );
}

export function GrowthMetricsPanel() {
  const [growth, setGrowth] = useState<GrowthMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGrowth() {
      try {
        const metrics = await getGrowthMetrics();
        setGrowth(metrics);
      } catch (error) {
        log.error('Failed to fetch growth metrics:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchGrowth();
  }, []);

  return (
    <Card className="bg-nex-surface border border-nex-light">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-slate-light flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-400" />
          Week-over-Week Growth
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <TrendIndicator
          label="New Members"
          icon={Users}
          thisWeek={growth?.membersThisWeek ?? 0}
          lastWeek={growth?.membersLastWeek ?? 0}
          growthPercent={growth?.memberGrowthPercent ?? 0}
          loading={loading}
        />
        <TrendIndicator
          label="New Enrollments"
          icon={GraduationCap}
          thisWeek={growth?.enrollmentsThisWeek ?? 0}
          lastWeek={growth?.enrollmentsLastWeek ?? 0}
          growthPercent={growth?.enrollmentGrowthPercent ?? 0}
          loading={loading}
        />
      </CardContent>
    </Card>
  );
}
