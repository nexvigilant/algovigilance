"use client";

import * as React from "react";
import Link from "next/link";
import {
  StepWizard,
  type Step,
  TipBox,
  RememberBox,
  JargonBuster,
  TrafficLight,
} from "@/components/pv-for-nexvigilants";
import {
  computeSignalsSync,
  computeNaranjoSync,
  assessReadiness,
  type SignalResult,
  type NaranjoResult,
  type ReadinessResult,
} from "@/lib/pv-compute";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Activity,
  ChevronRight,
  Search,
  ClipboardCheck,
  LayoutDashboard,
  ArrowRight,
  CheckCircle2,
  Database,
  Shield,
  Radar,
  Table2,
} from "lucide-react";

// ── Textbook example contingency table ────────────────────────────────────────
// a=15, b=100, c=10, d=1000 → PRR ≈ 13.17 (strong signal)
const DEMO_TABLE = { a: 15, b: 100, c: 10, d: 1000 } as const;

// ── Mini Naranjo: Q1=Yes(+1), Q2=Yes(+2), Q3=Yes(+1), Q4–Q10=DontKnow(0) ─────
// Score = 4 → "Possible"
const MINI_NARANJO_ANSWERS = [1, 1, 1, 0, 0, 0, 0, 0, 0, 0] as const;

// ── Step 1: Welcome to PV ─────────────────────────────────────────────────────

function StepWelcome() {
  return (
    <div className="flex flex-col gap-golden-3">
      <div className="rounded-xl border border-cyan/10 bg-cyan/[0.04] p-golden-3">
        <p className="text-base leading-golden text-white/90">
          <JargonBuster
            term="Pharmacovigilance"
            definition="The science of detecting, assessing, understanding, and preventing adverse effects of medicines. From Greek: pharmakon (drug) + vigilare (to watch)."
          >
            Pharmacovigilance
          </JargonBuster>{" "}
          is a fancy word for drug safety monitoring. Your job? Make sure
          medicines don&apos;t hurt people.
        </p>
      </div>

      <TipBox>
        You don&apos;t need a science degree. You need curiosity and this tool.
      </TipBox>

      <div className="flex items-start gap-golden-2 rounded-xl border border-white/[0.08] bg-white/[0.03] p-golden-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-400/20 bg-red-400/5">
          <Activity className="h-5 w-5 text-red-400" aria-hidden="true" />
        </div>
        <div>
          <p className="mb-golden-1 text-sm font-semibold text-white">
            What you&apos;ll learn in the next 5 minutes
          </p>
          <ul className="space-y-1 text-sm text-slate-400">
            <li className="flex items-center gap-2">
              <ChevronRight className="h-3 w-3 text-cyan/50" />
              How drug safety monitoring actually works
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="h-3 w-3 text-cyan/50" />
              Run your first signal detection — with real math
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="h-3 w-3 text-cyan/50" />
              Assess whether a drug caused a reaction
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ── Step 2: The Big Picture ───────────────────────────────────────────────────

function PipelineStep({
  icon,
  label,
  sublabel,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full border",
          color,
        )}
      >
        {icon}
      </div>
      <span className="text-xs font-semibold text-white">{label}</span>
      <span className="text-[10px] text-slate-500 leading-snug max-w-[80px]">
        {sublabel}
      </span>
    </div>
  );
}

function StepBigPicture() {
  return (
    <div className="flex flex-col gap-golden-3">
      {/* Visual pipeline */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-golden-3">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
          <PipelineStep
            icon={<Search className="h-5 w-5 text-cyan" />}
            label="Signal Detection"
            sublabel="Spot the clue"
            color="border-cyan/20 bg-cyan/5"
          />
          <ArrowRight
            className="h-4 w-4 shrink-0 text-white/20"
            aria-hidden="true"
          />
          <PipelineStep
            icon={<ClipboardCheck className="h-5 w-5 text-violet-400" />}
            label="Causality"
            sublabel="Investigate"
            color="border-violet-400/20 bg-violet-400/5"
          />
          <ArrowRight
            className="h-4 w-4 shrink-0 text-white/20"
            aria-hidden="true"
          />
          <PipelineStep
            icon={<span className="text-base font-bold text-amber-400">S</span>}
            label="Seriousness"
            sublabel="How bad is it?"
            color="border-amber-400/20 bg-amber-400/5"
          />
          <ArrowRight
            className="h-4 w-4 shrink-0 text-white/20"
            aria-hidden="true"
          />
          <PipelineStep
            icon={<Activity className="h-5 w-5 text-emerald-400" />}
            label="Reporting"
            sublabel="File the report"
            color="border-emerald-400/20 bg-emerald-400/5"
          />
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-golden-3">
        <p className="text-sm leading-golden text-white/80">
          Think of it like detective work:{" "}
          <span className="text-cyan font-medium">Spot the clue</span> →{" "}
          <span className="text-violet-400 font-medium">Investigate</span> →{" "}
          <span className="text-amber-400 font-medium">
            Decide how serious it is
          </span>{" "}
          →{" "}
          <span className="text-emerald-400 font-medium">File the report</span>
        </p>
      </div>

      <RememberBox>
        Every step has a tool here. We&apos;ll walk you through the first one.
      </RememberBox>
    </div>
  );
}

// ── Step 3: Your First Signal Detection ───────────────────────────────────────

function ContingencyCell({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: number;
  sublabel: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-white/[0.08] bg-white/[0.03] p-3 text-center">
      <span className="mb-0.5 text-[10px] font-mono uppercase tracking-widest text-slate-500">
        {label}
      </span>
      <span className="text-2xl font-bold tabular-nums text-white">
        {value}
      </span>
      <span className="mt-0.5 text-[10px] text-slate-500 leading-snug">
        {sublabel}
      </span>
    </div>
  );
}

function SignalResultDisplay({ result }: { result: SignalResult }) {
  const prr = result.prr.toFixed(2);
  const trafficLevel = result.any_signal
    ? result.prr >= 5
      ? "red"
      : "yellow"
    : "green";

  return (
    <div className="flex flex-col gap-golden-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-golden-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-emerald-300">
          Signal Analysis Results
        </span>
        <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[10px] font-mono uppercase tracking-wider">
          Complete
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
            PRR
          </span>
          <span className="text-xl font-bold tabular-nums text-white">
            {prr}
          </span>
          <span className="text-[10px] text-slate-500">
            {result.prr_signal ? "Signal" : "No signal"}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
            ROR
          </span>
          <span className="text-xl font-bold tabular-nums text-white">
            {result.ror.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500">
            {result.ror_signal ? "Signal" : "No signal"}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
            IC
          </span>
          <span className="text-xl font-bold tabular-nums text-white">
            {result.ic.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500">
            {result.ic_signal ? "Signal" : "No signal"}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
            Chi-sq
          </span>
          <span className="text-xl font-bold tabular-nums text-white">
            {result.chi_square.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500">
            {result.chi_signal ? "Signal" : "No signal"}
          </span>
        </div>
      </div>

      <TrafficLight
        level={trafficLevel}
        label={
          result.any_signal
            ? `PRR = ${prr} — that's a strong signal!`
            : "No signal detected"
        }
      />
    </div>
  );
}

function StepFirstSignal() {
  const [result, setResult] = React.useState<SignalResult | null>(null);
  const [ran, setRan] = React.useState(false);

  function handleDetect() {
    const r = computeSignalsSync(DEMO_TABLE);
    setResult(r);
    setRan(true);
  }

  return (
    <div className="flex flex-col gap-golden-3">
      <p className="text-sm leading-golden text-white/80">
        Below is a classic textbook example. The 2x2 table shows how often a
        drug appears in reports with and without the side effect we&apos;re
        watching.
      </p>

      {/* 2x2 Table */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-golden-3">
        <p className="mb-golden-2 text-xs font-mono uppercase tracking-widest text-slate-500">
          2x2 Contingency Table
        </p>
        <div className="grid grid-cols-2 gap-2">
          <ContingencyCell
            label="a — Drug + Event"
            value={DEMO_TABLE.a}
            sublabel="Reports with drug AND side effect"
          />
          <ContingencyCell
            label="b — Drug, No Event"
            value={DEMO_TABLE.b}
            sublabel="Drug reported, side effect absent"
          />
          <ContingencyCell
            label="c — No Drug + Event"
            value={DEMO_TABLE.c}
            sublabel="Side effect with other drugs"
          />
          <ContingencyCell
            label="d — Neither"
            value={DEMO_TABLE.d}
            sublabel="No drug, no side effect"
          />
        </div>
      </div>

      {!ran && (
        <button
          type="button"
          onClick={handleDetect}
          className="flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          Detect — Run My First Signal Analysis
        </button>
      )}

      {result && <SignalResultDisplay result={result} />}

      {ran && (
        <TipBox>
          You just did what took PV professionals years to learn. The math is
          built in.
        </TipBox>
      )}
    </div>
  );
}

// ── Step 4: Your First Case Assessment ────────────────────────────────────────

type MiniAnswer = 1 | -1 | 0;

const MINI_QUESTIONS: { label: string; yes: string; no: string }[] = [
  {
    label:
      "Did this kind of reaction happen to patients before with this drug?",
    yes: "Yes, there are previous reports",
    no: "No, this is new",
  },
  {
    label: "Did the reaction start AFTER the patient took the drug?",
    yes: "Yes, it happened after",
    no: "No, it happened before or unrelated",
  },
  {
    label: "Did the reaction improve when the drug was stopped?",
    yes: "Yes, patient improved",
    no: "No change when stopped",
  },
];

function CategoryBadge({ category }: { category: NaranjoResult["category"] }) {
  const config: Record<
    NaranjoResult["category"],
    { cls: string; label: string }
  > = {
    Definite: {
      cls: "border-red-500/30 bg-red-500/10 text-red-300",
      label: "Definite ADR",
    },
    Probable: {
      cls: "border-amber-500/30 bg-amber-500/10 text-amber-300",
      label: "Probable ADR",
    },
    Possible: {
      cls: "border-blue-500/30 bg-blue-500/10 text-blue-300",
      label: "Possible ADR",
    },
    Doubtful: {
      cls: "border-slate-500/30 bg-slate-500/10 text-slate-300",
      label: "Doubtful ADR",
    },
  };
  const { cls, label } = config[category];
  return <Badge className={cn("text-xs font-semibold", cls)}>{label}</Badge>;
}

function StepCaseAssessment() {
  const [answers, setAnswers] = React.useState<MiniAnswer[]>([0, 0, 0]);
  const [result, setResult] = React.useState<NaranjoResult | null>(null);

  function setAnswer(idx: number, val: MiniAnswer) {
    setAnswers((prev) => {
      const next = [...prev] as MiniAnswer[];
      next[idx] = val;
      return next;
    });
    // Reset result when answers change
    setResult(null);
  }

  function handleAssess() {
    // Q1–Q3 from user, Q4–Q10 = DontKnow (0)
    const fullAnswers = [...answers, 0, 0, 0, 0, 0, 0, 0];
    const r = computeNaranjoSync(fullAnswers);
    setResult(r);
  }

  const allAnswered = answers.every((a) => a !== 0);

  return (
    <div className="flex flex-col gap-golden-3">
      <p className="text-sm leading-golden text-white/80">
        The{" "}
        <JargonBuster
          term="Naranjo Scale"
          definition="A 10-question algorithm by Naranjo et al. (1981) that scores the probability that a drug caused an adverse reaction. Scores: Definite (≥9), Probable (5–8), Possible (1–4), Doubtful (≤0)."
        >
          Naranjo Scale
        </JargonBuster>{" "}
        has 10 questions. We&apos;re starting with just the first 3. Answer Yes
        or No for each.
      </p>

      <div className="flex flex-col gap-3">
        {MINI_QUESTIONS.map((q, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-golden-3"
          >
            <p className="mb-golden-2 text-sm font-medium text-white/90">
              Q{idx + 1}: {q.label}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAnswer(idx, 1)}
                className={cn(
                  "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-150",
                  answers[idx] === 1
                    ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                    : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-white",
                )}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setAnswer(idx, -1)}
                className={cn(
                  "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-150",
                  answers[idx] === -1
                    ? "border-red-500/50 bg-red-500/15 text-red-300"
                    : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-white",
                )}
              >
                No
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleAssess}
        disabled={!allAnswered}
        className={cn(
          "flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-bold transition-all duration-200",
          allAnswered
            ? "bg-violet-600 text-white hover:bg-violet-500"
            : "cursor-not-allowed bg-white/5 text-slate-500",
        )}
      >
        <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
        {allAnswered
          ? "Assess Causality"
          : "Answer all 3 questions to continue"}
      </button>

      {result && (
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.04] p-golden-3">
          <div className="mb-golden-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-violet-300">
              Naranjo Assessment
            </span>
            <CategoryBadge category={result.category} />
          </div>
          <p className="text-sm text-white/80">
            Based on these 3 questions alone, the score is{" "}
            <span className="font-bold text-white">{result.score}</span> —{" "}
            <span className="font-semibold text-violet-300">
              {result.category}
            </span>
          </p>
        </div>
      )}

      <RememberBox>
        The full Naranjo has 10 questions. You can find it at the Causality
        page.
      </RememberBox>
    </div>
  );
}

// ── Step 5: You're Ready! ─────────────────────────────────────────────────────

const NEXT_STEPS = [
  {
    title: "Explore Signals",
    description:
      "Run full signal detection with all 5 algorithms. Bring your own data.",
    href: "/nucleus/vigilance/signals",
    icon: Search,
    color: "border-cyan/20 bg-cyan/5 hover:border-cyan/40",
    iconColor: "text-cyan",
    badge: null,
  },
  {
    title: "Assess Causality",
    description:
      "Walk through all 10 Naranjo questions. Get a complete causality verdict.",
    href: "/nucleus/vigilance/causality",
    icon: ClipboardCheck,
    color: "border-violet-400/20 bg-violet-400/5 hover:border-violet-400/40",
    iconColor: "text-violet-400",
    badge: null,
  },
  {
    title: "Your Operations Center",
    description:
      "Cases, signals, deadlines, and system health — all in one place.",
    href: "/nucleus/vigilance/operations",
    icon: LayoutDashboard,
    color: "border-emerald-400/20 bg-emerald-400/5 hover:border-emerald-400/40",
    iconColor: "text-emerald-400",
    badge: "Home Base",
  },
] as const;

const DEEPER_STEPS = [
  {
    title: "Batch Signal Scan",
    description:
      "Test multiple drug-event pairs at once — paste data, analyze all, export results.",
    href: "/nucleus/vigilance/pipeline",
    icon: Database,
    color: "border-cyan/20 bg-cyan/5 hover:border-cyan/40",
    iconColor: "text-cyan",
  },
  {
    title: "Set Safety Guardrails",
    description:
      "Configure threshold rules — decide what crosses the fence and what passes.",
    href: "/nucleus/vigilance/fence",
    icon: Shield,
    color: "border-red-400/20 bg-red-400/5 hover:border-red-400/40",
    iconColor: "text-red-400",
  },
  {
    title: "Understand Signal Theory",
    description:
      "Explore the three axioms — data, noise, and existence — with interactive sliders.",
    href: "/nucleus/vigilance/theory",
    icon: Radar,
    color: "border-blue-400/20 bg-blue-400/5 hover:border-blue-400/40",
    iconColor: "text-blue-400",
  },
  {
    title: "Explore Your Data",
    description:
      "Upload CSV data, group by columns, aggregate, and export — like a safety spreadsheet.",
    href: "/nucleus/vigilance/data-explorer",
    icon: Table2,
    color: "border-emerald-400/20 bg-emerald-400/5 hover:border-emerald-400/40",
    iconColor: "text-emerald-400",
  },
  {
    title: "From Signal to Action",
    description:
      "Follow one signal through the full chain — detection to risk score to regulatory action.",
    href: "/nucleus/vigilance/risk-bridge",
    icon: ArrowRight,
    color: "border-gold/20 bg-gold/5 hover:border-gold/40",
    iconColor: "text-gold",
  },
] as const;

function StepYoureReady() {
  const readiness = assessReadiness({
    completed_modules: 5,
    total_modules: 5,
    quiz_score_avg: 85,
  });

  return (
    <div className="flex flex-col gap-golden-3">
      <div className="flex items-start gap-golden-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-golden-3">
        <CheckCircle2
          className="mt-0.5 h-6 w-6 shrink-0 text-emerald-400"
          aria-hidden="true"
        />
        <div>
          <p className="mb-golden-1 text-base font-semibold text-emerald-300">
            You&apos;re a AlgoVigilance now.
          </p>
          <p className="text-sm leading-golden text-white/80">
            You just ran signal detection AND a causality assessment.
            That&apos;s real pharmacovigilance — the same work done by drug
            safety professionals around the world.
          </p>
          <p className="mt-golden-1 text-xs text-emerald-400/70 font-mono">
            Readiness: {readiness.readiness} — {readiness.next_step}
          </p>
        </div>
      </div>

      <p className="text-sm font-medium text-white/60">
        Where do you want to go next?
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {NEXT_STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <Link key={step.href} href={step.href} className="block">
              <Card
                className={cn(
                  "relative h-full border transition-all duration-200",
                  step.color,
                )}
              >
                {step.badge && (
                  <div className="absolute right-3 top-3">
                    <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[10px] font-mono uppercase tracking-wider">
                      {step.badge}
                    </Badge>
                  </div>
                )}
                <CardContent className="p-4">
                  <div
                    className={cn(
                      "mb-3 flex h-9 w-9 items-center justify-center rounded-lg border",
                      step.color,
                    )}
                  >
                    <Icon
                      className={cn("h-4 w-4", step.iconColor)}
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="mb-1 text-sm font-semibold text-white">
                    {step.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-400">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <TipBox>
        Bookmark the Operations Center — it&apos;s your home base.
      </TipBox>

      <p className="mt-golden-2 text-sm font-medium text-white/60">
        Go deeper — advanced tools
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {DEEPER_STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <Link key={step.href} href={step.href} className="block">
              <Card
                className={cn(
                  "relative h-full border transition-all duration-200",
                  step.color,
                )}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border",
                        step.color,
                      )}
                    >
                      <Icon
                        className={cn("h-3.5 w-3.5", step.iconColor)}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-semibold text-white">
                        {step.title}
                      </h3>
                      <p className="text-[10px] leading-relaxed text-slate-400">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Onboarding Component ─────────────────────────────────────────────────

export function PvOnboarding() {
  const [currentStep, setCurrentStep] = React.useState(0);

  const steps: Step[] = [
    {
      title: "Welcome to PV",
      description:
        "Pharmacovigilance in plain English — what it is and why it matters.",
      content: <StepWelcome />,
    },
    {
      title: "The Big Picture",
      description:
        "How drug safety monitoring actually works, start to finish.",
      content: <StepBigPicture />,
    },
    {
      title: "Your First Signal Detection",
      description:
        "Run a real disproportionality analysis on a textbook example.",
      content: <StepFirstSignal />,
    },
    {
      title: "Your First Case Assessment",
      description: "Apply the Naranjo algorithm to 3 key causality questions.",
      content: <StepCaseAssessment />,
    },
    {
      title: "You're Ready!",
      description: "Choose your next step — the full suite awaits.",
      content: <StepYoureReady />,
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Page header */}
      <header className="mb-golden-4">
        <div className="flex items-center gap-golden-2 mb-golden-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-cyan/20 bg-cyan/5">
            <Activity className="h-5 w-5 text-cyan" aria-hidden="true" />
          </div>
          <div>
            <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-cyan/50">
              AlgoVigilance Vigilance
            </p>
            <h1 className="font-headline text-2xl font-extrabold tracking-tight text-white md:text-3xl">
              Welcome to PV
            </h1>
          </div>
        </div>
        <p className="max-w-xl text-sm leading-golden text-slate-dim/70">
          No jargon. No textbooks. Just a guided walk through the tools —
          starting with your very first signal.
        </p>
      </header>

      {/* Wizard */}
      <div className="mx-auto w-full max-w-2xl flex-1">
        <StepWizard
          steps={steps}
          currentStep={currentStep}
          onNext={
            currentStep < steps.length - 1
              ? () => setCurrentStep((s) => s + 1)
              : undefined
          }
          onBack={
            currentStep > 0 ? () => setCurrentStep((s) => s - 1) : undefined
          }
        />
      </div>
    </div>
  );
}
