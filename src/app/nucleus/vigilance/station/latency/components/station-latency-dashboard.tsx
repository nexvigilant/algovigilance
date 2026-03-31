"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  Loader2,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HealthTrafficResult } from "@/lib/pv-compute/operations";

// ---------------------------------------------------------------------------
// Types (mirrors /api/station/health shape)
// ---------------------------------------------------------------------------

interface DomainHealth {
  domain: string;
  avg_duration_ms: number;
  call_count: number;
  error_count: number;
  top_tools: string[];
}

interface StationHealth {
  avg_duration_ms: number;
  latency_p99_ms: number;
  error_rate_pct: number;
  slo_status: "ok" | "warn" | "critical";
  domains: DomainHealth[];
  total_calls: number;
  total_errors: number;
  uptime_seconds: number;
  _error?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SLO_THRESHOLD_MS = 5000; // 5s P99 SLO
const REFRESH_INTERVAL_MS = 30_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatUptime(seconds: number): string {
  if (seconds === 0) return "—";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  }
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  return `${d}d ${h}h`;
}

function latencyColor(ms: number): {
  bar: string;
  text: string;
  bg: string;
  border: string;
} {
  if (ms < 1000) {
    return {
      bar: "bg-emerald-500",
      text: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
    };
  }
  if (ms < 3000) {
    return {
      bar: "bg-amber-500",
      text: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
    };
  }
  return {
    bar: "bg-red-500",
    text: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
  };
}

function sloColors(status: "ok" | "warn" | "critical") {
  switch (status) {
    case "ok":
      return {
        badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
        label: "SLO MET",
      };
    case "warn":
      return {
        badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
        icon: <AlertTriangle className="h-4 w-4 text-amber-400" />,
        label: "SLO WARNING",
      };
    case "critical":
      return {
        badge: "bg-red-500/15 text-red-400 border-red-500/30",
        icon: <XCircle className="h-4 w-4 text-red-400" />,
        label: "SLO BREACH",
      };
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SummaryCard({
  label,
  value,
  sub,
  colorClass,
}: {
  label: string;
  value: string;
  sub?: string;
  colorClass?: string;
}) {
  return (
    <div className="border border-white/[0.10] bg-white/[0.04] p-4 rounded-none">
      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400/60 mb-1">
        {label}
      </p>
      <p
        className={`text-2xl font-extrabold font-mono tabular-nums leading-none ${colorClass ?? "text-white"}`}
      >
        {value}
      </p>
      {sub && (
        <p className="text-[10px] text-slate-400/40 font-mono mt-1">{sub}</p>
      )}
    </div>
  );
}

function DomainBar({ domain, maxMs }: { domain: DomainHealth; maxMs: number }) {
  const pct =
    maxMs > 0 ? Math.min((domain.avg_duration_ms / maxMs) * 100, 100) : 0;
  const sloBreached = domain.avg_duration_ms > SLO_THRESHOLD_MS;
  const colors = latencyColor(domain.avg_duration_ms);
  const errorRate =
    domain.call_count > 0
      ? ((domain.error_count / domain.call_count) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-mono text-slate-300 truncate max-w-[180px]">
          {domain.domain}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {sloBreached && (
            <span className="text-[8px] font-bold text-red-400 uppercase tracking-widest">
              BREACH
            </span>
          )}
          <span
            className={`text-xs font-bold font-mono tabular-nums ${colors.text}`}
          >
            {domain.avg_duration_ms.toFixed(0)} ms
          </span>
        </div>
      </div>
      <div className="relative h-2 bg-white/[0.06] rounded-none overflow-hidden">
        {/* SLO reference line at SLO_THRESHOLD_MS / maxMs */}
        {maxMs > 0 && (
          <div
            className="absolute top-0 bottom-0 w-px bg-white/20"
            style={{
              left: `${Math.min((SLO_THRESHOLD_MS / maxMs) * 100, 100)}%`,
            }}
          />
        )}
        <div
          className={`h-full transition-all duration-500 ${colors.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center gap-3 mt-0.5">
        <span className="text-[9px] font-mono text-slate-400/40">
          {domain.call_count.toLocaleString()} calls
        </span>
        {domain.error_count > 0 && (
          <span className="text-[9px] font-mono text-red-400/60">
            {errorRate}% errors
          </span>
        )}
        {domain.top_tools.length > 0 && (
          <span className="text-[9px] font-mono text-slate-400/30 truncate">
            top: {domain.top_tools[0]}
          </span>
        )}
      </div>
    </div>
  );
}

type SortKey = "domain" | "avg_duration_ms" | "call_count" | "error_rate";
type SortDir = "asc" | "desc";

function DomainTable({ domains }: { domains: DomainHealth[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("avg_duration_ms");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = [...domains].sort((a, b) => {
    let aVal: string | number;
    let bVal: string | number;

    if (sortKey === "domain") {
      aVal = a.domain;
      bVal = b.domain;
    } else if (sortKey === "avg_duration_ms") {
      aVal = a.avg_duration_ms;
      bVal = b.avg_duration_ms;
    } else if (sortKey === "call_count") {
      aVal = a.call_count;
      bVal = b.call_count;
    } else {
      // error_rate
      aVal = a.call_count > 0 ? a.error_count / a.call_count : 0;
      bVal = b.call_count > 0 ? b.error_count / b.call_count : 0;
    }

    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortDir === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    return sortDir === "asc"
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number);
  });

  function ColHeader({
    label,
    k,
    align = "left",
  }: {
    label: string;
    k: SortKey;
    align?: "left" | "right";
  }) {
    const active = sortKey === k;
    return (
      <th
        className={`text-[9px] font-bold uppercase tracking-widest text-slate-400/50 py-2 cursor-pointer hover:text-slate-300/70 select-none ${align === "right" ? "text-right pr-3" : "text-left pl-3"}`}
        onClick={() => handleSort(k)}
      >
        {label}
        {active && (
          <span className="ml-1 text-slate-400/40">
            {sortDir === "asc" ? "↑" : "↓"}
          </span>
        )}
      </th>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono border-collapse">
        <thead>
          <tr className="border-b border-white/[0.08]">
            <ColHeader label="Domain" k="domain" />
            <ColHeader label="Avg Latency" k="avg_duration_ms" align="right" />
            <ColHeader label="Calls" k="call_count" align="right" />
            <th className="text-[9px] font-bold uppercase tracking-widest text-slate-400/50 py-2 text-right pr-3">
              Errors
            </th>
            <ColHeader label="Error Rate" k="error_rate" align="right" />
            <th className="text-[9px] font-bold uppercase tracking-widest text-slate-400/50 py-2 text-right pr-3">
              Top Tool
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((d) => {
            const colors = latencyColor(d.avg_duration_ms);
            const errorRate =
              d.call_count > 0
                ? ((d.error_count / d.call_count) * 100).toFixed(1)
                : "0.0";
            const sloBreached = d.avg_duration_ms > SLO_THRESHOLD_MS;

            return (
              <tr
                key={d.domain}
                className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
              >
                <td className="py-2 pl-3 text-slate-300">
                  <span>{d.domain}</span>
                  {sloBreached && (
                    <span className="ml-2 text-[8px] text-red-400 font-bold uppercase">
                      SLO BREACH
                    </span>
                  )}
                </td>
                <td
                  className={`py-2 text-right pr-3 font-bold tabular-nums ${colors.text}`}
                >
                  {d.avg_duration_ms.toFixed(0)} ms
                </td>
                <td className="py-2 text-right pr-3 text-slate-400 tabular-nums">
                  {d.call_count.toLocaleString()}
                </td>
                <td className="py-2 text-right pr-3 tabular-nums">
                  <span
                    className={
                      d.error_count > 0 ? "text-red-400" : "text-slate-500"
                    }
                  >
                    {d.error_count.toLocaleString()}
                  </span>
                </td>
                <td className="py-2 text-right pr-3 tabular-nums">
                  <span
                    className={
                      parseFloat(errorRate) > 5
                        ? "text-red-400"
                        : "text-slate-400"
                    }
                  >
                    {errorRate}%
                  </span>
                </td>
                <td className="py-2 text-right pr-3 text-slate-400/50 truncate max-w-[120px]">
                  {d.top_tools[0] ?? "—"}
                </td>
              </tr>
            );
          })}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={6} className="py-6 text-center text-slate-400/40">
                No domain data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SLO Compliance section
// ---------------------------------------------------------------------------

function SloComplianceSection({ domains }: { domains: DomainHealth[] }) {
  if (domains.length === 0) return null;

  const within = domains.filter((d) => d.avg_duration_ms <= SLO_THRESHOLD_MS);
  const breaching = domains.filter((d) => d.avg_duration_ms > SLO_THRESHOLD_MS);
  const pct =
    domains.length > 0
      ? ((within.length / domains.length) * 100).toFixed(0)
      : "0";

  return (
    <div className="border border-white/[0.08] bg-white/[0.03]">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06]">
        <Activity className="h-3.5 w-3.5 text-slate-400/50" />
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400/50">
          SLO Compliance — 5s P99 Target
        </span>
        <div className="h-px flex-1 bg-white/[0.06]" />
        <span className="text-[9px] font-mono text-slate-400/40">
          {pct}% compliant
        </span>
      </div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-400/60 mb-2">
            Within SLO ({within.length})
          </p>
          {within.length === 0 && (
            <p className="text-[10px] text-slate-400/30 font-mono">None</p>
          )}
          {within.map((d) => (
            <div
              key={d.domain}
              className="flex items-center justify-between py-1 border-b border-white/[0.04] last:border-0"
            >
              <span className="text-[10px] font-mono text-slate-300">
                {d.domain}
              </span>
              <span className="text-[10px] font-mono text-emerald-400 tabular-nums">
                {d.avg_duration_ms.toFixed(0)} ms
              </span>
            </div>
          ))}
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-red-400/60 mb-2">
            SLO Breach ({breaching.length})
          </p>
          {breaching.length === 0 && (
            <p className="text-[10px] text-slate-400/30 font-mono">
              None — all domains meeting target
            </p>
          )}
          {breaching.map((d) => (
            <div
              key={d.domain}
              className="flex items-center justify-between py-1 border-b border-white/[0.04] last:border-0"
            >
              <span className="text-[10px] font-mono text-slate-300">
                {d.domain}
              </span>
              <span className="text-[10px] font-mono text-red-400 tabular-nums">
                {d.avg_duration_ms.toFixed(0)} ms
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main dashboard
// ---------------------------------------------------------------------------

export function StationLatencyDashboard() {
  const [data, setData] = useState<StationHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/station/health");
      if (!res.ok) {
        setFetchError(`API returned ${res.status}`);
        return;
      }
      const json: StationHealth = await res.json();
      setData(json);
      setFetchError(json._error ?? null);
      setLastRefresh(new Date());
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Fetch failed");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  // Auto-refresh every 30s
  useEffect(() => {
    const id = setInterval(fetchHealth, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchHealth]);

  const slo = data ? sloColors(data.slo_status) : sloColors("ok");

  // Sort domains descending by avg latency for the bar chart
  const sortedDomains = data?.domains
    ? [...data.domains].sort((a, b) => b.avg_duration_ms - a.avg_duration_ms)
    : [];

  const maxMs =
    sortedDomains.length > 0 ? (sortedDomains[0]?.avg_duration_ms ?? 0) : 0;
  // Extend max slightly so bars don't hit 100% and the SLO line is visible
  const chartMax = Math.max(maxMs * 1.1, SLO_THRESHOLD_MS * 1.2);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* ------------------------------------------------------------------ */}
      {/* Hero */}
      {/* ------------------------------------------------------------------ */}
      <header className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="intel-status-active" />
              <span className="intel-label">AlgoVigilance Station / Latency</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold font-headline text-white tracking-tight mb-2">
              Station Latency Monitor
            </h1>
            <p className="text-sm text-slate-400/60 max-w-2xl">
              Per-domain P99 latency trends and SLO compliance for{" "}
              <span className="text-white/60 font-mono">
                mcp.nexvigilant.com
              </span>
              . Data refreshes every 30 seconds.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0 pt-1">
            {/* SLO badge */}
            {data && (
              <div
                className={`flex items-center gap-1.5 border px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest font-mono ${slo.badge}`}
              >
                {slo.icon}
                {slo.label}
              </div>
            )}
            {/* Refresh button */}
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                fetchHealth();
              }}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-white/[0.08] text-[9px] font-mono text-slate-400/40 hover:text-white hover:border-white/20 transition-all"
            >
              <RefreshCw
                className={`h-3 w-3 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Fetch error banner */}
      {/* ------------------------------------------------------------------ */}
      {fetchError && (
        <div className="border border-amber-500/30 bg-amber-500/5 px-4 py-2 mb-6">
          <p className="text-amber-400/80 text-xs font-mono">
            {fetchError} — showing last known data
          </p>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Loading skeleton */}
      {/* ------------------------------------------------------------------ */}
      {loading && !data && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-5 w-5 text-slate-400/40 animate-spin mr-2" />
          <span className="text-xs font-mono text-slate-400/40">
            Fetching station health...
          </span>
        </div>
      )}

      {data && (
        <>
          {/* ---------------------------------------------------------------- */}
          {/* Summary cards */}
          {/* ---------------------------------------------------------------- */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <SummaryCard
              label="Global P99"
              value={
                data.latency_p99_ms > 0
                  ? `${data.latency_p99_ms.toFixed(0)} ms`
                  : "—"
              }
              sub={`SLO: ${SLO_THRESHOLD_MS.toLocaleString()} ms`}
              colorClass={latencyColor(data.latency_p99_ms).text}
            />
            <SummaryCard
              label="Error Rate"
              value={
                data.error_rate_pct > 0
                  ? `${data.error_rate_pct.toFixed(2)}%`
                  : "0.00%"
              }
              sub={`${data.total_errors.toLocaleString()} total errors`}
              colorClass={
                data.error_rate_pct > 5
                  ? "text-red-400"
                  : data.error_rate_pct > 1
                    ? "text-amber-400"
                    : "text-emerald-400"
              }
            />
            <SummaryCard
              label="Total Calls"
              value={data.total_calls.toLocaleString()}
              sub={`${sortedDomains.length} domains`}
            />
            <SummaryCard
              label="Uptime"
              value={formatUptime(data.uptime_seconds)}
              sub="since last restart"
            />
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Bar chart */}
          {/* ---------------------------------------------------------------- */}
          <Card className="mb-6 border-white/[0.08] bg-white/[0.03] rounded-none shadow-none">
            <CardHeader className="pb-3 border-b border-white/[0.06]">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-white/80 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400/50" />
                  Average Latency by Domain
                </CardTitle>
                <div className="flex items-center gap-3 text-[9px] font-mono text-slate-400/40">
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-3 bg-emerald-500 rounded-sm" />
                    &lt;1s
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-3 bg-amber-500 rounded-sm" />
                    1–3s
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-3 bg-red-500 rounded-sm" />
                    &gt;3s
                  </span>
                  <span className="flex items-center gap-1 text-white/20">
                    <span className="inline-block h-2 w-px bg-white/30" />
                    5s SLO
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {sortedDomains.length === 0 ? (
                <p className="text-xs text-slate-400/40 font-mono py-4 text-center">
                  No domain data — station may not expose per-domain metrics
                </p>
              ) : (
                <div className="space-y-3">
                  {sortedDomains.map((d) => (
                    <DomainBar key={d.domain} domain={d} maxMs={chartMax} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ---------------------------------------------------------------- */}
          {/* Domain table */}
          {/* ---------------------------------------------------------------- */}
          <Card className="mb-6 border-white/[0.08] bg-white/[0.03] rounded-none shadow-none">
            <CardHeader className="pb-3 border-b border-white/[0.06]">
              <CardTitle className="text-sm font-bold text-white/80">
                Domain Detail
              </CardTitle>
              <p className="text-[10px] text-slate-400/40 font-mono">
                Click column headers to sort
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <DomainTable domains={data.domains} />
            </CardContent>
          </Card>

          {/* ---------------------------------------------------------------- */}
          {/* SLO compliance */}
          {/* ---------------------------------------------------------------- */}
          <SloComplianceSection domains={data.domains} />

          {/* ---------------------------------------------------------------- */}
          {/* Footer */}
          {/* ---------------------------------------------------------------- */}
          {lastRefresh && (
            <p className="text-[9px] font-mono text-slate-400/30 text-center mt-6">
              Last refreshed: {lastRefresh.toLocaleTimeString()} &bull;
              Auto-refresh every 30s
            </p>
          )}
        </>
      )}
    </div>
  );
}
