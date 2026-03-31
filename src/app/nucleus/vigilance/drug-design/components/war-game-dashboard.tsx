"use client";

import { useState } from "react";
import { resolveColor } from "@/components/ui/branded/status-badge";
import { classifyPrrStrength, classifyPayoffTier } from "@/lib/pv-compute";
import {
  type Swords,
  Target,
  Activity,
  Pill,
  Shield,
  TrendingUp,
  ChevronRight,
  AlertTriangle,
  Crosshair,
} from "lucide-react";

// ─── War-Game Data (from NexCore forge_nash_solve + game_theory_nash_2x2) ──────

interface Battleground {
  id: string;
  candidate: string;
  incumbent: string;
  safetyGap: string;
  mechanism: string;
  signal: {
    prr: number;
    ror: number;
    ic: number;
    ebgm: number;
    safetyMargin: number;
  };
  pk: {
    incumbentVd: number;
    saferVd: number;
    incumbentCl: number;
    saferCl: number;
    vdReduction: string;
  };
  nash: {
    rowP: number;
    colQ: number;
    rowPayoff: number;
    colPayoff: number;
  };
  nashWeight: string;
  status: "dominant" | "strong" | "emerging";
}

const BATTLEGROUNDS: Battleground[] = [
  {
    id: "NXV-201",
    candidate: "SaferDM2",
    incumbent: "Metformin",
    safetyGap: "Lactic acidosis",
    mechanism: "AMPK activator without Complex I inhibition",
    signal: {
      prr: 16.553,
      ror: 18.019,
      ic: 3.781,
      ebgm: 4.655,
      safetyMargin: -16.05,
    },
    pk: {
      incumbentVd: 654,
      saferVd: 300,
      incumbentCl: 26.5,
      saferCl: 20,
      vdReduction: "54%",
    },
    nash: { rowP: 0.3, colQ: 0.5, rowPayoff: 55, colPayoff: 50 },
    nashWeight: "99.94%",
    status: "dominant",
  },
  {
    id: "NXV-202",
    candidate: "SaferStatin",
    incumbent: "Atorvastatin",
    safetyGap: "Acute Kidney Injury",
    mechanism: "Hepatic-selective HMG-CoA reductase inhibitor (Vd = 0.71L)",
    signal: {
      prr: 1.256,
      ror: 1.263,
      ic: 0.282,
      ebgm: 0.328,
      safetyMargin: -0.25,
    },
    pk: {
      incumbentVd: 381,
      saferVd: 4.66,
      incumbentCl: 38.1,
      saferCl: 10,
      vdReduction: "99%",
    },
    nash: { rowP: 0.167, colQ: 0.5, rowPayoff: 45, colPayoff: 55 },
    nashWeight: "0.03%",
    status: "strong",
  },
  {
    id: "NXV-203",
    candidate: "SaferSSRI",
    incumbent: "Sertraline",
    safetyGap: "Insomnia / Somnolence",
    mechanism:
      "Circadian-neutral 5-HT reuptake inhibitor (receptor selectivity)",
    signal: {
      prr: 2.312,
      ror: 2.36,
      ic: 1.061,
      ebgm: 1.276,
      safetyMargin: -1.29,
    },
    pk: {
      incumbentVd: 1400,
      saferVd: 200,
      incumbentCl: 96,
      saferCl: 40,
      vdReduction: "86%",
    },
    nash: { rowP: 0.308, colQ: 0.462, rowPayoff: 35.8, colPayoff: 64.2 },
    nashWeight: "0.03%",
    status: "emerging",
  },
];

const PAYOFF_MATRIX = {
  rows: ["SaferDM2", "SaferStatin", "SaferSSRI"],
  cols: ["Ignore", "Defend", "Innovate"],
  values: [
    [90, 30, 10],
    [40, 70, 20],
    [15, 25, 60],
  ],
  nashRow: [0.22, 0.27, 0.51],
  nashCol: [0.29, 0.25, 0.46],
  expectedPayoff: 38.23,
};

// ─── Utility ──────

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// pv-compute: classifyPayoffTier mirrors payoff-tier-classifier.yaml
const PAYOFF_TIER_COLORS: Record<string, string> = {
  high: "bg-emerald-500/20 text-emerald-400",
  medium: "bg-amber-500/15 text-amber-400",
  low: "bg-red-500/15 text-red-400",
};

function getPayoffColor(value: number): string {
  const { tier } = classifyPayoffTier(value);
  return PAYOFF_TIER_COLORS[tier] ?? "bg-red-500/15 text-red-400";
}

function getStatusColor(status: Battleground["status"]): string {
  return resolveColor(status);
}

// pv-compute: classifyPrrStrength mirrors prr-strength-classifier.yaml
const PRR_STRENGTH_COLORS: Record<string, string> = {
  critical: "text-red-400",
  signal: "text-amber-400",
  subthreshold: "text-slate-400",
};

function getSignalStrength(prr: number): { label: string; color: string } {
  const { strength } = classifyPrrStrength(prr);
  return {
    label: strength.toUpperCase(),
    color: PRR_STRENGTH_COLORS[strength] ?? "text-slate-400",
  };
}

// ─── Components ──────

function SectionHeader({
  icon: Icon,
  label,
  sublabel,
}: {
  icon: typeof Swords;
  label: string;
  sublabel?: string;
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
      <Icon className="h-3.5 w-3.5 text-gold/60" />
      <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-slate-400">
        {label}
      </span>
      {sublabel && (
        <>
          <div className="h-px flex-1 bg-white/[0.08]" />
          <span className="text-[9px] font-mono text-cyan/40">{sublabel}</span>
        </>
      )}
    </div>
  );
}

function BattlegroundCard({
  bg,
  isSelected,
  onSelect,
}: {
  bg: Battleground;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const signalStrength = getSignalStrength(bg.signal.prr);

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left border transition-all duration-200 group",
        isSelected
          ? "border-gold/40 bg-gold/5"
          : "border-white/[0.08] bg-white/[0.03] hover:border-white/[0.16] hover:bg-white/[0.05]",
      )}
    >
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-mono text-gold/50">{bg.id}</span>
              <span
                className={cn(
                  "text-[8px] font-mono px-1.5 py-0.5 border rounded-sm",
                  getStatusColor(bg.status),
                )}
              >
                {bg.status.toUpperCase()}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">{bg.candidate}</h3>
            <p className="text-[10px] font-mono text-slate-400">
              vs {bg.incumbent}
            </p>
          </div>
          <ChevronRight
            className={cn(
              "h-4 w-4 mt-1 transition-transform",
              isSelected
                ? "text-gold rotate-90"
                : "text-white/20 group-hover:text-white/40",
            )}
          />
        </div>

        <div className="flex items-center gap-2">
          <AlertTriangle className="h-3 w-3 text-red-400/60" />
          <span className="text-[10px] font-mono text-red-400/80">
            {bg.safetyGap}
          </span>
          <span
            className={cn("text-[8px] font-mono ml-auto", signalStrength.color)}
          >
            PRR {bg.signal.prr.toFixed(1)}x — {signalStrength.label}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="border border-white/[0.06] bg-white/[0.02] p-1.5">
            <div className="text-[8px] font-mono text-slate-500 mb-0.5">
              Nash Weight
            </div>
            <div className="text-xs font-bold text-gold">{bg.nashWeight}</div>
          </div>
          <div className="border border-white/[0.06] bg-white/[0.02] p-1.5">
            <div className="text-[8px] font-mono text-slate-500 mb-0.5">
              d(s) Margin
            </div>
            <div className="text-xs font-bold text-red-400">
              {bg.signal.safetyMargin.toFixed(2)}
            </div>
          </div>
          <div className="border border-white/[0.06] bg-white/[0.02] p-1.5">
            <div className="text-[8px] font-mono text-slate-500 mb-0.5">
              Vd Reduction
            </div>
            <div className="text-xs font-bold text-cyan">
              {bg.pk.vdReduction}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

function PayoffMatrix() {
  return (
    <div className="border border-white/[0.12] bg-white/[0.03]">
      <SectionHeader
        icon={Crosshair}
        label="3×3 Payoff Matrix"
        sublabel="Nash Equilibrium via Fictitious Play"
      />
      <div className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr>
                <th className="text-left p-2 text-slate-500 border-b border-white/[0.06]">
                  Entrant \ Incumbent
                </th>
                {PAYOFF_MATRIX.cols.map((col, i) => (
                  <th
                    key={col}
                    className="p-2 text-center text-slate-400 border-b border-white/[0.06]"
                  >
                    {col}
                    <div className="text-[8px] text-cyan/40 mt-0.5">
                      q={PAYOFF_MATRIX.nashCol[i].toFixed(2)}
                    </div>
                  </th>
                ))}
                <th className="p-2 text-center text-gold/60 border-b border-white/[0.06]">
                  Nash p
                </th>
              </tr>
            </thead>
            <tbody>
              {PAYOFF_MATRIX.rows.map((row, i) => (
                <tr
                  key={row}
                  className="border-b border-white/[0.04] last:border-0"
                >
                  <td className="p-2 text-white/80 font-semibold">{row}</td>
                  {PAYOFF_MATRIX.values[i].map((val, j) => (
                    <td key={j} className="p-2 text-center">
                      <span
                        className={cn(
                          "inline-block px-2 py-0.5 rounded-sm font-bold",
                          getPayoffColor(val),
                        )}
                      >
                        {val}
                      </span>
                    </td>
                  ))}
                  <td className="p-2 text-center text-gold font-bold">
                    {PAYOFF_MATRIX.nashRow[i].toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex items-center gap-4 text-[9px] font-mono text-slate-500 border-t border-white/[0.06] pt-3">
          <span>
            Expected payoff:{" "}
            <span className="text-gold">{PAYOFF_MATRIX.expectedPayoff}</span>
          </span>
          <span>|</span>
          <span>
            Dominant row:{" "}
            <span className="text-emerald-400">SaferSSRI (p=0.51)</span>
          </span>
          <span>|</span>
          <span>
            Dominant col: <span className="text-cyan">Innovate (q=0.46)</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function DetailPanel({ bg }: { bg: Battleground }) {
  return (
    <div className="space-y-4">
      {/* Signal Intelligence */}
      <div className="border border-white/[0.12] bg-white/[0.03]">
        <SectionHeader
          icon={Activity}
          label="Signal Intelligence"
          sublabel={`${bg.incumbent} — ${bg.safetyGap}`}
        />
        <div className="p-4">
          <div className="grid grid-cols-5 gap-2 text-center mb-3">
            {[
              { label: "PRR", value: bg.signal.prr, threshold: 2.0 },
              { label: "ROR", value: bg.signal.ror, threshold: 2.0 },
              { label: "IC", value: bg.signal.ic, threshold: 0 },
              { label: "EBGM", value: bg.signal.ebgm, threshold: 2.0 },
              { label: "d(s)", value: bg.signal.safetyMargin, threshold: 0 },
            ].map((m) => {
              const isSignal =
                m.label === "d(s)" ? m.value < 0 : m.value >= m.threshold;
              return (
                <div
                  key={m.label}
                  className="border border-white/[0.06] bg-white/[0.02] p-2"
                >
                  <div className="text-[8px] font-mono text-slate-500">
                    {m.label}
                  </div>
                  <div
                    className={cn(
                      "text-sm font-bold",
                      isSignal ? "text-red-400" : "text-slate-400",
                    )}
                  >
                    {m.value.toFixed(m.label === "d(s)" ? 2 : 3)}
                  </div>
                  <div
                    className={cn(
                      "text-[7px] font-mono mt-0.5",
                      isSignal ? "text-red-400/60" : "text-emerald-400/60",
                    )}
                  >
                    {isSignal ? "SIGNAL" : "CLEAR"}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] font-mono text-slate-400">
            <span className="text-gold">Mechanism:</span> {bg.mechanism}
          </p>
        </div>
      </div>

      {/* PK Comparison */}
      <div className="border border-white/[0.12] bg-white/[0.03]">
        <SectionHeader
          icon={Pill}
          label="PK Profile Comparison"
          sublabel={`${bg.incumbent} → ${bg.candidate}`}
        />
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[8px] font-mono text-slate-500 mb-2 uppercase tracking-widest">
                Volume of Distribution
              </div>
              <div className="flex items-end gap-3">
                <div>
                  <div className="text-[9px] text-slate-500">
                    {bg.incumbent}
                  </div>
                  <div className="text-lg font-bold text-white/60">
                    {bg.pk.incumbentVd} L
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gold/40 mb-1" />
                <div>
                  <div className="text-[9px] text-gold">{bg.candidate}</div>
                  <div className="text-lg font-bold text-cyan">
                    {bg.pk.saferVd} L
                  </div>
                </div>
              </div>
              <div className="mt-1.5">
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan to-emerald-400 rounded-full transition-all duration-700"
                    style={{
                      width: `${100 - (bg.pk.saferVd / bg.pk.incumbentVd) * 100}%`,
                    }}
                  />
                </div>
                <div className="text-[8px] font-mono text-emerald-400 mt-0.5">
                  {bg.pk.vdReduction} reduction
                </div>
              </div>
            </div>
            <div>
              <div className="text-[8px] font-mono text-slate-500 mb-2 uppercase tracking-widest">
                Clearance
              </div>
              <div className="flex items-end gap-3">
                <div>
                  <div className="text-[9px] text-slate-500">
                    {bg.incumbent}
                  </div>
                  <div className="text-lg font-bold text-white/60">
                    {bg.pk.incumbentCl} L/h
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gold/40 mb-1" />
                <div>
                  <div className="text-[9px] text-gold">{bg.candidate}</div>
                  <div className="text-lg font-bold text-cyan">
                    {bg.pk.saferCl} L/h
                  </div>
                </div>
              </div>
              <div className="text-[8px] font-mono text-slate-400 mt-1.5">
                Lower clearance = longer therapeutic window
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nash Equilibrium */}
      <div className="border border-white/[0.12] bg-white/[0.03]">
        <SectionHeader
          icon={Target}
          label="Nash Equilibrium (2×2)"
          sublabel={`${bg.candidate} vs Incumbent`}
        />
        <div className="p-4">
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="border border-white/[0.06] bg-white/[0.02] p-2">
              <div className="text-[8px] font-mono text-slate-500">Row p</div>
              <div className="text-sm font-bold text-gold">
                {bg.nash.rowP.toFixed(3)}
              </div>
            </div>
            <div className="border border-white/[0.06] bg-white/[0.02] p-2">
              <div className="text-[8px] font-mono text-slate-500">Col q</div>
              <div className="text-sm font-bold text-cyan">
                {bg.nash.colQ.toFixed(3)}
              </div>
            </div>
            <div className="border border-white/[0.06] bg-white/[0.02] p-2">
              <div className="text-[8px] font-mono text-slate-500">
                Entrant Payoff
              </div>
              <div className="text-sm font-bold text-emerald-400">
                {bg.nash.rowPayoff}
              </div>
            </div>
            <div className="border border-white/[0.06] bg-white/[0.02] p-2">
              <div className="text-[8px] font-mono text-slate-500">
                Incumbent Payoff
              </div>
              <div className="text-sm font-bold text-red-400">
                {bg.nash.colPayoff}
              </div>
            </div>
          </div>
          <div className="mt-3 text-[9px] font-mono text-slate-400">
            {bg.nash.rowPayoff > bg.nash.colPayoff ? (
              <span className="text-emerald-400">
                Entrant advantage: payoff {bg.nash.rowPayoff} &gt;{" "}
                {bg.nash.colPayoff}
              </span>
            ) : (
              <span className="text-amber-400">
                Incumbent retains edge: payoff {bg.nash.colPayoff} &gt;{" "}
                {bg.nash.rowPayoff}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StrategyPanel() {
  return (
    <div className="border border-white/[0.12] bg-white/[0.03]">
      <SectionHeader
        icon={Shield}
        label="Playing to Win — Strategic Recommendations"
      />
      <div className="p-4 space-y-4">
        <div className="space-y-3">
          {[
            {
              phase: "Phase 1 — Lead with SaferDM2",
              detail:
                "Nash weight 99.94%. Lactic acidosis PRR 16.5x creates an exploitable safety moat. Metformin's 70-year monopoly has no branded competitor targeting this gap.",
              timeline: "IND filing → Phase I",
              color: "border-emerald-500/30 bg-emerald-500/5",
              accent: "text-emerald-400",
            },
            {
              phase: "Phase 2 — Develop SaferStatin IP",
              detail:
                "Vd reduction 381L → 4.66L (99%) via hepatic selectivity. This is the strongest PK advantage. AKI signal is subthreshold (PRR 1.26) — position as preventive safety.",
              timeline: "Patent filing → Preclinical",
              color: "border-amber-500/30 bg-amber-500/5",
              accent: "text-amber-400",
            },
            {
              phase: "Phase 3 — SaferSSRI for Differentiation",
              detail:
                "Circadian-neutral mechanism (no insomnia/somnolence) targets Sertraline + Escitalopram market. Nash says incumbent will innovate (q=0.46) — race for receptor selectivity.",
              timeline: "MOA validation → Lead optimization",
              color: "border-cyan/30 bg-cyan/5",
              accent: "text-cyan",
            },
          ].map((s) => (
            <div key={s.phase} className={cn("border p-3", s.color)}>
              <div className="flex items-start justify-between mb-1.5">
                <h4 className={cn("text-xs font-bold", s.accent)}>{s.phase}</h4>
                <span className="text-[8px] font-mono text-slate-500 bg-white/[0.04] px-1.5 py-0.5">
                  {s.timeline}
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 leading-relaxed">
                {s.detail}
              </p>
            </div>
          ))}
        </div>

        <div className="border-t border-white/[0.06] pt-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-3 w-3 text-gold/60" />
            <span className="text-[9px] font-mono text-gold/80 uppercase tracking-widest">
              Market Entry Sequence
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono">
            <span className="text-emerald-400 bg-emerald-500/10 px-2 py-1 border border-emerald-500/20">
              NXV-201
            </span>
            <ChevronRight className="h-3 w-3 text-white/20" />
            <span className="text-amber-400 bg-amber-500/10 px-2 py-1 border border-amber-500/20">
              NXV-202
            </span>
            <ChevronRight className="h-3 w-3 text-white/20" />
            <span className="text-cyan bg-cyan/10 px-2 py-1 border border-cyan/20">
              NXV-203
            </span>
            <span className="text-slate-500 ml-2">← Nash-optimal order</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ──────

export function WarGameDashboard() {
  const [selectedBg, setSelectedBg] = useState(0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
          <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-slate-400">
            Reverse PV Drug Design / Competitive Intelligence
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-headline mb-2 text-white tracking-tight">
          Drug Design War-Game
        </h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Mine FAERS safety gaps. Model molecular redesigns. War-game
          competitive entry.
        </p>
        <p className="text-[9px] font-mono text-cyan/30 mt-1">
          3 battlegrounds — Nash equilibrium via NexCore forge engine
        </p>
      </header>

      {/* Battleground Selection + Detail */}
      <div className="grid gap-6 lg:grid-cols-12 mb-6">
        <div className="lg:col-span-4 space-y-3">
          <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest px-1 mb-2">
            Battlegrounds
          </div>
          {BATTLEGROUNDS.map((bg, i) => (
            <BattlegroundCard
              key={bg.id}
              bg={bg}
              isSelected={selectedBg === i}
              onSelect={() => setSelectedBg(i)}
            />
          ))}
        </div>
        <div className="lg:col-span-8">
          <DetailPanel bg={BATTLEGROUNDS[selectedBg]} />
        </div>
      </div>

      {/* Payoff Matrix */}
      <div className="mb-6">
        <PayoffMatrix />
      </div>

      {/* Strategy */}
      <StrategyPanel />
    </div>
  );
}
