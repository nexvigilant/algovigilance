'use client';

import { useEffect, useState } from 'react';
import { Users, MessageSquare, CircleDot, Activity } from 'lucide-react';
import { GridStatCard } from '@/components/ui/branded/grid-stat-card';
import { getCommunityStats } from '../actions/discovery/core';
import { useRealtimeStat } from '@/hooks/use-realtime-stat';

interface CommunityStatsData {
  totalCommunities: number;
  totalMembers: number;
  totalPosts: number;
  activeToday: number;
}

export function CommunityStatsGrid() {
  const [stats, setStats] = useState<CommunityStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Real-time member count with dead-man switch staleness detection
  const memberStat = useRealtimeStat('community_members');

  useEffect(() => {
    async function fetchStats() {
      try {
        const result = await getCommunityStats();
        if (result.success && result.data) {
          setStats(result.data);
        }
      } catch {
        // Silently fail — stats are non-critical
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  // Prefer real-time member count when connected, fall back to server action
  const memberCount = memberStat.connected ? memberStat.value : (stats?.totalMembers ?? 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-golden-2 max-w-3xl w-full mx-auto">
      <GridStatCard
        icon={CircleDot}
        title="Circles"
        value={stats?.totalCommunities ?? 0}
        variant="cyan"
        loading={loading}
        animateDelay={0}
      />
      <GridStatCard
        icon={Users}
        title={memberStat.isStale ? 'AlgoVigilances (stale)' : 'AlgoVigilances'}
        value={memberCount}
        variant="gold"
        loading={loading && memberStat.loading}
        animateDelay={100}
      />
      <GridStatCard
        icon={MessageSquare}
        title="Posts"
        value={stats?.totalPosts ?? 0}
        variant="purple"
        loading={loading}
        animateDelay={200}
      />
      <GridStatCard
        icon={Activity}
        title="Active Today"
        value={stats?.activeToday ?? 0}
        variant="emerald"
        loading={loading}
        animateDelay={300}
      />
    </div>
  );
}
