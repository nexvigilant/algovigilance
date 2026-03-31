'use client';

/**
 * Onboarding Analytics Dashboard
 *
 * Displays aggregated onboarding funnel metrics for admins.
 * Shows conversion rates, drop-off points, and completion trends.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  UserCheck,
  TrendingUp,
  Clock,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ONBOARDING_STEPS } from '@/types/onboarding-journey';
import { getOnboardingAnalytics } from '../../actions/admin/onboarding-analytics';

interface AnalyticsData {
  totalStarted: number;
  totalCompleted: number;
  completionRate: number;
  avgCompletionTime: number;
  stepMetrics: {
    stepId: string;
    started: number;
    completed: number;
    skipped: number;
    dropOff: number;
  }[];
  recentActivity: {
    date: string;
    started: number;
    completed: number;
  }[];
}

export function OnboardingAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      setIsLoading(true);
      try {
        const result = await getOnboardingAnalytics();
        if (result.success && result.analytics) {
          setData(result.analytics);
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-cyan" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="bg-nex-surface border-cyan/20">
        <CardContent className="py-8 text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-cyan/40 mb-4" />
          <p className="text-cyan-soft/70">No analytics data available yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<Users className="h-5 w-5" />}
          label="Started"
          value={data.totalStarted}
          subtext="Total journeys begun"
        />
        <MetricCard
          icon={<UserCheck className="h-5 w-5" />}
          label="Completed"
          value={data.totalCompleted}
          subtext="Fully onboarded"
        />
        <MetricCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Conversion"
          value={`${data.completionRate}%`}
          subtext="Completion rate"
          highlight={data.completionRate >= 50}
        />
        <MetricCard
          icon={<Clock className="h-5 w-5" />}
          label="Avg Time"
          value={formatDuration(data.avgCompletionTime)}
          subtext="To complete"
        />
      </div>

      {/* Funnel Visualization */}
      <Card className="bg-nex-surface border-cyan/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-white">
            <BarChart3 className="h-5 w-5 text-cyan" />
            Onboarding Funnel
          </CardTitle>
          <CardDescription>
            Drop-off analysis by step
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.stepMetrics.map((metric, index) => {
              const stepDef = ONBOARDING_STEPS.find((s) => s.id === metric.stepId);
              const conversionRate = metric.started > 0
                ? Math.round(((metric.completed + metric.skipped) / metric.started) * 100)
                : 0;

              return (
                <div key={metric.stepId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-cyan/50 text-sm">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="font-medium text-white">
                        {stepDef?.title || metric.stepId}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Badge variant="outline" className="border-cyan/30 text-cyan-soft">
                        {metric.completed} completed
                      </Badge>
                      {metric.skipped > 0 && (
                        <Badge variant="outline" className="border-slate-dim/30 text-slate-dim">
                          {metric.skipped} skipped
                        </Badge>
                      )}
                      <span className={cn(
                        'font-semibold',
                        conversionRate >= 70 ? 'text-emerald-400' :
                        conversionRate >= 40 ? 'text-gold' :
                        'text-red-400'
                      )}>
                        {conversionRate}%
                      </span>
                    </div>
                  </div>
                  <Progress value={conversionRate} className="h-2" />
                  {metric.dropOff > 0 && (
                    <p className="text-xs text-red-400/70">
                      ↳ {metric.dropOff} users dropped off at this step
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {data.recentActivity.length > 0 && (
        <Card className="bg-nex-surface border-cyan/20">
          <CardHeader>
            <CardTitle className="text-lg text-white">Recent Activity</CardTitle>
            <CardDescription>Last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {data.recentActivity.map((day) => (
                <div
                  key={day.date}
                  className="text-center p-2 rounded bg-nex-light"
                >
                  <p className="text-xs text-cyan-soft/60">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </p>
                  <p className="text-lg font-bold text-white">{day.started}</p>
                  <p className="text-xs text-emerald-400">
                    {day.completed} done
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  subtext,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext: string;
  highlight?: boolean;
}) {
  return (
    <Card className={cn(
      'bg-nex-surface border-cyan/20',
      highlight && 'border-emerald-500/50'
    )}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="p-2 rounded-lg bg-cyan/10 text-cyan">
            {icon}
          </div>
        </div>
        <p className={cn(
          'text-2xl font-bold mt-3',
          highlight ? 'text-emerald-400' : 'text-white'
        )}>
          {value}
        </p>
        <p className="text-sm font-medium text-cyan-soft">{label}</p>
        <p className="text-xs text-slate-dim mt-1">{subtext}</p>
      </CardContent>
    </Card>
  );
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
