"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ScoreMeter,
  TipBox,
  JargonBuster,
  TrafficLight,
} from "@/components/pv-for-nexvigilants";
import {
  computeA1DataGeneration,
  computeA2NoiseDominance,
  computeA3SignalExistence,
  assessAllAxioms,
} from "@/lib/pv-compute";
// Types (A1Result, A2Result, A3Result, CombinedAssessment) used via inference
import {
  Database,
  Volume2,
  Target,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";

// ── Zone palettes (Tailwind classes — matched by ScoreMeter's cn() call) ─────

const UTILIZATION_ZONES = [
  { min: 0, max: 30, label: "Insufficient", color: "bg-red-500" },
  { min: 30, max: 70, label: "Moderate", color: "bg-amber-500" },
  { min: 70, max: 100, label: "Good", color: "bg-emerald-500" },
];

const NOISE_ZONES = [
  { min: 0, max: 30, label: "Low noise", color: "bg-emerald-500" },
  { min: 30, max: 60, label: "Moderate", color: "bg-amber-500" },
  { min: 60, max: 80, label: "High", color: "bg-orange-500" },
  { min: 80, max: 100, label: "Overwhelming", color: "bg-red-500" },
];

const SIGNAL_ZONES = [
  { min: 0, max: 40, label: "Absent", color: "bg-red-500" },
  { min: 40, max: 70, label: "Weak", color: "bg-amber-500" },
  { min: 70, max: 100, label: "Detected", color: "bg-emerald-500" },
];

// ── Verdict helpers ───────────────────────────────────────────────────────────

function verdictBadgeVariant(
  verdict: string,
): "default" | "secondary" | "destructive" {
  if (verdict === "Good" || verdict === "Detected") return "default";
  if (verdict === "Insufficient" || verdict === "Absent") return "destructive";
  return "secondary";
}

function axiomPassIcon(passes: boolean) {
  return passes ? (
    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
  ) : (
    <XCircle className="h-5 w-5 text-red-500" />
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function TheoryExplorer() {
  // A1 — Data Generation
  const [reportsReceived, setReportsReceived] = useState(500);
  const [capacity, setCapacity] = useState(10000);

  // A2 — Noise
  const [noiseRatio, setNoiseRatio] = useState(0.3);
  const [backgroundLevel, setBackgroundLevel] = useState(0.2);

  // A3 — Signal
  const [confidence, setConfidence] = useState(0.7);
  const [observedCount, setObservedCount] = useState(30);
  const [expectedCount, setExpectedCount] = useState(15);

  // ── Computed via pv-compute ──────────────────────────────────────────────
  const a1 = useMemo(
    () => computeA1DataGeneration(reportsReceived, capacity),
    [reportsReceived, capacity],
  );
  const a2 = useMemo(() => computeA2NoiseDominance(noiseRatio), [noiseRatio]);
  const a3 = useMemo(
    () => computeA3SignalExistence(confidence, observedCount, expectedCount),
    [confidence, observedCount, expectedCount],
  );
  const combined = useMemo(() => assessAllAxioms(a1, a2, a3), [a1, a2, a3]);

  // Destructure for template compatibility
  const { utilization } = a1;
  const a1Verdict = a1.verdict;
  const a1Passes = a1.passes;
  const { snr, overwhelming } = a2;
  const a2Verdict = a2.verdict;
  const a2Passes = a2.passes;
  const signalStrength = a3.strength;
  const a3Verdict = a3.verdict;
  const a3Passes = a3.passes;
  const { passCount, overallLevel: overallLight } = combined;
  const overallLabel =
    passCount === 3
      ? "All axioms satisfied"
      : passCount >= 1
        ? "Partial — signal conditions at risk"
        : "Signal detection blocked";

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-100">
          Signal Theory Axioms
        </h1>
        <p className="text-gray-400">
          The Theory of Vigilance rests on three axioms. Adjust the sliders to
          see how each axiom behaves — and what it takes for a{" "}
          <JargonBuster
            term="pharmacovigilance signal"
            definition="A pattern in safety data suggesting a possible causal relationship between a drug and an adverse event. Requires sufficient data (A1), low enough noise (A2), and measurable deviation above background (A3)."
          >
            safety signal
          </JargonBuster>{" "}
          to emerge.
        </p>
      </div>

      {/* Three axiom tabs */}
      <Tabs defaultValue="a1">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="a1" className="gap-2">
            <Database className="h-4 w-4" />
            A1 · Data
          </TabsTrigger>
          <TabsTrigger value="a2" className="gap-2">
            <Volume2 className="h-4 w-4" />
            A2 · Noise
          </TabsTrigger>
          <TabsTrigger value="a3" className="gap-2">
            <Target className="h-4 w-4" />
            A3 · Signal
          </TabsTrigger>
        </TabsList>

        {/* ── A1: Data Generation ─────────────────────────────────────────── */}
        <TabsContent value="a1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-400" />
                Axiom 1 — Data Generation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-gray-400">
                Safety signal detection requires enough reports. Too few cases
                and the math cannot reach statistical thresholds — the database
                is underpowered regardless of how real the risk is.
              </p>

              {/* Reports received slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-200">
                    Reports received
                  </label>
                  <span className="tabular-nums text-sm text-gray-400">
                    {reportsReceived.toLocaleString()}
                  </span>
                </div>
                <Slider
                  value={[reportsReceived]}
                  onValueChange={(val: number[]) => setReportsReceived(val[0])}
                  min={0}
                  max={10000}
                  step={50}
                />
              </div>

              {/* Capacity slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-200">
                    Database capacity
                  </label>
                  <span className="tabular-nums text-sm text-gray-400">
                    {capacity.toLocaleString()}
                  </span>
                </div>
                <Slider
                  value={[capacity]}
                  onValueChange={(val: number[]) => setCapacity(val[0])}
                  min={100}
                  max={50000}
                  step={100}
                />
              </div>

              {/* Utilization meter */}
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <ScoreMeter
                  score={Math.round(utilization * 100)}
                  label="Database utilization"
                  zones={UTILIZATION_ZONES}
                />
                <div className="mt-3 flex items-center gap-2">
                  {axiomPassIcon(a1Passes)}
                  <span className="text-sm font-medium text-gray-200">
                    Verdict:
                  </span>
                  <Badge variant={verdictBadgeVariant(a1Verdict)}>
                    {a1Verdict}
                  </Badge>
                  <span className="text-sm text-gray-400">
                    ({(utilization * 100).toFixed(1)}% utilized)
                  </span>
                </div>
              </div>

              <TipBox>
                A utilization above 30% means you have enough case volume to
                begin signal detection. Below that, even a real signal may
                disappear in the noise of small numbers.
              </TipBox>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── A2: Noise ───────────────────────────────────────────────────── */}
        <TabsContent value="a2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-amber-400" />
                Axiom 2 — Noise Separation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-gray-400">
                Spontaneous reporting databases are noisy. Every drug produces
                background reports — some real reactions, some coincidences.
                Signal detection only works when the true signal rises above
                that background.
              </p>

              {/* Noise ratio slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-200">
                    Noise ratio
                  </label>
                  <span className="tabular-nums text-sm text-gray-400">
                    {(noiseRatio * 100).toFixed(0)}%
                  </span>
                </div>
                <Slider
                  value={[Math.round(noiseRatio * 100)]}
                  onValueChange={(val: number[]) => setNoiseRatio(val[0] / 100)}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>

              {/* Background level slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-200">
                    Background reporting level
                  </label>
                  <span className="tabular-nums text-sm text-gray-400">
                    {(backgroundLevel * 100).toFixed(0)}%
                  </span>
                </div>
                <Slider
                  value={[Math.round(backgroundLevel * 100)]}
                  onValueChange={(val: number[]) =>
                    setBackgroundLevel(val[0] / 100)
                  }
                  min={0}
                  max={100}
                  step={1}
                />
              </div>

              {/* SNR display + noise meter */}
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3">
                <ScoreMeter
                  score={Math.round(noiseRatio * 100)}
                  label="Noise level"
                  zones={NOISE_ZONES}
                />
                <div className="flex items-center gap-4 pt-1">
                  <div className="flex items-center gap-2">
                    {axiomPassIcon(a2Passes)}
                    <span className="text-sm font-medium text-gray-200">
                      Verdict:
                    </span>
                    <Badge
                      variant={verdictBadgeVariant(
                        a2Passes ? "Good" : "Insufficient",
                      )}
                    >
                      {a2Verdict}
                    </Badge>
                  </div>
                  <span className="text-sm text-gray-400">
                    SNR: {isFinite(snr) ? snr.toFixed(2) : "∞"} : 1
                  </span>
                </div>
              </div>

              {overwhelming ? (
                <div className="flex items-start gap-2 rounded-lg border border-red-800 bg-red-950/40 p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
                  <p className="text-sm text-red-300">
                    Noise ratio above 80% — the background overwhelms the
                    signal. Disproportionality methods (PRR, ROR) cannot
                    distinguish true reactions from reporting noise.
                  </p>
                </div>
              ) : (
                <TipBox>
                  The{" "}
                  <JargonBuster
                    term="signal-to-noise ratio (SNR)"
                    definition="The ratio of true signal to background noise. A higher SNR means the adverse event stands out more clearly above baseline reporting rates, making it easier to detect."
                  >
                    signal-to-noise ratio
                  </JargonBuster>{" "}
                  of {isFinite(snr) ? snr.toFixed(1) : "∞"} means for every
                  noise report there are{" "}
                  {isFinite(snr) ? snr.toFixed(1) : "many"} signal reports.
                </TipBox>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── A3: Signal ──────────────────────────────────────────────────── */}
        <TabsContent value="a3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-400" />
                Axiom 3 — Signal Existence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-gray-400">
                A signal exists when observed adverse event reports are
                statistically higher than expected. The z-score threshold of
                1.96 corresponds to 95% confidence — the standard in signal
                detection.
              </p>

              {/* Confidence slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-200">
                    Analyst confidence
                  </label>
                  <span className="tabular-nums text-sm text-gray-400">
                    {(confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <Slider
                  value={[Math.round(confidence * 100)]}
                  onValueChange={(val: number[]) => setConfidence(val[0] / 100)}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>

              {/* Observed count slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-200">
                    Observed cases (n)
                  </label>
                  <span className="tabular-nums text-sm text-gray-400">
                    {observedCount}
                  </span>
                </div>
                <Slider
                  value={[observedCount]}
                  onValueChange={(val: number[]) => setObservedCount(val[0])}
                  min={0}
                  max={200}
                  step={1}
                />
              </div>

              {/* Expected count slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-200">
                    Expected cases (E)
                  </label>
                  <span className="tabular-nums text-sm text-gray-400">
                    {expectedCount}
                  </span>
                </div>
                <Slider
                  value={[expectedCount]}
                  onValueChange={(val: number[]) => setExpectedCount(val[0])}
                  min={1}
                  max={200}
                  step={1}
                />
              </div>

              {/* Signal meter */}
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3">
                <ScoreMeter
                  score={Math.max(
                    0,
                    Math.min(100, ((signalStrength + 2) / 6) * 100),
                  )}
                  label="Signal strength (z-score)"
                  zones={SIGNAL_ZONES}
                />
                <div className="flex items-center gap-3 pt-1 flex-wrap">
                  <div className="flex items-center gap-2">
                    {axiomPassIcon(a3Passes)}
                    <Badge variant={verdictBadgeVariant(a3Verdict)}>
                      {a3Verdict}
                    </Badge>
                  </div>
                  <span className="text-sm text-gray-400">
                    z = {signalStrength.toFixed(2)} (threshold: 1.96)
                  </span>
                  {confidence <= 0.5 && (
                    <Badge variant="secondary">Low confidence</Badge>
                  )}
                </div>
              </div>

              <TipBox>
                A z-score above 1.96 means the observed count is unlikely to be
                due to chance alone (p &lt; 0.05). Combined with analyst
                confidence above 50%, this constitutes a detectable signal.
              </TipBox>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Combined assessment ───────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Combined Axiom Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {/* A1 */}
            <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
              {axiomPassIcon(a1Passes)}
              <div>
                <div className="text-sm font-medium text-gray-200">
                  A1 · Data
                </div>
                <Badge
                  variant={verdictBadgeVariant(a1Verdict)}
                  className="mt-1 text-xs"
                >
                  {a1Verdict}
                </Badge>
              </div>
            </div>

            {/* A2 */}
            <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
              {axiomPassIcon(a2Passes)}
              <div>
                <div className="text-sm font-medium text-gray-200">
                  A2 · Noise
                </div>
                <Badge
                  variant={verdictBadgeVariant(
                    a2Passes ? "Good" : "Insufficient",
                  )}
                  className="mt-1 text-xs"
                >
                  {a2Verdict}
                </Badge>
              </div>
            </div>

            {/* A3 */}
            <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
              {axiomPassIcon(a3Passes)}
              <div>
                <div className="text-sm font-medium text-gray-200">
                  A3 · Signal
                </div>
                <Badge
                  variant={verdictBadgeVariant(a3Verdict)}
                  className="mt-1 text-xs"
                >
                  {a3Verdict}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-lg border border-white/10 bg-white/5 p-4">
            <TrafficLight level={overallLight} label={overallLabel} />
            <div>
              <div className="font-semibold text-gray-100">{overallLabel}</div>
              <div className="mt-0.5 text-sm text-gray-400">
                {passCount} of 3 axioms satisfied
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
