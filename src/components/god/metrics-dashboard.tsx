"use client";

import { useEffect, useRef, useState } from "react";

interface MetricsState {
  sessions: {
    total: number;
    last_24h: number;
    model_verdicts: number;
    sigma_pct: number;
    recent_20_verdicts: number;
  } | null;
  tools: {
    total_calls: number;
    success_rate_pct: number;
    top_tools: Array<{ tool_name: string; total_calls: number; success_count: number; failure_count: number }>;
  } | null;
  tests: {
    total_passed: number;
    total_failed: number;
    pass_rate_pct: number;
  } | null;
  knowledge: {
    beliefs: number;
    patterns: number;
    active_corrections: number;
    antibodies: number;
    artifacts: number;
    trust_domains: number;
  } | null;
  flywheel: {
    current: Record<string, number>;
    trend: number[];
  } | null;
  infrastructure: {
    hooks: number;
    skills: number;
    agents: number;
    micrograms: number;
  } | null;
  conservation: {
    boundary_pct: number;
    void_pct: number;
    existence_pct: number;
    sigma_pct: number;
  } | null;
  tokens: {
    total_actions: number;
    total_tokens: number;
    tokens_per_action: number;
  } | null;
  decisions: {
    total: number;
    high_risk: number;
    medium_risk: number;
  } | null;
  velocity: {
    recent: Array<{ session_band: string; momentum: string; commits: number; files_modified: number }>;
  } | null;
}

function MetricCard({ label, value, sub, color = "text-white" }: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
      <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{label}</div>
      <div className={`mt-0.5 text-xl font-bold font-mono tabular-nums ${color}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {sub && <div className="mt-0.5 text-[10px] text-zinc-600">{sub}</div>}
    </div>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="h-1 w-full rounded-full bg-zinc-800 overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all duration-1000`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function SparkLine({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const w = 120;
  const h = 32;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={w} height={h} className="inline-block">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" className={color} />
    </svg>
  );
}

export function MetricsDashboard() {
  const [metrics, setMetrics] = useState<MetricsState>({
    sessions: null, tools: null, tests: null, knowledge: null,
    flywheel: null, infrastructure: null, conservation: null,
    tokens: null, decisions: null, velocity: null,
  });
  const [streaming, setStreaming] = useState(false);
  const [eventCount, setEventCount] = useState(0);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    setStreaming(true);
    const es = new EventSource("/api/metrics");
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as { type: string; data: Record<string, unknown> };
        setEventCount((c) => c + 1);

        const t = event.type;
        const d = event.data;

        if (t === "metrics.sessions") setMetrics((m) => ({ ...m, sessions: d as MetricsState["sessions"] }));
        else if (t === "metrics.tools") setMetrics((m) => ({ ...m, tools: d as MetricsState["tools"] }));
        else if (t === "metrics.tests") setMetrics((m) => ({ ...m, tests: d as MetricsState["tests"] }));
        else if (t === "metrics.knowledge") setMetrics((m) => ({ ...m, knowledge: d as MetricsState["knowledge"] }));
        else if (t === "metrics.flywheel") setMetrics((m) => ({ ...m, flywheel: d as MetricsState["flywheel"] }));
        else if (t === "metrics.infrastructure") setMetrics((m) => ({ ...m, infrastructure: d as MetricsState["infrastructure"] }));
        else if (t === "metrics.conservation") setMetrics((m) => ({ ...m, conservation: d as MetricsState["conservation"] }));
        else if (t === "metrics.tokens") setMetrics((m) => ({ ...m, tokens: d as MetricsState["tokens"] }));
        else if (t === "metrics.decisions") setMetrics((m) => ({ ...m, decisions: d as MetricsState["decisions"] }));
        else if (t === "metrics.velocity") setMetrics((m) => ({ ...m, velocity: d as MetricsState["velocity"] }));
        else if (t === "metrics.complete") setStreaming(false);
      } catch { /* skip */ }
    };

    es.onerror = () => { setStreaming(false); es.close(); };
    return () => { es.close(); esRef.current = null; };
  }, []);

  const { sessions, tools, tests, knowledge, flywheel, infrastructure, conservation, tokens, decisions } = metrics;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-mono uppercase tracking-wider text-zinc-400">System Metrics</h2>
          {streaming && (
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-900/30 px-2 py-0.5 rounded animate-pulse">
              {eventCount}/10
            </span>
          )}
        </div>
        {flywheel?.trend && <SparkLine values={flywheel.trend} color="text-cyan-400" />}
      </div>

      {/* Row 1: Sessions + Conservation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        <MetricCard label="Sessions" value={sessions?.total ?? "..."} sub={`${sessions?.last_24h ?? 0} / 24h`} />
        <MetricCard label="Model Verdicts" value={sessions?.model_verdicts ?? "..."} sub={`ς = ${sessions?.sigma_pct ?? 0}%`} color="text-cyan-400" />
        <MetricCard label="Tool Calls" value={tools?.total_calls ?? "..."} sub={`${tools?.success_rate_pct ?? 0}% success`} />
        <MetricCard label="Tests" value={`${tests?.total_passed ?? 0}/${(tests?.total_passed ?? 0) + (tests?.total_failed ?? 0)}`} sub={`${tests?.pass_rate_pct ?? 0}% pass`} color="text-emerald-400" />
        <MetricCard label="Tokens/Action" value={tokens?.tokens_per_action ?? "..."} sub={`${(tokens?.total_tokens ?? 0).toLocaleString()} total`} />
        <MetricCard label="Decisions" value={decisions?.total ?? "..."} sub={`${decisions?.high_risk ?? 0} high risk`} />
      </div>

      {/* Row 2: Conservation Law */}
      {conservation && (
        <div className="rounded-lg border border-cyan-900/30 bg-cyan-950/10 p-3">
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-cyan-500">∃ = ∂(×(ς, ∅))</span>
            <div className="flex-1 grid grid-cols-4 gap-3">
              <div>
                <span className="text-zinc-500">∂ </span>
                <span className="text-white">{conservation.boundary_pct}%</span>
                <MiniBar value={conservation.boundary_pct} max={100} color="bg-cyan-500" />
              </div>
              <div>
                <span className="text-zinc-500">∅ </span>
                <span className="text-white">{conservation.void_pct}%</span>
                <MiniBar value={conservation.void_pct} max={100} color="bg-violet-500" />
              </div>
              <div>
                <span className="text-zinc-500">ς </span>
                <span className="text-white">{conservation.sigma_pct}%</span>
                <MiniBar value={conservation.sigma_pct} max={100} color="bg-amber-500" />
              </div>
              <div>
                <span className="text-zinc-500">∃ </span>
                <span className="text-white">{conservation.existence_pct}%</span>
                <MiniBar value={conservation.existence_pct} max={100} color="bg-emerald-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Row 3: Flywheel + Infrastructure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Flywheel */}
        {flywheel?.current && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Flywheel</span>
              <span className="text-lg font-bold font-mono text-cyan-400">
                {flywheel.current.score ?? 0}/100
              </span>
            </div>
            <div className="space-y-1.5">
              {(["rim", "momentum", "friction", "gyro", "elastic"] as const).map((dim) => {
                const val = Number(flywheel.current[dim]) || 0;
                const colors: Record<string, string> = {
                  rim: "bg-orange-500", momentum: "bg-cyan-500", friction: "bg-amber-500",
                  gyro: "bg-violet-500", elastic: "bg-emerald-500",
                };
                return (
                  <div key={dim}>
                    <div className="flex justify-between text-[10px] font-mono mb-0.5">
                      <span className="text-zinc-500">{dim}</span>
                      <span className="text-zinc-400">{val}/20</span>
                    </div>
                    <MiniBar value={val} max={20} color={colors[dim] ?? "bg-zinc-500"} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Infrastructure + Knowledge */}
        <div className="space-y-3">
          {infrastructure && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Infrastructure</span>
              <div className="grid grid-cols-4 gap-2 mt-2">
                <div className="text-center">
                  <div className="text-base font-bold font-mono text-orange-400">{infrastructure.hooks}</div>
                  <div className="text-[9px] text-zinc-600">hooks</div>
                </div>
                <div className="text-center">
                  <div className="text-base font-bold font-mono text-cyan-400">{infrastructure.skills}</div>
                  <div className="text-[9px] text-zinc-600">skills</div>
                </div>
                <div className="text-center">
                  <div className="text-base font-bold font-mono text-violet-400">{infrastructure.agents}</div>
                  <div className="text-[9px] text-zinc-600">agents</div>
                </div>
                <div className="text-center">
                  <div className="text-base font-bold font-mono text-emerald-400">{infrastructure.micrograms}</div>
                  <div className="text-[9px] text-zinc-600">mcg</div>
                </div>
              </div>
            </div>
          )}

          {knowledge && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Knowledge</span>
              <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                <div>
                  <div className="text-sm font-bold font-mono text-white">{knowledge.beliefs}</div>
                  <div className="text-[9px] text-zinc-600">beliefs</div>
                </div>
                <div>
                  <div className="text-sm font-bold font-mono text-white">{knowledge.patterns}</div>
                  <div className="text-[9px] text-zinc-600">patterns</div>
                </div>
                <div>
                  <div className="text-sm font-bold font-mono text-white">{knowledge.artifacts}</div>
                  <div className="text-[9px] text-zinc-600">artifacts</div>
                </div>
                <div>
                  <div className="text-sm font-bold font-mono text-white">{knowledge.active_corrections}</div>
                  <div className="text-[9px] text-zinc-600">corrections</div>
                </div>
                <div>
                  <div className="text-sm font-bold font-mono text-white">{knowledge.antibodies}</div>
                  <div className="text-[9px] text-zinc-600">antibodies</div>
                </div>
                <div>
                  <div className="text-sm font-bold font-mono text-white">{knowledge.trust_domains}</div>
                  <div className="text-[9px] text-zinc-600">trust</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 4: Top Tools */}
      {tools?.top_tools && tools.top_tools.length > 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Top Tools</span>
          <div className="mt-2 space-y-1">
            {tools.top_tools.slice(0, 8).map((tool) => {
              const total = Number(tool.total_calls) || 0;
              const success = Number(tool.success_count) || 0;
              const rate = total > 0 ? Math.round((success * 100) / total) : 0;
              return (
                <div key={tool.tool_name} className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="w-20 text-zinc-400 truncate">{tool.tool_name}</span>
                  <div className="flex-1"><MiniBar value={total} max={50000} color={rate > 80 ? "bg-emerald-500" : "bg-amber-500"} /></div>
                  <span className="text-zinc-500 w-14 text-right">{total.toLocaleString()}</span>
                  <span className={`w-10 text-right ${rate > 80 ? "text-emerald-400" : "text-amber-400"}`}>{rate}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
