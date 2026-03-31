'use client';

import Link from 'next/link';
import { useNexWatch, type BiometricSnapshot } from '@/hooks/use-nexwatch';

const ZONE_COLORS: Record<string, string> = {
  resting: 'text-emerald-400',
  active: 'text-amber-400',
  elevated: 'text-orange-400',
  very_elevated: 'text-red-400',
  low: 'text-blue-400',
  no_contact: 'text-zinc-500',
  unknown: 'text-zinc-500',
};

const ZONE_BG: Record<string, string> = {
  resting: 'bg-emerald-500/10 border-emerald-500/20',
  active: 'bg-amber-500/10 border-amber-500/20',
  elevated: 'bg-orange-500/10 border-orange-500/20',
  very_elevated: 'bg-red-500/10 border-red-500/20',
  low: 'bg-blue-500/10 border-blue-500/20',
  no_contact: 'bg-zinc-500/10 border-zinc-500/20',
  unknown: 'bg-zinc-500/10 border-zinc-500/20',
};

const STRESS_LABELS: Record<string, string> = {
  low: 'Low',
  very_low: 'Very Low',
  moderate: 'Moderate',
  high: 'High',
  very_high: 'Very High',
  unknown: '--',
};

function MetricCard({
  label,
  value,
  unit,
  sublabel,
  color,
}: {
  label: string;
  value: string | number;
  unit?: string;
  sublabel?: string;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">{label}</p>
      <p className={`text-3xl font-bold mt-1.5 tabular-nums ${color ?? 'text-zinc-100'}`}>
        {value}
        {unit && <span className="text-sm text-zinc-500 ml-1 font-normal">{unit}</span>}
      </p>
      {sublabel && <p className="text-xs text-zinc-600 mt-1">{sublabel}</p>}
    </div>
  );
}

function StatusIndicator({ connected, source }: { connected: boolean; source: string }) {
  const label = source === 'firebase' ? 'Realtime' : source === 'api' ? 'Polling' : 'Offline';
  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-block w-2.5 h-2.5 rounded-full ${
          connected
            ? source === 'firebase'
              ? 'bg-emerald-400 animate-pulse'
              : 'bg-amber-400 animate-pulse'
            : 'bg-zinc-600'
        }`}
      />
      <span className="text-xs text-zinc-500 font-mono">{label}</span>
    </div>
  );
}

function HrvGauge({ value }: { value: number | null }) {
  if (value == null) return <span className="text-zinc-500">--</span>;
  // HRV zones: <20 low (red), 20-50 moderate (amber), >50 good (green)
  const pct = Math.min(value / 100, 1);
  const color = value < 20 ? '#f87171' : value < 50 ? '#fbbf24' : '#34d399';
  return (
    <div className="flex items-center gap-3">
      <svg width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="20" fill="none" stroke="#27272a" strokeWidth="4" />
        <circle
          cx="24" cy="24" r="20"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={`${pct * 125.6} 125.6`}
          strokeLinecap="round"
          transform="rotate(-90 24 24)"
        />
        <text x="24" y="27" textAnchor="middle" fill={color} fontSize="12" fontWeight="bold" fontFamily="monospace">
          {value.toFixed(0)}
        </text>
      </svg>
      <div>
        <p className="text-xs text-zinc-500">HRV RMSSD</p>
        <p className="text-sm" style={{ color }}>
          {value < 20 ? 'Low — recovery' : value < 50 ? 'Moderate' : 'Good'}
        </p>
      </div>
    </div>
  );
}

function Sparkline({ history }: { history: BiometricSnapshot[] }) {
  if (history.length < 2) return null;

  const bpms = history.map((h) => h.bpm);
  const min = Math.min(...bpms) - 5;
  const max = Math.max(...bpms) + 5;
  const range = max - min || 1;
  const w = 400;
  const h = 80;

  const points = bpms
    .map((bpm, i) => {
      const x = (i / (bpms.length - 1)) * w;
      const y = h - ((bpm - min) / range) * h;
      return `${x},${y}`;
    })
    .join(' ');

  // Gradient fill under the line
  const areaPoints = `0,${h} ${points} ${w},${h}`;

  const latest = bpms[bpms.length - 1];
  const avg = Math.round(bpms.reduce((a, b) => a + b, 0) / bpms.length);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
          Heart Rate Trend
        </p>
        <div className="flex gap-4 text-xs text-zinc-500">
          <span>Min: <span className="text-zinc-300 tabular-nums">{Math.min(...bpms)}</span></span>
          <span>Avg: <span className="text-zinc-300 tabular-nums">{avg}</span></span>
          <span>Max: <span className="text-zinc-300 tabular-nums">{Math.max(...bpms)}</span></span>
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20" preserveAspectRatio="none">
        <defs>
          <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#hrGrad)" />
        <polyline points={points} fill="none" stroke="#34d399" strokeWidth="2" />
        <circle
          cx={w}
          cy={h - ((latest - min) / range) * h}
          r="3"
          fill="#34d399"
        />
      </svg>
      <p className="text-xs text-zinc-600 mt-2">
        Last {history.length} readings ({Math.round(history.length * 2 / 60)}min)
      </p>
    </div>
  );
}

function StressTimeline({ history }: { history: BiometricSnapshot[] }) {
  if (history.length < 2) return null;

  const stressMap: Record<string, number> = {
    very_low: 1,
    low: 2,
    moderate: 3,
    high: 4,
    very_high: 5,
    unknown: 0,
  };

  const stressColor = (level: number) => {
    if (level <= 1) return '#34d399';
    if (level === 2) return '#a3e635';
    if (level === 3) return '#fbbf24';
    if (level === 4) return '#f97316';
    return '#ef4444';
  };

  const barWidth = Math.max(2, 300 / history.length);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-3">
        Stress Timeline
      </p>
      <div className="flex items-end gap-px h-8">
        {history.map((snap, i) => {
          const level = stressMap[snap.stress] ?? 0;
          const heightPct = level > 0 ? (level / 5) * 100 : 10;
          return (
            <div
              key={i}
              style={{
                width: `${barWidth}px`,
                height: `${heightPct}%`,
                backgroundColor: stressColor(level),
                opacity: level === 0 ? 0.2 : 0.8,
              }}
              className="rounded-t-sm"
              title={`${snap.stress} at ${new Date(snap.time).toLocaleTimeString()}`}
            />
          );
        })}
      </div>
    </div>
  );
}

export function VitalsDashboard() {
  const { data, history, error, source } = useNexWatch();

  const connected = data.status === 'connected';
  const bpm = data.current_bpm;
  const zone = data.zone;
  const stress = data.stress_estimate;
  const hrv = data.hrv_rmssd_ms;
  const steps = data.steps_today;
  const temp = data.skin_temp_c;
  const recommendation = data.founder_health?.recommendation ?? 'unknown';

  const bpmColor =
    bpm === 0
      ? 'text-zinc-500'
      : bpm < 60
        ? 'text-blue-400'
        : bpm < 80
          ? 'text-emerald-400'
          : bpm < 100
            ? 'text-amber-400'
            : 'text-red-400';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg p-2 border ${ZONE_BG[zone] ?? ZONE_BG.unknown}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={ZONE_COLORS[zone] ?? 'text-zinc-500'}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-100">NexWatch</h1>
            <p className="text-sm text-zinc-500">
              {connected ? data.device ?? 'Galaxy Watch' : 'Watch disconnected'}
              {data.updated_at && (
                <span className="ml-2 tabular-nums">
                  {new Date(data.updated_at).toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
        </div>
        <StatusIndicator connected={connected} source={source} />
      </div>

      {error && (
        <div className="rounded-lg bg-red-950/30 border border-red-900/50 p-3 mb-6 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Recommendation Banner */}
      {recommendation !== 'nominal' && recommendation !== 'unknown' && recommendation !== 'watch_disconnected' && (
        <div className="rounded-lg bg-amber-950/20 border border-amber-900/50 p-3 mb-6 flex items-center gap-2">
          <span className="text-amber-400 text-sm">
            {recommendation.replace(/_/g, ' ')}
          </span>
        </div>
      )}

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <MetricCard
          label="Heart Rate"
          value={bpm === 0 ? '--' : bpm}
          unit="bpm"
          sublabel={zone !== 'unknown' ? zone.replace(/_/g, ' ') : undefined}
          color={bpmColor}
        />
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <HrvGauge value={hrv} />
        </div>
        <MetricCard
          label="Stress"
          value={STRESS_LABELS[stress] ?? stress}
          color={ZONE_COLORS[stress] ?? ZONE_COLORS[zone]}
        />
        <MetricCard
          label="Steps"
          value={steps.toLocaleString()}
          sublabel="Today"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {temp != null && (
          <MetricCard
            label="Skin Temp"
            value={temp.toFixed(1)}
            unit="°C"
            color={temp > 37.5 ? 'text-red-400' : 'text-zinc-300'}
          />
        )}
        {data.pressure_hpa != null && (
          <MetricCard
            label="Pressure"
            value={data.pressure_hpa.toFixed(0)}
            unit="hPa"
          />
        )}
        <MetricCard
          label="Accuracy"
          value={data.accuracy < 0 ? '--' : data.accuracy}
          sublabel={data.accuracy === 3 ? 'High' : data.accuracy === 2 ? 'Medium' : data.accuracy >= 0 ? 'Low' : undefined}
        />
        <MetricCard
          label="On Wrist"
          value={data.on_wrist ? 'Yes' : 'No'}
          color={data.on_wrist ? 'text-emerald-400' : 'text-zinc-500'}
        />
      </div>

      {/* Charts */}
      <div className="space-y-4">
        <Sparkline history={history} />
        <StressTimeline history={history} />
      </div>

      {/* History Link */}
      <div className="mt-6 text-center">
        <Link
          href="/nucleus/vitals/history"
          className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          View full history (24h / 7d / 30d) →
        </Link>
      </div>
    </div>
  );
}
