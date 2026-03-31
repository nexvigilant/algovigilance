'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge, resolveColor } from '@/components/ui/branded/status-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Shield,
  Target,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { getPredictiveHealthStatus, type CommunityHealthReport } from '../../actions/admin/governance';
import { cn } from '@/lib/utils';

export function GovernanceClient() {
  const [report, setReport] = useState<CommunityHealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadHealthReport() {
    setLoading(true);
    setError(null);
    const result = await getPredictiveHealthStatus();
    if (result.success && result.report) {
      setReport(result.report);
    } else {
      setError(result.error || 'Failed to load health report');
    }
    setLoading(false);
  }

  useEffect(() => {
    loadHealthReport();
  }, []);

  const getStatusColor = (status: string) => resolveColor(status);

  const getStatusIcon = (status: CommunityHealthReport['status']) => {
    switch (status) {
      case 'optimal': return <CheckCircle2 className="h-5 w-5" />;
      case 'stable': return <Activity className="h-5 w-5" />;
      case 'declining': return <TrendingDown className="h-5 w-5" />;
      case 'critical': return <AlertTriangle className="h-5 w-5" />;
    }
  };

  return (
    <div className="max-w-6xl">
      <header className="mb-golden-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-golden-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-cyan/30 bg-cyan/5">
              <Shield className="h-5 w-5 text-cyan" aria-hidden="true" />
            </div>
            <div>
              <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-cyan/60">
                AlgoVigilance Community
              </p>
              <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Community Governance
              </h1>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={loadHealthReport}
            disabled={loading}
            className="border-cyan text-cyan hover:bg-cyan/10"
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
        <p className="text-sm text-slate-dim/70 max-w-xl leading-golden mt-golden-2">
          Real-time health monitoring and predictive analytics for community vitality
        </p>
      </header>

      {error ? (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Access Restricted</span>
            </div>
            <p className="text-sm text-slate-dim/70">
              {error === 'Unauthorized'
                ? 'This area is for community administrators. Contact your team lead for access.'
                : error}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.history.back()}
              className="border-cyan/30 text-cyan-soft hover:bg-cyan/10"
            >
              Return to Community
            </Button>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-nex-surface border-nex-light">
              <CardHeader>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : report && (
        <>
          <Card className={cn('mb-6 border', getStatusColor(report.status))}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getStatusIcon(report.status)}
                  <div>
                    <p className="text-sm text-slate-dim uppercase tracking-wide">
                      Community Vitality Index
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold font-headline">
                        {report.vitalityIndex}
                      </span>
                      <span className="text-slate-dim">/100</span>
                    </div>
                  </div>
                </div>
                <StatusBadge status={report.status} />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
            <Card className="bg-nex-surface border-nex-light">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-cyan" />
                  Sentiment Velocity
                </CardDescription>
                <CardTitle className="text-2xl">
                  {report.sentimentVelocity > 0 ? '+' : ''}{(report.sentimentVelocity * 100).toFixed(0)}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-dim">
                  {report.sentimentVelocity > 0.5 ? 'Strongly positive community mood' :
                   report.sentimentVelocity > 0 ? 'Positive trend' : 'Needs attention'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-nex-surface border-nex-light">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gold" />
                  Intervention Rate
                </CardDescription>
                <CardTitle className="text-2xl">
                  {(report.interventionRate * 100).toFixed(1)}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-dim">
                  {report.interventionRate < 0.02 ? 'Healthy self-moderation' :
                   report.interventionRate < 0.05 ? 'Normal intervention levels' : 'Elevated moderation activity'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-nex-surface border-nex-light">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-emerald-400" />
                  Match Accuracy
                </CardDescription>
                <CardTitle className="text-2xl">
                  {(report.matchAccuracy * 100).toFixed(0)}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-dim">
                  Discovery-to-join conversion rate
                </p>
              </CardContent>
            </Card>
          </div>

          {report.recommendations.length > 0 && (
            <Card className="bg-nex-surface border-nex-light">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-dim">
                      <span className="text-cyan mt-1">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <p className="text-sm text-slate-dim mt-4 text-center">
            Last updated: {report.timestamp.toLocaleString()}
          </p>
        </>
      )}
    </div>
  );
}
