'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Activity, Crosshair, Radio } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getTenantBenchmarks,
  type BenchmarkReport,
  type BenchmarkDataPoint,
} from '../../actions/benchmarks';

const DIMENSION_META: Record<string, { label: string; code: string; unit: string; higherBetter: boolean }> = {
  signal_detection_rate: { label: 'Signal Detection Rate', code: 'SDR', unit: '%', higherBetter: true },
  case_processing_time: { label: 'Case Processing Time', code: 'CPT', unit: 'days', higherBetter: false },
  report_quality_score: { label: 'Report Quality', code: 'RQS', unit: '%', higherBetter: true },
  regulatory_compliance_rate: { label: 'Regulatory Compliance', code: 'RCR', unit: '%', higherBetter: true },
  team_competency_level: { label: 'Team Competency', code: 'TCL', unit: '/5', higherBetter: true },
  knowledge_coverage: { label: 'Knowledge Coverage', code: 'KCV', unit: '%', higherBetter: true },
  community_engagement: { label: 'Community Engagement', code: 'CEI', unit: '%', higherBetter: true },
};

function formatValue(value: number, unit: string): string {
  if (unit === '%') return `${(value * 100).toFixed(0)}`;
  if (unit === 'days') return value.toFixed(1);
  if (unit === '/5') return value.toFixed(1);
  return value.toFixed(2);
}

function ThreatBar({ percentile }: { percentile: number }) {
  const segments = 20;
  const filled = Math.round((percentile / 100) * segments);

  return (
    <div className="flex gap-px" role="meter" aria-valuenow={percentile} aria-valuemin={0} aria-valuemax={100}>
      {Array.from({ length: segments }).map((_, i) => {
        const isActive = i < filled;
        const color =
          i < segments * 0.25 ? 'bg-red-500/80' :
          i < segments * 0.5 ? 'bg-gold/80' :
          i < segments * 0.75 ? 'bg-cyan/80' :
          'bg-emerald-500/80';

        return (
          <div
            key={i}
            className={`h-1 flex-1 transition-all duration-500 ${
              isActive ? color : 'bg-nex-light/20'
            }`}
            style={{ transitionDelay: `${i * 25}ms` }}
          />
        );
      })}
    </div>
  );
}

function DimensionCard({ dp, index: _index }: { dp: BenchmarkDataPoint; index: number }) {
  const meta = DIMENSION_META[dp.dimension] || { label: dp.dimension, code: '???', unit: '', higherBetter: true };
  const isAboveMedian = meta.higherBetter
    ? dp.value > dp.platformMedian
    : dp.value < dp.platformMedian;

  return (
    <div className="group relative border border-nex-light/40 bg-gradient-to-b from-nex-surface/60 to-nex-deep/30 overflow-hidden transition-all hover:border-cyan/20">
      {/* Top accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="p-4">
        {/* Header: code + label + trend */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono font-bold text-cyan/60 bg-cyan/8 px-1.5 py-0.5 border border-cyan/15">
              {meta.code}
            </span>
            <span className="text-xs font-medium text-slate-dim/90 tracking-tight">
              {meta.label}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {isAboveMedian ? (
              <TrendingUp className="h-3 w-3 text-emerald-400" />
            ) : dp.value === dp.platformMedian ? (
              <Minus className="h-3 w-3 text-slate-dim/50" />
            ) : (
              <TrendingDown className="h-3 w-3 text-gold/80" />
            )}
          </div>
        </div>

        {/* Value + percentile */}
        <div className="flex items-baseline gap-3 mb-3">
          <div>
            <span className="text-2xl font-bold tabular-nums text-white tracking-tight">
              {formatValue(dp.value, meta.unit)}
            </span>
            <span className="text-[10px] font-mono text-slate-dim/50 ml-1">
              {meta.unit}
            </span>
          </div>
          <div className="text-right ml-auto">
            <span className="text-sm font-mono font-bold tabular-nums text-cyan">
              P{dp.percentile.toFixed(0)}
            </span>
          </div>
        </div>

        {/* Segmented bar */}
        <ThreatBar percentile={dp.percentile} />

        {/* Range labels */}
        <div className="flex justify-between mt-1.5 text-[9px] font-mono text-slate-dim/40 tabular-nums">
          <span>P25: {formatValue(dp.platformP25, meta.unit)}</span>
          <span>MED: {formatValue(dp.platformMedian, meta.unit)}</span>
          <span>P75: {formatValue(dp.platformP75, meta.unit)}</span>
        </div>
      </div>
    </div>
  );
}

function OverallScore({ report }: { report: BenchmarkReport }) {
  const threatLevel =
    report.overallPercentile >= 75 ? { label: 'OPTIMAL', color: 'text-emerald-400', border: 'border-emerald-500/30' } :
    report.overallPercentile >= 50 ? { label: 'NOMINAL', color: 'text-cyan', border: 'border-cyan/30' } :
    report.overallPercentile >= 25 ? { label: 'ADVISORY', color: 'text-gold', border: 'border-gold/30' } :
    { label: 'CRITICAL', color: 'text-red-400', border: 'border-red-500/30' };

  return (
    <div className="relative border border-nex-light/40 bg-gradient-to-r from-nex-surface/60 via-nex-deep/30 to-nex-surface/60 overflow-hidden">
      {/* Scan line effect */}
      <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,174,239,0.01)_50%)] bg-[length:100%_4px] pointer-events-none" />

      <div className="relative p-6">
        <div className="flex items-center gap-2 mb-5">
          <Activity className="h-4 w-4 text-cyan/60" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/60">
            Overall Score
          </span>
          <div className="h-px flex-1 bg-nex-light/30" />
          <span className={`text-[10px] font-mono uppercase tracking-widest font-bold ${threatLevel.color}`}>
            {threatLevel.label}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Composite score */}
          <div className="text-center">
            <div className="text-4xl font-bold tabular-nums text-white tracking-tighter leading-none">
              {report.overallScore.toFixed(1)}
            </div>
            <div className="text-[9px] font-mono text-slate-dim/50 uppercase tracking-widest mt-1.5">
              Composite Index
            </div>
          </div>

          {/* Percentile */}
          <div className="text-center border-x border-nex-light/20">
            <div className={`text-4xl font-bold tabular-nums tracking-tighter leading-none ${threatLevel.color}`}>
              P{report.overallPercentile.toFixed(0)}
            </div>
            <div className="text-[9px] font-mono text-slate-dim/50 uppercase tracking-widest mt-1.5">
              Percentile Rank
            </div>
          </div>

          {/* Period */}
          <div className="text-center">
            <div className="text-xl font-mono font-bold text-slate-light/80 leading-none mt-2">
              {report.period}
            </div>
            <div className="text-[9px] font-mono text-slate-dim/50 uppercase tracking-widest mt-1.5">
              Reporting Period
            </div>
          </div>
        </div>

        {/* Full-width threat bar */}
        <div className="mt-5">
          <ThreatBar percentile={report.overallPercentile} />
        </div>
      </div>
    </div>
  );
}

function IntelPanel({ report }: { report: BenchmarkReport }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* Situational awareness */}
      <div className="border border-nex-light/40 bg-nex-surface/30 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Crosshair className="h-3.5 w-3.5 text-gold/60" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/60">
            Situational Awareness
          </span>
        </div>
        <div className="space-y-3">
          {report.insights.map((insight, i) => (
            <div key={i} className="flex gap-3">
              <span className="flex-shrink-0 text-[9px] font-mono text-slate-dim/40 tabular-nums mt-0.5">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="text-xs text-slate-dim/80 leading-relaxed">{insight}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Directives */}
      <div className="border border-nex-light/40 bg-nex-surface/30 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Radio className="h-3.5 w-3.5 text-cyan/60" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/60">
            Recommendations
          </span>
        </div>
        <div className="space-y-3">
          {report.recommendations.map((rec, i) => (
            <div key={i} className="flex gap-3">
              <span className="flex-shrink-0 text-[9px] font-mono text-cyan/40 tabular-nums mt-0.5">
                D-{String(i + 1).padStart(2, '0')}
              </span>
              <p className="text-xs text-slate-dim/80 leading-relaxed">{rec}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="border border-nex-light/40 bg-nex-surface/30 p-6">
        <Skeleton className="h-4 w-48 mb-5" />
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-12 w-20 mx-auto" />
          <Skeleton className="h-12 w-20 mx-auto" />
          <Skeleton className="h-12 w-20 mx-auto" />
        </div>
        <Skeleton className="h-1 w-full mt-5" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border border-nex-light/40 bg-nex-surface/30 p-4">
            <Skeleton className="h-3 w-28 mb-3" />
            <Skeleton className="h-8 w-16 mb-3" />
            <div className="flex gap-px">
              {Array.from({ length: 20 }).map((_, j) => (
                <Skeleton key={j} className="h-1 flex-1" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BenchmarksDashboard() {
  const [report, setReport] = useState<BenchmarkReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBenchmarks() {
      const result = await getTenantBenchmarks();
      if (result.success && result.data) {
        setReport(result.data);
      } else {
        setError(result.error || 'Failed to load benchmarks');
      }
      setLoading(false);
    }
    loadBenchmarks();
  }, []);

  if (loading) return <DashboardSkeleton />;

  if (error || !report) {
    return (
      <div className="border border-nex-light/40 bg-nex-surface/30 p-12 text-center">
        <Activity className="h-6 w-6 text-slate-dim/30 mx-auto mb-3" />
        <p className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/50">
          {error || 'Assessment data unavailable'}
        </p>
        <p className="text-[9px] font-mono text-slate-dim/30 mt-1">
          Verify NexCore API operational status
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-golden-3">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <OverallScore report={report} />
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-golden-2">
        {report.dataPoints.map((dp, i) => (
          <motion.div
            key={dp.dimension}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 + i * 0.07 }}
          >
            <DimensionCard dp={dp} index={i} />
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <IntelPanel report={report} />
      </motion.div>
    </div>
  );
}
