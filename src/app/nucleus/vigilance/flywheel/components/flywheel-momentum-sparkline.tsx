"use client";

import { useId } from "react";
import { JargonBuster, RememberBox } from "@/components/pv-for-nexvigilants";
import type { MomentumResult } from "@/lib/pv-compute/flywheel";
import type { HistoryRecord, MomentumTrend } from "./flywheel-types";

interface FlywheelMomentumSparklineProps {
  history: HistoryRecord[];
}

const trendColors: Record<MomentumTrend, string> = {
  ACCELERATING: "#10b981", // emerald-500
  MAINTAINING: "#06b6d4", // cyan-500
  DECELERATING: "#f59e0b", // amber-500
  BASELINE: "#64748b", // slate-500
};

export function FlywheelMomentumSparkline({
  history,
}: FlywheelMomentumSparklineProps) {
  const gradientId = useId();

  if (history.length === 0) {
    return (
      <div className="border border-white/[0.08] bg-white/[0.04] rounded-lg p-6">
        <h2 className="text-sm font-semibold text-foreground mb-2">
          Session Momentum
        </h2>
        <p className="text-xs text-muted-foreground">
          No history data yet. Momentum will appear after a few sessions.
        </p>
      </div>
    );
  }

  // Use last 30 records for the sparkline
  const records = history.slice(-30);
  const maxCommits = Math.max(...records.map((r) => r.commits), 1);

  // SVG dimensions
  const width = 600;
  const height = 120;
  const padding = { top: 10, right: 10, bottom: 20, left: 10 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const points = records.map((r, i) => ({
    x: padding.left + (i / Math.max(records.length - 1, 1)) * plotW,
    y: padding.top + plotH - (r.commits / maxCommits) * plotH,
    color: trendColors[r.momentum] ?? trendColors.BASELINE,
    record: r,
  }));

  // Build polyline path
  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  // Area fill path
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + plotH} L ${points[0].x} ${padding.top + plotH} Z`;

  // Latest trend
  const latest = records[records.length - 1];
  const latestColor = trendColors[latest.momentum] ?? trendColors.BASELINE;

  return (
    <div className="border border-white/[0.08] bg-white/[0.04] rounded-lg p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-foreground">
          Is{" "}
          <JargonBuster
            term="Momentum"
            definition="The trend of your development speed over time. Accelerating means each session is faster than the last. Decelerating means things are slowing down."
          >
            Momentum
          </JargonBuster>{" "}
          Building?
        </h2>
        <div className="flex items-center gap-2">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: latestColor }}
          />
          <span className="text-xs font-mono text-muted-foreground">
            {latest.momentum}
          </span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Each point is a session. Height shows commits. Color shows momentum
        trend.
      </p>

      {/* SVG Sparkline */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Momentum sparkline showing ${records.length} sessions. Latest trend: ${latest.momentum}`}
      >
        {/* Area fill */}
        <path d={areaPath} fill={`url(#${gradientId})`} opacity={0.15} />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={latestColor}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3}
            fill={p.color}
            stroke="var(--background)"
            strokeWidth={1.5}
          >
            <title>
              {new Date(p.record.ts).toLocaleDateString()} — {p.record.commits}{" "}
              commits, {p.record.momentum}
            </title>
          </circle>
        ))}

        {/* Gradient definition */}
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={latestColor} />
            <stop offset="100%" stopColor={latestColor} stopOpacity={0} />
          </linearGradient>
        </defs>
      </svg>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-4 justify-center">
        {(Object.entries(trendColors) as [MomentumTrend, string][]).map(
          ([trend, color]) => (
            <div key={trend} className="flex items-center gap-1.5">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-[10px] text-muted-foreground">
                {trend.charAt(0) + trend.slice(1).toLowerCase()}
              </span>
            </div>
          ),
        )}
      </div>

      <RememberBox>
        Momentum is a trailing indicator. A single slow session doesn&apos;t
        mean the flywheel is broken — look at the overall trend over 5+
        sessions.
      </RememberBox>
    </div>
  );
}
