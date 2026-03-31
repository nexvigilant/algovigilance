"use client";

import { classifyPrrStrength } from "@/lib/pv-compute";
import type { PrrStrengthResult } from "@/lib/pv-compute";
import type { SignalReportData } from "../lib/signal-data";
import { VERDICT_META } from "../lib/signal-data";

interface SignalHeaderProps {
  data: SignalReportData;
}

export function SignalHeader({ data }: SignalHeaderProps) {
  const meta = VERDICT_META[data.verdict];

  return (
    <div className="border border-white/[0.12] bg-white/[0.03] px-6 py-5">
      {/* Top row: breadcrumb + date */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="intel-status-active" />
          <span className="intel-label">Signal Detection Report</span>
        </div>
        <span className="text-[10px] font-mono text-slate-dim/40 tabular-nums">
          Analysis date: {data.date_of_analysis}
        </span>
      </div>

      {/* Drug + Event names */}
      <div className="flex flex-col md:flex-row md:items-end gap-4 mb-5">
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-extrabold font-headline text-white tracking-tight capitalize">
            {data.drug}
          </h1>
          {data.brands.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {data.brands.map((brand) => (
                <span
                  key={brand}
                  className="text-[9px] font-mono uppercase tracking-widest text-gold/60 border border-gold/20 bg-gold/5 px-2 py-0.5"
                >
                  {brand}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-slate-dim/40">
          <span className="text-lg text-slate-dim/30">+</span>
        </div>

        <div className="flex-1">
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/50 mb-0.5">
            Adverse Event
          </p>
          <h2 className="text-2xl md:text-3xl font-bold font-headline text-slate-light capitalize">
            {data.event}
          </h2>
        </div>
      </div>

      {/* Verdict badge + description */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center gap-3 border ${meta.border} ${meta.bg} px-5 py-4`}
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <span
              className={`text-xl md:text-2xl font-extrabold font-headline tracking-tight ${meta.color}`}
            >
              {meta.label}
            </span>
            <VerdictIcon verdict={data.verdict} />
          </div>
          <p className="text-[11px] font-mono text-slate-dim/60">{meta.desc}</p>
        </div>

        {/* Case count snapshot */}
        <div className="flex gap-4 sm:gap-6 shrink-0">
          <StatPill label="Cases" value={data.cases_total.toLocaleString()} />
          <StatPill
            label="Serious"
            value={data.cases_serious.toLocaleString()}
            highlight
          />
        </div>
      </div>
    </div>
  );
}

function VerdictIcon({ verdict }: { verdict: string }) {
  const glyphs: Record<string, string> = {
    Strong: "⬛",
    Moderate: "▲",
    Weak: "◈",
    Noise: "○",
  };
  const colors: Record<string, string> = {
    Strong: "text-red-400",
    Moderate: "text-amber-400",
    Weak: "text-yellow-400",
    Noise: "text-emerald-400",
  };
  return (
    <span
      className={`text-sm ${colors[verdict] ?? "text-slate-dim/50"}`}
      aria-hidden="true"
    >
      {glyphs[verdict] ?? "◇"}
    </span>
  );
}

function StatPill({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="text-center">
      <div
        className={`text-lg font-bold font-headline tabular-nums ${highlight ? "text-red-300" : "text-slate-light"}`}
      >
        {value}
      </div>
      <div className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40">
        {label}
      </div>
    </div>
  );
}
