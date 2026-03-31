"use client";

import type { SignalResult } from "@/lib/pv-compute";
import type { SignalScores } from "../lib/signal-data";

interface ConservationDiagramProps {
  scores: SignalScores;
  observedRate: number;
  expectedRate: number;
}

/**
 * Conservation Law Diagram — shows how all four disproportionality metrics
 * derive from the same observed × expected product under different boundaries.
 *
 * ∃ = ∂(×(ς, ∅))
 *   ς = observed reporting rate
 *   ∅ = expected reporting rate
 *   ∂ = boundary operator (each metric is a different ∂)
 */
export function ConservationDiagram({
  scores,
  observedRate,
  expectedRate,
}: ConservationDiagramProps) {
  const product = observedRate / expectedRate;

  const outputs: {
    label: string;
    symbol: string;
    value: string;
    desc: string;
    color: string;
  }[] = [
    {
      label: "PRR",
      symbol: "∂_ratio",
      value: scores.prr.toFixed(3),
      desc: "Proportional reporting ratio",
      color: "cyan",
    },
    {
      label: "ROR",
      symbol: "∂_odds",
      value: scores.ror.toFixed(3),
      desc: "Reporting odds ratio",
      color: "cyan",
    },
    {
      label: "IC",
      symbol: "∂_info",
      value: `${scores.ic.toFixed(3)} bits`,
      desc: "Information component (log₂)",
      color: "gold",
    },
  ];

  if (scores.ebgm !== undefined) {
    outputs.push({
      label: "EBGM",
      symbol: "∂_bayes",
      value: scores.ebgm.toFixed(3),
      desc: "Empirical Bayes geometric mean",
      color: "gold",
    });
  }

  return (
    <div className="border border-white/[0.12] bg-white/[0.03]">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
        <span className="intel-label">Conservation Law</span>
        <div className="h-px flex-1 bg-white/[0.08]" />
        <span className="text-[9px] font-mono text-slate-dim/25 italic">
          ∃ = ∂(×(ς, ∅))
        </span>
      </div>

      <div className="p-4">
        {/* Equation display */}
        <div className="text-center mb-5 py-3 border border-white/[0.06] bg-white/[0.02]">
          <p className="text-lg font-bold font-headline text-white tracking-wider">
            ∃ = ∂(×(ς, ∅))
          </p>
          <p className="text-[9px] font-mono text-slate-dim/40 mt-1">
            Signal existence = boundary operator applied to (observed ×
            expected)
          </p>
        </div>

        {/* Flow layout */}
        <div className="flex flex-col md:flex-row items-stretch gap-3">
          {/* Input column */}
          <div className="flex flex-col gap-2 w-full md:w-36 shrink-0">
            <InputNode
              symbol="ς"
              label="Observed Rate"
              value={(observedRate * 100).toFixed(4) + "%"}
              desc="Drug + Event reports"
              color="cyan"
            />
            <div className="flex items-center justify-center py-1">
              <span className="text-slate-dim/25 font-mono">×</span>
            </div>
            <InputNode
              symbol="∅"
              label="Expected Rate"
              value={(expectedRate * 100).toFixed(4) + "%"}
              desc="Background rate"
              color="slate"
            />
          </div>

          {/* Product node + arrow */}
          <div className="flex md:flex-col items-center justify-center gap-2 md:w-32 shrink-0">
            <div className="h-px md:h-8 w-8 md:w-px bg-white/[0.08]" />
            <div className="border border-white/[0.12] bg-white/[0.04] px-3 py-2 text-center min-w-max">
              <p className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 mb-0.5">
                ×(ς, ∅)
              </p>
              <p className="text-base font-bold text-white tabular-nums font-mono">
                {product.toFixed(2)}x
              </p>
              <p className="text-[8px] font-mono text-slate-dim/30">
                obs / exp
              </p>
            </div>
            <div className="h-px md:h-8 w-8 md:w-px bg-white/[0.08]" />
          </div>

          {/* Boundary + outputs */}
          <div className="flex-1 flex flex-col gap-2">
            <p className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/35 mb-1">
              ∂ (boundary operators)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {outputs.map((out) => (
                <OutputNode key={out.label} {...out} />
              ))}
            </div>
          </div>
        </div>

        {/* Footnote */}
        <p className="mt-4 text-[9px] font-mono text-slate-dim/30 border-t border-white/[0.06] pt-3">
          All four metrics measure the same underlying signal (∃) through
          different mathematical boundaries (∂). A strong signal appears as
          elevation across all four simultaneously.
        </p>
      </div>
    </div>
  );
}

function InputNode({
  symbol,
  label,
  value,
  desc,
  color,
}: {
  symbol: string;
  label: string;
  value: string;
  desc: string;
  color: "cyan" | "slate";
}) {
  const isCyan = color === "cyan";
  return (
    <div
      className={`border px-3 py-2 ${isCyan ? "border-cyan/20 bg-cyan/[0.04]" : "border-white/[0.08] bg-white/[0.02]"}`}
    >
      <div className="flex items-baseline gap-1.5 mb-0.5">
        <span
          className={`text-base font-bold font-headline ${isCyan ? "text-cyan" : "text-slate-dim/60"}`}
        >
          {symbol}
        </span>
        <span className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/35">
          {label}
        </span>
      </div>
      <p
        className={`text-sm font-bold font-mono tabular-nums ${isCyan ? "text-cyan" : "text-slate-dim/70"}`}
      >
        {value}
      </p>
      <p className="text-[8px] font-mono text-slate-dim/30 mt-0.5">{desc}</p>
    </div>
  );
}

function OutputNode({
  label,
  symbol,
  value,
  desc,
  color,
}: {
  label: string;
  symbol: string;
  value: string;
  desc: string;
  color: string;
}) {
  const isGold = color === "gold";
  return (
    <div
      className={`border px-3 py-2 ${isGold ? "border-gold/20 bg-gold/[0.03]" : "border-cyan/15 bg-cyan/[0.03]"}`}
    >
      <div className="flex items-baseline gap-1.5 mb-0.5">
        <span
          className={`text-sm font-bold font-headline ${isGold ? "text-gold" : "text-cyan"}`}
        >
          {label}
        </span>
        <span className="text-[8px] font-mono text-slate-dim/30">{symbol}</span>
      </div>
      <p
        className={`text-base font-bold font-mono tabular-nums ${isGold ? "text-gold/80" : "text-cyan/80"}`}
      >
        {value}
      </p>
      <p className="text-[8px] font-mono text-slate-dim/30 mt-0.5 leading-tight">
        {desc}
      </p>
    </div>
  );
}
