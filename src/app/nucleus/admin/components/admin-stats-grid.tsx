'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  BookOpen,
  MessageSquare,
  GraduationCap,
  Briefcase,
  Mail,
  AlertTriangle,
  UserPlus,
} from 'lucide-react';
import { GridStatCard } from '@/components/ui/branded/grid-stat-card';
import { getPlatformStats, type PlatformStats } from '../platform-stats-actions';
import { logger } from '@/lib/logger';

const log = logger.scope('components/admin-stats-grid');

export function AdminStatsGrid() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-4">
      {/* Tier 1: Primary stats — 4-column grid (matches Control Center) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GridStatCard
          icon={Users}
          title="Members"
          value={stats?.totalMembers ?? 0}
          variant="cyan"
          loading={loading}
        />
        <GridStatCard
          icon={BookOpen}
          title="Pathways"
          value={stats?.activeCourses ?? 0}
          variant="gold"
          loading={loading}
        />
        <GridStatCard
          icon={GraduationCap}
          title="Enrollments"
          value={stats?.totalEnrollments ?? 0}
          variant="emerald"
          loading={loading}
        />
        <GridStatCard
          icon={MessageSquare}
          title="Posts"
          value={stats?.communityPosts ?? 0}
          variant="purple"
          loading={loading}
        />
      </div>

      {/* Tier 2: Attention items — 4-column grid */}
      {stats && (stats.pendingConsultingLeads > 0 ||
        stats.pendingAffiliateApplications > 0 ||
        stats.unreadContactSubmissions > 0 ||
        stats.criticalLeads > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.pendingConsultingLeads > 0 && (
            <GridStatCard
              icon={Briefcase}
              title="Pending Leads"
              value={stats.pendingConsultingLeads}
              variant="amber"
              subtitle="Consulting inquiries"
            />
          )}
          {stats.criticalLeads > 0 && (
            <GridStatCard
              icon={AlertTriangle}
              title="Critical Leads"
              value={stats.criticalLeads}
              variant="amber"
              subtitle="Score >= 150"
            />
          )}
          {stats.unreadContactSubmissions > 0 && (
            <GridStatCard
              icon={Mail}
              title="Unread Contact"
              value={stats.unreadContactSubmissions}
              variant="amber"
              subtitle="New submissions"
            />
          )}
          {stats.pendingAffiliateApplications > 0 && (
            <GridStatCard
              icon={UserPlus}
              title="Applications"
              value={stats.pendingAffiliateApplications}
              variant="amber"
              subtitle="Pending review"
            />
          )}
        </div>
      )}
    </div>
  );
}
