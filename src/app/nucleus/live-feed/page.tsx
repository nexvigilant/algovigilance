"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { MetricsDashboard } from "@/components/god/metrics-dashboard";

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

interface LiveFrame {
  type: "health" | "signal" | "batch_complete";
  timestamp: string;
  station?: StationData;
  signal?: SignalResult;
  batch?: BatchSummary;
}

function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  return `${hours}h ${minutes}m`;
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "ok"
      ? "bg-emerald-400 shadow-emerald-400/50"
      : status === "degraded"
        ? "bg-amber-400 shadow-amber-400/50"
        : "bg-red-400 shadow-red-400/50";
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${color} shadow-lg animate-pulse`}
    />
  );
}

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 backdrop-blur-sm">
      <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold text-white font-mono tabular-nums">
        {value}
      </div>
      {sub && <div className="mt-0.5 text-xs text-zinc-500">{sub}</div>}
    </div>
  );
}

function PulseBar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
      <div
        className={`h-full rounded-full ${color} transition-all duration-1000 ease-out`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function SignalRow({ result }: { result: SignalResult }) {
  const verdictColors: Record<string, string> = {
    strong_signal: "text-red-400 bg-red-900/20 border-red-800/40",
    signal_detected: "text-amber-400 bg-amber-900/20 border-amber-800/40",
    idiosyncratic_signal: "text-violet-400 bg-violet-900/20 border-violet-800/40",
    no_signal: "text-zinc-500 bg-zinc-900/20 border-zinc-800/40",
    unavailable: "text-zinc-600 bg-zinc-900/20 border-zinc-800/40",
    timeout: "text-zinc-600 bg-zinc-900/20 border-zinc-800/40",
  };

  const cls = verdictColors[result.verdict] ?? verdictColors.no_signal;

  return (
    <div
      className={`flex items-center gap-4 rounded-lg border p-3 ${cls} animate-in fade-in slide-in-from-left-2 duration-500`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{result.drug}</span>
          <span className="text-zinc-600">&rarr;</span>
          <span className="text-sm truncate">{result.event}</span>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs font-mono shrink-0">
        {result.prr !== null && (
          <span>
            PRR:{" "}
            <span className={result.signal ? "text-white" : ""}>
              {result.prr.toFixed(1)}
            </span>
          </span>
        )}
        {result.caseCount !== null && (
          <span className="text-zinc-500">
            n={result.caseCount.toLocaleString()}
          </span>
        )}
        <span className="text-zinc-600">{result.latencyMs}ms</span>
        <span
          className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${
            result.signal
              ? "bg-red-900/30 text-red-300"
              : "bg-zinc-800 text-zinc-500"
          }`}
        >
          {result.verdict.replace(/_/g, " ")}
        </span>
      </div>
    </div>
  );
}

interface GodDomainState {
  score: number;
  status: "pending" | "streaming" | "complete";
  invariants: string[];
  dimensions: Record<string, unknown>;
  duration_ms: number;
}

const GOD_DOMAINS = ["mcg", "rust", "station", "brain"] as const;
type GodDomain = (typeof GOD_DOMAINS)[number];

const GOD_COLORS: Record<GodDomain, { border: string; text: string; bg: string; ring: string }> = {
  mcg: { border: "border-cyan-800/40", text: "text-cyan-400", bg: "bg-cyan-950/20", ring: "stroke-cyan-400" },
  rust: { border: "border-orange-800/40", text: "text-orange-400", bg: "bg-orange-950/20", ring: "stroke-orange-400" },
  station: { border: "border-emerald-800/40", text: "text-emerald-400", bg: "bg-emerald-950/20", ring: "stroke-emerald-400" },
  brain: { border: "border-violet-800/40", text: "text-violet-400", bg: "bg-violet-950/20", ring: "stroke-violet-400" },
};

const GOD_LABELS: Record<GodDomain, string> = {
  mcg: "Micrograms",
  rust: "NexCore",
  station: "Station",
  brain: "Infrastructure",
};

function GodScoreRing({ score, domain }: { score: number; domain: GodDomain }) {
  const radius = 24;
  const size = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const ringColor = GOD_COLORS[domain].ring;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={3} className="text-zinc-800" />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={3} strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        className={`${ringColor} transition-all duration-1000 ease-out`} />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        className="fill-white text-xs font-mono font-bold transform rotate-90"
        style={{ transformOrigin: `${size / 2}px ${size / 2}px` }}>
        {score}
      </text>
    </svg>
  );
}

export default function LiveFeedPage() {
  const [station, setStation] = useState<StationData | null>(null);
  const [signals, setSignals] = useState<SignalResult[]>([]);
  const [batch, setBatch] = useState<BatchSummary | null>(null);
  const [connected, setConnected] = useState(false);
  const [tick, setTick] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  // GoD state
  const [godDomains, setGodDomains] = useState<Record<string, GodDomainState>>({});
  const [godComposite, setGodComposite] = useState<number | null>(null);
  const [godStreaming, setGodStreaming] = useState(false);
  const godSourceRef = useRef<EventSource | null>(null);

  const handleFrame = useCallback((frame: LiveFrame) => {
    setTick((t) => t + 1);

    if (frame.type === "health" && frame.station) {
      setStation(frame.station);
    } else if (frame.type === "signal" && frame.signal) {
      setSignals((prev) => [...prev, frame.signal!]);
    } else if (frame.type === "batch_complete" && frame.batch) {
      setBatch(frame.batch);
    }
  }, []);

  // Signal feed SSE
  useEffect(() => {
    const es = new EventSource("/api/live-feed");
    eventSourceRef.current = es;

    es.onopen = () => setConnected(true);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as LiveFrame;
        handleFrame(data);
      } catch {
        // ignore
      }
    };

    es.onerror = () => setConnected(false);

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [handleFrame]);

  // GoD feed SSE
  useEffect(() => {
    setGodStreaming(true);
    const es = new EventSource("/api/god/stream");
    godSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const evt = JSON.parse(event.data) as {
          domain: string;
          mode: string;
          data: Record<string, unknown>;
          duration_ms: number;
        };

        if (evt.mode === "claim" && !("phase" in evt.data)) {
          setGodDomains((prev) => ({
            ...prev,
            [evt.domain]: {
              score: prev[evt.domain]?.score ?? 0,
              status: "streaming",
              invariants: Array.isArray(evt.data.invariants) ? (evt.data.invariants as string[]) : [],
              dimensions: prev[evt.domain]?.dimensions ?? {},
              duration_ms: evt.duration_ms,
            },
          }));
        } else if (evt.mode === "feed") {
          if ((evt.data as { phase?: string }).phase === "complete") {
            setGodComposite((evt.data as { composite?: number }).composite ?? null);
            setGodStreaming(false);
          } else {
            setGodDomains((prev) => ({
              ...prev,
              [evt.domain]: {
                ...prev[evt.domain],
                score: (evt.data as { score?: number }).score ?? 0,
                status: "streaming",
                invariants: prev[evt.domain]?.invariants ?? [],
                dimensions: prev[evt.domain]?.dimensions ?? {},
                duration_ms: evt.duration_ms,
              },
            }));
          }
        } else if (evt.mode === "report") {
          setGodDomains((prev) => ({
            ...prev,
            [evt.domain]: {
              score: (evt.data as { score?: number }).score ?? prev[evt.domain]?.score ?? 0,
              status: "complete",
              invariants: prev[evt.domain]?.invariants ?? [],
              dimensions: (evt.data as { dimensions?: Record<string, unknown> }).dimensions ?? {},
              duration_ms: evt.duration_ms,
            },
          }));
        }
      } catch {
        // skip
      }
    };

    es.onerror = () => {
      setGodStreaming(false);
      es.close();
    };

    return () => {
      es.close();
      godSourceRef.current = null;
    };
  }, []);

  const signalCount = signals.filter((s) => s.signal).length;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-zinc-400 hover:text-white transition-colors text-sm"
            >
              &larr; Home
            </Link>
            <div className="h-4 w-px bg-zinc-700" />
            <h1 className="text-lg font-semibold tracking-tight">
              Live Feed
            </h1>
            <span className="font-mono text-xs text-zinc-500">
              mcp.nexvigilant.com
            </span>
          </div>
          <div className="flex items-center gap-3">
            <StatusDot status={station?.status ?? "unknown"} />
            <span className="text-xs font-mono text-zinc-400">
              {connected ? "STREAMING" : "CONNECTING..."}
            </span>
            <span className="text-xs font-mono text-zinc-600">
              tick #{tick}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* Station Health */}
        <div className="rounded-xl border border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-950 p-6">
          <div className="flex items-center gap-3 mb-4">
            <StatusDot status={station?.status ?? "unknown"} />
            <h2 className="text-sm font-mono uppercase tracking-wider text-zinc-400">
              Station Health
            </h2>
            <span className="ml-auto text-xs font-mono text-zinc-600">
              {station ? "LIVE" : "LOADING..."}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <MetricCard
              label="Status"
              value={station?.status?.toUpperCase() ?? "---"}
            />
            <MetricCard
              label="Tools"
              value={station?.tools ?? 0}
              sub={`${station?.configs ?? 0} configs`}
            />
            <MetricCard
              label="Total Calls"
              value={station?.calls ?? 0}
              sub={`${(station?.callsPerMinute ?? 0).toFixed(1)}/min`}
            />
            <MetricCard
              label="Uptime"
              value={formatUptime(station?.uptime ?? 0)}
            />
            <MetricCard
              label="P99 Latency"
              value={`${station?.latencyP99 ?? 0}ms`}
            />
            <MetricCard
              label="Error Rate"
              value={`${(station?.errorRate ?? 0).toFixed(1)}%`}
              sub={station?.trend ?? "---"}
            />
          </div>
        </div>

        {/* Parallel Signal Processing */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-mono uppercase tracking-wider text-zinc-400">
              Parallel Signal Processing
            </h2>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-zinc-500">
                {signals.length}/8 complete
              </span>
              {signalCount > 0 && (
                <span className="text-red-400">
                  {signalCount} signal{signalCount > 1 ? "s" : ""} detected
                </span>
              )}
              {batch && (
                <span className="text-emerald-400">
                  avg {batch.avgLatencyMs}ms
                </span>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <PulseBar
              value={signals.length}
              max={8}
              color={
                signals.length === 8 ? "bg-emerald-500" : "bg-cyan-500"
              }
            />
          </div>

          {/* Signal results streaming in */}
          <div className="space-y-2">
            {signals.length === 0 && (
              <div className="text-zinc-600 text-sm py-4 text-center">
                Processing 8 drug-event pairs in parallel...
              </div>
            )}
            {signals.map((sig, i) => (
              <SignalRow key={`${sig.drug}-${sig.event}-${i}`} result={sig} />
            ))}
          </div>

          {/* Batch summary */}
          {batch && (
            <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400">
                Batch complete: {batch.completed}/{batch.total} processed
              </span>
              <span className="text-zinc-500">
                {batch.signals} signals | avg {batch.avgLatencyMs}ms | source:
                OpenVigil (20M+ FAERS)
              </span>
            </div>
          )}
        </div>

        {/* Infrastructure */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-4">
              Infrastructure
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-400">Station Tools</span>
                  <span className="font-mono text-white">
                    {station?.tools ?? 0}
                  </span>
                </div>
                <PulseBar
                  value={station?.tools ?? 0}
                  max={500}
                  color="bg-amber-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-400">Micrograms</span>
                  <span className="font-mono text-white">705+</span>
                </div>
                <PulseBar value={705} max={1000} color="bg-cyan-500" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-400">Decision Chains</span>
                  <span className="font-mono text-white">23</span>
                </div>
                <PulseBar value={23} max={50} color="bg-emerald-500" />
              </div>
            </div>
          </div>

          {/* Conservation Law */}
          <div className="rounded-xl border border-cyan-900/30 bg-gradient-to-r from-cyan-950/20 to-zinc-950 p-6">
            <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-500 mb-3">
              Conservation Law
            </h3>
            <div className="font-mono text-2xl text-cyan-300 mb-4">
              ∃ = ∂(×(ς, ∅))
            </div>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Safety knowledge (∃) is produced by applying detection thresholds
              (∂) to the product of accumulated state (ς) and structured absence
              (∅).
            </p>
            <p className="text-sm text-zinc-500 mt-2">
              This station processes the equation in real time across{" "}
              <span className="text-cyan-400 font-mono">
                {station?.tools ?? 0}
              </span>{" "}
              tools spanning FDA, EMA, WHO, PubMed, and ClinicalTrials.gov.
            </p>
          </div>
        </div>

        {/* Domain Governors (GoD) — Live SSE */}
        <div className="rounded-xl border border-violet-900/30 bg-gradient-to-r from-violet-950/10 to-zinc-950 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-mono uppercase tracking-wider text-violet-400">
                Governors over Domains
              </h2>
              {godComposite !== null && (
                <span className="font-mono text-lg font-bold text-violet-300">
                  {godComposite}/100
                </span>
              )}
              {godStreaming && (
                <span className="text-[10px] font-mono text-violet-400 bg-violet-900/30 px-2 py-0.5 rounded animate-pulse">
                  STREAMING
                </span>
              )}
            </div>
            <span className="text-[10px] font-mono text-zinc-600">
              {Object.values(godDomains).filter((d) => d.status === "complete").length}/{GOD_DOMAINS.length} complete
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {GOD_DOMAINS.map((domain) => {
              const state = godDomains[domain];
              const colors = GOD_COLORS[domain];
              const label = GOD_LABELS[domain];
              const score = state?.score ?? 0;
              const status = state?.status ?? "pending";

              return (
                <div
                  key={domain}
                  className={`rounded-lg border ${colors.border} ${colors.bg} p-3 transition-all duration-300 ${
                    status === "streaming" ? "animate-pulse" : ""
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <GodScoreRing score={score} domain={domain} />
                    <div className="text-center">
                      <div className="text-xs font-medium text-white">{label}</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">
                        {status === "complete" && state
                          ? `${state.invariants.length} inv / ${state.duration_ms}ms`
                          : status === "streaming"
                            ? "streaming..."
                            : "waiting"}
                      </div>
                    </div>
                  </div>
                  {status === "complete" && state && Object.keys(state.dimensions).length > 0 && (
                    <div className="mt-2 pt-2 border-t border-zinc-800/50 space-y-0.5">
                      {Object.entries(state.dimensions)
                        .filter(([k]) => !k.includes("target") && typeof state.dimensions[k] === "number")
                        .slice(0, 3)
                        .map(([key, val]) => (
                          <div key={key} className="flex justify-between text-[10px] font-mono">
                            <span className="text-zinc-600">{key.replace(/_/g, " ")}</span>
                            <span className="text-zinc-400">
                              {typeof val === "number" ? val.toLocaleString() : String(val)}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* System Metrics — streamed from brain.db */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
          <MetricsDashboard />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-zinc-600 font-mono">
          <span>
            git: {station?.gitSha ?? "---"} | protocol: MCP 2025-03-26 |
            transport: Streamable HTTP + SSE + LiveBus
          </span>
          <span>3 SSE streams / 10 metric channels</span>
        </div>
      </div>
    </div>
  );
}
