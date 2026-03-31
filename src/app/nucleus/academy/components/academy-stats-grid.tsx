'use client';

import { useEffect, useState } from 'react';
import { BookOpen, GraduationCap, Clock, Brain } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { GridStatCard } from '@/components/ui/branded/grid-stat-card';
import { getMyAcademyStats } from './academy-stats-actions';

interface AcademyUserStats {
  pathwaysEnrolled: number;
  pathwaysCompleted: number;
  lessonsCompleted: number;
  dueReviews: number;
}

export function AcademyStatsGrid() {
  const { user } = useAuth();
  const userId = user?.uid;
  const [stats, setStats] = useState<AcademyUserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    const uid = userId;

    async function fetchStats() {
      try {
        const data = await getMyAcademyStats(uid);
        setStats(data);
      } catch {
        // Silently fail — stats are non-critical
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [userId]);

  // Don't render if no user or no data yet and not loading
  if (!user) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-golden-2 max-w-5xl w-full mx-auto">
      <GridStatCard
        icon={BookOpen}
        title="Pathways"
        value={stats?.pathwaysEnrolled ?? 0}
        variant="cyan"
        loading={loading}
        animateDelay={0}
      />
      <GridStatCard
        icon={GraduationCap}
        title="Completed"
        value={stats?.pathwaysCompleted ?? 0}
        variant="gold"
        loading={loading}
        animateDelay={100}
      />
      <GridStatCard
        icon={Clock}
        title="Practices Done"
        value={stats?.lessonsCompleted ?? 0}
        variant="emerald"
        loading={loading}
        animateDelay={200}
      />
      <GridStatCard
        icon={Brain}
        title="Due Reviews"
        value={stats?.dueReviews ?? 0}
        variant={stats && stats.dueReviews > 0 ? 'amber' : 'purple'}
        loading={loading}
        animateDelay={300}
      />
    </div>
  );
}
