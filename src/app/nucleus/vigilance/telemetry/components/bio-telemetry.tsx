"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Cpu, RefreshCw, Loader2 } from "lucide-react";
import {
  classifyHealthTraffic,
  type HealthTrafficResult,
} from "@/lib/pv-compute";

interface Metric {
  label: string;
  value: string;
  unit: string;
  trend: "up" | "down" | "stable";
}

interface BioSystem {
  name: string;
  crate_name: string;
  biology: string;
  icon: string;
  color: string;
  mcp_tools: number;
  description: string;
  metrics: Metric[];
}

interface GuardianData {
  iteration: number;
  threat_level: string;
  signals: number;
  actions: number;
  sensors: number;
  actuators: number;
  duration_ms?: number;
  last_tick?: string;
}

const SYSTEMS: BioSystem[] = [
  {
    name: "Cytokine",
    crate_name: "nexcore-cytokine",
    biology: "Inter-cell signaling",
    icon: "\u{1F4E1}",
    color: "cyan",
    mcp_tools: 5,
    description:
      "Inter-crate event signaling system modeled on biological cytokines. Five families: IL (interleukin), TNF, IFN (interferon), TGF, CSF (colony-stimulating factor).",
    metrics: [],
  },
  {
    name: "Hormones",
    crate_name: "nexcore-hormones",
    biology: "System-wide config",
    icon: "\u{1F9EA}",
    color: "purple",
    mcp_tools: 4,
    description:
      "System-wide configuration propagation modeled on hormonal signaling. Six hormone types with exponential decay toward baseline values.",
    metrics: [],
  },
  {
    name: "Immunity",
    crate_name: "nexcore-immunity",
    biology: "Antipattern detection",
    icon: "\u{1F6E1}\u{FE0F}",
    color: "red",
    mcp_tools: 5,
    description:
      "PAMP (pathogen-associated molecular pattern) and DAMP (damage-associated) detection. Maintains an antibody registry for known antipatterns with adaptive learning.",
    metrics: [],
  },
  {
    name: "Energy",
    crate_name: "nexcore-energy",
    biology: "ATP/ADP token budget",
    icon: "\u{26A1}",
    color: "amber",
    mcp_tools: 4,
    description:
      "Token budget management via ATP/ADP energy model. EC = (ATP + 0.5*ADP) / total. Four metabolic regimes: anabolic, catabolic, balanced, starvation.",
    metrics: [],
  },
  {
    name: "Synapse",
    crate_name: "nexcore-synapse",
    biology: "Learning connections",
    icon: "\u{1F9E0}",
    color: "emerald",
    mcp_tools: 8,
    description:
      "Learning system with amplitude growth following Michaelis-Menten saturation kinetics. Synapses strengthen with repeated stimulation, decay without it.",
    metrics: [],
  },
  {
    name: "Transcriptase",
    crate_name: "nexcore-transcriptase",
    biology: "Schema inference",
    icon: "\u{1F52C}",
    color: "blue",
    mcp_tools: 4,
    description:
      "Reverse transcriptase: infers structured schemas from unstructured JSON data. Like biological RT converts RNA back to DNA, this converts data into type definitions.",
    metrics: [],
  },
  {
    name: "Ribosome",
    crate_name: "nexcore-ribosome",
    biology: "Schema-to-code gen",
    icon: "\u{1F3ED}",
    color: "orange",
    mcp_tools: 6,
    description:
      "Translates inferred schemas into executable Rust code. Detects drift between schema and generated code. Like biological ribosomes translate mRNA into proteins.",
    metrics: [],
  },
  {
    name: "Phenotype",
    crate_name: "nexcore-phenotype",
    biology: "Adversarial mutation",
    icon: "\u{1F9EC}",
    color: "rose",
    mcp_tools: 1,
    description:
      "Adversarial test generation via 7 mutation types: boundary, null injection, type coercion, overflow, encoding, timing, and state corruption.",
    metrics: [],
  },
];

const COLOR_MAP: Record<
  string,
  { border: string; text: string; borderHover: string }
> = {
  cyan: {
    border: "border-cyan-500/20",
    text: "text-cyan-400",
    borderHover: "hover:border-cyan-500/40",
  },
  purple: {
    border: "border-purple-500/20",
    text: "text-purple-400",
    borderHover: "hover:border-purple-500/40",
  },
  red: {
    border: "border-red-500/20",
    text: "text-red-400",
    borderHover: "hover:border-red-500/40",
  },
  amber: {
    border: "border-amber-500/20",
    text: "text-amber-400",
    borderHover: "hover:border-amber-500/40",
  },
  emerald: {
    border: "border-emerald-500/20",
    text: "text-emerald-400",
    borderHover: "hover:border-emerald-500/40",
  },
  blue: {
    border: "border-blue-500/20",
    text: "text-blue-400",
    borderHover: "hover:border-blue-500/40",
  },
  orange: {
    border: "border-orange-500/20",
    text: "text-orange-400",
    borderHover: "hover:border-orange-500/40",
  },
  rose: {
    border: "border-rose-500/20",
    text: "text-rose-400",
    borderHover: "hover:border-rose-500/40",
  },
};

function threatColor(level: string): string {
  switch (level.toLowerCase()) {
    case "critical":
      return "text-red-400";
    case "high":
      return "text-red-400";
    case "medium":
      return "text-amber-400";
    case "low":
      return "text-emerald-400";
    case "none":
      return "text-emerald-400";
    default:
      return "text-slate-dim/60";
  }
}

function threatBorder(level: string): string {
  switch (level.toLowerCase()) {
    case "critical":
    case "high":
      return "border-red-500/30";
    case "medium":
      return "border-amber-500/30";
    default:
      return "border-emerald-500/30";
  }
}

export function BioTelemetry() {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [guardian, setGuardian] = useState<GuardianData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const totalTools = SYSTEMS.reduce((s, sys) => s + sys.mcp_tools, 0);

  const fetchGuardian = useCallback(async () => {
    try {
      const res = await fetch("/api/nexcore/guardian");
      if (res.ok) {
        const data = await res.json();
        setGuardian({
          iteration: data.iteration ?? data.tick_count ?? 0,
          threat_level: data.threat_level ?? data.current_threat ?? "Unknown",
          signals: data.signals ?? data.signal_count ?? 0,
          actions: data.actions ?? data.action_count ?? 0,
          sensors: data.sensors ?? data.sensor_count ?? 0,
          actuators: data.actuators ?? data.actuator_count ?? 0,
          duration_ms: data.duration_ms ?? data.last_duration_ms,
          last_tick: data.last_tick ?? data.timestamp,
        });
        setError(null);
      } else {
        setError("Guardian API returned " + res.status);
      }
    } catch {
      setError("NexCore API unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerTick = useCallback(async () => {
    setLoading(true);
    try {
      // Sequential: tick must complete before refreshing state
      await fetch("/api/nexcore/guardian?action=tick", { method: "POST" }).then(
        (r) => {
          if (r.ok) return fetchGuardian();
          return undefined;
        },
      );
    } catch {
      setError("Tick failed");
    } finally {
      setLoading(false);
    }
  }, [fetchGuardian]);

  useEffect(() => {
    fetchGuardian();
  }, [fetchGuardian]);

  // pv-compute: classify Guardian health status into traffic level
  const healthTraffic: HealthTrafficResult = useMemo(
    () =>
      classifyHealthTraffic(
        guardian?.threat_level.toLowerCase() === "low" ||
          guardian?.threat_level.toLowerCase() === "none"
          ? "healthy"
          : guardian?.threat_level.toLowerCase() === "medium"
            ? "degraded"
            : "critical",
      ),
    [guardian?.threat_level],
  );

  const TRAFFIC_COLOR: Record<string, string> = {
    green: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    yellow: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    red: "text-red-400 border-red-500/30 bg-red-500/10",
  };

  const vitals = guardian
    ? [
        {
          label: "Threat Level",
          value: guardian.threat_level,
          color: threatColor(guardian.threat_level),
          border: threatBorder(guardian.threat_level),
        },
        {
          label: "Iteration",
          value: String(guardian.iteration),
          color: "text-cyan",
          border: "border-cyan/30",
        },
        {
          label: "Signals",
          value: String(guardian.signals),
          color: "text-white",
          border: "border-white/[0.12]",
        },
        {
          label: "Actions",
          value: String(guardian.actions),
          color: "text-white",
          border: "border-white/[0.12]",
        },
        {
          label: "Sensors",
          value: String(guardian.sensors),
          color: "text-emerald-400",
          border: "border-emerald-500/30",
        },
        {
          label: "Actuators",
          value: String(guardian.actuators),
          color: "text-emerald-400",
          border: "border-emerald-500/30",
        },
      ]
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header className="mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="intel-status-active" />
          <span className="intel-label">
            Biological Systems / Guardian Telemetry
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-headline mb-2 text-white tracking-tight">
          Biological Telemetry
        </h1>
        <p className="text-sm text-slate-dim/60 max-w-3xl mx-auto">
          Real-time health monitoring across 8 biological crates. Guardian
          homeostasis loop data from NexCore API.
        </p>
      </header>

      {error && (
        <div className="border border-amber-500/30 bg-amber-500/5 p-3 mb-6">
          <p className="text-amber-400/80 text-xs font-mono">
            {error} — showing system catalog only
          </p>
        </div>
      )}

      {/* Guardian vitals — live from API */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 text-cyan/40 animate-spin mr-2" />
            <span className="text-[10px] font-mono text-slate-dim/40">
              Fetching Guardian status...
            </span>
          </div>
        ) : (
          vitals.map((v) => (
            <div
              key={v.label}
              className={`border bg-white/[0.06] p-3 ${v.border}`}
            >
              <p className="text-[8px] font-bold text-slate-dim/40 uppercase tracking-widest">
                {v.label}
              </p>
              <p
                className={`text-sm font-extrabold font-mono mt-0.5 ${v.color}`}
              >
                {v.value}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Control bar */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-6">
          <span className="text-[9px] font-bold text-slate-dim/40 font-mono uppercase">
            8 Bio Crates
          </span>
          <span className="text-[9px] text-slate-dim/30 font-mono">
            {totalTools} MCP Tools
          </span>
          {guardian && (
            <span
              className={`text-[9px] font-mono ${guardian.threat_level.toLowerCase() === "low" || guardian.threat_level.toLowerCase() === "none" ? "text-emerald-400/60" : "text-amber-400/60"}`}
            >
              {guardian.threat_level.toLowerCase() === "low" ||
              guardian.threat_level.toLowerCase() === "none"
                ? "ALL SYSTEMS OPERATIONAL"
                : `THREAT: ${guardian.threat_level.toUpperCase()}`}
            </span>
          )}
        </div>
        <button
          onClick={triggerTick}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-white/[0.08] text-[9px] font-mono text-slate-dim/40 hover:text-cyan hover:border-cyan/30 transition-all"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Tick
        </button>
      </div>

      {/* System grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {SYSTEMS.map((sys, idx) => {
          const c = COLOR_MAP[sys.color] || COLOR_MAP.cyan;
          return (
            <button
              key={sys.name}
              onClick={() => setSelectedIdx(selectedIdx === idx ? null : idx)}
              className={`border bg-white/[0.06] p-4 text-left transition-all ${c.border} ${c.borderHover}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{sys.icon}</span>
                  <span
                    className={`text-sm font-extrabold font-mono ${c.text}`}
                  >
                    {sys.name}
                  </span>
                </div>
                <span className="text-[8px] font-bold text-emerald-400/60 bg-emerald-500/10 px-1.5 py-0.5 border border-emerald-500/20">
                  ACTIVE
                </span>
              </div>
              <p className="text-[10px] text-slate-dim/50 mb-2">
                {sys.biology}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-mono text-slate-dim/30">
                  {sys.crate_name}
                </span>
                <span className="text-[8px] font-mono text-slate-dim/40">
                  {sys.mcp_tools} tools
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detail panel */}
      {selectedIdx !== null &&
        (() => {
          const sys = SYSTEMS[selectedIdx];
          const c = COLOR_MAP[sys.color] || COLOR_MAP.cyan;
          return (
            <div
              className={`border bg-white/[0.06] p-6 mb-8 ${c.border.replace("/20", "/30")}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className={`text-lg font-extrabold font-mono ${c.text}`}>
                    {sys.icon} {sys.name}
                  </h2>
                  <p className="text-[10px] text-slate-dim/40 font-mono">
                    {sys.crate_name} &bull; {sys.mcp_tools} MCP tools
                  </p>
                </div>
                <button
                  onClick={() => setSelectedIdx(null)}
                  className="text-slate-dim/40 hover:text-white text-xs font-mono"
                >
                  &times; Close
                </button>
              </div>
              <p className="text-xs text-slate-dim/50 leading-relaxed mb-4">
                {sys.description}
              </p>
              <div className="border border-white/[0.08] bg-black/20 p-4">
                <p className="text-[9px] font-mono text-slate-dim/30 uppercase tracking-widest mb-2">
                  Subsystem Details
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div>
                    <span className="text-slate-dim/40">Biology:</span>{" "}
                    <span className="text-white">{sys.biology}</span>
                  </div>
                  <div>
                    <span className="text-slate-dim/40">Crate:</span>{" "}
                    <span className="text-white">{sys.crate_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-dim/40">MCP Tools:</span>{" "}
                    <span className="text-white">{sys.mcp_tools}</span>
                  </div>
                  <div>
                    <span className="text-slate-dim/40">Status:</span>{" "}
                    <span className="text-emerald-400">Registered</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      {/* Guardian tick log */}
      {guardian && (
        <div className="border border-white/[0.12] bg-white/[0.06]">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
            <Cpu className="h-3.5 w-3.5 text-cyan/60" />
            <span className="intel-label">Guardian Homeostasis Status</span>
            <div className="h-px flex-1 bg-white/[0.06]" />
            <span className="text-[8px] font-mono text-slate-dim/30">
              via NexCore API
            </span>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border border-white/[0.08] bg-black/20 p-3">
                <p className="text-[8px] text-slate-dim/30 uppercase tracking-widest">
                  Threat Level
                </p>
                <p
                  className={`text-lg font-extrabold font-mono ${threatColor(guardian.threat_level)}`}
                >
                  {guardian.threat_level.toUpperCase()}
                </p>
              </div>
              <div className="border border-white/[0.08] bg-black/20 p-3">
                <p className="text-[8px] text-slate-dim/30 uppercase tracking-widest">
                  Iteration
                </p>
                <p className="text-lg font-extrabold font-mono text-white tabular-nums">
                  {guardian.iteration}
                </p>
              </div>
              <div className="border border-white/[0.08] bg-black/20 p-3">
                <p className="text-[8px] text-slate-dim/30 uppercase tracking-widest">
                  Signals / Actions
                </p>
                <p className="text-lg font-extrabold font-mono text-white tabular-nums">
                  {guardian.signals} / {guardian.actions}
                </p>
              </div>
              <div className="border border-white/[0.08] bg-black/20 p-3">
                <p className="text-[8px] text-slate-dim/30 uppercase tracking-widest">
                  Sensors / Actuators
                </p>
                <p className="text-lg font-extrabold font-mono text-white tabular-nums">
                  {guardian.sensors} / {guardian.actuators}
                </p>
              </div>
            </div>
            {/* pv-compute: system health traffic classification */}
            <div className="flex items-center justify-center gap-3 mt-4">
              <span
                className={`px-3 py-1 border font-mono text-[10px] font-bold uppercase tracking-widest ${TRAFFIC_COLOR[healthTraffic.trafficLevel] ?? "text-white border-white/[0.12]"}`}
              >
                {healthTraffic.trafficLevel}
              </span>
              <span className="text-[9px] font-mono text-slate-dim/40">
                pv-compute · health traffic classification
              </span>
            </div>
            {guardian.duration_ms !== undefined && (
              <p className="text-[9px] font-mono text-slate-dim/30 mt-3 text-center">
                Last tick: {guardian.duration_ms}ms
                {guardian.last_tick && ` at ${guardian.last_tick}`}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
