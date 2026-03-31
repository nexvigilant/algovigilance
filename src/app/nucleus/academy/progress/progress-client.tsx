'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  Award,
  Clock,
  Target,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { getProgressAnalytics, type ProgressAnalytics } from './actions';
import { getReviewHistory, getDomainMastery } from '@/lib/actions/fsrs';
import type { DailyReviewActivity, DomainMastery } from '@/lib/actions/fsrs';
import { VoiceEmptyState } from '@/components/voice';
import { AcademyDashboardStatCard } from '../components/dashboard-stat-card';
import { ActivityHeatmap } from '../components/activity-heatmap';
import { DomainMasteryGrid as DomainMasteryProgressGrid } from '../components/domain-mastery-grid';
import {
  FSRSStatsCard,
  RetentionTrendChart,
  StreakCalendar,
} from '@/components/academy/fsrs-analytics';

import { logger } from '@/lib/logger';
const log = logger.scope('progress/progress-client');

export function ProgressClient() {
  const { user, loading: authLoading } = useAuth();
  const [analytics, setAnalytics] = useState<ProgressAnalytics | null>(null);
  const [reviewHistory, setReviewHistory] = useState<DailyReviewActivity[]>([]);
  const [domainMastery, setDomainMastery] = useState<DomainMastery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      loadAnalytics();
    } else if (!authLoading && !user) {
      setError('Please sign in to view your progress');
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const loadAnalytics = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const [data, history, mastery] = await Promise.all([
        getProgressAnalytics(user.uid),
        getReviewHistory(user.uid),
        getDomainMastery(user.uid),
      ]);
      setAnalytics(data);
      setReviewHistory(history);
      setDomainMastery(mastery);
    } catch (err) {
      log.error('[ProgressClient] Error loading analytics:', err);
      setError('Failed to load progress analytics. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-headline mb-2">My Learning Progress</h1>
          <p className="text-muted-foreground">Track your capabilities and learning achievements</p>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-headline mb-2">My Learning Progress</h1>
          <p className="text-muted-foreground">Track your capabilities and learning achievements</p>
        </div>

        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-headline mb-2">My Learning Progress</h1>
          <p className="text-muted-foreground">Track your capabilities and learning achievements</p>
        </div>

        <VoiceEmptyState
          context="progress"
          title="No progress data yet"
          description="Complete a capability pathway to see your analytics and track your learning journey."
          variant="card"
          size="lg"
          action={{
            label: 'Browse Pathways',
            href: '/nucleus/academy/courses',
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline mb-2 text-gold">My Learning Progress</h1>
        <p className="text-slate-dim">Track your capabilities and learning achievements</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <AcademyDashboardStatCard
          title="Pathways Completed"
          value={analytics.coursesCompleted}
          subtext={`${analytics.coursesInProgress} in progress`}
          icon={Award}
          variant="cyan"
        />

        <AcademyDashboardStatCard
          title="Learning Hours"
          value={analytics.totalLearningTime}
          subtext={`${analytics.daysActive} active days`}
          icon={Clock}
          variant="gold"
        />

        <AcademyDashboardStatCard
          title="Skills Acquired"
          value={analytics.skillsAcquired}
          subtext={`Level: ${analytics.skillLevel}`}
          icon={Zap}
          variant="cyan"
        />

        <AcademyDashboardStatCard
          title="Certificates"
          value={analytics.certificatesEarned}
          subtext="Verified credentials"
          icon={Target}
          variant="gold"
        />
      </div>

      {/* Real Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ActivityHeatmap history={reviewHistory} />
        <DomainMasteryProgressGrid domains={domainMastery} />
      </div>

      {/* Course Progress */}
      <Card className="mb-6 bg-nex-surface border border-nex-light">
        <CardHeader>
          <CardTitle className="text-gold">Pathway Progress</CardTitle>
          <CardDescription className="text-slate-dim">Overview of your course enrollment status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Completion Stats */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-light">Completion Rate</span>
                <span className="text-slate-dim">
                  {analytics.coursesCompleted} of {analytics.coursesEnrolled}
                </span>
              </div>
              <Progress
                value={
                  analytics.coursesEnrolled > 0
                    ? (analytics.coursesCompleted / analytics.coursesEnrolled) * 100
                    : 0
                }
                className="h-2"
              />
            </div>

            {/* Quiz Performance */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-light">Average Quiz Score</span>
                <span className="text-slate-dim">{analytics.averageQuizScore}%</span>
              </div>
              <Progress value={analytics.averageQuizScore} className="h-2" />
            </div>

            {/* Activity */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-nex-light">
              <div>
                <p className="text-sm text-slate-dim">Active Days</p>
                <p className="text-2xl font-bold text-cyan">{analytics.daysActive}</p>
              </div>
              <div>
                <p className="text-sm text-slate-dim">Current Streak</p>
                <p className="text-2xl font-bold text-cyan">{analytics.currentStreak}</p>
              </div>
              <div>
                <p className="text-sm text-slate-dim">Longest Streak</p>
                <p className="text-2xl font-bold text-cyan">{analytics.longestStreak}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Engagement Stats */}
      <Card className="bg-nex-surface border border-nex-light">
        <CardHeader>
          <CardTitle className="text-gold">Engagement Summary</CardTitle>
          <CardDescription className="text-slate-dim">Your learning activity metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-slate-dim">Total Learning Time</p>
              <p className="text-2xl font-bold text-cyan">{analytics.totalLearningTime}</p>
              <p className="text-xs text-slate-dim">minutes</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-dim">Lessons Completed</p>
              <p className="text-2xl font-bold text-cyan">{analytics.lessonsCompleted}</p>
              <p className="text-xs text-slate-dim">modules finished</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-dim">Avg. Daily Time</p>
              <p className="text-2xl font-bold text-cyan">
                {analytics.daysActive > 0
                  ? Math.round(analytics.totalLearningTime / analytics.daysActive)
                  : 0}
              </p>
              <p className="text-xs text-slate-dim">minutes per day</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-slate-dim">Skill Level</p>
              <p className="text-2xl font-bold text-gold capitalize">{analytics.skillLevel}</p>
              <p className="text-xs text-slate-dim">current rank</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spaced Repetition Analytics Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold font-headline text-gold mb-4">
          Spaced Repetition Analytics
        </h2>
        <p className="text-slate-dim mb-6">
          Track your memory retention and review performance with FSRS-powered insights
        </p>

        {/* FSRS Stats Overview */}
        <FSRSStatsCard className="mb-6" />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RetentionTrendChart />
          <StreakCalendar />
        </div>
      </div>
    </div>
  );
}
