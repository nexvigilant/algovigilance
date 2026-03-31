"use client";

import type { SignalResult } from "@/lib/pv-compute";
import type { SuseCandidate } from "../types";

function verdictColor(verdict: SuseCandidate["verdict"]): string {
  switch (verdict) {
    case "CRITICAL":
      return "text-red-400 bg-red-500/10";
    case "HIGH":
      return "text-amber-400 bg-amber-500/10";
    case "INVESTIGATE":
      return "text-cyan bg-cyan/10";
    case "CLEARED":
      return "text-slate-500 bg-slate-500/10";
  }
}

interface BatchRow extends Pick<SignalResult, "prr" | "ror" | "ic025"> {
  event: string;
  count: number;
  chiSq: number;
  a: number;
  b: number;
  c: number;
  d: number;
  verdict: SuseCandidate["verdict"];
  onLabel: boolean;
}

export function BatchResults({
  drug,
  rows,
  loading,
  progress,
}: {
  drug: string;
  rows: BatchRow[];
  loading: boolean;
  progress: { done: number; total: number };
}) {
  const signals = rows.filter((r) => r.verdict !== "CLEARED");
  const critical = rows.filter((r) => r.verdict === "CRITICAL").length;
  const high = rows.filter((r) => r.verdict === "HIGH").length;
  const investigate = rows.filter((r) => r.verdict === "INVESTIGATE").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Batch SUSE Analysis — {drug}
          </h3>
          <p className="text-xs text-muted-foreground">
            {rows.length} events analyzed, {signals.length} signal
            {signals.length !== 1 ? "s" : ""} detected
          </p>
        </div>
        {loading && (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-cyan transition-all"
                style={{
                  width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="text-xs text-slate-500">
              {progress.done}/{progress.total}
            </span>
          </div>
        )}
      </div>

      {/* Summary chips */}
      <div className="flex gap-2">
        {critical > 0 && (
          <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400">
            {critical} Critical
          </span>
        )}
        {high > 0 && (
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">
            {high} High
          </span>
        )}
        {investigate > 0 && (
          <span className="rounded-full border border-cyan/30 bg-cyan/10 px-2.5 py-1 text-xs font-medium text-cyan">
            {investigate} Investigate
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-white/5 -mx-2 sm:mx-0">
        <table className="w-full min-w-[640px] text-xs">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="px-3 py-2 text-left font-medium text-slate-400">
                Event
              </th>
              <th className="px-3 py-2 text-right font-medium text-slate-400">
                Reports
              </th>
              <th className="px-3 py-2 text-right font-medium text-slate-400">
                PRR
              </th>
              <th className="px-3 py-2 text-right font-medium text-slate-400">
                ROR
              </th>
              <th className="px-3 py-2 text-right font-medium text-slate-400">
                IC025
              </th>
              <th className="px-3 py-2 text-right font-medium text-slate-400">
                Chi²
              </th>
              <th className="px-3 py-2 text-center font-medium text-slate-400">
                On Label
              </th>
              <th className="px-3 py-2 text-center font-medium text-slate-400">
                Verdict
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.event}
                className="border-b border-white/[0.03] hover:bg-white/[0.02]"
              >
                <td className="px-3 py-2 font-medium text-white">
                  {row.event}
                </td>
                <td className="px-3 py-2 text-right font-mono text-slate-400">
                  {row.count.toLocaleString()}
                </td>
                <td
                  className={`px-3 py-2 text-right font-mono ${row.prr >= 2 ? "text-amber-400" : "text-slate-500"}`}
                >
                  {row.prr.toFixed(1)}
                </td>
                <td
                  className={`px-3 py-2 text-right font-mono ${row.ror > 1 ? "text-amber-400" : "text-slate-500"}`}
                >
                  {row.ror.toFixed(1)}
                </td>
                <td
                  className={`px-3 py-2 text-right font-mono ${row.ic025 > 0 ? "text-amber-400" : "text-slate-500"}`}
                >
                  {row.ic025.toFixed(2)}
                </td>
                <td
                  className={`px-3 py-2 text-right font-mono ${row.chiSq >= 3.841 ? "text-amber-400" : "text-slate-500"}`}
                >
                  {row.chiSq.toFixed(1)}
                </td>
                <td className="px-3 py-2 text-center">
                  <span
                    className={
                      row.onLabel ? "text-emerald-400" : "text-slate-600"
                    }
                  >
                    {row.onLabel ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-3 py-2 text-center">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${verdictColor(row.verdict)}`}
                  >
                    {row.verdict}
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-8 text-center text-slate-500"
                >
                  No events analyzed yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export type { BatchRow };
