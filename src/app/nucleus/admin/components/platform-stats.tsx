'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, BookOpen, GraduationCap, Award, MessageSquare, Briefcase, RefreshCw, AlertCircle, Mail, Handshake, ArrowRight, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getPlatformStats,
  getGrowthMetrics,
  type PlatformStats,
  type GrowthMetrics,
} from '../platform-stats-actions';
import { BrandedStatCard } from '@/components/ui/branded/branded-stat-card';

import { logger } from '@/lib/logger';
const log = logger.scope('components/platform-stats');

export function PlatformStatsDisplay() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [growth, setGrowth] = useState<GrowthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchStats() {
    try {
      const [platformStats, growthMetrics] = await Promise.all([
        getPlatformStats(),
        getGrowthMetrics(),
      ]);
      setStats(platformStats);
      setGrowth(growthMetrics);
    } catch (error) {
      log.error('Failed to fetch platform stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchStats();
  }

  return (
    <div className="bg-nex-surface border border-nex-light rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-light">Platform Overview</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={loading || refreshing}
          className="text-slate-dim hover:text-cyan"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <BrandedStatCard
          icon={<Users className="h-4 w-4" />}
          label="Total Members"
          value={stats?.totalMembers ?? '-'}
          trend={growth?.memberGrowthPercent}
          loading={loading}
        />
        <BrandedStatCard
          icon={<BookOpen className="h-4 w-4" />}
          label="Active Courses"
          value={stats?.activeCourses ?? '-'}
          loading={loading}
        />
        <BrandedStatCard
          icon={<GraduationCap className="h-4 w-4" />}
          label="Enrollments"
          value={stats?.totalEnrollments ?? '-'}
          trend={growth?.enrollmentGrowthPercent}
          loading={loading}
        />
        <BrandedStatCard
          icon={<Award className="h-4 w-4" />}
          label="Certificates"
          value={stats?.certificatesIssued ?? '-'}
          loading={loading}
        />
        <BrandedStatCard
          icon={<MessageSquare className="h-4 w-4" />}
          label="Community Posts"
          value={stats?.communityPosts ?? '-'}
          loading={loading}
        />
        <BrandedStatCard
          icon={<Briefcase className="h-4 w-4" />}
          label="Open Positions"
          value={stats?.activeJobs ?? '-'}
          loading={loading}
        />
      </div>

      {/* Action Required Section */}
      {!loading && stats && (stats.pendingConsultingLeads > 0 || stats.unreadContactSubmissions > 0 || stats.pendingAffiliateApplications > 0) && (
        <div className="mt-6 pt-4 border-t border-nex-light">
          <h4 className="text-sm font-medium text-amber-400 mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Action Required
          </h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stats.pendingConsultingLeads > 0 && (
              <Link
                href="/nucleus/admin/consulting-leads"
                className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <Handshake className="h-4 w-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-400">
                      {stats.pendingConsultingLeads} Pending Lead{stats.pendingConsultingLeads !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-slate-dim">Consulting inquiries awaiting review</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
            {stats.unreadContactSubmissions > 0 && (
              <Link
                href="/nucleus/admin/contact-submissions"
                className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <Mail className="h-4 w-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-400">
                      {stats.unreadContactSubmissions} Unread Message{stats.unreadContactSubmissions !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-slate-dim">Contact form submissions</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
            {stats.pendingAffiliateApplications > 0 && (
              <Link
                href="/nucleus/admin/affiliate-applications"
                className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <UserPlus className="h-4 w-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-400">
                      {stats.pendingAffiliateApplications} Affiliate App{stats.pendingAffiliateApplications !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-slate-dim">Ambassador/Advisor applications</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </div>
        </div>
      )}

      {stats?.lastUpdated && (
        <p className="text-xs text-slate-dim text-center mt-4">
          Last updated: {new Date(stats.lastUpdated).toLocaleString()}
        </p>
      )}
    </div>
  );
}
