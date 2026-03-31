'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Users, Award, Loader2 } from 'lucide-react';
import { getAcademyStats, type AcademyStats } from '../../platform-stats-actions';
import { logger } from '@/lib/logger';

const log = logger.scope('components/compact-stats');

interface StatPillProps {
  icon: typeof BookOpen;
  label: string;
  value: number | string;
  subtext?: string;
  color?: 'cyan' | 'gold' | 'emerald';
}

function StatPill({ icon: Icon, label, value, subtext, color = 'cyan' }: StatPillProps) {
  const colorClasses = {
    cyan: 'text-cyan border-cyan/20',
    gold: 'text-gold border-gold/20',
    emerald: 'text-emerald-400 border-emerald-500/20',
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border bg-nex-surface ${colorClasses[color]}`}>
      <Icon className="h-4 w-4" />
      <span className="font-mono font-bold">{value}</span>
      <span className="text-slate-dim text-xs hidden sm:inline">{label}</span>
      {subtext && <span className="text-slate-dim/60 text-xs hidden md:inline">({subtext})</span>}
    </div>
  );
}

export function CompactStats() {
  const [stats, setStats] = useState<AcademyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const academyStats = await getAcademyStats();
        setStats(academyStats);
      } catch (error) {
        log.error('Failed to fetch academy stats:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-dim">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading stats...</span>
      </div>
    );
  }

  const completionRate = stats?.totalEnrollments && stats?.completedEnrollments
    ? Math.round((stats.completedEnrollments / stats.totalEnrollments) * 100)
    : 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatPill
        icon={BookOpen}
        label="Pathways"
        value={stats?.publishedCourses ?? 0}
        subtext={`${stats?.draftCourses ?? 0} draft`}
        color="cyan"
      />
      <StatPill
        icon={Users}
        label="Active"
        value={stats?.activeLearners ?? 0}
        subtext="30d"
        color="cyan"
      />
      <StatPill
        icon={Award}
        label="Verified"
        value={stats?.totalCertificates ?? 0}
        subtext={`+${stats?.certificatesThisMonth ?? 0} this mo`}
        color="gold"
      />
      <StatPill
        icon={Award}
        label="Completion"
        value={`${completionRate}%`}
        color="emerald"
      />
    </div>
  );
}
