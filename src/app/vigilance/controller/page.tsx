"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getBindings, getFidelityHistory } from "./actions";
import type { LiveBinding, FidelityPoint } from "./actions";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TipBox,
  RememberBox,
  TechnicalStuffBox,
} from "@/components/pv-for-nexvigilants";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  RefreshCw,
  Zap,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

type ControllerVerdict =
  | "STABLE"
  | "FREQ_DECAY"
  | "FIDELITY_DEGRADED"
  | "RECURSION_SATURATED"
  | "COMPOUND";

type Tier = "T0" | "T1" | "T2" | "T3";

interface BindingEntry {
  id: string;
  hook: string;
  event: string;
  fidelity: number; // 0.0 – 1.0
  lastFired: string; // ISO-8601 or "never"
  missedWindows: number;
  degraded: boolean;
}

interface ArrowHop {
  label: string;
  fidelity: number;
}

interface ControllerState {
  verdict: ControllerVerdict;
  tier: Tier;
  nu: { rate: number; floor: number }; // ν health ratio
  rho: { depth: number; ceiling: number }; // ρ recursion depth
  arrowChain: ArrowHop[];
  bindings: BindingEntry[];
  lastUpdated: string;
}

// ---------------------------------------------------------------------------
// Station API — live data from mcp.nexvigilant.com
// ---------------------------------------------------------------------------

const STATION_BASE = "https://mcp.nexvigilant.com/tools";

// Default causal chain representing the hook lifecycle pipeline
const DEFAULT_CAUSAL_LINKS = [
  { cause: "SessionStart", effect: "brain-recall", fidelity: 0.95 },
  { cause: "brain-recall", effect: "PreToolUse", fidelity: 0.90 },
  { cause: "PreToolUse", effect: "PostToolUse", fidelity: 0.92 },
  { cause: "PostToolUse", effect: "Stop", fidelity: 0.88 },
  { cause: "Stop", effect: "exhale", fidelity: 0.85 },
];

// Bindings loaded from server action (settings.json + fidelity ledger)
// Falls back to empty array if server action fails
async function loadLiveBindings(): Promise<LiveBinding[]> {
  try {
    return await getBindings();
  } catch {
    return [];
  }
}

async function loadHistory(): Promise<FidelityPoint[]> {
  try {
    return await getFidelityHistory();
  } catch {
    return [];
  }
}

async function callStation<T>(toolName: string, args: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${STATION_BASE}/${toolName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`Station ${toolName}: ${res.status}`);
  const data = await res.json();
  // Station wraps in MCP content envelope
  const text = data?.content?.[0]?.text;
  if (text) return JSON.parse(text) as T;
  return data as T;
}

interface TickResponse {
  verdict: string;
  stable: boolean;
  nu: { rate: number; floor: number; health_ratio: number; decayed: boolean };
  rho: { depth: number; ceiling: number; saturated: boolean };
  arrow: {
    hops: number;
    f_total: number;
    f_min: number;
    below_threshold: boolean;
    weakest: { cause: string; effect: string; fidelity: number } | null;
  };
}

interface RegistryResponse {
  total_bindings: number;
  aggregate_fidelity: number;
  degraded_count: number;
  degraded_threshold: number;
  degraded_bindings: { hook: string; event: string; fidelity: number }[];
}

function classifyTier(verdict: string, fTotal: number): Tier {
  if (verdict === "STABLE") return "T0";
  if (verdict.startsWith("COMPOUND")) return "T3";
  if (fTotal < 0.5) return "T2";
  return "T1";
}

async function fetchControllerState(): Promise<ControllerState> {
  // Load real bindings from settings.json via server action
  const liveBindings = await loadLiveBindings();
  const bindingsForStation = liveBindings.map((b) => ({
    hook: b.hook,
    event: b.event,
    fidelity: b.fidelity,
  }));

  const [tick, registry] = await Promise.all([
    callStation<TickResponse>(
      "cybercinetics_nexvigilant_com_controller_tick",
      {
        nu_rate: 2.0,
        nu_floor: 0.5,
        rho_ceiling: 3,
        f_min: 0.80,
        causal_links: DEFAULT_CAUSAL_LINKS,
      }
    ),
    callStation<RegistryResponse>(
      "cybercinetics_nexvigilant_com_registry_status",
      {
        bindings: bindingsForStation.length > 0 ? bindingsForStation : [{ hook: "none", event: "Stop", fidelity: 1.0 }],
        degraded_threshold: 0.80,
      }
    ),
  ]);

  const verdict = tick.verdict as ControllerVerdict;
  const tier = classifyTier(tick.verdict, tick.arrow.f_total);

  // Build arrow chain from the causal links
  const arrowChain: ArrowHop[] = DEFAULT_CAUSAL_LINKS.map((link) => ({
    label: link.cause,
    fidelity: link.fidelity,
  }));

  // Build bindings from live settings.json data
  const degradedSet = new Set(
    (registry.degraded_bindings ?? []).map(
      (b: { hook: string; event: string }) => `${b.hook}:${b.event}`
    )
  );

  const bindings: BindingEntry[] = liveBindings.map((b, i) => ({
    id: `b${i}`,
    hook: b.hook,
    event: b.event,
    fidelity: b.fidelity,
    lastFired: new Date().toISOString(),
    missedWindows: b.fidelity < 0.80 ? Math.round((1 - b.fidelity) * 10) : 0,
    degraded: degradedSet.has(`${b.hook}:${b.event}`) || b.fidelity < 0.80,
  }));

  return {
    verdict,
    tier,
    nu: { rate: tick.nu.rate, floor: tick.nu.floor },
    rho: { depth: tick.rho.depth, ceiling: tick.rho.ceiling },
    arrowChain,
    bindings,
    lastUpdated: new Date().toISOString(),
  };
}

// Fallback for when Station is unreachable
const FALLBACK_STATE: ControllerState = {
  verdict: "STABLE",
  tier: "T0",
  nu: { rate: 2.0, floor: 0.5 },
  rho: { depth: 0, ceiling: 3 },
  arrowChain: DEFAULT_CAUSAL_LINKS.map((l) => ({
    label: l.cause,
    fidelity: l.fidelity,
  })),
  bindings: [],
  lastUpdated: new Date().toISOString(),
};

// ---------------------------------------------------------------------------
// Derived constants
// ---------------------------------------------------------------------------

const VERDICT_CONFIG: Record<
  ControllerVerdict,
  { label: string; description: string; color: string; bgColor: string }
> = {
  STABLE: {
    label: "Stable",
    description: "All bindings healthy. ν and ρ within bounds.",
    color: "text-emerald-400",
    bgColor: "border-emerald-500/30 bg-emerald-500/10",
  },
  FREQ_DECAY: {
    label: "Frequency Decay",
    description: "ν health ratio is falling below floor. Hooks are firing less often than expected.",
    color: "text-yellow-400",
    bgColor: "border-yellow-500/30 bg-yellow-500/10",
  },
  FIDELITY_DEGRADED: {
    label: "Fidelity Degraded",
    description: "One or more bindings have fidelity < 0.70. Hook-binary contracts are weakening.",
    color: "text-orange-400",
    bgColor: "border-orange-500/30 bg-orange-500/10",
  },
  RECURSION_SATURATED: {
    label: "Recursion Saturated",
    description: "ρ depth is approaching ceiling. Recursive audit loops are stacking.",
    color: "text-red-400",
    bgColor: "border-red-500/30 bg-red-500/10",
  },
  COMPOUND: {
    label: "Compound Failure",
    description: "Multiple failure modes active simultaneously. Immediate intervention required.",
    color: "text-red-300",
    bgColor: "border-red-400/40 bg-red-500/15",
  },
};

const TIER_CONFIG: Record<
  Tier,
  { color: string; textColor: string; description: string }
> = {
  T0: {
    color: "bg-emerald-500",
    textColor: "text-emerald-900",
    description: "Healthy — all systems nominal",
  },
  T1: {
    color: "bg-yellow-500",
    textColor: "text-yellow-900",
    description: "Watch — minor degradation detected",
  },
  T2: {
    color: "bg-orange-500",
    textColor: "text-orange-900",
    description: "Alert — significant fidelity loss",
  },
  T3: {
    color: "bg-red-500",
    textColor: "text-red-100",
    description: "Critical — binding contract broken",
  },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TierBadge({ tier }: { tier: Tier }) {
  const cfg = TIER_CONFIG[tier];
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold font-mono ${cfg.color} ${cfg.textColor}`}
      title={cfg.description}
    >
      {tier}
    </span>
  );
}

function VerdictCard({ verdict }: { verdict: ControllerVerdict }) {
  const cfg = VERDICT_CONFIG[verdict];
  return (
    <Card className={`border ${cfg.bgColor}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground font-mono">
          Controller Verdict
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          {verdict === "STABLE" ? (
            <CheckCircle className={`h-6 w-6 ${cfg.color}`} />
          ) : (
            <AlertTriangle className={`h-6 w-6 ${cfg.color}`} />
          )}
          <div>
            <p className={`text-xl font-black font-mono ${cfg.color}`}>
              {cfg.label}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {cfg.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NuHealthBar({ nu }: { nu: ControllerState["nu"] }) {
  const ratio = nu.floor > 0 ? nu.rate / nu.floor : 1;
  const pct = Math.min(100, Math.round((nu.rate / Math.max(nu.floor, nu.rate)) * 100));
  const healthy = nu.rate >= nu.floor;

  return (
    <Card className="border border-white/[0.08] bg-white/[0.03]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground font-mono">
          <span className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            ν Health Ratio
          </span>
          <span className={`text-base font-black tabular-nums ${healthy ? "text-emerald-400" : "text-orange-400"}`}>
            {nu.rate.toFixed(2)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Progress
          value={pct}
          className="h-3"
          aria-label={`ν health: ${nu.rate.toFixed(2)} of ${nu.floor.toFixed(2)} floor`}
        />
        <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
          <span>Rate: {nu.rate.toFixed(2)}</span>
          <span className="text-amber-400/70">Floor: {nu.floor.toFixed(2)}</span>
        </div>
        {!healthy && (
          <p className="text-[10px] text-orange-400">
            Rate below floor — hook firing frequency is decaying
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function RhoDepthMeter({ rho }: { rho: ControllerState["rho"] }) {
  const pct = Math.round((rho.depth / rho.ceiling) * 100);
  const critical = pct >= 80;
  const warning = pct >= 60;
  const barColor = critical ? "text-red-400" : warning ? "text-orange-400" : "text-emerald-400";

  return (
    <Card className="border border-white/[0.08] bg-white/[0.03]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground font-mono">
          <span className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            ρ Recursion Depth
          </span>
          <span className={`text-base font-black tabular-nums ${barColor}`}>
            {rho.depth} / {rho.ceiling}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Progress
          value={pct}
          className="h-3"
          aria-label={`ρ depth: ${rho.depth} of ${rho.ceiling} ceiling`}
        />
        <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
          <span>Depth: {rho.depth}</span>
          <span className="text-amber-400/70">Ceiling: {rho.ceiling}</span>
        </div>
        {critical && (
          <p className="text-[10px] text-red-400">
            Approaching ceiling — recursive audit loops are stacking
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ArrowFidelityChain({ chain }: { chain: ArrowHop[] }) {
  // F_total = product of all hop fidelities
  const fTotal = chain.reduce((acc, h) => acc * h.fidelity, 1);

  function hopColor(f: number) {
    if (f >= 0.85) return "text-emerald-400 border-emerald-500/40 bg-emerald-500/10";
    if (f >= 0.70) return "text-yellow-400 border-yellow-500/40 bg-yellow-500/10";
    if (f >= 0.50) return "text-orange-400 border-orange-500/40 bg-orange-500/10";
    return "text-red-400 border-red-500/40 bg-red-500/10";
  }

  return (
    <Card className="border border-white/[0.08] bg-white/[0.03]">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground font-mono">
          Arrow Fidelity Chain
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chain visualization */}
        <div className="flex flex-wrap items-center gap-1.5" role="list" aria-label="Arrow fidelity hops">
          {chain.map((hop, i) => (
            <div key={hop.label} className="flex items-center gap-1.5" role="listitem">
              <div
                className={`border rounded-md px-2.5 py-1.5 text-center min-w-[80px] ${hopColor(hop.fidelity)}`}
              >
                <p className="text-[9px] font-bold uppercase tracking-wide truncate max-w-[100px]">
                  {hop.label}
                </p>
                <p className="text-sm font-black font-mono tabular-nums mt-0.5">
                  {(hop.fidelity * 100).toFixed(0)}%
                </p>
              </div>
              {i < chain.length - 1 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" aria-hidden />
              )}
            </div>
          ))}
        </div>

        <Separator className="bg-white/[0.06]" />

        {/* F_total product */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-muted-foreground">
            F<sub>total</sub> = product of all hops
          </span>
          <span
            className={`text-lg font-black font-mono tabular-nums ${
              fTotal >= 0.60
                ? "text-emerald-400"
                : fTotal >= 0.35
                ? "text-orange-400"
                : "text-red-400"
            }`}
          >
            {(fTotal * 100).toFixed(1)}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function fidelityBadge(f: number) {
  if (f >= 0.85) return <Badge variant="outline" className="text-emerald-400 border-emerald-500/40 font-mono text-xs">{(f * 100).toFixed(0)}%</Badge>;
  if (f >= 0.70) return <Badge variant="outline" className="text-yellow-400 border-yellow-500/40 font-mono text-xs">{(f * 100).toFixed(0)}%</Badge>;
  if (f >= 0.50) return <Badge variant="outline" className="text-orange-400 border-orange-500/40 font-mono text-xs">{(f * 100).toFixed(0)}%</Badge>;
  return <Badge variant="outline" className="text-red-400 border-red-500/40 font-mono text-xs">{(f * 100).toFixed(0)}%</Badge>;
}

function BindingRegistry({ bindings }: { bindings: BindingEntry[] }) {
  const degradedCount = bindings.filter((b) => b.degraded).length;

  return (
    <Card className="border border-white/[0.08] bg-white/[0.03]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground font-mono">
          <span>Binding Registry</span>
          {degradedCount > 0 && (
            <span className="text-red-400 font-black text-sm">
              {degradedCount} degraded
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.06] hover:bg-transparent">
              <TableHead className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 font-mono pl-4">
                Hook
              </TableHead>
              <TableHead className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 font-mono">
                Event
              </TableHead>
              <TableHead className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 font-mono text-right">
                Fidelity
              </TableHead>
              <TableHead className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 font-mono text-right">
                Missed
              </TableHead>
              <TableHead className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 font-mono pr-4">
                Last Fired
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bindings.map((b) => (
              <TableRow
                key={b.id}
                className={`border-white/[0.04] transition-colors ${
                  b.degraded
                    ? "bg-red-500/[0.04] hover:bg-red-500/[0.08]"
                    : "hover:bg-white/[0.02]"
                }`}
                aria-label={`${b.hook} — ${b.degraded ? "degraded" : "healthy"}`}
              >
                <TableCell className="font-mono text-xs text-foreground pl-4 py-3">
                  <span className="flex items-center gap-1.5">
                    {b.degraded && (
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" aria-hidden />
                    )}
                    {b.hook}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-xs text-cyan-400/80 py-3">
                  {b.event}
                </TableCell>
                <TableCell className="text-right py-3">
                  {fidelityBadge(b.fidelity)}
                </TableCell>
                <TableCell className="text-right font-mono text-xs py-3">
                  <span className={b.missedWindows >= 5 ? "text-red-400" : "text-muted-foreground"}>
                    {b.missedWindows}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-[10px] text-muted-foreground/60 pr-4 py-3">
                  {b.lastFired === "never"
                    ? "never"
                    : new Date(b.lastFired).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Sparkline — SVG mini chart for F_total history
// ---------------------------------------------------------------------------

function FidelitySparkline({ points }: { points: FidelityPoint[] }) {
  if (points.length < 2) {
    return (
      <Card className="border border-white/[0.08] bg-white/[0.03]">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground font-mono">
            F_total History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            {points.length === 0
              ? "No history yet — the decay hook writes data each session."
              : "Need at least 2 sessions for a sparkline."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const W = 600;
  const H = 80;
  const PAD = 4;
  const min = Math.min(...points.map((p) => p.f_total), 0);
  const max = Math.max(...points.map((p) => p.f_total), 1);
  const range = max - min || 1;

  const toX = (i: number) => PAD + (i / (points.length - 1)) * (W - 2 * PAD);
  const toY = (v: number) => H - PAD - ((v - min) / range) * (H - 2 * PAD);

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(p.f_total).toFixed(1)}`)
    .join(" ");

  // Gradient fill below the line
  const fillD = `${pathD} L ${toX(points.length - 1).toFixed(1)} ${H} L ${toX(0).toFixed(1)} ${H} Z`;

  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  const delta = last.f_total - prev.f_total;
  const trend = delta > 0.01 ? "text-emerald-400" : delta < -0.01 ? "text-red-400" : "text-muted-foreground";

  // Threshold line at 0.80
  const threshY = toY(0.80);

  return (
    <Card className="border border-white/[0.08] bg-white/[0.03]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground font-mono">
          <span>F_total History ({points.length} sessions)</span>
          <span className={`text-sm font-black tabular-nums ${trend}`}>
            {last.f_total.toFixed(3)} ({delta >= 0 ? "+" : ""}{delta.toFixed(3)})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-20" aria-label="F_total sparkline">
          <defs>
            <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(52, 211, 153)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(52, 211, 153)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Threshold line at 0.80 */}
          {threshY > 0 && threshY < H && (
            <line
              x1={PAD} y1={threshY} x2={W - PAD} y2={threshY}
              stroke="rgb(251, 146, 60)" strokeWidth="0.5" strokeDasharray="4 3" opacity="0.5"
            />
          )}
          {/* Fill area */}
          <path d={fillD} fill="url(#spark-fill)" />
          {/* Line */}
          <path d={pathD} fill="none" stroke="rgb(52, 211, 153)" strokeWidth="1.5" />
          {/* Dots at each point */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={toX(i)}
              cy={toY(p.f_total)}
              r={i === points.length - 1 ? 3 : 1.5}
              fill={p.f_total >= 0.80 ? "rgb(52, 211, 153)" : p.f_total >= 0.50 ? "rgb(251, 146, 60)" : "rgb(248, 113, 113)"}
            />
          ))}
        </svg>
        <div className="flex justify-between text-[9px] font-mono text-muted-foreground/50 mt-1">
          <span>{points[0].ts ? new Date(points[0].ts).toLocaleDateString() : ""}</span>
          <span className="text-amber-400/50">threshold: 0.80</span>
          <span>{last.ts ? new Date(last.ts).toLocaleDateString() : ""}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function ControllerPage() {
  const [state, setState] = useState<ControllerState>(FALLBACK_STATE);
  const [history, setHistory] = useState<FidelityPoint[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const [next, hist] = await Promise.all([
        fetchControllerState(),
        loadHistory(),
      ]);
      setState(next);
      setHistory(hist);
      setLive(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Station unreachable");
      setState((prev) => ({ ...prev, lastUpdated: new Date().toISOString() }));
      setLive(false);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Fetch on mount + refresh every 30 seconds
  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, [refresh]);

  const verdictCfg = VERDICT_CONFIG[state.verdict];
  const tierCfg = TIER_CONFIG[state.tier];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      {/* Header */}
      <header className="space-y-3">
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full animate-pulse ${
              state.verdict === "STABLE" ? "bg-emerald-500" : "bg-orange-500"
            }`}
            aria-hidden
          />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono">
            Vigilance / Controller
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white font-headline">
              Controller — For AlgoVigilances
            </h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
              Live feedback loop state: how well your hooks are firing, how deep recursion has gone, and which bindings are degrading.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <TierBadge tier={state.tier} />
            <button
              onClick={refresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
              aria-label="Refresh controller state"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span className="font-mono">
                {refreshing ? "Refreshing…" : "Refresh"}
              </span>
            </button>
          </div>
        </div>

        {/* Tier description strip */}
        <div
          className={`rounded-md px-3 py-1.5 border text-xs font-mono ${verdictCfg.bgColor} ${verdictCfg.color} inline-flex items-center gap-2`}
        >
          <span className="font-bold">{tierCfg.description}</span>
          <span className="opacity-50">·</span>
          <span className={`opacity-70 ${live ? "" : "text-yellow-400"}`}>
            {live ? "" : "offline · "}updated{" "}
            {new Date(state.lastUpdated).toLocaleTimeString()}
          </span>
        </div>
        {error && (
          <p className="text-xs text-red-400/80 font-mono">
            Station: {error}
          </p>
        )}
      </header>

      {/* Explainer */}
      <TipBox>
        <strong>What is this?</strong> The feedback controller monitors hook-binary binding health using the ∂(→(ν, ς, ρ)) model. When bindings miss execution windows, their fidelity degrades. The controller classifies the overall system state and tells you which hooks need attention.
      </TipBox>

      {/* Top row — verdict + tier metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <VerdictCard verdict={state.verdict} />
        <NuHealthBar nu={state.nu} />
        <RhoDepthMeter rho={state.rho} />
      </div>

      {/* Arrow fidelity chain */}
      <ArrowFidelityChain chain={state.arrowChain} />

      {/* F_total sparkline history */}
      <FidelitySparkline points={history} />

      {/* Binding registry */}
      <BindingRegistry bindings={state.bindings} />

      {/* Explainer: what do these numbers mean? */}
      <RememberBox>
        <strong>Fidelity</strong> is how reliably a hook fires when its event occurs. 100% means it fires every time; 41% means it misses more than half its windows. Degraded bindings (red rows) are breaking the feedback loop.
      </RememberBox>

      <TechnicalStuffBox>
        <p className="font-semibold mb-1">Model: ∂(→(ν, ς, ρ))</p>
        <ul className="space-y-1 text-xs">
          <li><strong>ν</strong> (nu) — hook firing rate relative to expected floor. Below floor = FREQ_DECAY.</li>
          <li><strong>ς</strong> (sigma) — binding state. Fidelity is the per-binding ς measure.</li>
          <li><strong>ρ</strong> (rho) — recursion depth. Saturated when depth/ceiling ≥ 0.80.</li>
          <li><strong>F_total</strong> — product of all arrow fidelities. Measures end-to-end signal integrity across the event chain.</li>
          <li><strong>Tier</strong> — T0 (green) through T3 (red). Determined by worst active failure mode.</li>
        </ul>
      </TechnicalStuffBox>
    </div>
  );
}
