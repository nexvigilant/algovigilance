'use client';

import { useEffect, useState } from 'react';
import { Users, BookOpen, MessageSquare, Loader2, AlertTriangle } from 'lucide-react';
import { getPlatformStats, type PlatformStats } from '../platform-stats-actions';
import { logger } from '@/lib/logger';
import { BrandedStatPill } from '@/components/ui/branded/branded-stat-pill';
import { useRealtimeStat } from '@/hooks/use-realtime-stat';

const log = logger.scope('components/compact-platform-stats');

export function CompactPlatformStats() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Real-time member count from Firestore with dead-man switch staleness detection
  const memberStat = useRealtimeStat('community_members', { timeoutMs: 120_000 });

  useEffect(() => {
    async function fetchStats() {
      try {
        const platformStats = await getPlatformStats();
        setStats(platformStats);
      } catch (error) {
        log.error('Failed to fetch platform stats:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading && memberStat.loading) {
    return (
      <div className="flex items-center gap-2 text-slate-dim">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading stats...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <BrandedStatPill
        icon={memberStat.isStale ? AlertTriangle : Users}
        label={memberStat.isStale ? 'Members (stale)' : 'Members'}
        value={memberStat.connected ? memberStat.value : (stats?.totalMembers ?? 0)}
      />
      <BrandedStatPill
        icon={BookOpen}
        label="Pathways"
        value={stats?.activeCourses ?? 0}
      />
      <BrandedStatPill
        icon={MessageSquare}
        label="Posts"
        value={stats?.communityPosts ?? 0}
      />
    </div>
  );
}
