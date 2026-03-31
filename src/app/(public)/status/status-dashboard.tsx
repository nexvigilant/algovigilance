"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  Activity,
  Server,
  Bot,
  ShieldCheck,
  Globe,
  Zap,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────

type ServiceStatus = "operational" | "degraded" | "down" | "checking";

interface ServiceCheck {
  name: string;
  description: string;
  icon: React.ReactNode;
  status: ServiceStatus;
  latency: number | null;
  lastChecked: Date | null;
  detail: string;
}

interface StationHealth {
  status: string;
  tools: number;
  configs: number;
  telemetry: {
    uptime_seconds: number;
    error_rate_pct: number;
    calls_per_minute: number;
    slo_status: string;
    latency_p99_ms: number;
    total_calls: number;
    degraded_domains: string[];
  };
  version: string;
}

interface TickHistory {
  timestamp: Date;
  allOperational: boolean;
  services: { name: string; status: ServiceStatus }[];
}

// ─── Constants ──────────────────────────────────────────────────────────

const TICK_INTERVAL = 30_000; // 30 seconds
const MAX_HISTORY = 60; // Last 30 minutes of ticks

const STATION_URL = "https://mcp.nexvigilant.com";
const SITE_URL = "https://www.nexvigilant.com";

// ─── Helpers ────────────────────────────────────────────────────────────

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatLatency(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function statusIcon(status: ServiceStatus) {
  switch (status) {
    case "operational":
      return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    case "degraded":
      return <AlertTriangle className="h-4 w-4 text-amber-400" />;
    case "down":
      return <XCircle className="h-4 w-4 text-red-400" />;
    case "checking":
      return <RefreshCw className="h-4 w-4 text-slate-dim animate-spin" />;
  }
}

function statusLabel(status: ServiceStatus) {
  switch (status) {
    case "operational":
      return "Operational";
    case "degraded":
      return "Degraded";
    case "down":
      return "Down";
    case "checking":
      return "Checking...";
  }
}

function statusColor(status: ServiceStatus) {
  switch (status) {
    case "operational":
      return "text-emerald-400";
    case "degraded":
      return "text-amber-400";
    case "down":
      return "text-red-400";
    case "checking":
      return "text-slate-dim";
  }
}

// ─── Check Functions ────────────────────────────────────────────────────

async function checkStation(): Promise<
  Partial<ServiceCheck> & { health?: StationHealth }
> {
  const start = performance.now();
  try {
    const res = await fetch(`${STATION_URL}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const latency = Math.round(performance.now() - start);

    if (!res.ok) {
      return { status: "down", latency, detail: `HTTP ${res.status}` };
    }

    const data: StationHealth = await res.json();
    const hasErrors = data.telemetry.error_rate_pct > 5;
    const hasDegraded = data.telemetry.degraded_domains.length > 0;

    return {
      status: hasErrors || hasDegraded ? "degraded" : "operational",
      latency,
      detail: `${data.tools} tools | ${formatUptime(data.telemetry.uptime_seconds)} uptime | ${data.telemetry.calls_per_minute.toFixed(1)} calls/min`,
      health: data,
    };
  } catch {
    return {
      status: "down",
      latency: Math.round(performance.now() - start),
      detail: "Connection failed",
    };
  }
}

async function checkEndpoint(
  url: string,
  label: string,
): Promise<Partial<ServiceCheck>> {
  const start = performance.now();
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const latency = Math.round(performance.now() - start);

    if (!res.ok) {
      return {
        status: res.status >= 500 ? "down" : "degraded",
        latency,
        detail: `HTTP ${res.status}`,
      };
    }

    return { status: "operational", latency, detail: label };
  } catch {
    return {
      status: "down",
      latency: Math.round(performance.now() - start),
      detail: "Connection failed",
    };
  }
}

async function checkAgentChat(): Promise<Partial<ServiceCheck>> {
  const start = performance.now();
  try {
    const res = await fetch(`${SITE_URL}/api/agent/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userMessage: "ping" }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const latency = Math.round(performance.now() - start);

    if (res.status === 429) {
      return {
        status: "operational",
        latency,
        detail: "Rate limited (healthy)",
      };
    }

    if (!res.ok) {
      return {
        status: res.status >= 500 ? "down" : "degraded",
        latency,
        detail: `HTTP ${res.status}`,
      };
    }

    const data = await res.json();
    return {
      status: data.response ? "operational" : "degraded",
      latency,
      detail: data.response ? "Claude Haiku responding" : "Empty response",
    };
  } catch {
    return {
      status: "down",
      latency: Math.round(performance.now() - start),
      detail: "Connection failed",
    };
  }
}

// ─── Component ──────────────────────────────────────────────────────────

const INITIAL_SERVICES: ServiceCheck[] = [
  {
    name: "MCP Station",
    description: "Pharmacovigilance tool server",
    icon: <Server className="h-5 w-5" />,
    status: "checking",
    latency: null,
    lastChecked: null,
    detail: "",
  },
  {
    name: "Station Tools",
    description: "Tool catalog endpoint",
    icon: <Zap className="h-5 w-5" />,
    status: "checking",
    latency: null,
    lastChecked: null,
    detail: "",
  },
  {
    name: "AI Agent",
    description: "Claude Haiku conversational agent",
    icon: <Bot className="h-5 w-5" />,
    status: "checking",
    latency: null,
    lastChecked: null,
    detail: "",
  },
  {
    name: "Crystalbook Diagnostic",
    description: "System health assessment API",
    icon: <ShieldCheck className="h-5 w-5" />,
    status: "checking",
    latency: null,
    lastChecked: null,
    detail: "",
  },
  {
    name: "Website",
    description: "nexvigilant.com",
    icon: <Globe className="h-5 w-5" />,
    status: "checking",
    latency: null,
    lastChecked: null,
    detail: "",
  },
];

export function StatusDashboard() {
  const [services, setServices] = useState<ServiceCheck[]>(INITIAL_SERVICES);
  const [history, setHistory] = useState<TickHistory[]>([]);
  const [stationHealth, setStationHealth] = useState<StationHealth | null>(
    null,
  );
  const [tickCount, setTickCount] = useState(0);
  const [lastTick, setLastTick] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const runTick = useCallback(async () => {
    const now = new Date();

    // Run all checks in parallel
    const [station, tools, agent, diagnostic, website] = await Promise.all([
      checkStation(),
      checkEndpoint(`${STATION_URL}/tools`, "Tool catalog accessible"),
      checkAgentChat(),
      checkEndpoint(
        `${SITE_URL}/api/crystalbook/diagnose`,
        "Diagnostic API reachable",
      ).then((r) => ({
        // POST-only endpoint returns 405 on GET — that means it's alive
        ...r,
        status:
          r.detail === "HTTP 405" ? ("operational" as ServiceStatus) : r.status,
        detail: r.detail === "HTTP 405" ? "API reachable" : r.detail,
      })),
      checkEndpoint(SITE_URL, "Website loading"),
    ]);

    if (station.health) {
      setStationHealth(station.health);
    }

    const merge = (
      base: ServiceCheck,
      result: Partial<ServiceCheck>,
    ): ServiceCheck => ({
      ...base,
      status: result.status ?? "down",
      latency: result.latency ?? null,
      detail: result.detail ?? "",
      lastChecked: now,
    });

    const updated: ServiceCheck[] = [
      merge(INITIAL_SERVICES[0], station),
      merge(INITIAL_SERVICES[1], tools),
      merge(INITIAL_SERVICES[2], agent),
      merge(INITIAL_SERVICES[3], diagnostic),
      merge(INITIAL_SERVICES[4], website),
    ];

    setServices(updated);
    setLastTick(now);
    setTickCount((c) => c + 1);

    // Record history
    setHistory((prev) => {
      const entry: TickHistory = {
        timestamp: now,
        allOperational: updated.every((s) => s.status === "operational"),
        services: updated.map((s) => ({ name: s.name, status: s.status })),
      };
      return [...prev, entry].slice(-MAX_HISTORY);
    });
  }, []);

  useEffect(() => {
    runTick();
    intervalRef.current = setInterval(runTick, TICK_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [runTick]);

  const allOperational = services.every((s) => s.status === "operational");
  const anyDown = services.some((s) => s.status === "down");
  const overallStatus = anyDown
    ? "down"
    : allOperational
      ? "operational"
      : "degraded";

  return (
    <div className="min-h-screen bg-nex-background">
      <div className="container mx-auto px-4 py-12 md:px-6 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Activity className="h-6 w-6 text-cyan" />
            <h1 className="text-2xl md:text-3xl font-headline font-bold text-white">
              System Status
            </h1>
          </div>

          {/* Overall Status Banner */}
          <div
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium",
              overallStatus === "operational" &&
                "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
              overallStatus === "degraded" &&
                "bg-amber-500/10 text-amber-400 border border-amber-500/20",
              overallStatus === "down" &&
                "bg-red-500/10 text-red-400 border border-red-500/20",
            )}
          >
            {statusIcon(overallStatus)}
            {overallStatus === "operational"
              ? "All Systems Operational"
              : overallStatus === "degraded"
                ? "Some Systems Degraded"
                : "Service Disruption Detected"}
          </div>

          {lastTick && (
            <p className="text-xs text-slate-dim mt-3">
              <Clock className="inline h-3 w-3 mr-1" />
              Last checked {lastTick.toLocaleTimeString()} | Tick #{tickCount} |
              Refreshes every 30s
            </p>
          )}
        </div>

        {/* Service Grid */}
        <div className="space-y-3 mb-10">
          {services.map((service) => (
            <div
              key={service.name}
              className={cn(
                "flex items-center justify-between p-4 rounded-xl border transition-colors",
                service.status === "operational" &&
                  "border-nex-light bg-nex-surface/30",
                service.status === "degraded" &&
                  "border-amber-500/20 bg-amber-500/5",
                service.status === "down" && "border-red-500/20 bg-red-500/5",
                service.status === "checking" &&
                  "border-nex-light bg-nex-surface/20",
              )}
            >
              <div className="flex items-center gap-3">
                <div className="text-slate-dim">{service.icon}</div>
                <div>
                  <p className="font-medium text-white text-sm">
                    {service.name}
                  </p>
                  <p className="text-xs text-slate-dim">
                    {service.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {service.detail && (
                  <span className="text-xs text-slate-dim hidden sm:block max-w-[200px] truncate">
                    {service.detail}
                  </span>
                )}
                {service.latency !== null && (
                  <span className="text-xs text-slate-dim font-mono w-16 text-right">
                    {formatLatency(service.latency)}
                  </span>
                )}
                <div className="flex items-center gap-1.5">
                  {statusIcon(service.status)}
                  <span
                    className={cn(
                      "text-xs font-medium w-20",
                      statusColor(service.status),
                    )}
                  >
                    {statusLabel(service.status)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Station Telemetry */}
        {stationHealth && (
          <div className="mb-10">
            <h2 className="text-lg font-headline font-semibold text-white mb-4">
              MCP Station Telemetry
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: "Tools",
                  value: stationHealth.tools.toString(),
                },
                {
                  label: "Uptime",
                  value: formatUptime(stationHealth.telemetry.uptime_seconds),
                },
                {
                  label: "Error Rate",
                  value: `${stationHealth.telemetry.error_rate_pct.toFixed(1)}%`,
                },
                {
                  label: "Calls/min",
                  value: stationHealth.telemetry.calls_per_minute.toFixed(1),
                },
                {
                  label: "Total Calls",
                  value: stationHealth.telemetry.total_calls.toLocaleString(),
                },
                {
                  label: "P99 Latency",
                  value: formatLatency(stationHealth.telemetry.latency_p99_ms),
                },
                {
                  label: "SLO Status",
                  value: stationHealth.telemetry.slo_status.toUpperCase(),
                },
                {
                  label: "Configs",
                  value: stationHealth.configs.toString(),
                },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="p-3 rounded-lg border border-nex-light bg-nex-surface/30"
                >
                  <p className="text-xs text-slate-dim uppercase tracking-wide">
                    {metric.label}
                  </p>
                  <p className="text-lg font-bold text-white mt-1">
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tick History (last 30 minutes) */}
        {history.length > 1 && (
          <div className="mb-10">
            <h2 className="text-lg font-headline font-semibold text-white mb-4">
              Recent History
            </h2>
            <div className="flex gap-0.5 items-end h-8">
              {history.map((tick, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex-1 rounded-sm min-w-[3px] transition-colors",
                    tick.allOperational
                      ? "bg-emerald-500/60 h-full"
                      : tick.services.some((s) => s.status === "down")
                        ? "bg-red-500/60 h-full"
                        : "bg-amber-500/60 h-full",
                  )}
                  title={`${tick.timestamp.toLocaleTimeString()} — ${tick.allOperational ? "All operational" : "Issues detected"}`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-slate-dim">
                {history[0]?.timestamp.toLocaleTimeString()}
              </span>
              <span className="text-xs text-slate-dim">Now</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-slate-dim pt-6 border-t border-nex-light">
          <p>
            Monitoring{" "}
            <a
              href="https://mcp.nexvigilant.com"
              className="text-cyan hover:underline"
            >
              mcp.nexvigilant.com
            </a>{" "}
            and{" "}
            <a
              href="https://algovigilance.com"
              className="text-cyan hover:underline"
            >
              nexvigilant.com
            </a>
          </p>
          <p className="mt-1">
            Powered by AlgoVigilance Guardian | Ticks every 30s
          </p>
        </div>
      </div>
    </div>
  );
}
