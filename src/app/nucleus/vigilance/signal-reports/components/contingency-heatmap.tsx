"use client";

import type { ContingencyTable } from "@/lib/pv-compute";
import type { ContingencyValues } from "../lib/signal-data";

interface ContingencyHeatmapProps {
  values: ContingencyValues;
  observedRate: number;
  expectedRate: number;
}

/**
 * 2x2 contingency table rendered as a heatmap.
 * Cell darkness is proportional to the cell's share of its row total.
 * Darker = larger proportion of reports in that cell.
 */
export function ContingencyHeatmap({
  values,
  observedRate,
  expectedRate,
}: ContingencyHeatmapProps) {
  const { a, b, c, d } = values;

  const rowDrugTotal = a + b;
  const rowOtherTotal = c + d;
  const colEventTotal = a + c;
  const colNoEventTotal = b + d;
  const grandTotal = a + b + c + d;

  // Row-normalized intensities — how concentrated is each cell within its row?
  const intensityA = rowDrugTotal > 0 ? a / rowDrugTotal : 0;
  const intensityB = rowDrugTotal > 0 ? b / rowDrugTotal : 0;
  const intensityC = rowOtherTotal > 0 ? c / rowOtherTotal : 0;
  const intensityD = rowOtherTotal > 0 ? d / rowOtherTotal : 0;

  return (
    <div className="border border-white/[0.12] bg-white/[0.03]">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
        <span className="intel-label">2x2 Contingency Table</span>
        <div className="h-px flex-1 bg-white/[0.08]" />
        <span className="text-[9px] font-mono text-slate-dim/30">
          N = {grandTotal.toLocaleString()}
        </span>
      </div>

      <div className="p-4">
        {/* Column headers */}
        <div className="grid grid-cols-[120px_1fr_1fr_72px] gap-1 mb-1">
          <div />
          <div className="text-center text-[9px] font-mono uppercase tracking-widest text-cyan/60">
            Event (+)
          </div>
          <div className="text-center text-[9px] font-mono uppercase tracking-widest text-slate-dim/40">
            No Event (-)
          </div>
          <div className="text-center text-[9px] font-mono uppercase tracking-widest text-slate-dim/30">
            Total
          </div>
        </div>

        {/* Drug row */}
        <div className="grid grid-cols-[120px_1fr_1fr_72px] gap-1 mb-1">
          <div className="flex items-center">
            <span className="text-[9px] font-mono uppercase tracking-widest text-cyan/70">
              Drug (+)
            </span>
          </div>
          <HeatCell
            label="a"
            value={a}
            intensity={intensityA}
            colorClass="cyan"
            isHighlight
          />
          <HeatCell
            label="b"
            value={b}
            intensity={intensityB}
            colorClass="slate"
          />
          <TotalCell value={rowDrugTotal} />
        </div>

        {/* No-drug row */}
        <div className="grid grid-cols-[120px_1fr_1fr_72px] gap-1 mb-1">
          <div className="flex items-center">
            <span className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40">
              No Drug (-)
            </span>
          </div>
          <HeatCell
            label="c"
            value={c}
            intensity={intensityC}
            colorClass="slate"
          />
          <HeatCell
            label="d"
            value={d}
            intensity={intensityD}
            colorClass="slate"
          />
          <TotalCell value={rowOtherTotal} />
        </div>

        {/* Column totals */}
        <div className="grid grid-cols-[120px_1fr_1fr_72px] gap-1 mt-1 pt-1 border-t border-white/[0.06]">
          <div className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/30 flex items-center">
            Total
          </div>
          <TotalCell value={colEventTotal} />
          <TotalCell value={colNoEventTotal} />
          <TotalCell value={grandTotal} bold />
        </div>

        {/* Rate comparison */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <RateBar label="Observed rate (drug)" rate={observedRate} isHigher />
          <RateBar label="Expected rate (background)" rate={expectedRate} />
        </div>

        {/* RR shorthand */}
        <p className="mt-3 text-[9px] font-mono text-slate-dim/40 text-center">
          Observed / Expected ={" "}
          <span className="text-cyan font-bold">
            {(observedRate / expectedRate).toFixed(2)}x
          </span>{" "}
          background rate
        </p>
      </div>
    </div>
  );
}

function HeatCell({
  label,
  value,
  intensity,
  colorClass,
  isHighlight = false,
}: {
  label: string;
  value: number;
  intensity: number;
  colorClass: "cyan" | "slate";
  isHighlight?: boolean;
}) {
  // Map intensity [0, 1] → opacity [0.05, 0.35]
  const alpha = 0.05 + intensity * 0.3;
  const bgStyle =
    colorClass === "cyan"
      ? { backgroundColor: `rgba(123, 149, 181, ${alpha})` }
      : { backgroundColor: `rgba(168, 178, 209, ${alpha * 0.5})` };

  return (
    <div
      className={`relative flex flex-col items-center justify-center py-4 border ${
        isHighlight ? "border-cyan/30" : "border-white/[0.06]"
      }`}
      style={bgStyle}
    >
      <span className="absolute top-1 left-2 text-[8px] font-mono text-slate-dim/30">
        {label}
      </span>
      <span
        className={`text-base md:text-lg font-bold font-headline tabular-nums ${
          isHighlight ? "text-cyan" : "text-slate-light/70"
        }`}
      >
        {value.toLocaleString()}
      </span>
      <span className="text-[8px] font-mono text-slate-dim/30 mt-0.5">
        {(intensity * 100).toFixed(1)}%
      </span>
    </div>
  );
}

function TotalCell({ value, bold = false }: { value: number; bold?: boolean }) {
  return (
    <div className="flex items-center justify-center py-2">
      <span
        className={`text-sm tabular-nums font-mono ${bold ? "text-slate-light font-bold" : "text-slate-dim/50"}`}
      >
        {value.toLocaleString()}
      </span>
    </div>
  );
}

function RateBar({
  label,
  rate,
  isHigher = false,
}: {
  label: string;
  rate: number;
  isHigher?: boolean;
}) {
  const pct = (rate * 100).toFixed(3);
  return (
    <div className="border border-white/[0.06] bg-white/[0.02] px-3 py-2">
      <p className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 mb-1">
        {label}
      </p>
      <p
        className={`text-sm font-bold font-mono tabular-nums ${isHigher ? "text-cyan" : "text-slate-dim/60"}`}
      >
        {pct}%
      </p>
    </div>
  );
}
