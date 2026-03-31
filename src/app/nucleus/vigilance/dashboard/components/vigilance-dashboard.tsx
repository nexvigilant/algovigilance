"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { Activity, Shield, Eye, Brain, RefreshCw, Loader2 } from "lucide-react";
import { metricHealthColor, type MetricHealth } from "@/lib/pv-compute";

interface DashboardMetrics {
  health_status: string;
  guardian_state: string;
  guardian_iteration: number;
  vigil_status: string;
  llm_calls: number;
  llm_tokens: number;
}

const QUICK_ACTIONS = [
  {
    label: "Signal Detection",
    href: "/nucleus/vigilance/signals",
    icon: Activity,
  },
  { label: "FAERS Explorer", href: "/nucleus/vigilance/faers", icon: Eye },
  { label: "ICSR Cases", href: "/nucleus/vigilance/icsr", icon: Brain },
  {
    label: "Signal Analytics",
    href: "/nucleus/vigilance/analytics",
    icon: Activity,
  },
  {
    label: "Safety Reporting",
    href: "/nucleus/vigilance/reporting",
    icon: Shield,
  },
];

export function VigilanceDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/nexcore/guardian");
      if (res.ok) {
        const data = await res.json();
        setMetrics({
          health_status:
            data.health_status ??
            (data.threat_level === "Low" || data.threat_level === "None"
              ? "HEALTHY"
              : "DEGRADED"),
          guardian_state: data.threat_level ?? "UNKNOWN",
          guardian_iteration: data.iteration ?? data.tick_count ?? 0,
          vigil_status: data.vigil_status ?? "UNKNOWN",
          llm_calls: data.llm_calls ?? 0,
          llm_tokens: data.llm_tokens ?? 0,
        });
      }
    } catch {
      // API unavailable — metrics stay null
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const statusColor = (s: string) => {
    const upper = s.toUpperCase();
    let health: MetricHealth = "CRITICAL";
    if (["HEALTHY", "ACTIVE", "PATROLLING", "GREEN"].includes(upper))
      health = "HEALTHY";
    else if (["WARNING", "AMBER", "ELEVATED"].includes(upper))
      health = "WARNING";
    return metricHealthColor(health);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="intel-status-active" />
          <span className="intel-label">
            Vigilance Operations / System Health
          </span>
          <button
            onClick={refresh}
            disabled={loading}
            className="ml-4 text-slate-dim/40 hover:text-white transition-colors"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-headline mb-2 text-white tracking-tight">
          Vigilance Dashboard
        </h1>
        <p className="text-sm text-slate-dim/60 max-w-lg mx-auto">
          System health, Guardian status, and operational metrics for
          pharmacovigilance monitoring
        </p>
      </header>

      {/* Primary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-6">
            <Loader2 className="h-4 w-4 text-cyan/40 animate-spin mr-2" />
            <span className="text-[10px] font-mono text-slate-dim/40">
              Connecting to NexCore API...
            </span>
          </div>
        ) : metrics ? (
          <>
            <div
              className={`border bg-white/[0.06] p-4 ${statusColor(metrics.health_status)}`}
            >
              <p className="text-[8px] font-bold text-slate-dim/30 uppercase tracking-widest">
                Core Integrity
              </p>
              <p className="text-lg font-black font-mono mt-1">
                {metrics.health_status}
              </p>
            </div>
            <div
              className={`border bg-white/[0.06] p-4 ${statusColor(metrics.guardian_state)}`}
            >
              <p className="text-[8px] font-bold text-slate-dim/30 uppercase tracking-widest">
                Guardian State
              </p>
              <p className="text-lg font-black font-mono mt-1">
                {metrics.guardian_state}
              </p>
            </div>
            <div className="border border-cyan-500/30 bg-white/[0.06] p-4">
              <p className="text-[8px] font-bold text-slate-dim/30 uppercase tracking-widest">
                Homeostasis Cycle
              </p>
              <p className="text-lg font-black text-cyan-400 font-mono mt-1">
                #{metrics.guardian_iteration}
              </p>
            </div>
            <div
              className={`border bg-white/[0.06] p-4 ${statusColor(metrics.vigil_status)}`}
            >
              <p className="text-[8px] font-bold text-slate-dim/30 uppercase tracking-widest">
                Patrol Orbit
              </p>
              <p className="text-lg font-black font-mono mt-1">
                {metrics.vigil_status}
              </p>
            </div>
            <div className="border border-white/[0.08] bg-white/[0.06] p-4">
              <p className="text-[8px] font-bold text-slate-dim/30 uppercase tracking-widest">
                LLM Calls
              </p>
              <p className="text-lg font-black text-white font-mono mt-1">
                {metrics.llm_calls.toLocaleString()}
              </p>
            </div>
            <div className="border border-white/[0.08] bg-white/[0.06] p-4">
              <p className="text-[8px] font-bold text-slate-dim/30 uppercase tracking-widest">
                Token Usage
              </p>
              <p className="text-lg font-black text-white font-mono mt-1">
                {metrics.llm_tokens.toLocaleString()}
              </p>
            </div>
          </>
        ) : (
          <div className="col-span-full flex items-center justify-center py-6">
            <span className="text-[10px] font-mono text-slate-dim/30">
              NexCore API unavailable — no live metrics
            </span>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Guardian Homeostasis */}
        <div className="lg:col-span-2 border border-white/[0.12] bg-white/[0.06] p-6">
          <h3 className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest font-mono mb-4">
            Guardian Homeostasis Loop
          </h3>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {["SENSE", "DECIDE", "RESPOND", "FEEDBACK"].map((phase, i) => (
              <div
                key={phase}
                className="border border-white/[0.12] bg-black/20 p-4 text-center"
              >
                <div className="text-[8px] font-bold text-slate-dim/30 uppercase tracking-widest mb-2">
                  Phase {i + 1}
                </div>
                <div className="text-sm font-black text-emerald-400 font-mono">
                  {phase}
                </div>
                <div className="mt-2 h-1 bg-emerald-500/30">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
            ))}
          </div>

          <h4 className="text-[9px] font-bold text-slate-dim/40 uppercase tracking-widest font-mono mb-3">
            Activity Feed
          </h4>
          <div className="py-6 text-center">
            <p className="text-[10px] font-mono text-slate-dim/30">
              Activity feed requires NexCore event stream connection.
            </p>
            <p className="text-[9px] font-mono text-slate-dim/20 mt-1">
              See Bio Telemetry for live Guardian status.
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="border border-white/[0.12] bg-white/[0.04] p-6">
          <h3 className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest font-mono mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="border border-white/[0.12] bg-black/20 px-4 py-3 flex items-center gap-3 hover:border-cyan-500/30 transition-colors group"
                >
                  <Icon className="w-4 h-4 text-slate-dim/40 group-hover:text-cyan-400 transition-colors" />
                  <span className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors">
                    {action.label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* System summary */}
          <div className="mt-6 border border-white/[0.12] bg-black/20 p-4">
            <h4 className="text-[8px] font-bold text-slate-dim/30 uppercase tracking-widest mb-3">
              System Summary
            </h4>
            <div className="space-y-2 text-[10px] font-mono">
              <div className="flex justify-between">
                <span className="text-slate-dim/40">MCP Tools</span>
                <span className="text-white">369</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-dim/40">Signal Algorithms</span>
                <span className="text-white">5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-dim/40">Bio Crates</span>
                <span className="text-white">8</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-dim/40">Antibodies</span>
                <span className="text-white">8</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Station wire */}
      <div className="mt-6 rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-violet-400 mb-1">AlgoVigilance Station</p>
          <p className="text-[10px] text-white/40">Dashboard metrics backed by the same engine at mcp.nexvigilant.com that AI agents use.</p>
        </div>
        <a href="/nucleus/glass/signal-lab" className="shrink-0 ml-4 rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-medium text-violet-300 hover:bg-violet-500/20 transition-colors">
          Glass Signal Lab
        </a>
      </div>
    </div>
  );
}
