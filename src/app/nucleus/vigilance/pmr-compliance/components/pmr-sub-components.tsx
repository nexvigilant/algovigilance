"use client";

import type { PmrDelayResult } from "@/lib/pv-compute/pmr-compliance";
import { type StatusCounts } from "./pmr-types";

// ---------------------------------------------------------------------------
// Metric Card
// ---------------------------------------------------------------------------

export function MetricCard({
  label,
  value,
  sub,
  color = "text-white",
  alert,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`border p-4 ${
        alert
          ? "border-red-500/30 bg-red-500/5"
          : "border-white/[0.12] bg-white/[0.06]"
      }`}
    >
      <p className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/50 mb-1">
        {label}
      </p>
      <p className={`text-2xl font-extrabold font-headline ${color}`}>
        {value}
      </p>
      {sub && (
        <p className="text-[10px] font-mono text-slate-dim/40 mt-1">{sub}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status Bar (horizontal stacked)
// ---------------------------------------------------------------------------

export const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-slate-400",
  Ongoing: "bg-cyan",
  Delayed: "bg-red-400",
  Submitted: "bg-amber-400",
  Fulfilled: "bg-emerald-400",
  Released: "bg-blue-400",
  Terminated: "bg-gray-600",
};

export function StatusBar({
  counts,
  total,
}: {
  counts: StatusCounts;
  total: number;
}) {
  const ordered = [
    "Fulfilled",
    "Submitted",
    "Released",
    "Ongoing",
    "Pending",
    "Delayed",
    "Terminated",
  ];
  return (
    <div className="space-y-2">
      <div className="flex h-4 w-full overflow-hidden rounded-sm">
        {ordered.map((s) => {
          const n = counts[s] ?? 0;
          if (n === 0) return null;
          const pct = (n / total) * 100;
          return (
            <div
              key={s}
              className={`${STATUS_COLORS[s] ?? "bg-gray-500"} relative group`}
              style={{ width: `${pct}%` }}
              title={`${s}: ${n} (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 text-[10px] font-mono text-slate-dim/60">
        {ordered.map((s) => {
          const n = counts[s] ?? 0;
          if (n === 0) return null;
          return (
            <span key={s} className="flex items-center gap-1">
              <span
                className={`inline-block h-2 w-2 rounded-sm ${
                  STATUS_COLORS[s] ?? "bg-gray-500"
                }`}
              />
              {s}: {n} ({((n / total) * 100).toFixed(1)}%)
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Table component
// ---------------------------------------------------------------------------

export function DataTable({
  headers,
  rows,
  maxRows = 25,
}: {
  headers: string[];
  rows: (string | number)[][];
  maxRows?: number;
}) {
  return (
    <div className="overflow-x-auto border border-white/[0.08]">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="bg-white/[0.04]">
            {headers.map((h) => (
              <th
                key={h}
                className="text-left px-3 py-2 text-[10px] uppercase tracking-widest text-slate-dim/50 font-medium"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, maxRows).map((row, i) => (
            <tr
              key={i}
              className="border-t border-white/[0.06] hover:bg-white/[0.03]"
            >
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-1.5 text-slate-dim/80">
                  {typeof cell === "number" ? cell.toLocaleString() : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > maxRows && (
        <p className="text-[9px] font-mono text-slate-dim/40 px-3 py-1">
          Showing {maxRows} of {rows.length} rows
        </p>
      )}
    </div>
  );
}
