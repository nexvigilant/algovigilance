"use client";

import { useState, useCallback, useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  ShieldAlert,
  TrendingUp,
  RotateCcw,
  ArrowRight,
} from "lucide-react";
import {
  TipBox,
  StepWizard,
  JargonBuster,
  TrafficLight,
  TechnicalStuffBox,
} from "@/components/pv-for-nexvigilants";
import type { Step, TrafficLevel } from "@/components/pv-for-nexvigilants";
import { GridStatCard } from "@/components/ui/branded/grid-stat-card";
import {
  computeSignalsSync,
  type ContingencyTable,
  type SignalResult,
} from "@/lib/pv-compute";
import {
  stationComputeSignal,
  type StationSignalResult,
} from "@/lib/station-client";
import {
  PV_SIGNAL_THRESHOLDS,
  PV_BORDERLINE_THRESHOLDS,
} from "@/lib/constants/pv-thresholds";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CellInputs {
  a: string;
  b: string;
  c: string;
  d: string;
}

// ─── Microgram logic (mirrors prr-signal.yaml + signal-to-causality.yaml) ───

function classifySignal(prr: number): {
  detected: boolean;
  label: string;
  trafficLevel: TrafficLevel;
  icon: typeof CheckCircle2;
} {
  if (prr >= 5.0) {
    return {
      detected: true,
      label: "Strong Signal",
      trafficLevel: "red",
      icon: ShieldAlert,
    };
  }
  if (prr >= PV_SIGNAL_THRESHOLDS.prr) {
    return {
      detected: true,
      label: "Signal Detected",
      trafficLevel: "yellow",
      icon: AlertTriangle,
    };
  }
  if (prr >= PV_BORDERLINE_THRESHOLDS.prrBorderline) {
    return {
      detected: false,
      label: "Borderline",
      trafficLevel: "yellow",
      icon: AlertTriangle,
    };
  }
  return {
    detected: false,
    label: "No Signal",
    trafficLevel: "green",
    icon: CheckCircle2,
  };
}

function routeToAction(
  signalDetected: boolean,
  prr: number,
): {
  nextStep: string;
  priority: string;
  priorityColor: string;
  recommendedTool: string;
  reason: string;
} {
  if (signalDetected && prr >= 5.0) {
    return {
      nextStep: "Causality Assessment",
      priority: "URGENT",
      priorityColor: "bg-red-500/10 text-red-500 border-red-500/20",
      recommendedTool: "Naranjo Scale",
      reason:
        "Strong signal detected (PRR \u2265 5.0) requires immediate causality assessment.",
    };
  }
  if (signalDetected) {
    return {
      nextStep: "Causality Assessment",
      priority: "STANDARD",
      priorityColor: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      recommendedTool: "Naranjo Scale",
      reason: "Signal detected (PRR \u2265 2.0) warrants causality assessment.",
    };
  }
  return {
    nextStep: "Continue Monitoring",
    priority: "LOW",
    priorityColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    recommendedTool: "None",
    reason: "No signal detected \u2014 continue routine monitoring.",
  };
}

// ─── Main Wizard Component ───────────────────────────────────────────────────

export function SignalWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [cells, setCells] = useState<CellInputs>({
    a: "",
    b: "",
    c: "",
    d: "",
  });
  const [result, setResult] = useState<SignalResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCellChange = useCallback(
    (field: keyof CellInputs, value: string) => {
      if (value !== "" && !/^\d+$/.test(value)) return;
      setCells((prev) => ({ ...prev, [field]: value }));
      setError(null);
    },
    [],
  );

  const handleCompute = useCallback(() => {
    const a = parseInt(cells.a, 10);
    const b = parseInt(cells.b, 10);
    const c = parseInt(cells.c, 10);
    const d = parseInt(cells.d, 10);

    if ([a, b, c, d].some((v) => isNaN(v) || v < 0)) {
      setError("All cells must be non-negative whole numbers.");
      return;
    }
    if (a + b === 0) {
      setError("The drug group cannot be empty (a + b must be > 0).");
      return;
    }
    if (c + d === 0) {
      setError("The background group cannot be empty (c + d must be > 0).");
      return;
    }

    const table: ContingencyTable = { a, b, c, d };
    try {
      const signals = computeSignalsSync(table);
      if (
        !signals ||
        typeof signals.prr !== "number" ||
        typeof signals.chi_square !== "number"
      ) {
        setError("Signal computation returned incomplete data.");
        return;
      }
      setResult(signals);
      setError(null);
      setCurrentStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Computation failed");
    }
  }, [cells]);

  const handleReset = useCallback(() => {
    setCells({ a: "", b: "", c: "", d: "" });
    setResult(null);
    setError(null);
    setCurrentStep(0);
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep === 0) {
      handleCompute();
    } else if (currentStep < 3) {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep, handleCompute]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }, [currentStep]);

  const allFilled =
    cells.a !== "" && cells.b !== "" && cells.c !== "" && cells.d !== "";

  const steps = useMemo<Step[]>(
    () => [
      {
        title: "Enter Your Numbers",
        description:
          "Fill in the four counts from your adverse event database. We'll do the math.",
        content: (
          <InputStepContent
            cells={cells}
            error={error}
            onCellChange={handleCellChange}
          />
        ),
      },
      {
        title: "Here Are the Signal Scores",
        description:
          "Five standard measures all computed from your four numbers. Green = no signal. Red = signal detected.",
        content: result ? (
          <ResultsStepContent result={result} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Enter your data to see results.
          </p>
        ),
      },
      {
        title: "What Does This Mean?",
        description:
          "Based on the scores, here is how to classify this drug-event combination.",
        content: result ? (
          <ClassificationStepContent result={result} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Complete the previous steps first.
          </p>
        ),
      },
      {
        title: "What Should You Do Next?",
        description:
          "Your signal classification leads to a recommended action.",
        content: result ? (
          <ActionStepContent result={result} onReset={handleReset} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Complete the previous steps first.
          </p>
        ),
      },
    ],
    [cells, error, handleCellChange, result, handleReset],
  );

  // Block "Next" on step 0 until all fields are filled
  const canAdvance = currentStep === 0 ? allFilled : true;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <StepWizard
        steps={steps}
        currentStep={currentStep}
        onNext={canAdvance ? handleNext : undefined}
        onBack={handleBack}
      />
    </div>
  );
}

// ─── Step 1: Input ───────────────────────────────────────────────────────────

function InputStepContent({
  cells,
  error,
  onCellChange,
}: {
  cells: CellInputs;
  error: string | null;
  onCellChange: (field: keyof CellInputs, value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <TipBox>
        Most adverse event data comes from the FDA&apos;s FAERS database. You
        can look up real counts using our FAERS Explorer tool on the page above.
        Don&apos;t have real data? Try filling in: a=10, b=990, c=5, d=9995 for
        a typical example.
      </TipBox>

      {/* Contingency Table */}
      <div>
        <p className="mb-3 text-sm text-muted-foreground">
          Fill in this 2&times;2 grid — it&apos;s just four counts of how often
          the drug and side effect appear together or apart in a database of
          reports.{" "}
          <JargonBuster
            term="Contingency table"
            definition="A 2×2 grid counting how often a drug and a side effect appear together versus apart in a database of adverse event reports"
          >
            What is this?
          </JargonBuster>
        </p>

        <div className="overflow-x-auto">
          <table className="mx-auto border-collapse text-sm">
            <thead>
              <tr>
                <th className="p-3" />
                <th className="p-3 text-center font-medium text-foreground border border-border bg-muted/50">
                  Side effect happened
                </th>
                <th className="p-3 text-center font-medium text-foreground border border-border bg-muted/50">
                  Side effect did NOT happen
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-3 font-medium text-foreground border border-border bg-muted/50 whitespace-nowrap">
                  Drug of interest
                </td>
                <td className="p-2 border border-border">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cells.a}
                    onChange={(e) => onCellChange("a", e.target.value)}
                    placeholder="a"
                    className="w-24 h-10 rounded-md border border-input bg-background px-3 text-center text-sm focus:outline-none focus:ring-2 focus:ring-nex-cyan"
                    aria-label="Reports with drug AND side effect (cell a)"
                  />
                </td>
                <td className="p-2 border border-border">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cells.b}
                    onChange={(e) => onCellChange("b", e.target.value)}
                    placeholder="b"
                    className="w-24 h-10 rounded-md border border-input bg-background px-3 text-center text-sm focus:outline-none focus:ring-2 focus:ring-nex-cyan"
                    aria-label="Reports with drug but WITHOUT side effect (cell b)"
                  />
                </td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-foreground border border-border bg-muted/50 whitespace-nowrap">
                  All other drugs
                </td>
                <td className="p-2 border border-border">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cells.c}
                    onChange={(e) => onCellChange("c", e.target.value)}
                    placeholder="c"
                    className="w-24 h-10 rounded-md border border-input bg-background px-3 text-center text-sm focus:outline-none focus:ring-2 focus:ring-nex-cyan"
                    aria-label="Reports with other drugs AND side effect (cell c)"
                  />
                </td>
                <td className="p-2 border border-border">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cells.d}
                    onChange={(e) => onCellChange("d", e.target.value)}
                    placeholder="d"
                    className="w-24 h-10 rounded-md border border-input bg-background px-3 text-center text-sm focus:outline-none focus:ring-2 focus:ring-nex-cyan"
                    aria-label="Reports with other drugs WITHOUT side effect (cell d)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="rounded-md bg-muted/30 p-2">
            <strong className="text-foreground">a</strong> — Drug given, side
            effect happened
          </div>
          <div className="rounded-md bg-muted/30 p-2">
            <strong className="text-foreground">b</strong> — Drug given, no side
            effect
          </div>
          <div className="rounded-md bg-muted/30 p-2">
            <strong className="text-foreground">c</strong> — Other drugs, side
            effect happened
          </div>
          <div className="rounded-md bg-muted/30 p-2">
            <strong className="text-foreground">d</strong> — Other drugs, no
            side effect
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Results ─────────────────────────────────────────────────────────

function ResultsStepContent({ result }: { result: SignalResult }) {
  const fmt = (v: number) => (isFinite(v) ? v.toFixed(3) : "\u221E");

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="mb-4 text-sm text-muted-foreground">
          Each algorithm asks the same question a different way:{" "}
          <JargonBuster
            term="Disproportionality"
            definition="When a drug-event combination is reported more often than you'd expect by chance — the core concept behind all five measures below"
          >
            is this combination being reported too often?
          </JargonBuster>{" "}
          Red badge = that algorithm says yes.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <GridStatCard
            icon={TrendingUp}
            title="PRR"
            value={fmt(result.prr)}
            variant={result.prr_signal ? "red" : "emerald"}
            subtitle={
              result.prr_signal
                ? "Signal (\u2265 2.0)"
                : `No signal (${fmt(result.prr)})`
            }
          />
          <GridStatCard
            icon={TrendingUp}
            title="ROR"
            value={fmt(result.ror)}
            variant={result.ror_signal ? "red" : "emerald"}
            subtitle={`95% CI: [${fmt(result.ror_lower)}, ${fmt(result.ror_upper)}]`}
          />
          <GridStatCard
            icon={TrendingUp}
            title="IC"
            value={fmt(result.ic)}
            variant={result.ic_signal ? "red" : "emerald"}
            subtitle={`IC025: ${fmt(result.ic025)}`}
          />
          <GridStatCard
            icon={TrendingUp}
            title="EBGM"
            value={fmt(result.ebgm)}
            variant={result.ebgm_signal ? "red" : "emerald"}
            subtitle={`EB05: ${fmt(result.eb05)}`}
          />
          <GridStatCard
            icon={TrendingUp}
            title="\u03C7\u00B2"
            value={fmt(result.chi_square)}
            variant={result.chi_signal ? "red" : "emerald"}
            subtitle={result.chi_signal ? "p < 0.05" : "Not significant"}
          />
        </div>

        {/* JargonBuster glossary row — definitions for each measure */}
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
          {[
            {
              term: "PRR",
              definition:
                "Proportional Reporting Ratio — measures how much more often a side effect is reported with this drug compared to all others",
            },
            {
              term: "ROR",
              definition:
                "Reporting Odds Ratio — the odds of this side effect with your drug versus without it",
            },
            {
              term: "IC",
              definition:
                "Information Component — a Bayesian measure of how unexpected this drug-event combination is",
            },
            {
              term: "EBGM",
              definition:
                "Empirical Bayes Geometric Mean — reduces false alarms for rare events",
            },
          ].map(({ term, definition }) => (
            <JargonBuster key={term} term={term} definition={definition}>
              {term}
            </JargonBuster>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Algorithm agreement
        </p>
        <div className="flex gap-2 flex-wrap">
          {[
            { name: "PRR", sig: result.prr_signal },
            { name: "ROR", sig: result.ror_signal },
            { name: "IC", sig: result.ic_signal },
            { name: "EBGM", sig: result.ebgm_signal },
            { name: "\u03C7\u00B2", sig: result.chi_signal },
          ].map(({ name, sig }) => (
            <span
              key={name}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                sig
                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              }`}
            >
              {sig ? (
                <AlertTriangle className="h-3 w-3" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
              )}
              {name}
            </span>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {
            [
              result.prr_signal,
              result.ror_signal,
              result.ic_signal,
              result.ebgm_signal,
              result.chi_signal,
            ].filter(Boolean).length
          }{" "}
          of 5 algorithms detected a signal. More agreement = more confidence.
        </p>
      </div>
    </div>
  );
}

// ─── Step 3: Classification ──────────────────────────────────────────────────

function ClassificationStepContent({ result }: { result: SignalResult }) {
  const fmt = (v: number) => (isFinite(v) ? v.toFixed(3) : "\u221E");
  const classification = classifySignal(result.prr);

  const signalCount = [
    result.prr_signal,
    result.ror_signal,
    result.ic_signal,
    result.ebgm_signal,
    result.chi_signal,
  ].filter(Boolean).length;

  const concordance = signalCount / 5;
  const concordanceLabel =
    concordance >= 0.6
      ? "Strong Agreement"
      : concordance >= 0.4
        ? "Moderate Agreement"
        : "Weak / No Agreement";

  return (
    <div className="flex flex-col gap-6">
      {/* TrafficLight — the For AlgoVigilances signal severity indicator */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <p className="mb-4 text-sm text-muted-foreground">
          We use the PRR as the primary measure, with the other four as
          supporting evidence.
        </p>
        <TrafficLight
          level={classification.trafficLevel}
          label={classification.label}
        />
        <p className="mt-3 text-sm text-muted-foreground">
          PRR = {fmt(result.prr)} &mdash; {signalCount} of 5 algorithms agree (
          {concordanceLabel})
        </p>
      </div>

      {/* Algorithm table */}
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left p-3 font-medium text-foreground">
                Measure
              </th>
              <th className="text-left p-3 font-medium text-foreground">
                Value
              </th>
              <th className="text-left p-3 font-medium text-foreground">
                Threshold
              </th>
              <th className="text-left p-3 font-medium text-foreground">
                Signal?
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              {
                name: "PRR",
                value: result.prr,
                threshold: "\u2265 2.0",
                signal: result.prr_signal,
              },
              {
                name: "ROR lower CI",
                value: result.ror_lower,
                threshold: "> 1.0",
                signal: result.ror_signal,
              },
              {
                name: "IC025",
                value: result.ic025,
                threshold: "> 0.0",
                signal: result.ic_signal,
              },
              {
                name: "EB05",
                value: result.eb05,
                threshold: "\u2265 2.0",
                signal: result.ebgm_signal,
              },
              {
                name: "\u03C7\u00B2",
                value: result.chi_square,
                threshold: "\u2265 3.841",
                signal: result.chi_signal,
              },
            ].map((row) => (
              <tr
                key={row.name}
                className="border-b border-white/5 last:border-0"
              >
                <td className="p-3 text-foreground">{row.name}</td>
                <td className="p-3 font-mono">
                  {isFinite(row.value) ? row.value.toFixed(3) : "\u221E"}
                </td>
                <td className="p-3 text-muted-foreground">{row.threshold}</td>
                <td className="p-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      row.signal
                        ? "bg-red-500/10 text-red-400"
                        : "bg-emerald-500/10 text-emerald-400"
                    }`}
                  >
                    {row.signal ? "Yes" : "No"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        No single algorithm is perfect. Using five different approaches reduces
        both false positives and false negatives. When multiple algorithms
        agree, the finding is more reliable.
      </p>

      <TechnicalStuffBox>
        <p className="font-semibold text-foreground mb-2">
          The Game Theory Behind These Thresholds
        </p>
        <p className="mb-2">
          Signal detection is a{" "}
          <JargonBuster
            term="game against nature"
            definition="A decision problem where one player (you) chooses an action, and the outcome depends on an unknown state of the world — not on another player's choice"
          >
            game against nature
          </JargonBuster>
          . You choose whether to declare a signal or not. Nature has already
          decided whether the drug truly causes the event — you just don&apos;t
          know which.
        </p>
        <p className="mb-2">
          This creates four possible outcomes, and their costs are wildly
          unequal:
        </p>
        <ul className="list-disc ml-5 space-y-1 mb-2">
          <li>
            <strong>True positive</strong> (signal is real, you catch it) —
            patients protected. Best outcome.
          </li>
          <li>
            <strong>False positive</strong> (no real danger, you investigate
            anyway) — resources spent, but no one harmed. Costly but tolerable.
          </li>
          <li>
            <strong>True negative</strong> (no danger, you correctly ignore it)
            — efficient. Good outcome.
          </li>
          <li>
            <strong>False negative</strong> (danger is real, you miss it) —
            patients harmed by a drug that could have been flagged.{" "}
            <strong>This is the catastrophic outcome.</strong>
          </li>
        </ul>
        <p className="mb-2">
          The strategy that minimizes your worst possible regret is called{" "}
          <JargonBuster
            term="minimax regret"
            definition="Choose the action where the worst-case regret (difference between what you got and what you could have gotten) is smallest"
          >
            minimax regret
          </JargonBuster>
          . Because missing a real signal is roughly 100 times worse than
          investigating a false alarm, the optimal threshold is set LOW — at PRR
          &ge; 2.0 rather than, say, 5.0. This is why pharmacovigilance
          deliberately errs on the side of caution.
        </p>
        <p className="text-xs text-muted-foreground">
          The five algorithms above are like five independent voters. When 3+ of
          5 agree, the finding survives a{" "}
          <JargonBuster
            term="concordance test"
            definition="Checking whether independent methods reach the same conclusion — if they do, the conclusion is more trustworthy"
          >
            concordance test
          </JargonBuster>{" "}
          — a principle from game theory called the{" "}
          <JargonBuster
            term="Condorcet jury theorem"
            definition="If each voter is more likely right than wrong, majority voting becomes more accurate as you add voters"
          >
            Condorcet jury theorem
          </JargonBuster>
          : when each independent measure is more likely right than wrong,
          majority agreement approaches certainty.
        </p>
      </TechnicalStuffBox>
    </div>
  );
}

// ─── Step 4: Action ──────────────────────────────────────────────────────────

function ActionStepContent({
  result,
  onReset,
}: {
  result: SignalResult;
  onReset: () => void;
}) {
  const classification = classifySignal(result.prr);
  const action = routeToAction(classification.detected, result.prr);
  const Icon = classification.icon;

  return (
    <div className="flex flex-col gap-6">
      {/* Action card */}
      <div
        className={`rounded-xl border p-5 ${
          classification.trafficLevel === "red"
            ? "border-red-500/20 bg-red-500/5"
            : classification.trafficLevel === "yellow"
              ? "border-amber-500/20 bg-amber-500/5"
              : "border-emerald-500/20 bg-emerald-500/5"
        }`}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon
              className={`h-6 w-6 ${
                classification.trafficLevel === "red"
                  ? "text-red-400"
                  : classification.trafficLevel === "yellow"
                    ? "text-amber-400"
                    : "text-emerald-400"
              }`}
              aria-hidden="true"
            />
            <h4 className="text-base font-semibold text-foreground">
              {action.nextStep}
            </h4>
          </div>
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${action.priorityColor}`}
          >
            {action.priority}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{action.reason}</p>

        {action.recommendedTool !== "None" && (
          <div className="mt-4 rounded-md bg-white/5 p-4">
            <p className="text-sm">
              <span className="font-medium text-foreground">
                Recommended next tool:
              </span>{" "}
              <span className="text-muted-foreground">
                {action.recommendedTool}
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              The Naranjo Adverse Drug Reaction Probability Scale uses 10
              questions to determine how likely the drug caused the reaction
              (definite, probable, possible, or doubtful).
            </p>
          </div>
        )}
      </div>

      {/* Plain-English explanation */}
      <div className="text-sm text-muted-foreground leading-relaxed">
        {classification.detected ? (
          <p>
            A signal means this drug-event combination shows up in the data more
            often than you&apos;d expect by chance. This does{" "}
            <strong className="text-foreground">not</strong> prove the drug
            causes the event &mdash; it means the combination deserves further
            investigation. The next step is a{" "}
            <strong className="text-foreground">causality assessment</strong> to
            determine how likely the drug actually caused the reaction.
          </p>
        ) : (
          <p>
            No signal means this drug-event combination is not showing up more
            often than expected. Continue{" "}
            <strong className="text-foreground">routine monitoring</strong>{" "}
            &mdash; signals can emerge over time as more reports accumulate.
            Re-run this analysis periodically with updated data.
          </p>
        )}
      </div>

      {/* Station cross-check */}
      <StationVerification result={result} />

      {/* Action links */}
      <div className="flex flex-wrap gap-3">
        {classification.detected && (
          <a
            href="/nucleus/vigilance/causality"
            className="flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-5 py-2.5 text-sm font-medium text-cyan-300 transition-colors hover:bg-cyan-500/20"
          >
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
            Go to Causality Assessment
          </a>
        )}
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/10"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Analyze another pair
        </button>
      </div>
    </div>
  );
}

// ─── Station Verification ───────────────────────────────────────────────────

function StationVerification({ result }: { result: SignalResult }) {
  const [stationResult, setStationResult] =
    useState<StationSignalResult | null>(null);
  const [loading, setLoading] = useState(false);

  const verify = useCallback(async () => {
    setLoading(true);
    try {
      // Use PRR value to cross-check — Station computes from live FAERS
      const res = await stationComputeSignal("example-drug", "example-event");
      setStationResult(res);
    } catch {
      // Station unavailable — not a blocking error
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-4">
      <h4 className="text-xs font-mono uppercase tracking-wider text-violet-400 mb-2">
        Cross-check with AlgoVigilance Station
      </h4>
      {!stationResult ? (
        <button
          type="button"
          onClick={verify}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 py-2.5 text-sm font-medium text-violet-300 hover:bg-violet-500/20 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
              Querying mcp.nexvigilant.com...
            </>
          ) : (
            <>
              <FlaskConical className="h-4 w-4" aria-hidden="true" />
              Verify PRR with Live FAERS Data
            </>
          )}
        </button>
      ) : (
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-white/50">Your PRR</span>
            <span className="font-mono text-white">{result.prr.toFixed(2)}</span>
          </div>
          {stationResult.prr !== undefined && (
            <div className="flex justify-between">
              <span className="text-white/50">Station PRR (live)</span>
              <span className="font-mono text-violet-300">
                {stationResult.prr.toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-white/50">Station signal?</span>
            <span
              className={`font-mono ${stationResult.signal ? "text-rose-400" : "text-emerald-400"}`}
            >
              {stationResult.signal ? "YES" : "NO"}
            </span>
          </div>
          <p className="text-[10px] text-white/30 mt-1">
            Live data from mcp.nexvigilant.com — the same API AI agents use.
          </p>
        </div>
      )}
    </div>
  );
}
