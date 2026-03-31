"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Cable,
  CheckCircle2,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  FlaskConical,
  Pill,
  Search,
  Shield,
} from "lucide-react";

const STATION = "https://mcp.nexvigilant.com";
const MCP = `${STATION}/mcp`;

// ─── Types ────────────────────────────────────────────────────────────────

interface StepResult {
  status: "idle" | "loading" | "done" | "error";
  data: Record<string, unknown> | string | null;
  elapsed?: number;
  error?: string;
}

type StepKey =
  | "identity"
  | "faers"
  | "disproportionality"
  | "labeling"
  | "literature"
  | "verdict";

interface StepConfig {
  key: StepKey;
  number: number;
  title: string;
  description: string;
  icon: typeof Pill;
  toolName: string;
  toolArgs: Record<string, unknown>;
  learnMore: string;
}

// ─── Investigation Steps ─────────────────────────────────────────────────

const STEPS: StepConfig[] = [
  {
    key: "identity",
    number: 1,
    title: "Resolve Drug Identity",
    description:
      "Confirm semaglutide's RxNorm concept ID (RxCUI) so all subsequent queries use a canonical identifier. This prevents false negatives from brand name variations (Ozempic, Wegovy, Rybelsus).",
    icon: Pill,
    toolName: "rxnav_nlm_nih_gov_get_rxcui",
    toolArgs: { name: "semaglutide" },
    learnMore:
      "RxNav normalizes drug names across FDA, NLM, and VA systems. Without canonical IDs, a search for 'Ozempic' would miss reports filed under 'semaglutide'.",
  },
  {
    key: "faers",
    number: 2,
    title: "Search FAERS Reports",
    description:
      "Query the FDA Adverse Event Reporting System for semaglutide + pancreatitis reports. FAERS contains 20M+ spontaneous reports from healthcare professionals, consumers, and manufacturers.",
    icon: Search,
    toolName: "api_fda_gov_search_adverse_events",
    toolArgs: { drug: "semaglutide", event: "pancreatitis", limit: 5 },
    learnMore:
      "Spontaneous reporting is the backbone of post-market surveillance. Under-reporting is estimated at 90-95%, so even small FAERS counts may represent thousands of real cases.",
  },
  {
    key: "disproportionality",
    number: 3,
    title: "Compute Signal Strength",
    description:
      "Calculate PRR and ROR from the FAERS contingency table. A PRR ≥ 2 with ≥ 3 cases and chi-square ≥ 4 meets the Evans criteria for a statistical signal.",
    icon: Activity,
    toolName: "calculate_nexvigilant_com_compute_prr",
    toolArgs: { a: 2068, b: 108932, c: 65421, d: 19823579 },
    learnMore:
      "PRR = (a/(a+b)) / (c/(c+d)). It compares the reporting rate for this drug-event pair against the background rate for all other drugs. Values above 2.0 indicate disproportionate reporting.",
  },
  {
    key: "labeling",
    number: 4,
    title: "Check Drug Label",
    description:
      "Review the current FDA-approved labeling for semaglutide to determine if pancreatitis is already a recognized adverse reaction. An unlabeled signal is more urgent than a labeled one.",
    icon: BookOpen,
    toolName: "dailymed_nlm_nih_gov_get_adverse_reactions",
    toolArgs: { drug: "semaglutide" },
    learnMore:
      "DailyMed is the official source for FDA-approved drug labeling (SPL format). If pancreatitis is already in the label, the signal is 'expected' — still monitored, but not triggering expedited reporting.",
  },
  {
    key: "literature",
    number: 5,
    title: "Search Literature",
    description:
      "Search PubMed for published case reports and studies linking GLP-1 receptor agonists to pancreatitis. Literature corroboration strengthens the signal assessment.",
    icon: FlaskConical,
    toolName: "pubmed_ncbi_nlm_nih_gov_search_signal_literature",
    toolArgs: { drug: "semaglutide", event: "pancreatitis" },
    learnMore:
      "Case reports in peer-reviewed journals provide clinical detail that FAERS data lacks — temporality, dechallenge/rechallenge, confounders. Multiple independent reports strengthen biological plausibility.",
  },
  {
    key: "verdict",
    number: 6,
    title: "Assess Causality",
    description:
      "Apply the Naranjo ADR Probability Scale to determine whether semaglutide probably, possibly, or unlikely caused the pancreatitis reports.",
    icon: Shield,
    toolName: "calculate_nexvigilant_com_assess_naranjo_causality",
    toolArgs: {
      previous_experience: "yes",
      appeared_after_drug: "yes",
      improved_after_withdrawal: "yes",
      reappeared_on_rechallenge: "unknown",
      alternative_causes: "possible",
      placebo_response: "unknown",
      drug_in_blood: "not_done",
      dose_response: "unknown",
      previous_exposure: "unknown",
      objective_evidence: "yes",
    },
    learnMore:
      "The Naranjo scale scores 10 clinical questions from -1 to +2. Total ≥9 = Definite, 5-8 = Probable, 1-4 = Possible, ≤0 = Doubtful. It's the most widely used causality algorithm in PV.",
  },
];

// ─── MCP Call Helper ─────────────────────────────────────────────────────

async function callStation(
  toolName: string,
  args: Record<string, unknown>,
): Promise<{ data: Record<string, unknown> | string; elapsed: number }> {
  const start = performance.now();

  const body = {
    jsonrpc: "2.0",
    method: "tools/call",
    id: 1,
    params: { name: toolName, arguments: args },
  };

  const res = await fetch(`${STATION}/rpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const json = await res.json();
  if (json.error) throw new Error(json.error.message ?? "RPC error");

  const data = (json.result ?? {}) as Record<string, unknown>;
  return { data, elapsed: Math.round(performance.now() - start) };
}

// ─── Step Component ──────────────────────────────────────────────────────

function InvestigationStep({
  step,
  result,
  isActive,
  onRun,
  onToggle,
}: {
  step: StepConfig;
  result: StepResult;
  isActive: boolean;
  onRun: () => void;
  onToggle: () => void;
}) {
  const Icon = step.icon;
  const isDone = result.status === "done";
  const isLoading = result.status === "loading";

  return (
    <div
      className={`rounded-lg border transition-all ${
        isActive
          ? "border-cyan-500/40 bg-cyan-500/5"
          : isDone
            ? "border-emerald-500/20 bg-emerald-500/5"
            : "border-white/10 bg-white/[0.02]"
      }`}
    >
      {/* Step header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
            isDone
              ? "border-emerald-500/40 bg-emerald-500/10"
              : isActive
                ? "border-cyan-500/40 bg-cyan-500/10"
                : "border-white/10 bg-white/[0.05]"
          }`}
        >
          {isDone ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <span className="text-xs font-bold text-white/60">
              {step.number}
            </span>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Icon
              className={`h-4 w-4 ${isDone ? "text-emerald-400" : "text-cyan-400"}`}
            />
            <h3 className="text-sm font-semibold text-white">{step.title}</h3>
          </div>
          <p className="mt-0.5 text-xs text-white/40">
            <code className="text-cyan-400/60">{step.toolName}</code>
          </p>
        </div>
        {isDone && result.elapsed && (
          <span className="text-[10px] text-emerald-400/60 font-mono">
            {result.elapsed}ms
          </span>
        )}
        {isActive ? (
          <ChevronDown className="h-4 w-4 text-white/30" />
        ) : (
          <ChevronRight className="h-4 w-4 text-white/30" />
        )}
      </button>

      {/* Expanded content */}
      {isActive && (
        <div className="border-t border-white/5 p-4 space-y-4">
          <p className="text-sm text-slate-400 leading-relaxed">
            {step.description}
          </p>

          {/* Tool call info */}
          <div className="rounded bg-slate-900/80 p-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
              Station Tool Call
            </p>
            <pre className="text-[11px] text-cyan-300 font-mono overflow-x-auto">
              {step.toolName}({JSON.stringify(step.toolArgs, null, 2)})
            </pre>
          </div>

          {/* Run button */}
          {result.status !== "done" && (
            <button
              onClick={onRun}
              disabled={isLoading}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                isLoading
                  ? "bg-slate-700 text-slate-400 cursor-wait"
                  : "bg-cyan-600 text-white hover:bg-cyan-500"
              }`}
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  Calling Station...
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4" />
                  Run Step {step.number}
                </>
              )}
            </button>
          )}

          {/* Result */}
          {isDone && result.data && (
            <div className="rounded bg-slate-900/80 p-3">
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">
                Result ({result.elapsed}ms)
              </p>
              <pre className="text-[11px] text-slate-300 font-mono overflow-x-auto max-h-64 overflow-y-auto">
                {typeof result.data === "string"
                  ? String(result.data)
                  : JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          )}

          {/* Error */}
          {result.status === "error" && (
            <div className="rounded bg-red-500/10 border border-red-500/20 p-3">
              <p className="text-xs text-red-400">{result.error}</p>
            </div>
          )}

          {/* Educational note */}
          <div className="rounded bg-amber-500/5 border border-amber-500/10 p-3">
            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">
              Why This Matters
            </p>
            <p className="text-xs text-amber-200/70 leading-relaxed">
              {step.learnMore}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Copy CTA ──────────────────────────────────────────────────────────

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-md bg-white/5 px-2.5 py-1.5 text-[11px] font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
      aria-label={`Copy ${label}`}
    >
      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : label}
    </button>
  );
}

function CopyableCTA() {
  const toolSequence = STEPS.map(
    (s) => `${s.toolName}(${JSON.stringify(s.toolArgs)})`,
  ).join("\n");

  return (
    <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.02] p-6">
      <h3 className="text-sm font-semibold text-white mb-2">
        Reproduce This With Your AI Agent
      </h3>
      <p className="text-xs text-slate-400 mb-3">
        Connect to{" "}
        <code className="rounded bg-slate-800 px-1.5 py-0.5 text-cyan-300 text-[11px] font-mono">
          {MCP}
        </code>{" "}
        and run these 6 tools in sequence. No auth. No API key. Just MCP.
      </p>
      <div className="flex items-center gap-2 mb-3">
        <CopyButton text={MCP} label="Copy endpoint" />
        <CopyButton text={toolSequence} label="Copy tools" />
      </div>
      <pre className="rounded bg-slate-900 p-4 text-[11px] text-slate-300 font-mono overflow-x-auto">
        {toolSequence}
      </pre>
      <Link
        href="/station/connect"
        className="mt-3 inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
      >
        Step-by-step setup guide <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

// ─── Main Investigation ─────────────────────────────────────────────────

export function SemaglutideInvestigation() {
  const [results, setResults] = useState<Record<StepKey, StepResult>>(
    Object.fromEntries(
      STEPS.map((s) => [s.key, { status: "idle", data: null }]),
    ) as Record<StepKey, StepResult>,
  );
  const [activeStep, setActiveStep] = useState<StepKey>("identity");
  const completedCount = Object.values(results).filter(
    (r) => r.status === "done",
  ).length;

  const runStep = useCallback(async (step: StepConfig) => {
    setResults((prev) => ({
      ...prev,
      [step.key]: { status: "loading", data: null },
    }));

    try {
      const { data, elapsed } = await callStation(step.toolName, step.toolArgs);
      setResults((prev) => ({
        ...prev,
        [step.key]: { status: "done", data, elapsed },
      }));

      // Auto-advance to next step
      const idx = STEPS.findIndex((s) => s.key === step.key);
      if (idx < STEPS.length - 1) {
        setActiveStep(STEPS[idx + 1].key);
      }
    } catch (e) {
      setResults((prev) => ({
        ...prev,
        [step.key]: {
          status: "error",
          data: null,
          error: e instanceof Error ? e.message : "Unknown error",
        },
      }));
    }
  }, []);

  const runAll = useCallback(async () => {
    for (const step of STEPS) {
      if (results[step.key].status === "done") continue;
      setActiveStep(step.key);
      setResults((prev) => ({
        ...prev,
        [step.key]: { status: "loading", data: null },
      }));
      try {
        const { data, elapsed } = await callStation(
          step.toolName,
          step.toolArgs,
        );
        setResults((prev) => ({
          ...prev,
          [step.key]: { status: "done", data, elapsed },
        }));
      } catch (e) {
        setResults((prev) => ({
          ...prev,
          [step.key]: {
            status: "error",
            data: null,
            error: e instanceof Error ? e.message : "Unknown error",
          },
        }));
        break;
      }
    }
  }, [results]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      {/* Header */}
      <header className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-[0.2em]">
            Worked Example
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          Semaglutide + Pancreatitis
        </h1>
        <p className="mt-3 max-w-2xl text-base text-slate-400">
          A complete pharmacovigilance signal investigation in 6 steps — from
          drug identity to causality verdict. Every number is computed live from{" "}
          <a href="/station" className="text-cyan-400 hover:text-cyan-300">
            AlgoVigilance Station
          </a>
          , not hardcoded. Click through each step or run all at once.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            onClick={runAll}
            className="inline-flex items-center gap-2 rounded-md bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500 transition-colors"
          >
            <Activity className="h-4 w-4" />
            Run All Steps
          </button>
          <div className="text-sm text-slate-500">
            {completedCount}/{STEPS.length} steps complete
          </div>
          <div className="h-2 flex-1 max-w-48 rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-500"
              style={{
                width: `${(completedCount / STEPS.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </header>

      {/* Steps */}
      <div className="space-y-3">
        {STEPS.map((step) => (
          <InvestigationStep
            key={step.key}
            step={step}
            result={results[step.key]}
            isActive={activeStep === step.key}
            onRun={() => runStep(step)}
            onToggle={() =>
              setActiveStep(activeStep === step.key ? step.key : step.key)
            }
          />
        ))}
      </div>

      {/* Completion */}
      {completedCount === STEPS.length && (
        <div className="mt-8 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400 mb-3" />
          <h2 className="text-lg font-semibold text-white mb-2">
            Investigation Complete
          </h2>
          <p className="text-sm text-slate-400 mb-4 max-w-lg mx-auto">
            You just ran a complete PV signal investigation using 6 live data
            sources. Every number was computed in real-time by AlgoVigilance
            Station. This same investigation can be run by any MCP-equipped AI
            agent.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 rounded-md bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500 transition-colors"
            >
              Sign Up Free
            </Link>
            <Link
              href="/station"
              className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:border-cyan-500/40 transition-colors"
            >
              <Cable className="h-4 w-4" /> Browse All 135 Tools
            </Link>
          </div>
        </div>
      )}

      {/* MCP Agent CTA */}
      <CopyableCTA />
    </div>
  );
}
