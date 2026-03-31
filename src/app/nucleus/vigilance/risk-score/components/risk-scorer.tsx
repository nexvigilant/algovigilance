"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ShieldAlert,
  Beaker,
  RotateCcw,
  ArrowRight,
  Server,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  TipBox,
  RememberBox,
  WarningBox,
  TechnicalStuffBox,
  StepWizard,
  TrafficLight,
  JargonBuster,
  ScoreMeter,
} from "@/components/pv-for-nexvigilants";
import type { TrafficLevel } from "@/components/pv-for-nexvigilants";
import {
  detectSignal,
  type SignalResult as PvosSignalResult,
} from "@/lib/pvos-client";
import { computeRiskScore, type RiskScoreResult } from "@/lib/pv-compute";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RiskInputs {
  drug: string;
  event: string;
  prr: string;
  ror_lower: string;
  ic025: string;
  eb05: string;
  n: string;
}

/* ------------------------------------------------------------------ */
/*  Score zone definitions for the ScoreMeter                          */
/* ------------------------------------------------------------------ */

const RISK_ZONES = [
  { label: "Low", min: 0, max: 33, color: "bg-emerald-500" },
  { label: "Medium", min: 33, max: 66, color: "bg-amber-500" },
  { label: "High", min: 66, max: 100, color: "bg-red-500" },
];

/* ------------------------------------------------------------------ */
/*  Example data for quick testing                                     */
/* ------------------------------------------------------------------ */

const EXAMPLE_INPUTS: RiskInputs = {
  drug: "Atorvastatin",
  event: "Rhabdomyolysis",
  prr: "4.2",
  ror_lower: "2.1",
  ic025: "1.5",
  eb05: "3.8",
  n: "47",
};

/* ------------------------------------------------------------------ */
/*  Compute risk (delegates to pv-compute)                             */
/* ------------------------------------------------------------------ */

function computeRisk(inputs: RiskInputs): RiskScoreResult | null {
  const prr = parseFloat(inputs.prr);
  const ror_lower = parseFloat(inputs.ror_lower);
  const ic025 = parseFloat(inputs.ic025);
  const eb05 = parseFloat(inputs.eb05);
  const n = parseFloat(inputs.n);

  if ([prr, ror_lower, ic025, eb05, n].some((v) => isNaN(v))) return null;

  return computeRiskScore({ prr, ror_lower, ic025, eb05, n });
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function RiskScorer() {
  const [inputs, setInputs] = useState<RiskInputs>({
    drug: "",
    event: "",
    prr: "",
    ror_lower: "",
    ic025: "",
    eb05: "",
    n: "",
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [hasComputed, setHasComputed] = useState(false);
  const [serverVerifying, setServerVerifying] = useState(false);
  const [serverResult, setServerResult] = useState<PvosSignalResult | null>(
    null,
  );

  const result = useMemo<RiskScoreResult | null>(() => {
    if (!hasComputed) return null;
    return computeRisk(inputs);
  }, [inputs, hasComputed]);

  const handleLoadExample = useCallback(() => {
    setInputs(EXAMPLE_INPUTS);
  }, []);

  const handleReset = useCallback(() => {
    setInputs({
      drug: "",
      event: "",
      prr: "",
      ror_lower: "",
      ic025: "",
      eb05: "",
      n: "",
    });
    setCurrentStep(0);
    setHasComputed(false);
    setServerResult(null);
  }, []);

  const handleVerifyWithServer = useCallback(async () => {
    const a = parseFloat(inputs.n) || 0;
    const prr = parseFloat(inputs.prr) || 0;
    // Derive contingency values from PRR and case count (best-effort estimates)
    // a = drug-event cases, b = drug-no-event (estimate), c = other-drug-event (estimate)
    // PRR ≈ (a/(a+b)) / (c/(c+d)), we set b=100, c=round(a/prr), d=10000
    const b = 100;
    const c = prr > 0 ? Math.max(1, Math.round(a / prr)) : 1;
    const d = 10000;
    setServerVerifying(true);
    const result = await detectSignal(
      inputs.drug,
      inputs.event,
      Math.round(a),
      b,
      c,
      d,
    );
    setServerResult(result);
    setServerVerifying(false);
  }, [inputs]);

  const handleChange = useCallback((key: keyof RiskInputs, value: string) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }, []);

  const canCompute =
    inputs.drug.trim().length > 0 &&
    inputs.event.trim().length > 0 &&
    !isNaN(parseFloat(inputs.prr)) &&
    !isNaN(parseFloat(inputs.n));

  const handleNext = useCallback(() => {
    if (currentStep === 0) {
      if (!canCompute) return;
      setHasComputed(true);
      setCurrentStep(1);
    } else if (currentStep === 1) {
      setCurrentStep(2);
    }
  }, [currentStep, canCompute]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  }, [currentStep]);

  const steps = useMemo(
    () => [
      {
        title: "Tell Us About the Drug",
        description:
          "Enter the drug name, the side effect you're worried about, and the signal metrics you have.",
        content: (
          <StepOneContent
            inputs={inputs}
            onChange={handleChange}
            onLoadExample={handleLoadExample}
          />
        ),
      },
      {
        title: "Here's Your Risk Score",
        description:
          "We combined your signal metrics into a single risk score. Here's what it means.",
        content: (
          <StepTwoContent
            result={result}
            serverVerifying={serverVerifying}
            serverResult={serverResult}
            onVerifyWithServer={handleVerifyWithServer}
          />
        ),
      },
      {
        title: "What Should You Do Next?",
        description:
          "Based on the risk level, here are recommended next steps.",
        content: <StepThreeContent result={result} onReset={handleReset} />,
      },
    ],
    [
      inputs,
      handleChange,
      handleLoadExample,
      result,
      handleReset,
      serverVerifying,
      serverResult,
      handleVerifyWithServer,
    ],
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <StepWizard
        steps={steps}
        currentStep={currentStep}
        onNext={currentStep === 0 && !canCompute ? undefined : handleNext}
        onBack={handleBack}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 1 — Input                                                     */
/* ------------------------------------------------------------------ */

function StepOneContent({
  inputs,
  onChange,
  onLoadExample,
}: {
  inputs: RiskInputs;
  onChange: (key: keyof RiskInputs, value: string) => void;
  onLoadExample: () => void;
}) {
  const fields: {
    key: keyof RiskInputs;
    label: string;
    explanation: string;
    type: "text" | "number";
    placeholder: string;
  }[] = [
    {
      key: "drug",
      label: "Drug name",
      explanation: "Which drug are you evaluating?",
      type: "text",
      placeholder: "e.g. Atorvastatin",
    },
    {
      key: "event",
      label: "Adverse event",
      explanation: "What side effect are you concerned about?",
      type: "text",
      placeholder: "e.g. Rhabdomyolysis",
    },
    {
      key: "prr",
      label: "PRR value",
      explanation:
        "The Proportional Reporting Ratio from your signal detection run. Signal threshold is 2.0.",
      type: "number",
      placeholder: "e.g. 4.2",
    },
    {
      key: "ror_lower",
      label: "ROR lower confidence interval",
      explanation:
        "The lower bound of the Reporting Odds Ratio 95% CI. Signal threshold is 1.0.",
      type: "number",
      placeholder: "e.g. 2.1",
    },
    {
      key: "ic025",
      label: "IC025 value",
      explanation:
        "The lower 2.5% bound of the Information Component. Signal threshold is 0.",
      type: "number",
      placeholder: "e.g. 1.5",
    },
    {
      key: "eb05",
      label: "EB05 value",
      explanation:
        "The 5th percentile of the EBGM posterior. Signal threshold is 2.0.",
      type: "number",
      placeholder: "e.g. 3.8",
    },
    {
      key: "n",
      label: "Number of reported cases",
      explanation:
        "How many individual case reports of this drug-event combination exist?",
      type: "number",
      placeholder: "e.g. 47",
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <TipBox>
        Already ran{" "}
        <JargonBuster
          term="Signal Detection"
          definition="Statistical tests that check whether a drug-event combination shows up more than expected in adverse event databases"
        >
          Signal Detection
        </JargonBuster>
        ? Grab your metrics from the Signals page and paste them here. If you
        don&apos;t have real data, try the example!
      </TipBox>

      <button
        type="button"
        onClick={onLoadExample}
        className="flex items-center gap-2 self-start rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 transition-colors hover:bg-cyan-500/20"
      >
        <Beaker className="h-4 w-4" aria-hidden="true" />
        Load example (Atorvastatin + Rhabdomyolysis)
      </button>

      <div className="grid gap-4">
        {fields.map((f) => (
          <div key={f.key} className="flex flex-col gap-1.5">
            <label
              htmlFor={`risk-${f.key}`}
              className="text-sm font-medium text-foreground"
            >
              {f.label}
            </label>
            <p className="text-xs text-muted-foreground">{f.explanation}</p>
            <input
              id={`risk-${f.key}`}
              type={f.type}
              step={f.type === "number" ? "any" : undefined}
              min={f.type === "number" ? "0" : undefined}
              value={inputs[f.key]}
              placeholder={f.placeholder}
              onChange={(e) => onChange(f.key, e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
            />
          </div>
        ))}
      </div>

      <TechnicalStuffBox>
        The risk score is a{" "}
        <JargonBuster
          term="weighted composite"
          definition="Each metric is scaled to 0-1 between its threshold and upper bound, then multiplied by a weight reflecting its importance. PRR gets 25%, ROR lower CI and IC025 and EB05 each get 20%, case count gets 15%."
        >
          weighted composite
        </JargonBuster>{" "}
        of five{" "}
        <JargonBuster
          term="disproportionality metrics"
          definition="Statistical measures that compare how often a drug-event pair appears versus what you'd expect by chance"
        >
          disproportionality metrics
        </JargonBuster>
        , mapped to a 0-100 scale and classified using the Theory of Vigilance
        harm taxonomy.
      </TechnicalStuffBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 2 — Results                                                   */
/* ------------------------------------------------------------------ */

function StepTwoContent({
  result,
  serverVerifying,
  serverResult,
  onVerifyWithServer,
}: {
  result: RiskScoreResult | null;
  serverVerifying: boolean;
  serverResult: PvosSignalResult | null;
  onVerifyWithServer: () => void;
}) {
  if (!result) {
    return (
      <WarningBox>
        We couldn&apos;t compute a score. Go back and make sure you&apos;ve
        entered at least the drug name, event, PRR, and case count.
      </WarningBox>
    );
  }

  const overallLevel: TrafficLevel = result.trafficLevel;

  // Compare client-side result with server result
  const clientSignalDetected = result.score >= 33;
  const serverAgrees =
    serverResult !== null &&
    serverResult.signal_detected === clientSignalDetected;

  return (
    <div className="flex flex-col gap-5">
      {/* Hero score */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <ScoreMeter
          score={result.score}
          label="Composite Risk Score"
          zones={RISK_ZONES}
        />
      </div>

      {/* ToV Harm Level */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="mb-3 flex items-center gap-3">
          <ShieldAlert className="h-5 w-5 text-red-400" aria-hidden="true" />
          <h4 className="text-sm font-semibold text-foreground">
            <JargonBuster
              term="Theory of Vigilance Harm Level"
              definition="A classification from A (negligible) to F (critical) that translates a numeric risk score into an actionable severity category"
            >
              ToV Harm Level
            </JargonBuster>
          </h4>
        </div>
        <TrafficLight level={overallLevel} label={result.harmLevel} />
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          {result.harmDescription}
        </p>
      </div>

      {/* Per-factor breakdown */}
      <div className="flex flex-col gap-3">
        <h4 className="text-sm font-semibold text-foreground">
          Factor-by-factor breakdown
        </h4>
        {result.factors.map((f) => (
          <div
            key={f.key}
            className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <TrafficLight level={f.level} label={f.label} />
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <JargonBuster term={f.friendlyName} definition={f.jargonDef}>
                <span className="font-mono text-sm tabular-nums">
                  {f.raw.toFixed(2)}
                </span>
              </JargonBuster>
              <span className="text-[10px] font-mono text-muted-foreground">
                {Math.round(f.normalized * 100)}% of range &times;{" "}
                {Math.round(f.weight * 100)}% weight
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Server verification */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="mb-3 flex items-center gap-3">
          <Server className="h-5 w-5 text-cyan/60" aria-hidden="true" />
          <h4 className="text-sm font-semibold text-foreground">
            Verify with server
          </h4>
        </div>
        <p className="mb-3 text-xs text-muted-foreground leading-relaxed">
          Cross-check the client-side risk score against the PVOS signal
          detection engine on the server. This sends your drug and event to the
          nexcore-api and compares its PRR-based signal verdict with our local
          calculation.
        </p>

        {!serverResult && (
          <button
            type="button"
            onClick={onVerifyWithServer}
            disabled={serverVerifying}
            className="flex items-center gap-2 rounded-lg border border-cyan/30 bg-cyan/5 px-4 py-2 text-sm font-medium text-cyan hover:bg-cyan/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {serverVerifying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Checking with server...
              </>
            ) : (
              <>
                <Server className="h-4 w-4" aria-hidden="true" />
                Verify with server
              </>
            )}
          </button>
        )}

        {serverResult && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              {serverAgrees ? (
                <CheckCircle2
                  className="h-4 w-4 text-emerald-400 shrink-0"
                  aria-hidden="true"
                />
              ) : (
                <AlertTriangle
                  className="h-4 w-4 text-amber-400 shrink-0"
                  aria-hidden="true"
                />
              )}
              <span
                className={`text-sm font-medium ${serverAgrees ? "text-emerald-300" : "text-amber-300"}`}
              >
                {serverAgrees
                  ? "Server agrees with client-side result"
                  : "Server result differs — review both"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                <p className="text-muted-foreground mb-1">Server algorithm</p>
                <p className="text-white uppercase">{serverResult.algorithm}</p>
              </div>
              <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                <p className="text-muted-foreground mb-1">Server statistic</p>
                <p className="text-white">
                  {serverResult.statistic.toFixed(3)}
                </p>
              </div>
              <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                <p className="text-muted-foreground mb-1">Signal detected</p>
                <p
                  className={
                    serverResult.signal_detected
                      ? "text-red-400"
                      : "text-emerald-400"
                  }
                >
                  {serverResult.signal_detected ? "Yes" : "No"}
                </p>
              </div>
              {serverResult.ci_lower !== undefined && (
                <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                  <p className="text-muted-foreground mb-1">95% CI lower</p>
                  <p className="text-white">
                    {serverResult.ci_lower.toFixed(3)}
                  </p>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onVerifyWithServer}
              disabled={serverVerifying}
              className="self-start flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors disabled:opacity-50"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              Re-check
            </button>
          </div>
        )}
      </div>

      <RememberBox>
        This score is a <strong>screening tool</strong>, not a diagnosis. It
        combines statistical signals into a single number to help you prioritize
        which drug-event pairs deserve deeper investigation.
      </RememberBox>

      <TechnicalStuffBox>
        Formula: risk = (normalize(PRR, 2, 10) &times; 0.25 + normalize(ROR
        lower, 1, 5) &times; 0.20 + normalize(IC025, 0, 3) &times; 0.20 +
        normalize(EB05, 2, 10) &times; 0.20 + normalize(N, 3, 100) &times; 0.15)
        &times; 100. Each normalize() clamps the value between its threshold and
        upper bound, then scales to 0-1. All computation runs client-side in
        your browser.
      </TechnicalStuffBox>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 3 — Next Steps                                                */
/* ------------------------------------------------------------------ */

function StepThreeContent({
  result,
  onReset,
}: {
  result: RiskScoreResult | null;
  onReset: () => void;
}) {
  if (!result) {
    return (
      <p className="text-sm text-muted-foreground">
        Complete the scoring first to see recommendations.
      </p>
    );
  }

  const overallLevel: TrafficLevel = result.trafficLevel;

  return (
    <div className="flex flex-col gap-5">
      {overallLevel === "green" && (
        <>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <h4 className="mb-2 text-base font-semibold text-emerald-300">
              Low risk — no immediate action needed
            </h4>
            <p className="text-sm leading-relaxed text-emerald-200/80">
              The signal metrics for this drug-event pair are below or near
              their standard thresholds. This doesn&apos;t mean the drug is 100%
              safe — it means the data doesn&apos;t show a notable pattern right
              now.
            </p>
          </div>
          <TipBox>
            Re-run this assessment quarterly or whenever new FAERS data becomes
            available. Signals can emerge as more reports accumulate.
          </TipBox>
        </>
      )}

      {overallLevel === "yellow" && (
        <>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
            <h4 className="mb-2 text-base font-semibold text-amber-300">
              Moderate risk — investigation recommended
            </h4>
            <p className="text-sm leading-relaxed text-amber-200/80">
              Some signal metrics are elevated. Here&apos;s what to do:
            </p>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-amber-200/80">
              <li className="flex gap-2">
                <ArrowRight
                  className="mt-0.5 h-4 w-4 shrink-0 text-amber-400"
                  aria-hidden="true"
                />
                <span>
                  Run a full signal detection to see individual metric details
                </span>
              </li>
              <li className="flex gap-2">
                <ArrowRight
                  className="mt-0.5 h-4 w-4 shrink-0 text-amber-400"
                  aria-hidden="true"
                />
                <span>
                  Perform a causality assessment on the strongest cases
                </span>
              </li>
              <li className="flex gap-2">
                <ArrowRight
                  className="mt-0.5 h-4 w-4 shrink-0 text-amber-400"
                  aria-hidden="true"
                />
                <span>
                  Review the medical literature for known associations
                </span>
              </li>
            </ul>
          </div>
          <RememberBox>
            A moderate score means &quot;dig deeper,&quot; not
            &quot;panic.&quot; Many signals at this level resolve with better
            data or clinical context.
          </RememberBox>
        </>
      )}

      {overallLevel === "red" && (
        <>
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
            <h4 className="mb-2 text-base font-semibold text-red-300">
              High risk — escalation recommended
            </h4>
            <p className="text-sm leading-relaxed text-red-200/80">
              Multiple metrics show a strong association. Recommended actions:
            </p>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-red-200/80">
              <li className="flex gap-2">
                <ArrowRight
                  className="mt-0.5 h-4 w-4 shrink-0 text-red-400"
                  aria-hidden="true"
                />
                <span>
                  Perform individual causality assessments on every case
                </span>
              </li>
              <li className="flex gap-2">
                <ArrowRight
                  className="mt-0.5 h-4 w-4 shrink-0 text-red-400"
                  aria-hidden="true"
                />
                <span>
                  Alert your safety team or QPPV for signal evaluation
                </span>
              </li>
              <li className="flex gap-2">
                <ArrowRight
                  className="mt-0.5 h-4 w-4 shrink-0 text-red-400"
                  aria-hidden="true"
                />
                <span>
                  Prepare a signal evaluation report for regulatory submission
                </span>
              </li>
            </ul>
          </div>
          <WarningBox>
            A high composite score indicates a strong statistical pattern, but
            clinical judgment remains essential. Consult medical experts before
            taking regulatory action.
          </WarningBox>
        </>
      )}

      <div className="flex flex-wrap gap-3">
        <a
          href="/nucleus/vigilance/signals"
          className="flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-5 py-2.5 text-sm font-medium text-cyan-300 transition-colors hover:bg-cyan-500/20"
        >
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
          Run Full Signal Detection
        </a>
        <a
          href="/nucleus/vigilance/causality"
          className="flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-5 py-2.5 text-sm font-medium text-cyan-300 transition-colors hover:bg-cyan-500/20"
        >
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
          Causality Assessment
        </a>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="flex items-center gap-2 self-start rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/10"
      >
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Score a different drug
      </button>

      {/* Station wire */}
      <div className="mt-6 rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-violet-400 mb-1">AlgoVigilance Station</p>
          <p className="text-[10px] text-white/40">Guardian risk scoring with ToV safety manifold. AI agents score risk at mcp.nexvigilant.com.</p>
        </div>
        <a href="/nucleus/glass/benefit-risk-lab" className="shrink-0 ml-4 rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-medium text-violet-300 hover:bg-violet-500/20 transition-colors">Glass B:R Lab</a>
      </div>
    </div>
  );
}
