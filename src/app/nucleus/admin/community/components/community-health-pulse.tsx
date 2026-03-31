'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Minus,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getCommunityAnalytics } from '@/app/nucleus/community/actions/analytics';

import { logger } from '@/lib/logger';
const log = logger.scope('admin/CommunityHealthPulse');

type HealthStatus = 'healthy' | 'warning' | 'critical';

interface HealthMetric {
  label: string;
  value: string | number;
  trend: 'up' | 'down' | 'stable';
  trendValue?: string;
  status: HealthStatus;
}

/**
 * Community Health Pulse
 *
 * A compact, at-a-glance health indicator for the community admin dashboard.
 * Shows key metrics with health status indicators.
 */
export function CommunityHealthPulse() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [overallHealth, setOverallHealth] = useState<HealthStatus>('healthy');
  const [healthScore, setHealthScore] = useState(0);

  useEffect(() => {
    loadHealthData();
  }, []);

  async function loadHealthData() {
    try {
      const result = await getCommunityAnalytics('7d');
      if (result.success && result.data) {
        const data = result.data;

        // Calculate engagement rate
        const engagementRate =
          data.overview.totalMembers > 0
            ? ((data.overview.activeMembers / data.overview.totalMembers) * 100).toFixed(1)
            : '0';

        // Build metrics array
        const healthMetrics: HealthMetric[] = [
          {
            label: 'Active Members',
            value: data.overview.activeMembers,
            trend: data.overview.growthRate > 0 ? 'up' : data.overview.growthRate < 0 ? 'down' : 'stable',
            trendValue: `${Math.abs(data.overview.growthRate)}%`,
            status: getEngagementStatus(parseFloat(engagementRate)),
          },
          {
            label: 'Engagement Rate',
            value: `${engagementRate}%`,
            trend: parseFloat(engagementRate) > 10 ? 'up' : 'stable',
            status: getEngagementStatus(parseFloat(engagementRate)),
          },
          {
            label: 'Avg Response',
            value: `${data.engagement.avgResponseTime}h`,
            trend: data.engagement.avgResponseTime < 24 ? 'up' : 'down',
            status: getResponseTimeStatus(data.engagement.avgResponseTime),
          },
          {
            label: 'Posts/Day',
            value: data.engagement.avgPostsPerDay,
            trend: data.engagement.avgPostsPerDay > 5 ? 'up' : 'stable',
            status: getPostingStatus(data.engagement.avgPostsPerDay),
          },
        ];

        setMetrics(healthMetrics);

        // Calculate overall health score (0-100)
        const score = calculateHealthScore(healthMetrics);
        setHealthScore(score);
        setOverallHealth(score >= 70 ? 'healthy' : score >= 40 ? 'warning' : 'critical');
      }
    } catch (error) {
      log.error('Error loading health data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-2">
          <div className="h-6 w-48 bg-slate-700 rounded"></div>
        </CardHeader>
        <CardContent>
          <div className="h-24 bg-slate-700 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'border-l-4 transition-colors',
        overallHealth === 'healthy' && 'border-l-emerald-500',
        overallHealth === 'warning' && 'border-l-yellow-500',
        overallHealth === 'critical' && 'border-l-red-500'
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity
              className={cn(
                'h-5 w-5',
                overallHealth === 'healthy' && 'text-emerald-500 animate-[heartbeat_2s_ease-in-out_infinite]',
                overallHealth === 'warning' && 'text-yellow-500',
                overallHealth === 'critical' && 'text-red-500 animate-pulse'
              )}
            />
            <CardTitle className="text-lg text-slate-light">
              Community Health Pulse
            </CardTitle>
          </div>
          <HealthBadge status={overallHealth} score={healthScore} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Metric Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </div>

        {/* Quick Actions / Alerts */}
        {overallHealth !== 'healthy' && (
          <div
            className={cn(
              'flex items-center gap-2 rounded-lg p-3 text-sm',
              overallHealth === 'warning' && 'bg-yellow-500/10 text-yellow-200',
              overallHealth === 'critical' && 'bg-red-500/10 text-red-200'
            )}
          >
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              {overallHealth === 'warning'
                ? 'Engagement is lower than usual. Consider posting engagement prompts.'
                : 'Community activity is critically low. Immediate action recommended.'}
            </span>
          </div>
        )}

        {/* Link to full analytics */}
        <div className="flex justify-end pt-2">
          <Button asChild variant="ghost" size="sm" className="text-cyan-soft/70 hover:text-cyan">
            <Link href="/nucleus/admin/community/analytics">
              View Full Analytics
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function HealthBadge({
  status,
  score,
}: {
  status: HealthStatus;
  score: number;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-0.5',
        status === 'healthy' && 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10',
        status === 'warning' && 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10',
        status === 'critical' && 'border-red-500/50 text-red-400 bg-red-500/10'
      )}
    >
      {status === 'healthy' && <CheckCircle2 className="h-3.5 w-3.5" />}
      {status === 'warning' && <AlertTriangle className="h-3.5 w-3.5" />}
      {status === 'critical' && <AlertTriangle className="h-3.5 w-3.5" />}
      <span className="font-medium">{score}/100</span>
    </Badge>
  );
}

function MetricCard({ metric }: { metric: HealthMetric }) {
  const TrendIcon =
    metric.trend === 'up'
      ? TrendingUp
      : metric.trend === 'down'
      ? TrendingDown
      : Minus;

  return (
    <div className="space-y-1">
      <div className="text-xs text-slate-dim">{metric.label}</div>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-semibold text-slate-light">{metric.value}</span>
        {metric.trendValue && (
          <span
            className={cn(
              'flex items-center text-xs',
              metric.trend === 'up' && 'text-emerald-400',
              metric.trend === 'down' && 'text-red-400',
              metric.trend === 'stable' && 'text-slate-dim'
            )}
          >
            <TrendIcon className="h-3 w-3 mr-0.5" />
            {metric.trendValue}
          </span>
        )}
      </div>
      <div
        className={cn(
          'h-1 w-full rounded-full',
          metric.status === 'healthy' && 'bg-emerald-500/30',
          metric.status === 'warning' && 'bg-yellow-500/30',
          metric.status === 'critical' && 'bg-red-500/30'
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all',
            metric.status === 'healthy' && 'bg-emerald-500',
            metric.status === 'warning' && 'bg-yellow-500',
            metric.status === 'critical' && 'bg-red-500'
          )}
          style={{
            width: `${metric.status === 'healthy' ? 100 : metric.status === 'warning' ? 60 : 30}%`,
          }}
        />
      </div>
    </div>
  );
}

// Health status calculation helpers
function getEngagementStatus(rate: number): HealthStatus {
  if (rate >= 15) return 'healthy';
  if (rate >= 5) return 'warning';
  return 'critical';
}

function getResponseTimeStatus(hours: number): HealthStatus {
  if (hours <= 12) return 'healthy';
  if (hours <= 48) return 'warning';
  return 'critical';
}

function getPostingStatus(postsPerDay: number): HealthStatus {
  if (postsPerDay >= 5) return 'healthy';
  if (postsPerDay >= 1) return 'warning';
  return 'critical';
}

function calculateHealthScore(metrics: HealthMetric[]): number {
  const statusScores = { healthy: 100, warning: 50, critical: 20 };
  const totalScore = metrics.reduce((sum, m) => sum + statusScores[m.status], 0);
  return Math.round(totalScore / metrics.length);
}
