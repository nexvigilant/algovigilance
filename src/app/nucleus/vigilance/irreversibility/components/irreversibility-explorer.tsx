"use client";

import { useState, useMemo } from "react";
import {
  TipBox,
  RememberBox,
  WarningBox,
  JargonBuster,
  TrafficLight,
  ScoreMeter,
} from "@/components/pv-for-nexvigilants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldAlert,
  Clock,
  Undo2,
  Timer,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  getAllActions,
  classifyReversibility,
  computeIrreversibilityScore,
  findPointOfNoReturn,
  STANDARD_FACTORS,
  DEADLINE_PRESETS,
} from "@/lib/pv-compute";
import type {
  PvActionCategory,
  IrreversibilityFactor,
  DeadlinePreset,
} from "@/lib/pv-compute";

// ── Score meter zones (source: irreversibility.ts threshold definitions) ─────

const IRREVERSIBILITY_ZONES = [
  { min: 0, max: 0.3, label: "Reversible", color: "#22c55e" },
  { min: 0.3, max: 0.7, label: "Conditional", color: "#f59e0b" },
  { min: 0.7, max: 1, label: "Irreversible", color: "#ef4444" },
];

// ── Urgency color mapping ────────────────────────────────────────────────────

function urgencyTraffic(urgency: string): {
  level: "green" | "yellow" | "red";
  label: string;
} {
  switch (urgency) {
    case "safe":
      return { level: "green", label: "Safe" };
    case "warning":
      return { level: "yellow", label: "Warning" };
    case "critical":
      return { level: "red", label: "Critical" };
    case "expired":
      return { level: "red", label: "Expired" };
    default:
      return { level: "yellow", label: urgency };
  }
}

function reversibilityIcon(level: string) {
  switch (level) {
    case "reversible":
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case "conditional":
      return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    case "irreversible":
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return null;
  }
}

function reversibilityBadge(level: string) {
  const variant =
    level === "reversible"
      ? "default"
      : level === "conditional"
        ? "secondary"
        : "destructive";
  return <Badge variant={variant}>{level}</Badge>;
}

// ── Main component ───────────────────────────────────────────────────────────

export function IrreversibilityExplorer() {
  const actions = useMemo(() => getAllActions(), []);
  const [selectedAction, setSelectedAction] = useState<PvActionCategory | null>(
    null,
  );
  const [factorStates, setFactorStates] = useState<boolean[]>(
    STANDARD_FACTORS.map(() => false),
  );
  const [selectedPreset, setSelectedPreset] = useState<DeadlinePreset | null>(
    null,
  );
  const [simulatedHoursElapsed, setSimulatedHoursElapsed] = useState(0);

  // Computed: classification of selected action
  const classification = selectedAction
    ? classifyReversibility(selectedAction)
    : null;

  // Computed: irreversibility score from factor toggles
  const scoreResult = useMemo(() => {
    const factors: IrreversibilityFactor[] = STANDARD_FACTORS.map((f, i) => ({
      ...f,
      present: factorStates[i],
    }));
    return computeIrreversibilityScore(factors);
  }, [factorStates]);

  // Computed: point of no return for selected deadline preset
  const ponrResult = useMemo(() => {
    if (!selectedPreset) return null;
    const preset = DEADLINE_PRESETS.find((p) => p.id === selectedPreset);
    if (!preset) return null;

    const windowMs = preset.windowHours * 60 * 60 * 1000;
    const startMs = 0;
    const deadlineMs = windowMs;
    const nowMs = simulatedHoursElapsed * 60 * 60 * 1000;

    return {
      preset,
      result: findPointOfNoReturn(deadlineMs, nowMs, startMs),
    };
  }, [selectedPreset, simulatedHoursElapsed]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900 dark:text-gray-100">
          <ShieldAlert className="h-8 w-8 text-red-600" />
          Can You Undo This?
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Not all PV actions are created equal. Some you can take back. Some you
          can take back <em>if you act fast</em>. And some — once done — are
          done forever. This tool helps you understand which is which, using the{" "}
          <JargonBuster
            term="Irreversibility (∝)"
            definition="The T1 primitive that measures whether an action can be undone. In PV, irreversible actions include ICSR submissions, market withdrawals, and missed regulatory deadlines."
          >
            irreversibility primitive
          </JargonBuster>
          .
        </p>
      </div>

      {/* (source: ICH E2A Section IV, ICH E2D Section III) */}
      <RememberBox>
        In pharmacovigilance, <strong>irreversible</strong> means the action
        creates a permanent regulatory record. You can amend (add information)
        but never retract. A submitted ICSR, a missed deadline, a market
        withdrawal — these are one-way doors.
      </RememberBox>

      {/* ── Section 1: Action Catalog ─────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Undo2 className="h-5 w-5" />
            PV Action Catalog
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Select an action to see its reversibility classification.
          </p>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {actions.map((a) => (
              <Button
                key={a.category}
                variant={selectedAction === a.category ? "default" : "outline"}
                onClick={() => setSelectedAction(a.category)}
                className="h-auto flex-col items-start p-3 text-left"
              >
                <div className="flex w-full items-center gap-2">
                  {reversibilityIcon(a.reversibilityLevel)}
                  <span className="font-medium">{a.name}</span>
                </div>
                <span className="mt-1 text-xs opacity-60">
                  {a.reversibilityLevel}
                  {a.undoWindow ? ` (${a.undoWindow}h window)` : ""}
                </span>
              </Button>
            ))}
          </div>

          {classification && (
            <div
              className={`mt-4 rounded-lg border p-4 ${
                classification.level === "irreversible"
                  ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
                  : classification.level === "conditional"
                    ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950"
                    : "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
              }`}
            >
              <div className="flex items-center gap-3">
                {reversibilityIcon(classification.level)}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {classification.action.name}
                    </span>
                    {reversibilityBadge(classification.level)}
                  </div>
                  <p className="mt-1 text-sm">{classification.explanation}</p>
                  {classification.canUndo && classification.undoWindowHours && (
                    <p className="mt-1 text-xs text-gray-500">
                      Undo window: {classification.undoWindowHours} hours (
                      {(classification.undoWindowHours / 24).toFixed(0)} days)
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {!selectedAction && (
            <TipBox>
              Select any action above to see whether it can be undone, and if
              so, how long you have. Green = safe to reverse. Amber = act fast.
              Red = permanent.
            </TipBox>
          )}
        </CardContent>
      </Card>

      {/* ── Section 2: Irreversibility Score Calculator ────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Irreversibility Score
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Toggle the factors below to compute an{" "}
            <JargonBuster
              term="Irreversibility Score"
              definition="A weighted 0-1 score measuring how irreversible a situation is. Each factor (regulator submission, patient impact, public communication, deadline, third-party dependency) contributes proportionally."
            >
              irreversibility score
            </JargonBuster>{" "}
            for your current situation.
          </p>

          <div className="space-y-2">
            {STANDARD_FACTORS.map((f, i) => (
              <label
                key={f.name}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                  factorStates[i]
                    ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950"
                    : "border-gray-200 dark:border-gray-800"
                }`}
              >
                <input
                  type="checkbox"
                  checked={factorStates[i]}
                  onChange={() => {
                    const next = [...factorStates];
                    next[i] = !next[i];
                    setFactorStates(next);
                  }}
                  className="h-4 w-4"
                />
                <div className="flex-1">
                  <span className="font-medium">{f.name}</span>
                  <span className="ml-2 text-xs text-gray-400">
                    weight: {(f.weight * 100).toFixed(0)}%
                  </span>
                </div>
              </label>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <ScoreMeter
              score={scoreResult.score * 100}
              zones={IRREVERSIBILITY_ZONES.map((z) => ({
                ...z,
                min: z.min * 100,
                max: z.max * 100,
              }))}
              label="Irreversibility"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  {(scoreResult.score * 100).toFixed(0)}%
                </span>
                {reversibilityBadge(scoreResult.level)}
              </div>
              {scoreResult.dominantFactor !== "none" && (
                <p className="text-sm text-gray-500">
                  Dominant factor: {scoreResult.dominantFactor}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 3: Point of No Return Simulator ────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Point of No Return
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Select a regulatory deadline type and slide the time to see when the{" "}
            <JargonBuster
              term="Point of No Return"
              definition="The moment when an action transitions from reversible (state that can change) to irreversible (permanent fact). In PV, this is typically a regulatory reporting deadline."
            >
              point of no return
            </JargonBuster>{" "}
            arrives.
          </p>

          {/* (source: ICH E2A Section IV.A, ICH E2C(R2), EU GVP Module IX) */}
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {DEADLINE_PRESETS.map((p) => (
              <Button
                key={p.id}
                variant={selectedPreset === p.id ? "default" : "outline"}
                onClick={() => {
                  setSelectedPreset(p.id);
                  setSimulatedHoursElapsed(0);
                }}
                className="h-auto flex-col p-3 text-left"
              >
                <span className="text-xs font-semibold">{p.name}</span>
                <span className="mt-1 text-xs opacity-60">
                  {(p.windowHours / 24).toFixed(0)} days
                </span>
              </Button>
            ))}
          </div>

          {ponrResult && (
            <>
              {/* Time slider */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="h-4 w-4" />
                  Hours elapsed: {simulatedHoursElapsed} /{" "}
                  {ponrResult.preset.windowHours}
                </label>
                <input
                  type="range"
                  min={0}
                  max={ponrResult.preset.windowHours * 1.2}
                  step={1}
                  value={simulatedHoursElapsed}
                  onChange={(e) =>
                    setSimulatedHoursElapsed(Number(e.target.value))
                  }
                  className="w-full"
                />
              </div>

              {/* Result display */}
              <div
                className={`rounded-lg border p-4 ${
                  ponrResult.result.urgency === "expired"
                    ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950"
                    : ponrResult.result.urgency === "critical"
                      ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
                      : ponrResult.result.urgency === "warning"
                        ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950"
                        : "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
                }`}
              >
                <div className="flex items-center gap-3">
                  <TrafficLight
                    level={urgencyTraffic(ponrResult.result.urgency).level}
                    label={urgencyTraffic(ponrResult.result.urgency).label}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold">
                        {ponrResult.result.pastDeadline
                          ? `${Math.abs(ponrResult.result.hoursRemaining)}h overdue`
                          : `${ponrResult.result.hoursRemaining}h remaining`}
                      </span>
                      <Badge
                        variant={
                          ponrResult.result.urgency === "expired"
                            ? "destructive"
                            : ponrResult.result.urgency === "critical"
                              ? "destructive"
                              : ponrResult.result.urgency === "warning"
                                ? "secondary"
                                : "default"
                        }
                      >
                        {ponrResult.result.urgency}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm">
                      {ponrResult.result.explanation}
                    </p>
                    <div className="mt-2 flex gap-4 text-xs text-gray-500">
                      <span>
                        Window:{" "}
                        {(ponrResult.result.percentElapsed * 100).toFixed(1)}%
                        elapsed
                      </span>
                      <span>Source: {ponrResult.preset.source}</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className={`h-full transition-all ${
                      ponrResult.result.urgency === "expired"
                        ? "bg-red-500"
                        : ponrResult.result.urgency === "critical"
                          ? "bg-red-400"
                          : ponrResult.result.urgency === "warning"
                            ? "bg-amber-400"
                            : "bg-green-400"
                    }`}
                    style={{
                      width: `${Math.min(100, ponrResult.result.percentElapsed * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {!selectedPreset && (
            <TipBox>
              Choose a deadline type to see the countdown. Slide the time
              forward to watch the urgency escalate from safe → warning →
              critical → expired. This is the ∝ primitive in action — the
              boundary where state becomes permanent.
            </TipBox>
          )}
        </CardContent>
      </Card>

      {/* Irreversibility warning */}
      <WarningBox>
        This tool illustrates the <strong>concept</strong> of irreversibility in
        PV regulatory actions. Actual undo windows depend on your
        organization&apos;s SOPs, the specific regulatory authority, and case
        circumstances. Always consult your QPPV or regulatory affairs team
        before relying on reversibility assumptions.
      </WarningBox>
    </div>
  );
}
