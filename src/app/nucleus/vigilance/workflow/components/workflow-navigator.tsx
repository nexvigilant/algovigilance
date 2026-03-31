"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  RotateCcw,
  GitFork,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TipBox,
  RememberBox,
  JargonBuster,
  StepWizard,
} from "@/components/pv-for-nexvigilants";
import { routeWorkflow, routeFullCase } from "@/lib/pv-compute/workflow";
import type {
  WorkflowInput,
  WorkflowRoute,
  CaseData,
  CaseRoute,
} from "@/lib/pv-compute/workflow";

// ── Step definitions ──────────────────────────────────────────────────────────

const STEPS = [
  {
    title: "What Are You Doing?",
    description: "Choose your pharmacovigilance task",
    content: null,
  },
  {
    title: "Tell Us About Your Data",
    description: "Describe the data you have available",
    content: null,
  },
  {
    title: "Your Workflow Path",
    description: "Your personalized workflow recommendation",
    content: null,
  },
];

type TaskChoice =
  | "signal_detection"
  | "causality_assessment"
  | "case_review"
  | "unsure";

const TASK_CHOICES: Array<{
  value: TaskChoice;
  label: string;
  description: string;
  emoji: string;
}> = [
  {
    value: "signal_detection",
    label: "Find Safety Signals",
    description:
      "I have drug-event count data and want to see if a drug is causing problems more than expected",
    emoji: "🔍",
  },
  {
    value: "causality_assessment",
    label: "Assess Causality",
    description:
      "A patient had a reaction — I need to score whether the drug caused it",
    emoji: "⚖️",
  },
  {
    value: "case_review",
    label: "Review a Case",
    description:
      "I have an individual safety case (ICSR) and need to classify and file it",
    emoji: "📋",
  },
  {
    value: "unsure",
    label: "I'm Not Sure Yet",
    description: "Help me figure out where to start",
    emoji: "💡",
  },
];

const ROUTE_TO_HREF: Record<string, string> = {
  signal_detection: "/nucleus/vigilance/signals",
  causality_assessment: "/nucleus/vigilance/causality",
  case_review: "/nucleus/vigilance/seriousness",
  data_collection: "/nucleus/vigilance/faers",
};

const PRIORITY_COLOR: Record<string, string> = {
  P0: "text-red-400 border-red-400/30 bg-red-400/5",
  P1: "text-amber-400 border-amber-400/30 bg-amber-400/5",
  P2: "text-cyan border-cyan/30 bg-cyan/5",
  P3: "text-emerald-400 border-emerald-400/30 bg-emerald-400/5",
};

// ── Main component ────────────────────────────────────────────────────────────

export function WorkflowNavigator() {
  const [step, setStep] = useState(0);
  const [taskChoice, setTaskChoice] = useState<TaskChoice | null>(null);
  const [hasDrugEventData, setHasDrugEventData] = useState<boolean | null>(
    null,
  );
  const [caseData, setCaseData] = useState<CaseData>({});
  const [route, setRoute] = useState<WorkflowRoute | null>(null);
  const [caseRoute, setCaseRoute] = useState<CaseRoute | null>(null);

  function reset() {
    setStep(0);
    setTaskChoice(null);
    setHasDrugEventData(null);
    setCaseData({});
    setRoute(null);
    setCaseRoute(null);
  }

  function computeRoute() {
    const input: WorkflowInput = {
      task_type:
        taskChoice === "unsure" ? undefined : (taskChoice ?? undefined),
      has_drug_event_data: hasDrugEventData ?? false,
    };
    const r = routeWorkflow(input);
    setRoute(r);

    // If routing to case_review, also compute full-case route
    if (r.start_with === "case_review" || taskChoice === "case_review") {
      const cr = routeFullCase(caseData);
      setCaseRoute(cr);
    }
    setStep(2);
  }

  // ── Step 0 — Task selection ────────────────────────────────────────────────
  const step0 = (
    <div className="space-y-golden-3">
      <div>
        <h2 className="font-headline text-xl font-bold text-white mb-1">
          What are you trying to do?
        </h2>
        <p className="text-sm text-slate-dim/60">
          Pick the task that best describes your situation.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-golden-2">
        {TASK_CHOICES.map((choice) => (
          <button
            key={choice.value}
            onClick={() => {
              setTaskChoice(choice.value);
              setStep(1);
            }}
            className={`text-left p-4 border transition-all duration-200 ${
              taskChoice === choice.value
                ? "border-cyan/50 bg-cyan/5"
                : "border-white/[0.08] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
            }`}
          >
            <span className="text-2xl block mb-2" aria-hidden="true">
              {choice.emoji}
            </span>
            <p className="text-sm font-semibold text-white mb-1">
              {choice.label}
            </p>
            <p className="text-xs text-slate-dim/60 leading-relaxed">
              {choice.description}
            </p>
          </button>
        ))}
      </div>

      <TipBox>
        Not sure? Choose &ldquo;I&apos;m Not Sure Yet&rdquo; and tell us if you
        have drug-event count data.
      </TipBox>
    </div>
  );

  // ── Step 1 — Data availability ─────────────────────────────────────────────
  const step1 = (
    <div className="space-y-golden-3">
      <div>
        <h2 className="font-headline text-xl font-bold text-white mb-1">
          {taskChoice === "case_review"
            ? "Tell us about this case"
            : "Do you have drug-event data?"}
        </h2>
        <p className="text-sm text-slate-dim/60">
          {taskChoice === "case_review"
            ? "These details help us route the case correctly."
            : "This tells us which tools are available to you right now."}
        </p>
      </div>

      {taskChoice === "case_review" ? (
        <div className="space-y-golden-2">
          <p className="text-xs font-mono uppercase tracking-widest text-slate-dim/50 mb-golden-2">
            ICH E2A Seriousness Criteria
          </p>
          {(
            [
              {
                key: "has_death" as keyof CaseData,
                label: "Death",
                description: "Patient died",
              },
              {
                key: "has_hospitalization" as keyof CaseData,
                label: "Hospitalization",
                description: "Requires or prolongs hospital stay",
              },
              {
                key: "has_disability" as keyof CaseData,
                label: "Disability",
                description: "Persistent significant disability",
              },
              {
                key: "signal_detected" as keyof CaseData,
                label: "Signal Detected",
                description:
                  "PRR ≥ 2.0 or other disproportionality signal found",
              },
              {
                key: "causality_assessed" as keyof CaseData,
                label: "Causality Assessed",
                description: "Naranjo or WHO-UMC assessment complete",
              },
            ] as Array<{
              key: keyof CaseData;
              label: string;
              description: string;
            }>
          ).map(({ key, label, description }) => (
            <label
              key={key}
              className="flex items-start gap-3 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={!!caseData[key]}
                onChange={(e) =>
                  setCaseData((prev) => ({ ...prev, [key]: e.target.checked }))
                }
                className="mt-0.5 h-4 w-4 accent-cyan"
              />
              <span>
                <span className="text-sm text-white group-hover:text-cyan transition-colors">
                  {label}
                </span>
                <span className="block text-xs text-slate-dim/50">
                  {description}
                </span>
              </span>
            </label>
          ))}
        </div>
      ) : (
        <div className="space-y-golden-2">
          <p className="text-sm text-slate-dim/70">
            <JargonBuster
              term="drug-event data"
              definition="A count table showing how many patients took a drug (and had/didn't have a side effect) vs. those who didn't take the drug. You need at least the 'a' cell — people who took the drug AND had the effect."
            >
              Drug-event data
            </JargonBuster>{" "}
            means you have numbers like &ldquo;15 patients took Drug X and had
            Headache, 1000 patients took Drug X but didn&apos;t.&rdquo;
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setHasDrugEventData(true)}
              className={`flex-1 p-4 border text-center transition-all duration-200 ${
                hasDrugEventData === true
                  ? "border-cyan/50 bg-cyan/5 text-cyan"
                  : "border-white/[0.08] bg-white/[0.03] hover:border-white/20 text-slate-dim/70"
              }`}
            >
              <CheckCircle2
                className="h-5 w-5 mx-auto mb-1"
                aria-hidden="true"
              />
              <span className="text-sm font-medium">Yes, I have data</span>
            </button>
            <button
              onClick={() => setHasDrugEventData(false)}
              className={`flex-1 p-4 border text-center transition-all duration-200 ${
                hasDrugEventData === false
                  ? "border-amber-400/50 bg-amber-400/5 text-amber-400"
                  : "border-white/[0.08] bg-white/[0.03] hover:border-white/20 text-slate-dim/70"
              }`}
            >
              <AlertCircle
                className="h-5 w-5 mx-auto mb-1"
                aria-hidden="true"
              />
              <span className="text-sm font-medium">No data yet</span>
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setStep(0)}
          className="border-white/20"
        >
          Back
        </Button>
        <Button
          size="sm"
          onClick={computeRoute}
          disabled={taskChoice !== "case_review" && hasDrugEventData === null}
          className="bg-cyan text-nex-deep hover:bg-cyan/90"
        >
          Show My Path <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // ── Step 2 — Result ────────────────────────────────────────────────────────
  const step2 = route && (
    <div className="space-y-golden-3">
      <div>
        <h2 className="font-headline text-xl font-bold text-white mb-1">
          Your PV Workflow Path
        </h2>
        <p className="text-sm text-slate-dim/60">
          Based on your answers, here is where to start and what to do next.
        </p>
      </div>

      <Card className="border-cyan/20 bg-cyan/5">
        <CardContent className="p-5 space-y-3">
          <p className="text-xs font-mono uppercase tracking-widest text-cyan/60">
            Recommended Starting Point
          </p>
          <p className="text-base font-semibold text-white">
            {route.description}
          </p>
          <p className="text-xs text-slate-dim/60">{route.next_steps}</p>

          {ROUTE_TO_HREF[route.start_with] && (
            <Link href={ROUTE_TO_HREF[route.start_with]}>
              <Button
                size="sm"
                className="mt-2 bg-cyan text-nex-deep hover:bg-cyan/90"
              >
                Start:{" "}
                {route.first_tool === "none"
                  ? "Collect Data"
                  : route.first_tool.replace(/_/g, " ")}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>

      {caseRoute && (
        <Card className={`border ${PRIORITY_COLOR[caseRoute.priority]}`}>
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-mono uppercase font-bold tracking-widest px-2 py-0.5 border rounded ${PRIORITY_COLOR[caseRoute.priority]}`}
              >
                {caseRoute.priority}
              </span>
              <p className="text-sm font-semibold text-white">
                {caseRoute.next_action.replace(/_/g, " ")}
              </p>
            </div>
            <p className="text-xs text-slate-dim/60">{caseRoute.reason}</p>
            <Link href={caseRoute.tool_path}>
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 mt-2"
              >
                Go to {caseRoute.tool_path.split("/").pop()}{" "}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <RememberBox>
        The PV chain follows: Signal Detection → Causality Assessment →
        Seriousness Classification → Regulatory Reporting. Start wherever your
        case enters the chain.
      </RememberBox>

      <Button
        variant="outline"
        size="sm"
        onClick={reset}
        className="border-white/20"
      >
        <RotateCcw className="mr-1.5 h-4 w-4" /> Start Over
      </Button>
    </div>
  );

  // ── Chain diagram (always visible) ────────────────────────────────────────

  const chainDiagram = (
    <div className="mt-golden-4 pt-golden-3 border-t border-white/[0.06]">
      <p className="text-xs font-mono uppercase tracking-widest text-slate-dim/40 mb-golden-2">
        The PV Chain
      </p>
      <div className="overflow-x-auto pb-2">
        <div className="flex items-start gap-2 min-w-max text-xs">
          {[
            {
              label: "Signal Detection",
              href: "/nucleus/vigilance/signals",
              color: "text-red-400 border-red-400/30",
            },
            { label: "→", href: null, color: "text-slate-dim/40" },
            {
              label: "Causality Assessment",
              href: "/nucleus/vigilance/causality",
              color: "text-amber-400 border-amber-400/30",
            },
            { label: "→", href: null, color: "text-slate-dim/40" },
            {
              label: "Seriousness Classification",
              href: "/nucleus/vigilance/seriousness",
              color: "text-cyan border-cyan/30",
            },
            { label: "→", href: null, color: "text-slate-dim/40" },
            {
              label: "Regulatory Reporting",
              href: "/nucleus/vigilance/reporting",
              color: "text-emerald-400 border-emerald-400/30",
            },
          ].map((item, i) =>
            item.href ? (
              <Link
                key={i}
                href={item.href}
                className={`px-2 py-1 border transition-opacity hover:opacity-100 opacity-70 ${item.color}`}
              >
                {item.label}
              </Link>
            ) : (
              <span key={i} className={`py-1 ${item.color}`} aria-hidden="true">
                {item.label}
              </span>
            ),
          )}
        </div>
        <div className="flex items-start gap-2 min-w-max text-xs mt-2 ml-4">
          <span className="text-slate-dim/30" aria-hidden="true">
            ↓
          </span>
          <Link
            href="/nucleus/vigilance/seriousness"
            className="px-2 py-1 border border-slate-dim/20 text-slate-dim/50 hover:opacity-100 opacity-70 transition-opacity"
          >
            Seriousness Check
          </Link>
          <span className="text-slate-dim/30" aria-hidden="true">
            →
          </span>
          <Link
            href="/nucleus/vigilance/reporting"
            className="px-2 py-1 border border-slate-dim/20 text-slate-dim/50 hover:opacity-100 opacity-70 transition-opacity"
          >
            Deadline Routing
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-golden-4">
      <StepWizard
        steps={STEPS}
        currentStep={step}
        onNext={() => {}}
        onBack={() => {}}
      />

      <motion.div
        key={step}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {step === 0 && step0}
        {step === 1 && step1}
        {step === 2 && step2}
      </motion.div>

      {chainDiagram}
    </div>
  );
}
