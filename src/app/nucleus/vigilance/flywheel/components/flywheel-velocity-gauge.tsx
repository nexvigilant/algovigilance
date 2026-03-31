"use client";

import { ScoreMeter, JargonBuster } from "@/components/pv-for-nexvigilants";
import type { FlywheelVelocity } from "@/lib/pv-compute/flywheel";
import type { VelocityBand, VelocityResult } from "./flywheel-types";
import { bandToScore, bandColor, formatDuration } from "./flywheel-logic";

interface FlywheelVelocityGaugeProps {
  velocity: VelocityResult | null;
  band: VelocityBand;
}

const VELOCITY_ZONES = [
  { label: "Slow", min: 0, max: 25, color: "bg-red-500" },
  { label: "Acceptable", min: 25, max: 50, color: "bg-amber-500" },
  { label: "Target", min: 50, max: 80, color: "bg-cyan-500" },
  { label: "Exceptional", min: 80, max: 100, color: "bg-emerald-500" },
];

export function FlywheelVelocityGauge({
  velocity,
  band,
}: FlywheelVelocityGaugeProps) {
  const score = bandToScore(band);

  return (
    <div className="border border-white/[0.08] bg-white/[0.04] rounded-lg p-6">
      <h2 className="text-sm font-semibold text-foreground mb-1">
        How Fast Are Fixes Landing?
      </h2>
      <p className="text-xs text-muted-foreground mb-4">
        The{" "}
        <JargonBuster
          term="Velocity Band"
          definition="A classification of your fix speed: Exceptional (under 1 hour), Target (under 24 hours), Acceptable (under 1 week), or Slow (over 1 week)."
        >
          velocity band
        </JargonBuster>{" "}
        shows how quickly detected issues get resolved.
      </p>

      <ScoreMeter score={score} label="Fix Velocity" zones={VELOCITY_ZONES} />

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Band" value={band} className={bandColor(band)} />
        <StatCard
          label="Avg Fix Time"
          value={velocity ? formatDuration(velocity.avg_delta_ms) : "—"}
        />
        <StatCard
          label="Min"
          value={velocity ? `${velocity.min_delta_hours.toFixed(1)}h` : "—"}
        />
        <StatCard
          label="Max"
          value={velocity ? `${velocity.max_delta_hours.toFixed(1)}h` : "—"}
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  className = "text-foreground",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="text-center">
      <p className="text-[9px] font-bold text-slate-400/60 uppercase tracking-widest font-mono">
        {label}
      </p>
      <p className={`text-lg font-bold font-mono mt-1 ${className}`}>{value}</p>
    </div>
  );
}
