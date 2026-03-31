'use client';


import { logger } from '@/lib/logger';
const log = logger.scope('components/academy-stats');
import { useEffect, useState } from 'react';
import {
  BookOpen,
  GraduationCap,
  Award,
  Users,
  FileText,
  Bookmark,
  TrendingUp,
  Loader2,
  RefreshCw,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAcademyStats, type AcademyStats } from '../../platform-stats-actions';

export function AcademyStatsDisplay() {
  const [stats, setStats] = useState<AcademyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchStats() {
    try {
      const academyStats = await getAcademyStats();
      setStats(academyStats);
    } catch (error) {
      log.error('Failed to fetch academy stats:', error);
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

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="bg-nex-surface border border-nex-light">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-cyan" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-light flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-cyan" />
          Academy Performance Overview
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-slate-dim hover:text-cyan"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Course Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-nex-surface border border-nex-light hover:border-cyan/50 transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-dim flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-cyan" />
              Total Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-cyan">{stats?.totalCourses ?? 0}</div>
            <div className="text-xs text-slate-dim mt-1">
              {stats?.publishedCourses ?? 0} published, {stats?.draftCourses ?? 0} draft
            </div>
          </CardContent>
        </Card>

        <Card className="bg-nex-surface border border-nex-light hover:border-cyan/50 transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-dim flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-cyan" />
              Total Enrollments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-cyan">{stats?.totalEnrollments ?? 0}</div>
            <div className="text-xs text-slate-dim mt-1 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {stats?.activeEnrollments ?? 0} active
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-emerald-400" />
                {stats?.completedEnrollments ?? 0} completed
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-nex-surface border border-nex-light hover:border-cyan/50 transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-dim flex items-center gap-2">
              <Award className="h-4 w-4 text-gold" />
              Certificates Issued
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gold">{stats?.totalCertificates ?? 0}</div>
            <div className="text-xs text-slate-dim mt-1">
              +{stats?.certificatesThisMonth ?? 0} this month
            </div>
          </CardContent>
        </Card>

        <Card className="bg-nex-surface border border-nex-light hover:border-cyan/50 transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-dim flex items-center gap-2">
              <Users className="h-4 w-4 text-cyan" />
              Active Learners
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-cyan">{stats?.activeLearners ?? 0}</div>
            <div className="text-xs text-slate-dim mt-1">
              Last 30 days
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Engagement */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-nex-surface border border-nex-light">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-cyan/10">
                <FileText className="h-6 w-6 text-cyan" />
              </div>
              <div>
                <div className="text-2xl font-bold text-cyan">{stats?.totalNotes ?? 0}</div>
                <div className="text-sm text-slate-dim">Lesson Notes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-nex-surface border border-nex-light">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-cyan/10">
                <Bookmark className="h-6 w-6 text-cyan" />
              </div>
              <div>
                <div className="text-2xl font-bold text-cyan">{stats?.totalBookmarks ?? 0}</div>
                <div className="text-sm text-slate-dim">Bookmarks</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-nex-surface border border-nex-light">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <CheckCircle className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-400">
                  {stats?.totalEnrollments && stats?.completedEnrollments
                    ? Math.round((stats.completedEnrollments / stats.totalEnrollments) * 100)
                    : 0}%
                </div>
                <div className="text-sm text-slate-dim">Completion Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {stats?.lastUpdated && (
        <p className="text-xs text-slate-dim text-right">
          Last updated: {new Date(stats.lastUpdated).toLocaleString()}
        </p>
      )}
    </div>
  );
}
