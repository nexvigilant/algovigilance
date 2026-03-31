'use client';

import { useEffect, useState } from 'react';
import { Activity, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getPredictiveHealthStatus, type CommunityHealthReport } from '../../actions/admin/governance';
import { Skeleton } from '@/components/ui/skeleton';

import { logger } from '@/lib/logger';
const log = logger.scope('components/community-vitality');

export function CommunityVitality() {
  const [report, setReport] = useState<CommunityHealthReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const result = await getPredictiveHealthStatus();
        if (result.success && result.report) {
          setReport(result.report);
        }
      } catch (err) {
        log.error('Failed to load vitality status');
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
  }, []);

  if (loading) {
    return <Skeleton className="h-24 w-full bg-nex-surface mb-8 rounded-2xl" />;
  }

  if (!report) return null;

  return (
    <Card className="bg-nex-surface border-nex-border mb-8 overflow-hidden rounded-2xl relative">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan/50 to-transparent" />
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Main Vitality Score */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-2 border-cyan/20 flex items-center justify-center bg-nex-deep">
                <span className="text-2xl font-black text-cyan-glow font-mono">
                  {report.vitalityIndex}
                </span>
              </div>
              <Activity className="absolute -bottom-1 -right-1 h-5 w-5 text-cyan animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-white uppercase tracking-wider text-sm">
                Community Vitality
              </h3>
              <p className="text-xs text-slate-dim">Status: <span className="text-emerald-400 font-bold uppercase">{report.status}</span></p>
            </div>
          </div>

          {/* Core Metrics */}
          <div className="flex-1 grid grid-cols-3 gap-8 w-full max-w-lg">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-tighter text-slate-dim font-bold">
                <span>Sentiment</span>
                <span className="text-cyan">{Math.round((report.sentimentVelocity + 1) * 50)}%</span>
              </div>
              <Progress value={(report.sentimentVelocity + 1) * 50} className="h-1 bg-nex-light" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-tighter text-slate-dim font-bold">
                <span>Accuracy</span>
                <span className="text-gold">{Math.round(report.matchAccuracy * 100)}%</span>
              </div>
              <Progress value={report.matchAccuracy * 100} className="h-1 bg-nex-light" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-tighter text-slate-dim font-bold">
                <span>Vigilance</span>
                <span className="text-emerald-400">{Math.round((1 - report.interventionRate) * 100)}%</span>
              </div>
              <Progress value={(1 - report.interventionRate) * 100} className="h-1 bg-nex-light" />
            </div>
          </div>

          {/* AI Insights Summary */}
          <div className="hidden lg:flex items-center gap-3 bg-nex-dark/50 p-3 rounded-xl border border-nex-light/50 max-w-xs">
            <Target className="h-5 w-5 text-gold flex-shrink-0" />
            <p className="text-[10px] text-slate-dim leading-tight italic">
              "{report.recommendations[0] || 'Community health looks good. Keep growing.'}"
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
