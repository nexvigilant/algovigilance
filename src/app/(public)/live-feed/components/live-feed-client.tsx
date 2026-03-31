"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Activity,
  Radio,
  Shield,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Server,
  GitBranch,
  Database,
  Cpu,
  ArrowRight,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────

interface StationData {
  status: string;
  tools: number;
  configs: number;
  calls: number;
  errorRate: number;
  uptime: number;
  trend: string;
  callsPerMinute: number;
  latencyP99: number;
  gitSha: string;
}

interface SignalResult {
  drug: string;
  event: string;
  harmType: string;
  prr: number | null;
  ror: number | null;
  ic: number | null;
  caseCount: number | null;
  signal: boolean;
  verdict: string;
  route: string;
  latencyMs: number;
}

interface BatchSummary {
  total: number;
  completed: number;
  signals: number;
  avgLatencyMs: number;
}

interface MeshTopology {
  nodes: Array<{ id: string; state: string; neighbor_count: number }>;
  edges: Array<{ from: string; to: string; quality: number }>;
  node_count: number;
  edge_count: number;
  route_count: number;
}

type FeedState = "idle" | "connecting" | "streaming" | "complete" | "error";

// ─── Design Tokens ───────────────────────────────────────────────────

const VERDICT_STYLES: Record<string, { text: string; bg: string; border: string; glow: string }> = {
  strong_signal: {
    text: "text-rose-400",
    bg: "bg-rose-400/10",
    border: "border-rose-400/30",
    glow: "shadow-[0_0_12px_rgba(244,63,94,0.3)]",
  },
  idiosyncratic_signal: {
    text: "text-orange-400",
    bg: "bg-orange-400/10",
    border: "border-orange-400/30",
    glow: "shadow-[0_0_12px_rgba(251,146,60,0.3)]",
  },
  signal_detected: {
    text: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/30",
    glow: "shadow-[0_0_12px_rgba(251,191,36,0.2)]",
  },
  no_signal: {
    text: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/30",
    glow: "",
  },
  unavailable: {
    text: "text-slate-dim",
    bg: "bg-nex-surface/30",
    border: "border-nex-border/50",
    glow: "",
  },
  timeout: {
    text: "text-slate-dim",
    bg: "bg-nex-surface/20",
    border: "border-nex-border/30",
    glow: "",
  },
};

const HARM_LABELS: Record<string, { label: string; color: string }> = {
  A: { label: "Dose-dependent", color: "text-cyan" },
  B: { label: "Idiosyncratic", color: "text-amber-400" },
  C: { label: "Chronic", color: "text-purple-400" },
};

// ─── Main Component ──────────────────────────────────────────────────

export function LiveFeedClient() {
  const [state, setState] = useState<FeedState>("idle");
  const [station, setStation] = useState<StationData | null>(null);
  const [signals, setSignals] = useState<SignalResult[]>([]);
  const [batch, setBatch] = useState<BatchSummary | null>(null);
  const [mesh, setMesh] = useState<MeshTopology | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startFeed = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setState("connecting");
    setSignals([]);
    setBatch(null);
    setMesh(null);
    setElapsed(0);

    // Start elapsed timer
    const start = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Date.now() - start);
    }, 100);

    const es = new EventSource("/api/live-feed");
    eventSourceRef.current = es;

    es.onopen = () => setState("streaming");

    es.onmessage = (event) => {
      try {
        const frame = JSON.parse(event.data);
        if (frame.type === "health" && frame.station) {
          setStation(frame.station);
        }
        if (frame.type === "signal" && frame.signal) {
          setSignals((prev) => [...prev, frame.signal]);
        }
        if (frame.type === "mesh_topology" && frame.mesh) {
          setMesh(frame.mesh);
        }
        if (frame.type === "batch_complete" && frame.batch) {
          setBatch(frame.batch);
          setState("complete");
          if (timerRef.current) clearInterval(timerRef.current);
        }
      } catch {
        /* ignore malformed frames */
      }
    };

    es.onerror = () => {
      setState("error");
      es.close();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-nex-deep text-slate-light">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-50 border-b border-nex-border/50 bg-nex-dark/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-dim hover:text-cyan transition-colors mb-3"
          >
            <ArrowLeft className="h-4 w-4" />
            nexvigilant.com
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Radio className="h-6 w-6 text-cyan" />
                {(state === "streaming" || state === "connecting") && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-headline font-bold text-gold">
                  Live Signal Feed
                </h1>
                <p className="text-sm text-slate-dim">
                  Parallel pharmacovigilance — real FDA FAERS data, 20M+ reports
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {state === "streaming" && (
                <span className="text-xs font-mono text-slate-dim tabular-nums">
                  {(elapsed / 1000).toFixed(1)}s
                </span>
              )}
              <button
                onClick={startFeed}
                disabled={state === "streaming" || state === "connecting"}
                className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  state === "idle" || state === "complete" || state === "error"
                    ? "bg-cyan text-nex-deep font-semibold hover:bg-cyan-glow shadow-glow-cyan active:scale-95"
                    : "bg-nex-surface text-slate-dim cursor-not-allowed"
                }`}
              >
                {state === "idle"
                  ? "View Live Feed"
                  : state === "connecting"
                    ? "Connecting..."
                    : state === "streaming"
                      ? `Processing ${signals.length}/8...`
                      : state === "complete"
                        ? "Run Again"
                        : "Retry"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        {/* ─── Station Health ─── */}
        {station && (
          <section className="rounded-xl border border-nex-border bg-nex-surface/30 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Server className="h-4 w-4 text-cyan/70" />
              <span className="text-xs font-medium text-slate-dim uppercase tracking-wider font-mono">
                mcp.nexvigilant.com
              </span>
              <StatusPill status={station.status} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Stat label="Tools" value={String(station.tools)} icon={<Cpu className="h-3 w-3" />} />
              <Stat label="Configs" value={String(station.configs)} icon={<GitBranch className="h-3 w-3" />} />
              <Stat label="Total Calls" value={station.calls.toLocaleString()} icon={<Database className="h-3 w-3" />} />
              <Stat label="Calls/min" value={String(station.callsPerMinute)} icon={<Activity className="h-3 w-3" />} />
              <Stat label="p99" value={`${station.latencyP99}ms`} icon={<Clock className="h-3 w-3" />} />
            </div>
          </section>
        )}

        {/* ─── Pipeline Visualization ─── */}
        {(state === "streaming" || state === "complete") && (
          <section className="rounded-xl border border-nex-border/50 bg-nex-surface/10 p-5 overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-medium text-slate-dim uppercase tracking-wider">
                Pipeline
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-dim overflow-x-auto pb-2">
              <PipelineStage label="FAERS" active={state === "streaming"} done={signals.length > 0} />
              <ArrowRight className="h-3 w-3 text-nex-border flex-shrink-0" />
              <PipelineStage label="OpenVigil" active={state === "streaming" && signals.length > 0} done={signals.length > 2} />
              <ArrowRight className="h-3 w-3 text-nex-border flex-shrink-0" />
              <PipelineStage label="PRR/ROR/IC" active={signals.length > 2} done={signals.length > 4} />
              <ArrowRight className="h-3 w-3 text-nex-border flex-shrink-0" />
              <PipelineStage label="Triage" active={signals.length > 4} done={signals.length > 6} />
              <ArrowRight className="h-3 w-3 text-nex-border flex-shrink-0" />
              <PipelineStage label="Route" active={signals.length > 6} done={state === "complete"} />
            </div>
            {/* Progress bar */}
            <div className="mt-3 h-1 rounded-full bg-nex-surface overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan via-cyan-glow to-emerald-400 transition-all duration-500 ease-out"
                style={{ width: `${(signals.length / 8) * 100}%` }}
              />
            </div>
          </section>
        )}

        {/* ─── Idle State ─── */}
        {state === "idle" && (
          <section className="rounded-xl border border-dashed border-nex-border/30 bg-nex-surface/5 p-16 text-center">
            <Activity className="h-12 w-12 text-cyan/20 mx-auto mb-4" />
            <h2 className="text-xl font-headline font-semibold text-slate-light mb-2">
              Ready to Process
            </h2>
            <p className="text-sm text-slate-dim max-w-lg mx-auto leading-relaxed">
              Click <span className="text-cyan font-medium">View Live Feed</span> to
              launch parallel signal detection across 8 drug-event pairs. Each signal
              is queried against 20M+ FDA FAERS reports, scored with PRR/ROR/IC
              disproportionality analysis, and routed through 60 decision pipelines.
            </p>
            <div className="flex justify-center gap-6 mt-8 text-[10px] font-mono text-slate-dim/60">
              <span>8 drugs</span>
              <span>60 pipelines</span>
              <span>6 bridges</span>
              <span>391 micrograms</span>
            </div>
          </section>
        )}

        {/* ─── Signal Results ─── */}
        {signals.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-cyan" />
                <span className="text-sm font-medium text-slate-light">
                  Signal Detection
                </span>
                <span className="text-xs font-mono text-slate-dim">
                  {signals.length}/8
                </span>
              </div>
              {state === "streaming" && (
                <span className="flex items-center gap-1.5 text-[10px] text-cyan">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-pulse" />
                  streaming
                </span>
              )}
            </div>

            <div className="grid gap-2">
              {signals.map((s, i) => (
                <SignalCard key={`${s.drug}-${i}`} signal={s} index={i} />
              ))}
            </div>
          </section>
        )}

        {/* ─── Mesh Topology ─── */}
        {mesh && (
          <section className="rounded-xl border border-nex-border/50 bg-nex-surface/10 p-5">
            <div className="flex items-center gap-2 mb-4">
              <GitBranch className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-medium text-slate-light">
                Signal Mesh Topology
              </span>
              <span className="ml-auto text-[10px] font-mono text-slate-dim">
                {mesh.node_count} nodes · {mesh.edge_count} edges · {mesh.route_count} routes
              </span>
            </div>

            {/* Node grid */}
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-4">
              {mesh.nodes.map((node) => (
                <div
                  key={node.id}
                  className={`rounded-lg border p-3 text-center transition-all ${
                    node.id === "collector"
                      ? "border-cyan/30 bg-cyan/10"
                      : node.state === "signal"
                        ? "border-amber-400/30 bg-amber-400/5"
                        : "border-nex-border/30 bg-nex-surface/20"
                  }`}
                >
                  <div className={`text-xs font-mono font-medium truncate ${
                    node.id === "collector" ? "text-cyan" : node.state === "signal" ? "text-amber-400" : "text-slate-dim"
                  }`}>
                    {node.id}
                  </div>
                  <div className="text-[10px] text-slate-dim/60 mt-1">
                    {node.neighbor_count} links
                  </div>
                </div>
              ))}
            </div>

            {/* Edge list — compact */}
            <div className="flex flex-wrap gap-1.5">
              {mesh.edges.map((edge, i) => (
                <span
                  key={`${edge.from}-${edge.to}-${i}`}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono ${
                    edge.quality >= 0.9
                      ? "bg-emerald-400/10 text-emerald-400"
                      : edge.quality >= 0.7
                        ? "bg-amber-400/10 text-amber-400"
                        : "bg-nex-surface/30 text-slate-dim"
                  }`}
                >
                  {edge.from} → {edge.to}
                  <span className="opacity-60">{(edge.quality * 100).toFixed(0)}%</span>
                </span>
              ))}
            </div>

            <div className="mt-3 text-[10px] text-slate-dim/40 font-mono">
              Powered by nexcore-mesh · 14/16 T1 primitives · adaptive routing + gossip + resilience
            </div>
          </section>
        )}

        {/* ─── Batch Summary ─── */}
        {batch && (
          <section className="rounded-xl border border-cyan/20 bg-gradient-to-br from-cyan/5 to-transparent p-6">
            <div className="flex items-center gap-2 mb-5">
              <Shield className="h-5 w-5 text-cyan" />
              <h3 className="text-lg font-headline font-semibold text-gold">
                Batch Complete
              </h3>
              <span className="ml-auto text-xs font-mono text-slate-dim">
                {(elapsed / 1000).toFixed(1)}s total
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <BigStat label="Processed" value={String(batch.total)} />
              <BigStat label="Signals Detected" value={String(batch.signals)} highlight />
              <BigStat
                label="Detection Rate"
                value={`${Math.round((batch.signals / batch.total) * 100)}%`}
              />
              <BigStat label="Avg Latency" value={`${batch.avgLatencyMs}ms`} />
            </div>
            <p className="mt-5 text-xs text-slate-dim leading-relaxed">
              Each drug-event pair was queried against 20M+ FDA FAERS reports in parallel,
              scored with PRR/ROR/IC disproportionality, classified by harm taxonomy (A-H),
              and routed through the AlgoVigilance microgram decision pipeline.
            </p>
          </section>
        )}

        {/* ─── Architecture Footer ─── */}
        <footer className="rounded-xl border border-nex-border/20 bg-nex-surface/5 p-6">
          <h3 className="text-xs font-medium text-slate-dim/60 uppercase tracking-wider mb-3">
            How It Works
          </h3>
          <div className="font-mono text-[11px] text-slate-dim/40 mb-4">
            FDA FAERS (20M reports) → OpenVigil (disproportionality) → Microgram
            Triage (60 pipelines) → Action Route
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[10px] text-slate-dim/50">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan/40" />
              SSE streaming
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400/40" />
              Promise.all parallel
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/40" />
              60 pipelines + 6 bridges
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400/40" />
              391 micrograms
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400/40" />
              sub-100&micro;s per decision
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}

// ─── Sub-Components ──────────────────────────────────────────────────

function SignalCard({ signal, index }: { signal: SignalResult; index: number }) {
  const style = VERDICT_STYLES[signal.verdict] ?? VERDICT_STYLES.unavailable;
  const harm = HARM_LABELS[signal.harmType];

  return (
    <div
      className={`rounded-lg border ${style.border} ${style.bg} p-4 ${style.glow} transition-all duration-500`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {signal.signal ? (
              <AlertTriangle className={`h-4 w-4 ${style.text} flex-shrink-0`} />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            )}
            <span className="font-headline font-semibold text-white truncate">
              {signal.drug}
            </span>
            <ArrowRight className="h-3 w-3 text-nex-border flex-shrink-0" />
            <span className="text-slate-light truncate">{signal.event}</span>
          </div>

          {/* Metrics row */}
          <div className="flex flex-wrap gap-1.5">
            {signal.prr !== null && (
              <MetricChip label="PRR" value={signal.prr.toFixed(1)} hot={signal.prr >= 2} />
            )}
            {signal.ror !== null && (
              <MetricChip label="ROR" value={signal.ror.toFixed(1)} hot={signal.ror >= 2} />
            )}
            {signal.ic !== null && (
              <MetricChip label="IC" value={signal.ic.toFixed(2)} hot={signal.ic >= 0} />
            )}
            {signal.caseCount !== null && (
              <MetricChip label="N" value={signal.caseCount.toLocaleString()} hot={false} />
            )}
            {harm && (
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono bg-nex-surface/50 ${harm.color}`}>
                Type {signal.harmType} · {harm.label}
              </span>
            )}
          </div>
        </div>

        {/* Verdict + route */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className={`px-2 py-0.5 rounded border text-[10px] font-mono font-medium ${style.text} ${style.border} ${style.bg}`}>
            {signal.verdict.replace(/_/g, " ").toUpperCase()}
          </span>
          <span className="text-[10px] text-slate-dim flex items-center gap-1 font-mono">
            <Clock className="h-3 w-3" />
            {signal.latencyMs}ms
          </span>
          <span className="text-[10px] text-slate-dim/60 font-mono">
            → {signal.route.replace(/_/g, " ")}
          </span>
        </div>
      </div>
    </div>
  );
}

function PipelineStage({
  label,
  active,
  done,
}: {
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <span
      className={`px-3 py-1.5 rounded-md border transition-all duration-300 flex-shrink-0 ${
        done
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
          : active
            ? "border-cyan/30 bg-cyan/10 text-cyan animate-pulse"
            : "border-nex-border/30 bg-nex-surface/20 text-slate-dim/40"
      }`}
    >
      {label}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const ok = status === "ok";
  return (
    <span
      className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-mono ${
        ok ? "bg-emerald-400/10 text-emerald-400" : "bg-rose-400/10 text-rose-400"
      }`}
    >
      {status.toUpperCase()}
    </span>
  );
}

function MetricChip({
  label,
  value,
  hot,
}: {
  label: string;
  value: string;
  hot: boolean;
}) {
  return (
    <span
      className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
        hot ? "bg-amber-400/10 text-amber-400" : "bg-nex-surface/50 text-slate-dim"
      }`}
    >
      {label} {value}
    </span>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[10px] text-slate-dim/60 uppercase tracking-wider mb-1">
        {icon}
        {label}
      </div>
      <div className="text-sm font-mono text-white">{value}</div>
    </div>
  );
}

function BigStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-slate-dim mb-1">{label}</div>
      <div
        className={`text-2xl font-bold font-mono ${highlight ? "text-cyan" : "text-white"}`}
      >
        {value}
      </div>
    </div>
  );
}
