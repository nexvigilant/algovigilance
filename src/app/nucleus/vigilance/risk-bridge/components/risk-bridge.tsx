"use client";

import { useState } from "react";
import {
  computeSignals,
  bridgeSignalToRisk,
  bridgeRiskToRegulatory,
} from "@/lib/pv-compute";
import type {
  SignalResult,
  ContingencyTable,
  RiskInput,
  RegulatoryAction,
  RegulatoryDecision,
} from "@/lib/pv-compute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  ScoreMeter,
  TipBox,
  JargonBuster,
  TrafficLight,
} from "@/components/pv-for-nexvigilants";
import type { TrafficLevel } from "@/components/pv-for-nexvigilants";
import { ArrowRight, Activity, Shield, Scale, FileCheck } from "lucide-react";

// ── Decision color map ────────────────────────────────────────────────────────

const DECISION_COLORS: Record<RegulatoryDecision, string> = {
  FAVORABLE: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  ACCEPTABLE: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  CONDITIONAL: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  UNFAVORABLE: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  NEGATIVE: "bg-red-500/20 text-red-400 border-red-500/30",
};

// ── Risk score zones for ScoreMeter ──────────────────────────────────────────

const RISK_ZONES = [
  { label: "Low Risk", min: 0, max: 20, color: "bg-emerald-500" },
  { label: "Moderate", min: 20, max: 60, color: "bg-amber-500" },
  { label: "High Risk", min: 60, max: 100, color: "bg-red-500" },
];

// ── TrafficLight level from decision ─────────────────────────────────────────

function decisionToTrafficLevel(decision: RegulatoryDecision): TrafficLevel {
  if (decision === "FAVORABLE" || decision === "ACCEPTABLE") return "green";
  if (decision === "CONDITIONAL") return "yellow";
  return "red";
}

// ── Compact stat card ─────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  signal,
}: {
  label: string;
  value: number;
  signal: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-white/10 bg-white/5 p-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-lg font-bold tabular-nums text-foreground">
        {isFinite(value) ? value.toFixed(2) : "∞"}
      </span>
      <Badge
        variant="outline"
        className={
          signal
            ? "w-fit border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
            : "w-fit border-white/20 bg-white/5 text-muted-foreground"
        }
      >
        {signal ? "Signal" : "No signal"}
      </Badge>
    </div>
  );
}

// ── Cell input ────────────────────────────────────────────────────────────────

function CellInput({
  id,
  label,
  description,
  value,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id} className="text-xs font-semibold text-foreground">
        {label}
      </Label>
      <p className="text-xs text-muted-foreground">{description}</p>
      <Input
        id={id}
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/5 border-white/10"
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type CellKey = keyof ContingencyTable;

interface CellState {
  a: string;
  b: string;
  c: string;
  d: string;
}

export function RiskBridge() {
  const [cells, setCells] = useState<CellState>({
    a: "15",
    b: "100",
    c: "20",
    d: "10000",
  });
  const [signalResult, setSignalResult] = useState<SignalResult | null>(null);
  const [benefitScore, setBenefitScore] = useState<number>(50);
  const [unmetNeed, setUnmetNeed] = useState<boolean>(false);
  const [alternativeAvailable, setAlternativeAvailable] =
    useState<boolean>(false);
  const [riskInput, setRiskInput] = useState<RiskInput | null>(null);
  const [regulatoryAction, setRegulatoryAction] =
    useState<RegulatoryAction | null>(null);
  const [step, setStep] = useState<number>(0);

  function handleDetectSignals() {
    const table: ContingencyTable = {
      a: Math.max(0, Number(cells.a) || 0),
      b: Math.max(0, Number(cells.b) || 0),
      c: Math.max(0, Number(cells.c) || 0),
      d: Math.max(0, Number(cells.d) || 0),
    };
    const result = computeSignals(table);
    setSignalResult(result);
    setStep(1);
  }

  function handleComputeRisk() {
    if (!signalResult) return;
    const risk = bridgeSignalToRisk(signalResult, {
      benefit_score: benefitScore,
      unmet_need: unmetNeed,
      alternative_available: alternativeAvailable,
    });
    setRiskInput(risk);
    setStep(2);
  }

  function handleGetRecommendation() {
    if (!riskInput) return;
    const action = bridgeRiskToRegulatory(riskInput);
    setRegulatoryAction(action);
    setStep(3);
  }

  function handleStartOver() {
    setCells({ a: "15", b: "100", c: "20", d: "10000" });
    setSignalResult(null);
    setBenefitScore(50);
    setUnmetNeed(false);
    setAlternativeAvailable(false);
    setRiskInput(null);
    setRegulatoryAction(null);
    setStep(0);
  }

  function updateCell(key: CellKey, value: string) {
    setCells((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="flex flex-col gap-8">
      {/* ── Section 1: Signal Detection ─────────────────────────────────────── */}
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-blue-400" aria-hidden="true" />
            Step 1 — Signal Detection
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <CellInput
              id="cell-a"
              label="a — Drug + Event"
              description="Cases with both drug and event"
              value={cells.a}
              onChange={(v) => updateCell("a", v)}
            />
            <CellInput
              id="cell-b"
              label="b — Drug, No Event"
              description="Drug without event"
              value={cells.b}
              onChange={(v) => updateCell("b", v)}
            />
            <CellInput
              id="cell-c"
              label="c — No Drug, Event"
              description="Event without drug"
              value={cells.c}
              onChange={(v) => updateCell("c", v)}
            />
            <CellInput
              id="cell-d"
              label="d — Neither"
              description="Neither drug nor event"
              value={cells.d}
              onChange={(v) => updateCell("d", v)}
            />
          </div>

          <Button onClick={handleDetectSignals} className="w-fit">
            Detect Signals
          </Button>

          {signalResult !== null && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard
                label="PRR"
                value={signalResult.prr}
                signal={signalResult.prr_signal}
              />
              <StatCard
                label="ROR"
                value={signalResult.ror}
                signal={signalResult.ror_signal}
              />
              <StatCard
                label="IC(0.25)"
                value={signalResult.ic025}
                signal={signalResult.ic_signal}
              />
              <StatCard
                label="EBGM"
                value={signalResult.ebgm}
                signal={signalResult.ebgm_signal}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Section 2: Risk Bridge ───────────────────────────────────────────── */}
      {step >= 1 && (
        <>
          <div className="flex items-center gap-3 px-2">
            <div className="h-px flex-1 bg-white/10" />
            <ArrowRight
              className="h-5 w-5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Scale className="h-4 w-4 text-amber-400" aria-hidden="true" />
                Step 2 — Risk Bridge
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <TipBox>
                The risk bridge translates raw signal numbers into a 0–100 risk
                score. PRR contributes up to 60 points, IC and EBGM each add 15,
                chi-square adds 10.
              </TipBox>

              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium text-foreground">
                  <JargonBuster
                    term="benefit-risk ratio"
                    definition="A way to weigh whether a drug's benefits justify its risks — like comparing the good and bad sides on a balance scale."
                  >
                    Benefit Score
                  </JargonBuster>
                  <span className="ml-2 font-bold tabular-nums text-foreground">
                    {benefitScore}
                  </span>
                </Label>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={[benefitScore]}
                  onValueChange={([v]) => setBenefitScore(v ?? 50)}
                  aria-label="Benefit score"
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0 — No benefit</span>
                  <span>100 — Maximum benefit</span>
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
                <div className="flex items-center gap-3">
                  <Switch
                    id="unmet-need"
                    checked={unmetNeed}
                    onCheckedChange={setUnmetNeed}
                    aria-label="Unmet medical need"
                  />
                  <Label
                    htmlFor="unmet-need"
                    className="cursor-pointer text-sm"
                  >
                    Unmet medical need
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    id="alt-available"
                    checked={alternativeAvailable}
                    onCheckedChange={setAlternativeAvailable}
                    aria-label="Therapeutic alternative available"
                  />
                  <Label
                    htmlFor="alt-available"
                    className="cursor-pointer text-sm"
                  >
                    Alternative available
                  </Label>
                </div>
              </div>

              <Button onClick={handleComputeRisk} className="w-fit">
                Compute Risk
              </Button>

              {riskInput !== null && (
                <ScoreMeter
                  score={riskInput.risk_score}
                  label="Risk Score"
                  zones={RISK_ZONES}
                />
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ── Section 3: Regulatory Decision ──────────────────────────────────── */}
      {step >= 2 && (
        <>
          <div className="flex items-center gap-3 px-2">
            <div className="h-px flex-1 bg-white/10" />
            <ArrowRight
              className="h-5 w-5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield
                  className="h-4 w-4 text-emerald-400"
                  aria-hidden="true"
                />
                Step 3 — Regulatory Decision
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <Button onClick={handleGetRecommendation} className="w-fit">
                Get Recommendation
              </Button>

              {regulatoryAction !== null && (
                <div className="flex flex-col gap-4">
                  <Badge
                    variant="outline"
                    className={`w-fit text-sm font-semibold ${DECISION_COLORS[regulatoryAction.decision]}`}
                  >
                    {regulatoryAction.decision}
                  </Badge>

                  <div className="grid gap-3 rounded-lg border border-white/10 bg-white/5 p-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Action
                      </span>
                      <span className="text-sm text-foreground">
                        {regulatoryAction.action.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Recommendation
                      </span>
                      <span className="text-sm text-foreground">
                        {regulatoryAction.recommendation}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Regulatory Reference
                      </span>
                      <span className="text-sm text-foreground">
                        {regulatoryAction.regulatory_reference}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ── Section 4: Summary ───────────────────────────────────────────────── */}
      {step >= 3 &&
        signalResult !== null &&
        riskInput !== null &&
        regulatoryAction !== null && (
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileCheck
                  className="h-4 w-4 text-purple-400"
                  aria-hidden="true"
                />
                Summary — Decision Chain
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              {/* Horizontal flow */}
              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                {/* Signal card */}
                <div className="flex flex-1 flex-col gap-2 rounded-lg border border-white/10 bg-white/5 p-4">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Signal
                  </span>
                  <span className="text-sm text-foreground">
                    PRR{" "}
                    {isFinite(signalResult.prr)
                      ? signalResult.prr.toFixed(2)
                      : "∞"}
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      signalResult.any_signal
                        ? "w-fit border-orange-500/40 bg-orange-500/10 text-orange-400"
                        : "w-fit border-white/20 bg-white/5 text-muted-foreground"
                    }
                  >
                    {signalResult.any_signal ? "Signal detected" : "No signal"}
                  </Badge>
                </div>

                <ArrowRight
                  className="mx-1 h-5 w-5 shrink-0 self-center text-muted-foreground"
                  aria-hidden="true"
                />

                {/* Risk score card */}
                <div className="flex flex-1 flex-col gap-2 rounded-lg border border-white/10 bg-white/5 p-4">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Risk Score
                  </span>
                  <span className="text-2xl font-bold tabular-nums text-foreground">
                    {riskInput.risk_score}
                    <span className="text-sm font-normal text-muted-foreground">
                      /100
                    </span>
                  </span>
                </div>

                <ArrowRight
                  className="mx-1 h-5 w-5 shrink-0 self-center text-muted-foreground"
                  aria-hidden="true"
                />

                {/* Decision card */}
                <div className="flex flex-1 flex-col gap-2 rounded-lg border border-white/10 bg-white/5 p-4">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Decision
                  </span>
                  <Badge
                    variant="outline"
                    className={`w-fit ${DECISION_COLORS[regulatoryAction.decision]}`}
                  >
                    {regulatoryAction.decision}
                  </Badge>
                </div>
              </div>

              <TrafficLight
                level={decisionToTrafficLevel(regulatoryAction.decision)}
                label={`Benefit-Risk Assessment: ${regulatoryAction.decision}`}
              />

              <Button
                variant="outline"
                onClick={handleStartOver}
                className="w-fit border-white/20 bg-white/5"
              >
                Start Over
              </Button>
            </CardContent>
          </Card>
        )}

      {/* Station wire */}
      <div className="mt-6 rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-violet-400 mb-1">AlgoVigilance Station</p>
          <p className="text-[10px] text-white/40">Signal-to-risk bridge via Guardian risk scoring. AI agents compute risk at mcp.nexvigilant.com.</p>
        </div>
        <a href="/nucleus/glass/benefit-risk-lab" className="shrink-0 ml-4 rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-medium text-violet-300 hover:bg-violet-500/20 transition-colors">Glass B:R Lab</a>
      </div>
    </div>
  );
}
