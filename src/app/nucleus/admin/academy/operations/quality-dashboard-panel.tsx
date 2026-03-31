'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Award,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Loader2,
  BarChart3,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  getContentQualityMetrics,
  getContentIssues,
  type ContentQualityMetrics,
  type ContentIssue,
} from '@/lib/actions/quality-dashboard';

import { logger } from '@/lib/logger';
const log = logger.scope('operations/quality-dashboard-panel');

function getTrendIcon(trend: 'improving' | 'stable' | 'declining') {
  switch (trend) {
    case 'improving':
      return <TrendingUp className="h-4 w-4 text-emerald-400" />;
    case 'declining':
      return <TrendingDown className="h-4 w-4 text-red-400" />;
    default:
      return <Minus className="h-4 w-4 text-slate-dim" />;
  }
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-cyan';
  if (score >= 40) return 'text-amber-400';
  return 'text-red-400';
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/30';
  if (score >= 60) return 'bg-cyan/10 border-cyan/30';
  if (score >= 40) return 'bg-amber-500/10 border-amber-500/30';
  return 'bg-red-500/10 border-red-500/30';
}

function getSeverityIcon(severity: 'critical' | 'warning' | 'info') {
  switch (severity) {
    case 'critical':
      return <XCircle className="h-4 w-4 text-red-400" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-amber-400" />;
    default:
      return <AlertCircle className="h-4 w-4 text-slate-dim" />;
  }
}

export function QualityDashboardPanel() {
  const [metrics, setMetrics] = useState<ContentQualityMetrics | null>(null);
  const [issues, setIssues] = useState<ContentIssue[]>([]);
  const [totalIssues, setTotalIssues] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [metricsRes, issuesRes] = await Promise.all([
        getContentQualityMetrics(),
        getContentIssues(10),
      ]);

      if (metricsRes.success && metricsRes.metrics) {
        setMetrics(metricsRes.metrics);
      }
      if (issuesRes.success) {
        setIssues(issuesRes.issues || []);
        setTotalIssues(issuesRes.totalCount || 0);
      }
    } catch (error) {
      log.error('Failed to load quality data:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const criticalIssues = issues.filter((i) => i.severity === 'critical');
  const warningIssues = issues.filter((i) => i.severity === 'warning');

  return (
    <Card className="bg-nex-surface border-nex-light">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-cyan" />
            <CardTitle className="text-slate-light">Content Quality</CardTitle>
            {metrics && (
              <div className="flex items-center gap-1">
                {getTrendIcon(metrics.contentHealthTrend)}
                <span className="text-xs text-slate-dim capitalize">
                  {metrics.contentHealthTrend}
                </span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-slate-dim hover:text-cyan"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-cyan" />
          </div>
        ) : metrics ? (
          <>
            {/* Overall Score */}
            <div className={`p-4 rounded-lg border ${getScoreBgColor(metrics.overallScore)}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-dim">Overall Quality Score</span>
                <span className={`text-2xl font-bold ${getScoreColor(metrics.overallScore)}`}>
                  {metrics.overallScore}%
                </span>
              </div>
              <Progress value={metrics.overallScore} className="h-2" />
            </div>

            {/* Quality Distribution */}
            <div className="grid grid-cols-4 gap-2">
              <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-center">
                <p className="text-lg font-bold text-emerald-400">
                  {metrics.byQualityTier.excellent}
                </p>
                <p className="text-xs text-slate-dim">Excellent</p>
              </div>
              <div className="p-2 rounded bg-cyan/10 border border-cyan/20 text-center">
                <p className="text-lg font-bold text-cyan">
                  {metrics.byQualityTier.good}
                </p>
                <p className="text-xs text-slate-dim">Good</p>
              </div>
              <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-center">
                <p className="text-lg font-bold text-amber-400">
                  {metrics.byQualityTier.fair}
                </p>
                <p className="text-xs text-slate-dim">Fair</p>
              </div>
              <div className="p-2 rounded bg-red-500/10 border border-red-500/20 text-center">
                <p className="text-lg font-bold text-red-400">
                  {metrics.byQualityTier.needsWork}
                </p>
                <p className="text-xs text-slate-dim">Needs Work</p>
              </div>
            </div>

            {expanded && (
              <>
                {/* Time Metrics */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-lg bg-nex-dark border border-nex-light">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-slate-dim" />
                      <span className="text-xs text-slate-dim">Avg Review Time</span>
                    </div>
                    <p className="text-lg font-semibold text-slate-light">
                      {metrics.avgTimeToReview}h
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-nex-dark border border-nex-light">
                    <div className="flex items-center gap-2 mb-1">
                      <BarChart3 className="h-4 w-4 text-slate-dim" />
                      <span className="text-xs text-slate-dim">Avg Publish Time</span>
                    </div>
                    <p className="text-lg font-semibold text-slate-light">
                      {metrics.avgTimeToPublish}h
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-nex-dark border border-nex-light">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="h-4 w-4 text-slate-dim" />
                      <span className="text-xs text-slate-dim">Rejection Rate</span>
                    </div>
                    <p className={`text-lg font-semibold ${metrics.rejectionRate > 20 ? 'text-red-400' : 'text-slate-light'}`}>
                      {metrics.rejectionRate}%
                    </p>
                  </div>
                </div>

                {/* Active Issues */}
                {issues.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-slate-light flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                        Active Issues
                        <Badge variant="secondary" className="bg-amber-500/10 text-amber-400">
                          {totalIssues}
                        </Badge>
                      </h4>
                    </div>
                    <ScrollArea className="h-[150px]">
                      <div className="space-y-2">
                        {issues.map((issue, index) => (
                          <div
                            key={`${issue.ksbId}-${index}`}
                            className="p-2 rounded bg-nex-dark border border-nex-light"
                          >
                            <div className="flex items-start gap-2">
                              {getSeverityIcon(issue.severity)}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-light truncate">
                                  {issue.ksbName}
                                </p>
                                <p className="text-xs text-slate-dim truncate">
                                  {issue.description}
                                </p>
                                <p className="text-xs text-slate-dim mt-0.5">
                                  {issue.domainName}
                                </p>
                              </div>
                              <Link
                                href={`/nucleus/admin/academy/ksb-builder?domain=${issue.domainId}&ksb=${issue.ksbId}`}
                                className="text-xs text-cyan hover:underline shrink-0"
                              >
                                Fix
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </>
            )}

            {/* Quick Stats */}
            {!expanded && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  {criticalIssues.length > 0 && (
                    <span className="flex items-center gap-1 text-red-400">
                      <XCircle className="h-3 w-3" />
                      {criticalIssues.length} critical
                    </span>
                  )}
                  {warningIssues.length > 0 && (
                    <span className="flex items-center gap-1 text-amber-400">
                      <AlertTriangle className="h-3 w-3" />
                      {warningIssues.length} warnings
                    </span>
                  )}
                  {issues.length === 0 && (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle className="h-3 w-3" />
                      No issues
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-dim">
                  {metrics.totalKSBs} total KSBs
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <Award className="h-8 w-8 text-slate-dim mx-auto mb-2" />
            <p className="text-sm text-slate-dim">Unable to load quality metrics</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
