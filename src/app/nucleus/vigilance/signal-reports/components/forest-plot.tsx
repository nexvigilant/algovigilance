"use client";

import type { SignalResult } from "@/lib/pv-compute";
import type { SignalScores } from "../lib/signal-data";

interface ForestPlotProps {
  scores: SignalScores;
}

/**
 * Forest plot SVG showing PRR, ROR, EBGM with 95% CI bars.
 * Log scale x-axis. Null reference at 1.0, signal threshold at 2.0.
 * IC shown separately with bits scale.
 */
export function ForestPlot({ scores }: ForestPlotProps) {
  const svgWidth = 520;
  const svgHeight = 200;
  const leftMargin = 64;
  const rightMargin = 24;
  const topMargin = 20;
  const rowHeight = 44;
  const plotWidth = svgWidth - leftMargin - rightMargin;

  // Log scale bounds: x ∈ [0.5, 8]
  const xMin = 0.5;
  const xMax = 8;

  function logX(val: number): number {
    const clamped = Math.min(Math.max(val, xMin), xMax);
    return (
      leftMargin +
      ((Math.log(clamped) - Math.log(xMin)) /
        (Math.log(xMax) - Math.log(xMin))) *
        plotWidth
    );
  }

  const nullX = logX(1.0);
  const thresholdX = logX(2.0);

  const metrics: {
    label: string;
    point: number;
    lower: number;
    upper: number;
    color: string;
    signal: boolean;
  }[] = [
    {
      label: "PRR",
      point: scores.prr,
      lower: scores.prr_ci[0],
      upper: scores.prr_ci[1],
      color: "#7B95B5",
      signal: scores.prr >= 2.0,
    },
    {
      label: "ROR",
      point: scores.ror,
      lower: scores.ror_ci[0],
      upper: scores.ror_ci[1],
      color: "#7B95B5",
      signal: scores.ror_ci[0] > 1.0,
    },
  ];

  // Tick values for log scale
  const ticks = [0.5, 1.0, 2.0, 4.0, 8.0];

  return (
    <div className="border border-white/[0.12] bg-white/[0.03]">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
        <span className="intel-label">
          Forest Plot — Disproportionality Metrics
        </span>
        <div className="h-px flex-1 bg-white/[0.08]" />
        <span className="text-[9px] font-mono text-slate-dim/30">95% CI</span>
      </div>

      <div className="p-4">
        {/* Main SVG plot: PRR + ROR */}
        <svg
          width="100%"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          role="img"
          aria-label="Forest plot showing PRR and ROR with 95% confidence intervals"
          className="overflow-visible"
        >
          {/* Grid lines at ticks */}
          {ticks.map((tick) => (
            <line
              key={`grid-${tick}`}
              x1={logX(tick)}
              y1={topMargin}
              x2={logX(tick)}
              y2={topMargin + metrics.length * rowHeight}
              stroke="rgba(168,178,209,0.08)"
              strokeWidth={1}
            />
          ))}

          {/* Null reference line at 1.0 */}
          <line
            x1={nullX}
            y1={topMargin - 8}
            x2={nullX}
            y2={topMargin + metrics.length * rowHeight + 4}
            stroke="rgba(168,178,209,0.35)"
            strokeWidth={1}
            strokeDasharray="none"
          />
          <text
            x={nullX}
            y={topMargin - 11}
            textAnchor="middle"
            fill="rgba(168,178,209,0.4)"
            fontSize={8}
            fontFamily="monospace"
          >
            null
          </text>

          {/* Signal threshold line at 2.0 */}
          <line
            x1={thresholdX}
            y1={topMargin - 8}
            x2={thresholdX}
            y2={topMargin + metrics.length * rowHeight + 4}
            stroke="rgba(248,113,113,0.45)"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
          <text
            x={thresholdX}
            y={topMargin - 11}
            textAnchor="middle"
            fill="rgba(248,113,113,0.5)"
            fontSize={8}
            fontFamily="monospace"
          >
            2.0
          </text>

          {/* Metric rows */}
          {metrics.map((m, i) => {
            const cy = topMargin + i * rowHeight + rowHeight / 2;
            const px = logX(m.point);
            const lx = logX(m.lower);
            const ux = logX(m.upper);
            const dotColor = m.signal ? "#f87171" : m.color;

            return (
              <g key={m.label}>
                {/* Row label */}
                <text
                  x={leftMargin - 6}
                  y={cy + 4}
                  textAnchor="end"
                  fill="rgba(168,178,209,0.6)"
                  fontSize={10}
                  fontFamily="monospace"
                  letterSpacing="0.05em"
                >
                  {m.label}
                </text>

                {/* CI bar (horizontal line) */}
                <line
                  x1={lx}
                  y1={cy}
                  x2={ux}
                  y2={cy}
                  stroke={dotColor}
                  strokeOpacity={0.6}
                  strokeWidth={1.5}
                />

                {/* CI caps */}
                <line
                  x1={lx}
                  y1={cy - 5}
                  x2={lx}
                  y2={cy + 5}
                  stroke={dotColor}
                  strokeOpacity={0.5}
                  strokeWidth={1}
                />
                <line
                  x1={ux}
                  y1={cy - 5}
                  x2={ux}
                  y2={cy + 5}
                  stroke={dotColor}
                  strokeOpacity={0.5}
                  strokeWidth={1}
                />

                {/* Point estimate diamond */}
                <polygon
                  points={`${px},${cy - 7} ${px + 7},${cy} ${px},${cy + 7} ${px - 7},${cy}`}
                  fill={dotColor}
                  fillOpacity={m.signal ? 0.9 : 0.5}
                />

                {/* Value annotation */}
                <text
                  x={ux + 8}
                  y={cy + 4}
                  fill={dotColor}
                  fillOpacity={0.85}
                  fontSize={9}
                  fontFamily="monospace"
                >
                  {m.point.toFixed(2)} [{m.lower.toFixed(2)},{" "}
                  {m.upper.toFixed(2)}]
                </text>
              </g>
            );
          })}

          {/* X-axis */}
          <line
            x1={leftMargin}
            y1={topMargin + metrics.length * rowHeight + 4}
            x2={svgWidth - rightMargin}
            y2={topMargin + metrics.length * rowHeight + 4}
            stroke="rgba(168,178,209,0.15)"
            strokeWidth={1}
          />

          {/* Tick labels */}
          {ticks.map((tick) => (
            <text
              key={`tick-${tick}`}
              x={logX(tick)}
              y={topMargin + metrics.length * rowHeight + 16}
              textAnchor="middle"
              fill="rgba(168,178,209,0.35)"
              fontSize={8}
              fontFamily="monospace"
            >
              {tick}
            </text>
          ))}

          {/* X-axis label */}
          <text
            x={leftMargin + plotWidth / 2}
            y={svgHeight - 2}
            textAnchor="middle"
            fill="rgba(168,178,209,0.25)"
            fontSize={8}
            fontFamily="monospace"
            letterSpacing="0.08em"
          >
            LOG SCALE — RATIO
          </text>
        </svg>

        {/* Separate metrics row: IC + Chi-sq (different scales) */}
        <div className="mt-2 pt-3 border-t border-white/[0.06] grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* IC panel */}
          <IcPanel
            ic={scores.ic}
            lower={scores.ic_ci[0]}
            upper={scores.ic_ci[1]}
          />

          {/* Chi-squared */}
          <ChiPanel chiSquared={scores.chi_squared} />
        </div>
      </div>
    </div>
  );
}

function IcPanel({
  ic,
  lower,
  upper,
}: {
  ic: number;
  lower: number;
  upper: number;
}) {
  const isSignal = lower > 0;
  // IC bar: map [-2, 4] range to percentage width
  const icMin = -2;
  const icMax = 4;
  const pctPoint = Math.min(
    100,
    Math.max(0, ((ic - icMin) / (icMax - icMin)) * 100),
  );
  const pctLower = Math.min(
    100,
    Math.max(0, ((lower - icMin) / (icMax - icMin)) * 100),
  );
  const pctUpper = Math.min(
    100,
    Math.max(0, ((upper - icMin) / (icMax - icMin)) * 100),
  );
  const zeroPct = Math.max(0, (-icMin / (icMax - icMin)) * 100);

  return (
    <div className="border border-white/[0.06] bg-white/[0.02] px-3 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/50">
          IC (Information Component)
        </span>
        <span
          className={`text-xs font-bold font-mono tabular-nums ${isSignal ? "text-red-400" : "text-slate-dim/60"}`}
        >
          {ic.toFixed(3)} bits
        </span>
      </div>
      {/* Visual bar */}
      <div className="relative h-3 bg-white/[0.04] overflow-hidden">
        {/* Zero line */}
        <div
          className="absolute top-0 bottom-0 w-px bg-white/20"
          style={{ left: `${zeroPct}%` }}
        />
        {/* CI range */}
        <div
          className={`absolute top-0.5 bottom-0.5 ${isSignal ? "bg-red-400/30" : "bg-slate-dim/20"}`}
          style={{ left: `${pctLower}%`, width: `${pctUpper - pctLower}%` }}
        />
        {/* Point */}
        <div
          className={`absolute top-0 bottom-0 w-0.5 ${isSignal ? "bg-red-400" : "bg-slate-dim/50"}`}
          style={{ left: `${pctPoint}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[8px] font-mono text-slate-dim/25">-2 bits</span>
        <span className="text-[8px] font-mono text-slate-dim/25">
          [{lower.toFixed(3)}, {upper.toFixed(3)}]
        </span>
        <span className="text-[8px] font-mono text-slate-dim/25">+4 bits</span>
      </div>
      <p className="text-[8px] font-mono text-slate-dim/30 mt-1">
        Signal: IC025 &gt; 0 (lower CI {isSignal ? ">" : "not >"} 0)
      </p>
    </div>
  );
}

function ChiPanel({ chiSquared }: { chiSquared: number }) {
  const isSignal = chiSquared >= 3.841;
  const barWidth = Math.min(100, (chiSquared / 50) * 100);

  return (
    <div className="border border-white/[0.06] bg-white/[0.02] px-3 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/50">
          Chi-Squared
        </span>
        <span
          className={`text-xs font-bold font-mono tabular-nums ${isSignal ? "text-red-400" : "text-slate-dim/60"}`}
        >
          {chiSquared.toFixed(2)}
        </span>
      </div>
      {/* Visual bar */}
      <div className="relative h-3 bg-white/[0.04] overflow-hidden">
        {/* Threshold at 3.841 — maps to 7.68% of 50 */}
        <div
          className="absolute top-0 bottom-0 w-px bg-gold/30"
          style={{ left: "7.68%" }}
        />
        <div
          className={`absolute top-0 bottom-0 ${isSignal ? "bg-red-400/40" : "bg-slate-dim/15"}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[8px] font-mono text-slate-dim/25">0</span>
        <span className="text-[8px] font-mono text-gold/40">
          threshold: 3.841
        </span>
        <span className="text-[8px] font-mono text-slate-dim/25">50</span>
      </div>
      <p className="text-[8px] font-mono text-slate-dim/30 mt-1">
        Evans criterion: Chi-sq &gt;= 3.841 (p &lt; 0.05)
      </p>
    </div>
  );
}
