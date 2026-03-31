"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  FlaskConical,
  Info,
  RotateCcw,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { JargonBuster } from "@/components/pv-for-nexvigilants";
import {
  computeNaranjo,
  computeWhoUmc,
  type NaranjoResult,
  type WhoUmcResult,
  type TemporalRelationship,
  type DechallengeResult,
  type RechallengeResult,
  type AlternativeCauses,
} from "@/lib/pv-compute";
import { fetchLiveNaranjo } from "../station-client";

// ─── Types ────────────────────────────────────────────────────────────────────

type AnswerValue = 1 | -1 | 0;

// ─── Naranjo Questions ───────────────────────────────────────────────────────

interface NaranjoQuestion {
  id: number;
  question: string;
  plain: string;
  yesPoints: number;
  noPoints: number;
  hint: string;
}

const NARANJO_QUESTIONS: NaranjoQuestion[] = [
  {
    id: 1,
    question: "Are there previous conclusive reports on this reaction?",
    plain:
      "Has this reaction been documented in published medical literature for this drug?",
    yesPoints: 1,
    noPoints: 0,
    hint: "Check the drug label, published case reports, or pharmacovigilance databases.",
  },
  {
    id: 2,
    question:
      "Did the adverse event appear after the suspected drug was administered?",
    plain:
      "Did the reaction start AFTER the patient took the drug (not before)?",
    yesPoints: 2,
    noPoints: -1,
    hint: "Temporal sequence is essential. 'No' here strongly argues against causality.",
  },
  {
    id: 3,
    question:
      "Did the adverse reaction improve when the drug was discontinued or a specific antagonist was given?",
    plain:
      "Did the reaction get better after stopping the drug or giving an antidote?",
    yesPoints: 1,
    noPoints: 0,
    hint: "Positive dechallenge is a classic signal of drug causality.",
  },
  {
    id: 4,
    question:
      "Did the adverse reaction reappear when the drug was re-administered?",
    plain:
      "Did the same reaction happen AGAIN when the patient restarted the drug?",
    yesPoints: 2,
    noPoints: -1,
    hint: "Positive rechallenge is the strongest evidence of drug causality. Often not done due to safety concerns.",
  },
  {
    id: 5,
    question:
      "Are there alternative causes that could on their own have caused the reaction?",
    plain:
      "Could something else — another drug, an illness, or a patient factor — fully explain the reaction?",
    yesPoints: -1,
    noPoints: 2,
    hint: "Think about concomitant medications, comorbidities, and patient history.",
  },
  {
    id: 6,
    question: "Did the reaction appear when a placebo was given?",
    plain:
      "Did this reaction occur when the patient received a sugar pill with no active drug?",
    yesPoints: -1,
    noPoints: 1,
    hint: "Usually answered 'Unknown' in spontaneous reports. Important in clinical trials.",
  },
  {
    id: 7,
    question:
      "Was the drug detected in blood (or other fluids) in concentrations known to be toxic?",
    plain:
      "Was there a drug blood level test showing the drug was at a harmful level?",
    yesPoints: 1,
    noPoints: 0,
    hint: "Relevant for drugs with narrow therapeutic windows (e.g., digoxin, phenytoin, lithium).",
  },
  {
    id: 8,
    question:
      "Was the reaction more severe when the dose was increased, or less severe when the dose was decreased?",
    plain:
      "Did increasing the dose make things worse, or decreasing the dose make things better?",
    yesPoints: 1,
    noPoints: 0,
    hint: "A clear dose-response relationship supports drug causality.",
  },
  {
    id: 9,
    question:
      "Did the patient have a similar reaction to the same or similar drugs in any previous exposure?",
    plain:
      "Has the patient reacted this way before to this drug or a drug in the same class?",
    yesPoints: 1,
    noPoints: 0,
    hint: "Prior reaction history is relevant context. Check allergy and ADR history.",
  },
  {
    id: 10,
    question: "Was the adverse event confirmed by any objective evidence?",
    plain:
      "Was the reaction confirmed by lab tests, imaging, biopsy, or other objective tests?",
    yesPoints: 1,
    noPoints: 0,
    hint: "Objective confirmation increases confidence. Examples: liver enzymes for hepatotoxicity, ECG for QT prolongation.",
  },
];

// ─── Practice Case Scenarios ────────────────────────────────────────────────

interface CaseScenario {
  name: string;
  drug: string;
  event: string;
  description: string;
  answers: AnswerValue[];
}

const CASE_SCENARIOS: CaseScenario[] = [
  {
    name: "Semaglutide & Pancreatitis",
    drug: "Semaglutide (Ozempic)",
    event: "Acute Pancreatitis",
    description:
      "68yo male started semaglutide for T2DM. 3 weeks later, presented with severe epigastric pain radiating to back. Lipase 4x ULN. Drug stopped, symptoms resolved in 5 days. No rechallenge. No gallstones on imaging. Prior reports exist in literature.",
    answers: [1, 1, 1, 0, -1, 0, 0, 0, 0, 1] as AnswerValue[],
  },
  {
    name: "Amoxicillin & Maculopapular Rash",
    drug: "Amoxicillin",
    event: "Maculopapular Rash",
    description:
      "24yo female prescribed amoxicillin for pharyngitis. Day 7: diffuse maculopapular rash. Drug continued (unaware), rash worsened. Stopped on Day 10, rash cleared in 3 days. Had similar rash with ampicillin 2 years ago. Concurrent EBV infection possible.",
    answers: [1, 1, 1, 0, 1, 0, 0, 1, 1, 1] as AnswerValue[],
  },
  {
    name: "Metformin & Lactic Acidosis",
    drug: "Metformin",
    event: "Lactic Acidosis",
    description:
      "72yo male on metformin 2g/day for 5 years. Admitted with acute kidney injury (Cr 4.2). Lactate 8.1 mmol/L. Metformin stopped, lactate normalized in 48h after dialysis. AKI from dehydration (gastroenteritis). Metformin level elevated.",
    answers: [1, 1, 1, 0, 1, 0, 1, 0, 0, 1] as AnswerValue[],
  },
];

// ─── Step Config ─────────────────────────────────────────────────────────────

type LabStep = "intro" | "questions" | "result";
const STEP_ORDER: LabStep[] = ["intro", "questions", "result"];
const STEP_LABELS: Record<LabStep, string> = {
  intro: "Overview",
  questions: "10 Questions",
  result: "Assessment",
};

// ─── Category Config ─────────────────────────────────────────────────────────

interface CategoryConfig {
  label: string;
  range: string;
  description: string;
  color: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
}

const CATEGORY_CONFIG: Record<NaranjoResult["category"], CategoryConfig> = {
  Definite: {
    label: "Definite",
    range: "Score >= 9",
    description:
      "Strong evidence supports a causal relationship. The drug is highly likely to have caused this reaction.",
    color: "text-red-400",
    borderColor: "border-red-500/30",
    bgColor: "bg-red-500/5",
    textColor: "text-red-300",
  },
  Probable: {
    label: "Probable",
    range: "Score 5 – 8",
    description:
      "Good evidence supports causality. In most pharmacovigilance systems, this triggers expedited reporting.",
    color: "text-orange-400",
    borderColor: "border-orange-500/30",
    bgColor: "bg-orange-500/5",
    textColor: "text-orange-300",
  },
  Possible: {
    label: "Possible",
    range: "Score 1 – 4",
    description:
      "Causality is plausible but not well-supported. Further evidence is needed before regulatory action.",
    color: "text-amber-400",
    borderColor: "border-amber-500/30",
    bgColor: "bg-amber-500/5",
    textColor: "text-amber-300",
  },
  Doubtful: {
    label: "Doubtful",
    range: "Score <= 0",
    description:
      "Causality is unlikely based on available information. Drug is probably not responsible for the reaction.",
    color: "text-emerald-400",
    borderColor: "border-emerald-500/30",
    bgColor: "bg-emerald-500/5",
    textColor: "text-emerald-300",
  },
};

// ─── Answer Toggle ────────────────────────────────────────────────────────────

function AnswerToggle({
  value,
  onChange,
  yesPoints,
  noPoints,
}: {
  value: AnswerValue;
  onChange: (v: AnswerValue) => void;
  yesPoints: number;
  noPoints: number;
}) {
  const options: { label: string; value: AnswerValue; pts: string }[] = [
    {
      label: "Yes",
      value: 1,
      pts: yesPoints >= 0 ? `+${yesPoints}` : `${yesPoints}`,
    },
    {
      label: "No",
      value: -1,
      pts: noPoints >= 0 ? `+${noPoints}` : `${noPoints}`,
    },
    { label: "Unknown", value: 0, pts: "0" },
  ];

  return (
    <div className="flex gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.label}
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex-1 rounded border py-1.5 text-[10px] font-mono uppercase tracking-wider transition-all",
            value === opt.value
              ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
              : "border-white/10 bg-white/[0.02] text-white/30 hover:text-white/50 hover:border-white/20",
          )}
        >
          <span className="block">{opt.label}</span>
          <span
            className={cn(
              "block text-[9px] mt-0.5",
              value === opt.value ? "text-cyan-400/70" : "text-white/20",
            )}
          >
            {opt.pts} pts
          </span>
        </button>
      ))}
    </div>
  );
}

// ─── Score Bar ────────────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  // Naranjo range: -4 to +13. Map to 0-100%.
  const MIN = -4;
  const MAX = 13;
  const pct = Math.max(0, Math.min(100, ((score - MIN) / (MAX - MIN)) * 100));

  const getBarColor = () => {
    if (score >= 9) return "bg-red-500";
    if (score >= 5) return "bg-orange-500";
    if (score >= 1) return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] font-mono">
        <span className="text-white/30">-4</span>
        <span className="text-white/50">Score: {score}</span>
        <span className="text-white/30">+13</span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            getBarColor(),
          )}
          style={{ width: `${pct}%` }}
        />
        {/* Threshold markers */}
        {[
          { val: 1, pct: ((1 - MIN) / (MAX - MIN)) * 100 },
          { val: 5, pct: ((5 - MIN) / (MAX - MIN)) * 100 },
          { val: 9, pct: ((9 - MIN) / (MAX - MIN)) * 100 },
        ].map((m) => (
          <div
            key={m.val}
            className="absolute top-0 h-full w-px bg-white/20"
            style={{ left: `${m.pct}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[9px] font-mono text-white/20">
        <span>Doubtful</span>
        <span>Possible</span>
        <span>Probable</span>
        <span>Definite</span>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

// ─── WHO-UMC Derivation from Naranjo Answers ───────────────────────────────

function deriveWhoUmcInputs(a: AnswerValue[]) {
  const temporal: TemporalRelationship =
    a[1] === 1 ? "reasonable" : a[1] === -1 ? "unlikely" : "unknown";
  const dechallenge: DechallengeResult =
    a[2] === 1 ? "positive" : a[2] === -1 ? "negative" : "unknown";
  const rechallenge: RechallengeResult =
    a[3] === 1 ? "positive" : a[3] === -1 ? "negative" : "not_done";
  const alternatives: AlternativeCauses =
    a[4] === 1 ? "probable" : a[4] === -1 ? "unlikely" : "unknown";
  return { temporal, dechallenge, rechallenge, alternatives };
}

const WHO_UMC_COLORS: Record<
  string,
  { color: string; border: string; bg: string }
> = {
  Certain: {
    color: "text-red-400",
    border: "border-red-500/30",
    bg: "bg-red-500/5",
  },
  "Probable/Likely": {
    color: "text-orange-400",
    border: "border-orange-500/30",
    bg: "bg-orange-500/5",
  },
  Possible: {
    color: "text-amber-400",
    border: "border-amber-500/30",
    bg: "bg-amber-500/5",
  },
  Unlikely: {
    color: "text-emerald-400",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/5",
  },
  "Conditional/Unclassified": {
    color: "text-sky-400",
    border: "border-sky-500/30",
    bg: "bg-sky-500/5",
  },
  "Unassessable/Unclassifiable": {
    color: "text-zinc-400",
    border: "border-zinc-500/30",
    bg: "bg-zinc-500/5",
  },
};

export default function CausalityAssessmentLab() {
  const [step, setStep] = useState<LabStep>("intro");
  const [answers, setAnswers] = useState<AnswerValue[]>(
    Array(10).fill(0) as AnswerValue[],
  );
  const [expandedHint, setExpandedHint] = useState<number | null>(null);
  const [activeCase, setActiveCase] = useState<string | null>(null);
  const [stationResult, setStationResult] = useState<{
    score: number;
    category: string;
  } | null>(null);
  const [stationLoading, setStationLoading] = useState(false);

  const stepIndex = STEP_ORDER.indexOf(step);

  const result: NaranjoResult = useMemo(
    () => computeNaranjo(answers),
    [answers],
  );

  const whoUmcResult: WhoUmcResult = useMemo(
    () => computeWhoUmc(deriveWhoUmcInputs(answers)),
    [answers],
  );

  const handleAnswer = useCallback((i: number, v: AnswerValue) => {
    setAnswers((prev) => {
      const next = [...prev] as AnswerValue[];
      next[i] = v;
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    setAnswers(Array(10).fill(0) as AnswerValue[]);
    setExpandedHint(null);
    setActiveCase(null);
    setStationResult(null);
    setStep("intro");
  }, []);

  const verifyWithStation = useCallback(async () => {
    setStationLoading(true);
    try {
      const drug = activeCase?.split(" ")[0] ?? "semaglutide";
      const event = activeCase?.includes("Pancreatitis")
        ? "pancreatitis"
        : activeCase?.includes("Lactic")
          ? "lactic acidosis"
          : "adverse event";
      const live = await fetchLiveNaranjo(drug.toLowerCase(), event, answers);
      setStationResult(live);
    } finally {
      setStationLoading(false);
    }
  }, [answers, activeCase]);

  const loadCase = useCallback((scenario: CaseScenario) => {
    setAnswers([...scenario.answers]);
    setActiveCase(scenario.name);
    setStep("questions");
  }, []);

  const goNext = useCallback(() => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx < STEP_ORDER.length - 1) setStep(STEP_ORDER[idx + 1]);
  }, [step]);

  const goBack = useCallback(() => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]);
  }, [step]);

  const catConfig = CATEGORY_CONFIG[result.category];
  const answeredCount = answers.filter((a) => a !== 0).length;

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-golden-4">
      {/* Header */}
      <header className="mb-golden-3 text-center pt-golden-3">
        <div className="flex items-center justify-center gap-2 mb-golden-1">
          <FlaskConical className="h-5 w-5 text-cyan-400" />
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/40">
            Academy Lab
          </p>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2">
          Causality Assessment Lab
        </h1>
        <p className="text-sm text-white/50 max-w-xl mx-auto leading-relaxed">
          Score 10 clinical questions to determine whether a drug caused an
          adverse reaction. Every calculation runs in your browser — instant, no
          server required.
        </p>
      </header>

      {/* Step Progress */}
      <div className="max-w-2xl mx-auto mb-golden-3 px-4">
        <div className="flex items-center gap-1">
          {STEP_ORDER.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <button
                onClick={() => {
                  if (i <= stepIndex) setStep(s);
                }}
                disabled={i > stepIndex}
                className={cn(
                  "flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded transition-colors w-full",
                  i === stepIndex
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                    : i < stepIndex
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "text-white/20",
                )}
              >
                {i < stepIndex ? (
                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                ) : (
                  <span className="h-3 w-3 shrink-0 text-center">{i + 1}</span>
                )}
                <span className="hidden sm:inline truncate">
                  {STEP_LABELS[s]}
                </span>
              </button>
              {i < STEP_ORDER.length - 1 && (
                <div
                  className={cn(
                    "w-4 h-px mx-0.5 shrink-0",
                    i < stepIndex ? "bg-emerald-500/30" : "bg-white/10",
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-2xl mx-auto px-4">
        {/* ── Step 1: Intro ── */}
        {step === "intro" && (
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5">
              <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <p className="text-xs text-cyan-300/80 leading-relaxed">
                The{" "}
                <JargonBuster
                  term="Naranjo scale"
                  definition="A 10-question scoring algorithm (Naranjo et al., 1981) that estimates the probability that an adverse drug reaction is caused by the drug. Scores range from -4 to +13."
                >
                  Naranjo ADR Probability Scale
                </JargonBuster>{" "}
                is the most widely used tool in pharmacovigilance for scoring
                individual case causality. It is fast, structured, and
                reproducible — qualities that matter when regulators review your
                work.
              </p>
            </div>

            {/* Category overview */}
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-white/40 mb-3">
                Causality Categories
              </h3>
              <div className="space-y-2">
                {(
                  [
                    "Definite",
                    "Probable",
                    "Possible",
                    "Doubtful",
                  ] as NaranjoResult["category"][]
                ).map((cat) => {
                  const cfg = CATEGORY_CONFIG[cat];
                  return (
                    <div
                      key={cat}
                      className={cn(
                        "flex items-center justify-between rounded border p-2.5",
                        cfg.borderColor,
                        cfg.bgColor,
                      )}
                    >
                      <span className={cn("text-sm font-semibold", cfg.color)}>
                        {cfg.label}
                      </span>
                      <span className="text-[10px] font-mono text-white/40">
                        {cfg.range}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* How it works */}
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-white/40 mb-3">
                How to Answer
              </h3>
              <ul className="space-y-1.5 text-xs text-white/50">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400/60 font-mono shrink-0">
                    Yes
                  </span>
                  <span>Evidence supports this criterion being met</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400/60 font-mono shrink-0">
                    No
                  </span>
                  <span>
                    Evidence clearly indicates this criterion is NOT met
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400/60 font-mono shrink-0">
                    Unknown
                  </span>
                  <span>
                    Information is missing or unavailable — always scores 0 and
                    does not penalize
                  </span>
                </li>
              </ul>
            </div>

            {/* Practice Cases */}
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-white/40 mb-3">
                Practice with Real Cases
              </h3>
              <div className="space-y-2">
                {CASE_SCENARIOS.map((scenario) => (
                  <button
                    key={scenario.name}
                    onClick={() => loadCase(scenario)}
                    className="w-full text-left rounded border border-white/10 bg-white/[0.02] p-3 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-white/80">
                        {scenario.name}
                      </span>
                      <span className="text-[9px] font-mono text-cyan-400/60 uppercase">
                        Load Case
                      </span>
                    </div>
                    <p className="text-[10px] text-white/40 leading-relaxed line-clamp-2">
                      {scenario.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={goNext}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 py-2.5 text-sm font-medium text-cyan-300 hover:bg-cyan-500/20 transition-colors"
            >
              <ArrowRight className="h-4 w-4" />
              Start Blank Assessment
            </button>
          </div>
        )}

        {/* ── Step 2: Questions ── */}
        {step === "questions" && (
          <div className="space-y-3">
            {/* Active case banner */}
            {activeCase && (
              <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-violet-400/60">
                    Practice Case: {activeCase}
                  </span>
                  <button
                    onClick={() => setActiveCase(null)}
                    className="text-[9px] font-mono text-white/30 hover:text-white/50"
                  >
                    Clear
                  </button>
                </div>
                <p className="text-[10px] text-violet-300/50 mt-1 leading-relaxed">
                  {
                    CASE_SCENARIOS.find((c) => c.name === activeCase)
                      ?.description
                  }
                </p>
              </div>
            )}
            {/* Live score ticker */}
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 sticky top-0 z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">
                  Running Score
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-lg font-bold font-mono",
                      catConfig.color,
                    )}
                  >
                    {result.score > 0 ? `+${result.score}` : result.score}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-mono px-1.5 py-0.5 rounded border",
                      catConfig.borderColor,
                      catConfig.bgColor,
                      catConfig.textColor,
                    )}
                  >
                    {result.category.toUpperCase()}
                  </span>
                </div>
              </div>
              <ScoreBar score={result.score} />
              <div className="mt-1.5 text-[9px] font-mono text-white/20 text-right">
                {answeredCount}/10 answered
              </div>
            </div>

            {NARANJO_QUESTIONS.map((q, i) => (
              <div
                key={q.id}
                className="rounded-lg border border-white/10 bg-white/[0.02] p-3"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-mono text-cyan-400/60 shrink-0 mt-0.5">
                    Q{q.id}
                  </span>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-white/80 leading-relaxed">
                      {q.plain}
                    </p>
                    <p className="text-[10px] text-white/30 mt-0.5 italic">
                      {q.question}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setExpandedHint(expandedHint === i ? null : i)
                    }
                    className="shrink-0 text-white/20 hover:text-white/50 transition-colors"
                    aria-label={`Hint for question ${q.id}`}
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                  </button>
                </div>

                {expandedHint === i && (
                  <div className="mb-2 text-[10px] text-amber-300/70 bg-amber-500/5 border border-amber-500/15 rounded px-2 py-1.5 leading-relaxed">
                    {q.hint}
                  </div>
                )}

                <AnswerToggle
                  value={answers[i]}
                  onChange={(v) => handleAnswer(i, v)}
                  yesPoints={q.yesPoints}
                  noPoints={q.noPoints}
                />
              </div>
            ))}

            <button
              onClick={goNext}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 py-2.5 text-sm font-medium text-cyan-300 hover:bg-cyan-500/20 transition-colors"
            >
              <ArrowRight className="h-4 w-4" />
              See Final Assessment
            </button>
          </div>
        )}

        {/* ── Step 3: Result ── */}
        {step === "result" && (
          <div className="space-y-4">
            {/* Verdict card */}
            <div
              className={cn(
                "rounded-lg border p-6 text-center",
                catConfig.borderColor,
                catConfig.bgColor,
              )}
            >
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-2">
                Naranjo ADR Causality
              </p>
              <h2
                className={cn(
                  "text-4xl font-extrabold font-mono mb-1",
                  catConfig.color,
                )}
              >
                {result.score > 0 ? `+${result.score}` : result.score}
              </h2>
              <p className={cn("text-xl font-bold mb-3", catConfig.color)}>
                {result.category}
              </p>
              <p className="text-xs text-white/50 max-w-sm mx-auto leading-relaxed">
                {catConfig.description}
              </p>
            </div>

            {/* WHO-UMC Dual Assessment */}
            <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-violet-400/60 mb-3">
                WHO-UMC Comparison
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div
                  className={cn(
                    "rounded border p-3 text-center",
                    catConfig.borderColor,
                    catConfig.bgColor,
                  )}
                >
                  <p className="text-[9px] font-mono uppercase text-white/30 mb-1">
                    Naranjo
                  </p>
                  <p className={cn("text-lg font-bold", catConfig.color)}>
                    {result.category}
                  </p>
                  <p className="text-[10px] font-mono text-white/30">
                    Score: {result.score}
                  </p>
                </div>
                <div
                  className={cn(
                    "rounded border p-3 text-center",
                    WHO_UMC_COLORS[whoUmcResult.category]?.border ??
                      "border-white/10",
                    WHO_UMC_COLORS[whoUmcResult.category]?.bg ??
                      "bg-white/[0.02]",
                  )}
                >
                  <p className="text-[9px] font-mono uppercase text-white/30 mb-1">
                    WHO-UMC
                  </p>
                  <p
                    className={cn(
                      "text-lg font-bold",
                      WHO_UMC_COLORS[whoUmcResult.category]?.color ??
                        "text-white/50",
                    )}
                  >
                    {whoUmcResult.category.split("/")[0]}
                  </p>
                  <p className="text-[10px] font-mono text-white/30">
                    Categorical
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-violet-300/60 leading-relaxed">
                {whoUmcResult.description}
              </p>
              <div className="mt-2 text-[10px] text-white/30 leading-relaxed">
                <span className="font-mono text-violet-400/40">Note:</span>{" "}
                WHO-UMC is derived from your answers to Q2 (temporal), Q3
                (dechallenge), Q4 (rechallenge), and Q5 (alternatives). Naranjo
                is quantitative (score-based), WHO-UMC is categorical
                (criteria-based). Disagreements reveal where the methods weigh
                evidence differently.
              </div>
            </div>

            {/* Score bar */}
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-white/40 mb-3">
                Score Breakdown
              </h3>
              <ScoreBar score={result.score} />
            </div>

            {/* Per-question breakdown */}
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-white/40 mb-3">
                Question Contributions
              </h3>
              <div className="space-y-1.5">
                {NARANJO_QUESTIONS.map((q, i) => {
                  const a = answers[i];
                  const pts = a === 1 ? q.yesPoints : a === -1 ? q.noPoints : 0;
                  return (
                    <div
                      key={q.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-white/40 truncate flex-1 mr-2">
                        <span className="font-mono text-cyan-400/40 mr-1.5">
                          Q{q.id}
                        </span>
                        {q.plain.split(" ").slice(0, 6).join(" ")}...
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono text-white/30">
                          {a === 1 ? "Yes" : a === -1 ? "No" : "Unknown"}
                        </span>
                        <span
                          className={cn(
                            "text-xs font-mono font-bold w-8 text-right",
                            pts > 0
                              ? "text-red-400"
                              : pts < 0
                                ? "text-emerald-400"
                                : "text-white/20",
                          )}
                        >
                          {pts > 0 ? `+${pts}` : pts}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div className="border-t border-white/10 pt-1.5 flex justify-between text-xs font-semibold">
                  <span className="text-white/50">Total</span>
                  <span className={cn("font-mono", catConfig.color)}>
                    {result.score > 0 ? `+${result.score}` : result.score} / 13
                    max
                  </span>
                </div>
              </div>
            </div>

            {/* Regulatory context */}
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-white/40 mb-2">
                What This Means in Practice
              </h3>
              <p className="text-xs text-white/50 leading-relaxed">
                {result.category === "Definite" ||
                result.category === "Probable"
                  ? "In most regulatory frameworks (ICH E2B, EMA, FDA), Probable or Definite causality in a serious case triggers a 15-day expedited report. Document your Naranjo score in the case narrative."
                  : result.category === "Possible"
                    ? "Possible causality may still require reporting depending on seriousness and expectedness. Collect more information before closing the case."
                    : "Doubtful causality typically indicates the drug is unlikely responsible. Ensure your reasoning is documented in the case narrative in case the assessment is later challenged."}
              </p>
            </div>

            {/* Station verification — Academy→Glass bridge */}
            <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-violet-400 mb-2">
                Verify with AlgoVigilance Station
              </h3>
              {!stationResult ? (
                <button
                  onClick={verifyWithStation}
                  disabled={stationLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 py-2.5 text-sm font-medium text-violet-300 hover:bg-violet-500/20 transition-colors disabled:opacity-50"
                >
                  {stationLoading ? (
                    <>
                      <span className="h-4 w-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
                      Querying mcp.nexvigilant.com...
                    </>
                  ) : (
                    <>
                      <FlaskConical className="h-4 w-4" />
                      Cross-check with Live PV Engine
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50">Station Score</span>
                    <span className="font-mono text-violet-300">
                      {stationResult.score}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50">Station Category</span>
                    <span className="font-mono text-violet-300">
                      {stationResult.category}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50">Your Score</span>
                    <span className="font-mono text-white">
                      {result.score}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/30 mt-1">
                    Powered by mcp.nexvigilant.com — the same engine AI agents use.
                  </p>
                </div>
              )}
            </div>

            {/* Academy → Glass Bridge */}
            <Link
              href="/nucleus/glass/causality-lab"
              className="block w-full rounded-lg border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-violet-500/10 p-4 hover:from-amber-500/15 hover:to-violet-500/15 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono uppercase tracking-wider text-amber-400/70 mb-1">
                    Ready for real cases?
                  </p>
                  <p className="text-sm font-semibold text-white group-hover:text-amber-200 transition-colors">
                    Try it live in Glass Causality Lab
                  </p>
                  <p className="text-xs text-white/40 mt-1">
                    Assess causality for any drug-event pair with live data from mcp.nexvigilant.com
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-amber-400/50 group-hover:text-amber-400 group-hover:translate-x-1 transition-all shrink-0" />
              </div>
            </Link>

            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] py-2.5 text-sm text-white/50 hover:text-white/70 hover:bg-white/[0.04] transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Start Over
              </button>
              <button
                onClick={() => setStep("questions")}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 py-2.5 text-sm font-medium text-cyan-300 hover:bg-cyan-500/20 transition-colors"
              >
                <ArrowRight className="h-4 w-4" />
                Adjust Answers
              </button>
            </div>
          </div>
        )}

        {/* Back nav */}
        {step !== "intro" && step !== "result" && (
          <div className="mt-4 flex justify-between">
            <button
              onClick={goBack}
              className="text-xs font-mono text-white/30 hover:text-white/50 transition-colors"
            >
              Back
            </button>
            <span className="text-[10px] font-mono text-white/20">
              Step {stepIndex + 1} of {STEP_ORDER.length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}