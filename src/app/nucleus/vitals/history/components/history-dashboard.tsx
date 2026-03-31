'use client';

import { useNexWatchHistory, type HistoryReading, type TimeRange } from '@/hooks/use-nexwatch-history';
import Link from 'next/link';

const RANGE_LABELS: Record<TimeRange, string> = {
  '24h': '24 Hours',
  '7d': '7 Days',
  '30d': '30 Days',
};

function RangeSelector({ current, onChange }: { current: TimeRange; onChange: (r: TimeRange) => void }) {
  return (
    <div className="flex gap-1 rounded-lg bg-zinc-900 p-1 border border-zinc-800">
      {(['24h', '7d', '30d'] as const).map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            current === r
              ? 'bg-zinc-700 text-zinc-100'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          {RANGE_LABELS[r]}
        </button>
      ))}
    </div>
  );
}

function StatCard({ label, value, unit, color }: { label: string; value: string | number; unit?: string; color?: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-1 tabular-nums ${color ?? 'text-zinc-100'}`}>
        {value}
        {unit && <span className="text-sm text-zinc-500 ml-1 font-normal">{unit}</span>}
      </p>
    </div>
  );
}

function HeartRateChart({ readings, range }: { readings: HistoryReading[]; range: TimeRange }) {
  if (readings.length < 2) return <EmptyChart message="Not enough data for chart" />;

  const bpms = readings.map((r) => r.bpm);
  const min = Math.min(...bpms) - 5;
  const max = Math.max(...bpms) + 5;
  const rng = max - min || 1;
  const w = 600;
  const h = 160;

  // Downsample for large datasets
  const sampled = downsample(readings, 300);
  const sampledBpms = sampled.map((r) => r.bpm);

  const points = sampledBpms
    .map((bpm, i) => {
      const x = (i / (sampledBpms.length - 1)) * w;
      const y = h - ((bpm - min) / rng) * h;
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `0,${h} ${points} ${w},${h}`;

  // Zone bands
  const zones = [
    { label: 'Resting', min: 0, max: 60, color: '#3b82f6' },
    { label: 'Normal', min: 60, max: 80, color: '#34d399' },
    { label: 'Active', min: 80, max: 100, color: '#fbbf24' },
    { label: 'Elevated', min: 100, max: 200, color: '#ef4444' },
  ];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
          Heart Rate — {RANGE_LABELS[range]}
        </p>
        <div className="flex gap-3 text-xs">
          {zones.map((z) => (
            <span key={z.label} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: z.color }} />
              <span className="text-zinc-500">{z.label}</span>
            </span>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-40" preserveAspectRatio="none">
        <defs>
          <linearGradient id="hrHistGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Zone bands */}
        {zones.map((z) => {
          const yTop = h - ((Math.min(z.max, max) - min) / rng) * h;
          const yBot = h - ((Math.max(z.min, min) - min) / rng) * h;
          if (yBot <= yTop) return null;
          return (
            <rect
              key={z.label}
              x="0" y={yTop}
              width={w} height={yBot - yTop}
              fill={z.color} opacity="0.05"
            />
          );
        })}
        <polygon points={areaPoints} fill="url(#hrHistGrad)" />
        <polyline points={points} fill="none" stroke="#34d399" strokeWidth="1.5" />
      </svg>
      <div className="flex justify-between text-xs text-zinc-600 mt-1">
        <span>{sampled.length > 0 ? formatTime(sampled[0].timestamp, range) : ''}</span>
        <span>{sampled.length > 0 ? formatTime(sampled[sampled.length - 1].timestamp, range) : ''}</span>
      </div>
    </div>
  );
}

function HrvChart({ readings, range }: { readings: HistoryReading[]; range: TimeRange }) {
  const withHrv = readings.filter((r) => r.hrv != null && r.hrv > 0);
  if (withHrv.length < 2) return <EmptyChart message="Not enough HRV data" />;

  const sampled = downsample(withHrv, 300);
  const hrvs = sampled.map((r) => r.hrv!);
  const min = Math.max(0, Math.min(...hrvs) - 5);
  const max = Math.max(...hrvs) + 5;
  const rng = max - min || 1;
  const w = 600;
  const h = 120;

  const points = hrvs
    .map((v, i) => {
      const x = (i / (hrvs.length - 1)) * w;
      const y = h - ((v - min) / rng) * h;
      return `${x},${y}`;
    })
    .join(' ');

  // HRV threshold line at 20ms (low recovery threshold)
  const thresholdY = h - ((20 - min) / rng) * h;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-3">
        HRV (RMSSD) — {RANGE_LABELS[range]}
      </p>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-28" preserveAspectRatio="none">
        <defs>
          <linearGradient id="hrvHistGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Low HRV threshold */}
        {thresholdY > 0 && thresholdY < h && (
          <line x1="0" y1={thresholdY} x2={w} y2={thresholdY} stroke="#f87171" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.5" />
        )}
        <polyline points={points} fill="none" stroke="#a78bfa" strokeWidth="1.5" />
      </svg>
      <div className="flex justify-between text-xs text-zinc-600 mt-1">
        <span>{sampled.length > 0 ? formatTime(sampled[0].timestamp, range) : ''}</span>
        <span className="text-red-400/50">— 20ms threshold</span>
        <span>{sampled.length > 0 ? formatTime(sampled[sampled.length - 1].timestamp, range) : ''}</span>
      </div>
    </div>
  );
}

function StressDistribution({ distribution }: { distribution: Record<string, number> }) {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const levels = [
    { key: 'very_low', label: 'Very Low', color: '#34d399' },
    { key: 'low', label: 'Low', color: '#a3e635' },
    { key: 'moderate', label: 'Moderate', color: '#fbbf24' },
    { key: 'high', label: 'High', color: '#f97316' },
    { key: 'very_high', label: 'Very High', color: '#ef4444' },
  ];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-3">
        Stress Distribution
      </p>
      <div className="flex h-6 rounded-full overflow-hidden bg-zinc-800">
        {levels.map((l) => {
          const count = distribution[l.key] ?? 0;
          const pct = (count / total) * 100;
          if (pct < 1) return null;
          return (
            <div
              key={l.key}
              style={{ width: `${pct}%`, backgroundColor: l.color }}
              className="transition-all"
              title={`${l.label}: ${count} readings (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>
      <div className="flex gap-4 mt-3 flex-wrap">
        {levels.map((l) => {
          const count = distribution[l.key] ?? 0;
          if (count === 0) return null;
          const pct = ((count / total) * 100).toFixed(0);
          return (
            <span key={l.key} className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
              {l.label} {pct}%
            </span>
          );
        })}
      </div>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
      <p className="text-sm text-zinc-500">{message}</p>
    </div>
  );
}

// Downsample readings using largest-triangle-three-buckets (simplified)
function downsample(data: HistoryReading[], threshold: number): HistoryReading[] {
  if (data.length <= threshold) return data;

  const step = data.length / threshold;
  const result: HistoryReading[] = [data[0]];

  for (let i = 1; i < threshold - 1; i++) {
    const idx = Math.round(i * step);
    if (idx < data.length) result.push(data[idx]);
  }

  result.push(data[data.length - 1]);
  return result;
}

function formatTime(timestamp: string, range: TimeRange): string {
  const d = new Date(timestamp);
  if (range === '24h') return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (range === '7d') return d.toLocaleDateString([], { weekday: 'short', hour: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function HistoryDashboard() {
  const { readings, loading, error, range, setRange, stats } = useNexWatchHistory();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/nucleus/vitals" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
              NexWatch
            </Link>
            <span className="text-zinc-700">/</span>
            <h1 className="text-xl font-bold text-zinc-100">History</h1>
          </div>
          <p className="text-sm text-zinc-500">
            Biometric trends from Galaxy Watch
          </p>
        </div>
        <RangeSelector current={range} onChange={setRange} />
      </div>

      {error && (
        <div className="rounded-lg bg-red-950/30 border border-red-900/50 p-3 mb-6 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-zinc-700 border-t-emerald-400 rounded-full animate-spin" />
        </div>
      )}

      {!loading && readings.length === 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
          <p className="text-zinc-400 mb-2">No readings for this period</p>
          <p className="text-xs text-zinc-600">The NexWatch bridge pushes data every 2 seconds when your Galaxy Watch is connected.</p>
        </div>
      )}

      {!loading && stats && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
            <StatCard label="Avg BPM" value={stats.avgBpm} unit="bpm" color="text-emerald-400" />
            <StatCard label="Min BPM" value={stats.minBpm} unit="bpm" color="text-blue-400" />
            <StatCard label="Max BPM" value={stats.maxBpm} unit="bpm" color="text-red-400" />
            <StatCard
              label="Avg HRV"
              value={stats.avgHrv ?? '--'}
              unit={stats.avgHrv != null ? 'ms' : undefined}
              color={stats.avgHrv != null && stats.avgHrv < 20 ? 'text-orange-400' : 'text-violet-400'}
            />
            <StatCard label="Readings" value={stats.totalReadings.toLocaleString()} />
          </div>

          {/* Charts */}
          <div className="space-y-4">
            <HeartRateChart readings={readings} range={range} />
            <HrvChart readings={readings} range={range} />
            <StressDistribution distribution={stats.stressDistribution} />
          </div>
        </>
      )}
    </div>
  );
}
