"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScoreMeter, TipBox } from "@/components/pv-for-nexvigilants";
import {
  evaluateFence,
  computeFenceHealth,
  DEFAULT_FENCE_RULES,
  FENCE_METRIC_LABELS,
} from "@/lib/pv-compute";
import type {
  FenceAction,
  FenceDecision,
  FenceRule,
  FenceSignal,
  FenceResult,
} from "@/lib/pv-compute";
import {
  Shield,
  Plus,
  Trash2,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";

const ACTION_COLORS: Record<FenceAction, string> = {
  allow: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  warn: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  block: "bg-red-500/20 text-red-400 border-red-500/30",
};

const DECISION_STYLES: Record<FenceDecision, string> = {
  PASS: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  WARN: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  BLOCK: "bg-red-500/20 text-red-400 border-red-500/30",
};

const DECISION_ICONS: Record<FenceDecision, typeof CheckCircle2> = {
  PASS: CheckCircle2,
  WARN: AlertTriangle,
  BLOCK: XCircle,
};

// Default rules imported from pv-compute as DEFAULT_FENCE_RULES

// ── Score meter zones ────────────────────────────────────────────────────────

const HEALTH_ZONES = [
  { min: 0, max: 50, label: "Poor", color: "bg-red-500" },
  { min: 50, max: 80, label: "Fair", color: "bg-amber-500" },
  { min: 80, max: 100, label: "Healthy", color: "bg-emerald-500" },
];

// ── Component ────────────────────────────────────────────────────────────────

export function FenceMonitor() {
  const [rules, setRules] = useState<FenceRule[]>(DEFAULT_FENCE_RULES);
  const [history, setHistory] = useState<FenceResult[]>([]);

  // Test signal form state
  const [drug, setDrug] = useState("metformin");
  const [event, setEvent] = useState("lactic acidosis");
  const [prr, setPrr] = useState("3.2");
  const [ror, setRor] = useState("2.8");
  const [ic025, setIc025] = useState("0.5");
  const [eb05, setEb05] = useState("1.4");
  const [chiSq, setChiSq] = useState("5.2");

  // Last test result
  const [lastResult, setLastResult] = useState<FenceResult | null>(null);

  // ── Rule management ──────────────────────────────────────────────────────

  const toggleRule = useCallback((id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
    );
  }, []);

  const removeRule = useCallback((id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const addRule = useCallback(() => {
    const id = `r${Date.now()}`;
    setRules((prev) => [
      ...prev,
      {
        id,
        name: "New Rule",
        metric: "prr",
        operator: ">=",
        threshold: 2.0,
        action: "warn",
        enabled: true,
      },
    ]);
  }, []);

  // ── Fence evaluation (via pv-compute) ───────────────────────────────────

  const testSignal = useCallback(() => {
    const signal: FenceSignal = {
      drug,
      event,
      prr: parseFloat(prr) || 0,
      ror: parseFloat(ror) || 0,
      ic025: parseFloat(ic025) || 0,
      eb05: parseFloat(eb05) || 0,
      chi_square: parseFloat(chiSq) || 0,
    };
    const result = evaluateFence(signal, rules);
    setLastResult(result);
    setHistory((prev) => [result, ...prev]);
  }, [drug, event, prr, ror, ic025, eb05, chiSq, rules]);

  // ── Summary stats (via pv-compute) ────────────────────────────────────

  const stats = useMemo(() => computeFenceHealth(history), [history]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="h-7 w-7 text-cyan-400" />
        <div>
          <h1 className="text-2xl font-semibold">Your Safety Guardrails</h1>
          <p className="text-sm text-muted-foreground">
            Configure signal thresholds and test whether drug-event pairs cross
            the fence
          </p>
        </div>
      </div>

      <TipBox>
        The signal fence enforces thresholds on disproportionality metrics. If
        any rule says &quot;block,&quot; the signal is blocked. If any says
        &quot;warn,&quot; you get an alert. Otherwise it passes through.
      </TipBox>

      {/* Health Score */}
      {stats.total > 0 && (
        <ScoreMeter
          score={stats.healthPct}
          label="Fence Health (% passed)"
          zones={HEALTH_ZONES}
        />
      )}

      {/* 3-column layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Column 1: Rules ─────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fence Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center gap-2 rounded-md border border-white/10 p-2"
              >
                <Switch
                  checked={rule.enabled}
                  onCheckedChange={() => toggleRule(rule.id)}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{rule.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {FENCE_METRIC_LABELS[rule.metric]} {rule.operator}{" "}
                    {rule.threshold}
                  </p>
                </div>
                <Badge variant="outline" className={ACTION_COLORS[rule.action]}>
                  {rule.action}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-red-400"
                  onClick={() => removeRule(rule.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={addRule}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Rule
            </Button>
          </CardContent>
        </Card>

        {/* ── Column 2: Test Signal ───────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Test a Signal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Drug</Label>
                <Input
                  value={drug}
                  onChange={(e) => setDrug(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Event</Label>
                <Input
                  value={event}
                  onChange={(e) => setEvent(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">PRR</Label>
                <Input
                  value={prr}
                  onChange={(e) => setPrr(e.target.value)}
                  className="h-8 text-sm"
                  type="number"
                  step="0.1"
                />
              </div>
              <div>
                <Label className="text-xs">ROR</Label>
                <Input
                  value={ror}
                  onChange={(e) => setRor(e.target.value)}
                  className="h-8 text-sm"
                  type="number"
                  step="0.1"
                />
              </div>
              <div>
                <Label className="text-xs">IC(0.25)</Label>
                <Input
                  value={ic025}
                  onChange={(e) => setIc025(e.target.value)}
                  className="h-8 text-sm"
                  type="number"
                  step="0.1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">EB05</Label>
                <Input
                  value={eb05}
                  onChange={(e) => setEb05(e.target.value)}
                  className="h-8 text-sm"
                  type="number"
                  step="0.1"
                />
              </div>
              <div>
                <Label className="text-xs">Chi-Sq</Label>
                <Input
                  value={chiSq}
                  onChange={(e) => setChiSq(e.target.value)}
                  className="h-8 text-sm"
                  type="number"
                  step="0.1"
                />
              </div>
            </div>

            <Button className="w-full" onClick={testSignal}>
              <Zap className="mr-1.5 h-4 w-4" />
              Test Signal
            </Button>

            {/* Last result */}
            {lastResult && (
              <div className="rounded-md border border-white/10 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = DECISION_ICONS[lastResult.decision];
                    return <Icon className="h-4 w-4" />;
                  })()}
                  <Badge
                    variant="outline"
                    className={DECISION_STYLES[lastResult.decision]}
                  >
                    {lastResult.decision}
                  </Badge>
                </div>
                {lastResult.triggered.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Triggered:{" "}
                    {lastResult.triggered.map((r) => r.name).join(", ")}
                  </p>
                )}
                {lastResult.triggered.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No rules triggered — signal passed cleanly
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Column 3: History ───────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Audit History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Stats bar */}
            {stats.total > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{stats.total} tested</span>
                  <span className="text-emerald-400">{stats.pass} pass</span>
                  <span className="text-amber-400">{stats.warn} warn</span>
                  <span className="text-red-400">{stats.block} block</span>
                </div>
                {/* Distribution bar */}
                <div className="flex h-2 w-full overflow-hidden rounded-full bg-white/5">
                  {stats.pass > 0 && (
                    <div
                      className="bg-emerald-500 transition-all"
                      style={{
                        width: `${(stats.pass / stats.total) * 100}%`,
                      }}
                    />
                  )}
                  {stats.warn > 0 && (
                    <div
                      className="bg-amber-500 transition-all"
                      style={{
                        width: `${(stats.warn / stats.total) * 100}%`,
                      }}
                    />
                  )}
                  {stats.block > 0 && (
                    <div
                      className="bg-red-500 transition-all"
                      style={{
                        width: `${(stats.block / stats.total) * 100}%`,
                      }}
                    />
                  )}
                </div>
              </div>
            )}

            {/* History entries */}
            <div className="max-h-[300px] space-y-2 overflow-y-auto">
              {history.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Test a signal to see results here
                </p>
              )}
              {history.map((entry, i) => {
                const Icon = DECISION_ICONS[entry.decision];
                return (
                  <div
                    key={`${entry.signal.drug}-${entry.signal.event}-${i}`}
                    className="flex items-center gap-2 rounded-md border border-white/10 p-2"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">
                        {entry.signal.drug} / {entry.signal.event}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.triggered.length} rule
                        {entry.triggered.length !== 1 ? "s" : ""} triggered
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${DECISION_STYLES[entry.decision]}`}
                    >
                      {entry.decision}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
