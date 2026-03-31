"use client";

import { JargonBuster } from "@/components/pv-for-nexvigilants";
import type { FlywheelVitals } from "@/lib/pv-compute/flywheel";

// ─── Demo values — placeholder until live data is wired ───────────────────────
// I = moment of inertia (knowledge base scale proxy)
// ω = angular velocity (execution throughput proxy)
// E = ½Iω²

const I_DEMO = 150; // moment of inertia
const OMEGA_DEMO = 0.8; // angular velocity (ω)
const E_DEMO = 0.5 * I_DEMO * OMEGA_DEMO * OMEGA_DEMO;

// ─── Component ────────────────────────────────────────────────────────────────

export function GoverningEquation() {
  return (
    <div className="border border-cyan-500/20 bg-cyan-500/5 rounded-lg px-6 py-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left: equation display */}
        <div>
          <p className="text-[9px] font-bold text-slate-400/60 uppercase tracking-widest font-mono mb-2">
            <JargonBuster
              term="Governing Equation"
              definition="The single formula that captures the flywheel's total stored energy. Everything else in the dashboard is either I, ω, or something that affects them."
            >
              Governing Equation
            </JargonBuster>
          </p>

          {/* E = ½Iω² — rendered with proper symbols */}
          <div
            className="flex items-baseline gap-1 text-white"
            aria-label="Kinetic energy equals one half I omega squared"
          >
            <span className="text-2xl font-bold font-mono text-cyan-300">
              E
            </span>
            <span className="text-xl font-mono text-slate-400 mx-0.5">=</span>
            <span className="text-2xl font-bold font-mono text-slate-300">
              &#189;
            </span>
            <span className="text-2xl font-bold font-mono text-cyan-300">
              I
            </span>
            <span className="text-2xl font-bold font-mono text-emerald-300">
              &#969;
            </span>
            <span className="text-lg font-bold font-mono text-emerald-300 relative -top-1">
              2
            </span>
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            Rotational kinetic energy — the stored forward power of the
            flywheel.
          </p>
        </div>

        {/* Right: live placeholder values */}
        <div className="flex gap-6 sm:gap-8 text-center">
          <EquationVar
            symbol="I"
            label="Moment of Inertia"
            value={I_DEMO.toFixed(0)}
            color="text-cyan-300"
            jargonTerm="Moment of Inertia (I)"
            jargonDef="Resistance to change in rotation speed. Maps to accumulated knowledge and built infrastructure — the heavier the flywheel, the harder it is to slow down."
          />
          <EquationVar
            symbol={<span>&#969;</span>}
            label="Angular Velocity"
            value={OMEGA_DEMO.toFixed(2)}
            color="text-emerald-300"
            jargonTerm="Angular Velocity (ω)"
            jargonDef="How fast the flywheel is currently spinning. Maps to execution throughput — completed PDP chains, shipped features, micrograms passing per session."
          />
          <EquationVar
            symbol="E"
            label="Kinetic Energy"
            value={E_DEMO.toFixed(1)}
            color="text-amber-300"
            jargonTerm="Kinetic Energy (E)"
            jargonDef="Total stored energy in the flywheel. High E means the system can sustain disruptions and keep moving. Low E means it can be stopped by small friction events."
          />
        </div>
      </div>
    </div>
  );
}

interface EquationVarProps {
  symbol: React.ReactNode;
  label: string;
  value: string;
  color: string;
  jargonTerm: string;
  jargonDef: string;
}

function EquationVar({
  symbol,
  label,
  value,
  color,
  jargonTerm,
  jargonDef,
}: EquationVarProps) {
  return (
    <div>
      <p className="text-[9px] font-bold text-slate-400/60 uppercase tracking-widest font-mono mb-1">
        <JargonBuster term={jargonTerm} definition={jargonDef}>
          {label}
        </JargonBuster>
      </p>
      <p className={`text-xl font-bold font-mono ${color}`}>{value}</p>
      <p className={`text-sm font-bold font-mono ${color} opacity-50 mt-0.5`}>
        {symbol}
      </p>
    </div>
  );
}
