'use client';

import { useEffect, useState } from 'react';
import { Users, Activity, Clock, FileText, Loader2 } from 'lucide-react';
import { getCommunityAnalytics } from '@/app/nucleus/community/actions/analytics';
import { logger } from '@/lib/logger';

const log = logger.scope('components/compact-health-stats');

interface StatPillProps {
  icon: typeof Users;
  label: string;
  value: string | number;
  status?: 'healthy' | 'warning' | 'critical';
}

function StatPill({ icon: Icon, label, value, status = 'healthy' }: StatPillProps) {
  const statusColors = {
    healthy: 'text-emerald-400 border-emerald-500/20',
    warning: 'text-amber-400 border-amber-500/20',
    critical: 'text-red-400 border-red-500/20',
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border bg-nex-surface ${statusColors[status]}`}>
      <Icon className="h-4 w-4" />
      <span className="font-mono font-bold">{value}</span>
      <span className="text-slate-dim text-xs hidden sm:inline">{label}</span>
    </div>
  );
}

function getEngagementStatus(rate: number): 'healthy' | 'warning' | 'critical' {
  if (rate >= 15) return 'healthy';
  if (rate >= 5) return 'warning';
  return 'critical';
}

export function CompactHealthStats() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    activeMembers: number;
    engagementRate: number;
    avgResponseHours: number;
    postsPerDay: number;
  } | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const result = await getCommunityAnalytics('7d');
        if (result.success && result.data) {
          const data = result.data;
          const engagementRate =
            data.overview.totalMembers > 0
              ? (data.overview.activeMembers / data.overview.totalMembers) * 100
              : 0;

          setStats({
            activeMembers: data.overview.activeMembers,
            engagementRate: Math.round(engagementRate),
            avgResponseHours: data.engagement?.avgResponseTime
              ? Math.round(data.engagement.avgResponseTime / 60)
              : 0,
            postsPerDay: data.engagement?.avgPostsPerDay ?? 0,
          });
        }
      } catch (error) {
        log.error('Failed to fetch community stats:', error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-dim">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading health...</span>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatPill
        icon={Users}
        label="Active"
        value={stats.activeMembers}
        status={stats.activeMembers > 0 ? 'healthy' : 'warning'}
      />
      <StatPill
        icon={Activity}
        label="Engagement"
        value={`${stats.engagementRate}%`}
        status={getEngagementStatus(stats.engagementRate)}
      />
      <StatPill
        icon={Clock}
        label="Avg Reply"
        value={stats.avgResponseHours > 0 ? `${stats.avgResponseHours}h` : 'N/A'}
        status={stats.avgResponseHours <= 24 ? 'healthy' : stats.avgResponseHours <= 48 ? 'warning' : 'critical'}
      />
      <StatPill
        icon={FileText}
        label="Posts/Day"
        value={stats.postsPerDay.toFixed(1)}
        status={stats.postsPerDay >= 1 ? 'healthy' : 'warning'}
      />
    </div>
  );
}
