"use client";

import { useMemo } from "react";
import { JargonBuster, TipBox } from "@/components/pv-for-nexvigilants";
import {
  computeRealityGradient,
  gradeLoopEvidence,
} from "@/lib/pv-compute/flywheel";
import type { EvidenceQuality, RealityRating } from "./flywheel-types";

const RATING_CONFIG: Record<
  RealityRating,
  { label: string; color: string; bgColor: string }
> = {
  testing_theater: {
    label: "Testing Theater",
    color: "text-red-400",
    bgColor: "bg-red-500/20",
  },
  safety_validated: {
    label: "Safety Validated",
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
  },
  efficacy_demonstrated: {
    label: "Efficacy Demonstrated",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
  },
  scale_confirmed: {
    label: "Scale Confirmed",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
  },
  production_ready: {
    label: "Production Ready",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
  },
};

const QUALITY_DOT: Record<EvidenceQuality, string> = {
  none: "bg-slate-600",
  weak: "bg-red-400",
  moderate: "bg-amber-400",
  strong: "bg-emerald-400",
};

/**
 * Reality Gradient gauge showing the VDAG score (0-100) with 5 color zones
 * and per-loop evidence quality dots.
 *
 * Uses client-side pv-compute functions — no MCP call needed.
 */
export function FlywheelRealityGauge() {
  // Compute with default inputs (will show "no data" state).
  // In production, these would come from live flywheel state.
  const gradient = useMemo(() => {
    const loops = [
      gradeLoopEvidence("Rim Integrity", "default", 0, 0.2),
      gradeLoopEvidence("Momentum", "default", 0, 0.2),
      gradeLoopEvidence("Friction", "default", 0, 0.2),
      gradeLoopEvidence("Gyroscopic", "default", 0, 0.2),
      gradeLoopEvidence("Elastic", "default", 0, 0.2),
    ];
    return computeRealityGradient(loops);
  }, []);

  const pct = Math.round(gradient.score * 100);
  const config = RATING_CONFIG[gradient.rating];

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-dim/60">
          <JargonBuster
            term="Reality Gradient"
            definition="A score from 0 to 100 showing how much real evidence backs your flywheel's health. Below 20 means you're operating on assumptions, not data."
          >
            Reality Gradient
          </JargonBuster>
        </h3>
      </div>

      {/* Score display */}
      <div className="flex items-baseline gap-3 mb-4">
        <span className={`text-5xl font-bold tabular-nums ${config.color}`}>
          {pct}
        </span>
        <span className="text-sm text-muted-foreground">/ 100</span>
        <span
          className={`ml-auto rounded-full px-3 py-1 text-xs font-medium ${config.bgColor} ${config.color}`}
        >
          {config.label}
        </span>
      </div>

      {/* 5-zone progress bar */}
      <div className="relative h-3 rounded-full bg-slate-800 overflow-hidden mb-4">
        {/* Zone backgrounds */}
        <div className="absolute inset-0 flex">
          <div className="w-[20%] bg-red-500/30" />
          <div className="w-[30%] bg-amber-500/30" />
          <div className="w-[30%] bg-cyan-500/30" />
          <div className="w-[15%] bg-emerald-500/30" />
          <div className="w-[5%] bg-green-500/30" />
        </div>
        {/* Fill */}
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
            pct < 20
              ? "bg-red-500"
              : pct < 50
                ? "bg-amber-500"
                : pct < 80
                  ? "bg-cyan-500"
                  : pct < 95
                    ? "bg-emerald-500"
                    : "bg-green-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Zone labels */}
      <div className="flex text-[10px] text-muted-foreground mb-6">
        <span className="w-[20%]">Theater</span>
        <span className="w-[30%]">Safety</span>
        <span className="w-[30%]">Efficacy</span>
        <span className="w-[15%]">Scale</span>
        <span className="w-[5%] text-right">Prod</span>
      </div>

      {/* Per-loop evidence dots */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          Per-Loop Evidence
        </p>
        <div className="grid grid-cols-5 gap-3">
          {gradient.perLoop.map((ev) => (
            <div key={ev.loopName} className="flex flex-col items-center gap-1">
              <div
                className={`h-3 w-3 rounded-full ${QUALITY_DOT[ev.quality]}`}
                title={`${ev.loopName}: ${ev.quality} (${Math.round(ev.score * 100)}%)`}
              />
              <span className="text-[10px] text-muted-foreground text-center leading-tight">
                {ev.loopName}
              </span>
            </div>
          ))}
        </div>
      </div>

      {!gradient.executable && (
        <TipBox>
          Reality score is below 20% — the flywheel is in &quot;testing
          theater&quot; mode. Add real evidence from loop evaluations to unlock
          execution.
        </TipBox>
      )}
    </div>
  );
}
