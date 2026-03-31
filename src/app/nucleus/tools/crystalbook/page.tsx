"use client";

import { useState } from "react";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BookOpen,
  Loader2,
} from "lucide-react";
import { StepWizard } from "@/components/pv-for-nexvigilants";

/* ---------- Types ---------- */

type PrimitiveStatus =
  | "PRESENT"
  | "ABSENT"
  | "UNVERIFIED"
  | "CLEAR"
  | "AMBIGUOUS"
  | "DISSOLVED"
  | "CAPTURED"
  | "OBSERVED"
  | "INFERRED"
  | "STALE"
  | "NAMED"
  | "UNNAMED"
  | "IGNORED";
type LawStatus = "SATISFIED" | "AT_RISK" | "VIOLATED" | "UNASSESSED";
type Verdict =
  | "HEALTHY"
  | "GUARDED"
  | "STRESSED"
  | "DEGRADED"
  | "CRITICAL"
  | "NON_EXISTENT";

interface DiagnosticResult {
  existence_status: PrimitiveStatus;
  boundary_status: PrimitiveStatus;
  state_status: PrimitiveStatus;
  void_status: PrimitiveStatus;
  conservation_holds: boolean;
  degraded_count: number;
  law_statuses: {
    num: string;
    name: string;
    vice: string;
    virtue: string;
    status: LawStatus;
  }[];
  overall_verdict: Verdict;
  prescription: string;
  station_source: boolean;
}

/* ---------- Law metadata ---------- */

const LAWS = [
  { num: "I", name: "True Measure", vice: "Pride", virtue: "Humility" },
  { num: "II", name: "Sufficient Portion", vice: "Greed", virtue: "Charity" },
  { num: "III", name: "Bounded Pursuit", vice: "Lust", virtue: "Chastity" },
  { num: "IV", name: "Generous Witness", vice: "Envy", virtue: "Kindness" },
  { num: "V", name: "Measured Intake", vice: "Gluttony", virtue: "Temperance" },
  { num: "VI", name: "Measured Response", vice: "Wrath", virtue: "Patience" },
  {
    num: "VII",
    name: "Active Maintenance",
    vice: "Sloth",
    virtue: "Diligence",
  },
  {
    num: "VIII",
    name: "Sovereign Boundary",
    vice: "Corruption",
    virtue: "Independence",
  },
];

const LAW_QUESTIONS = [
  "Does the system calibrate against reality, not its own certainty?",
  "Does the system circulate what it holds, not hoard?",
  "Does the system honor commitments and resist scope creep?",
  "Does the system strengthen its neighbors?",
  "Does the system ingest only what it can metabolize?",
  "Does the system correct proportionally, not wrathfully?",
  "Does the system maintain its own maintenance function?",
  "Are boundaries resourced independently of what they constrain?",
];

/* ---------- Pure diagnostic logic (all 8 laws) ---------- */

function runDiagnostic(input: {
  existence: string;
  boundary: string;
  state: string;
  void_id: string;
  scores: number[];
}): DiagnosticResult {
  const hasExistence = input.existence.trim().length > 0;
  const hasBoundary = input.boundary.trim().length > 0;
  const hasState = input.state.trim().length > 0;
  const hasVoid = input.void_id.trim().length > 0;

  const existenceStatus: PrimitiveStatus = hasExistence ? "PRESENT" : "ABSENT";
  const boundaryStatus: PrimitiveStatus = hasBoundary
    ? "CLEAR"
    : hasExistence
      ? "AMBIGUOUS"
      : "DISSOLVED";
  const stateStatus: PrimitiveStatus = hasState
    ? "OBSERVED"
    : hasExistence
      ? "INFERRED"
      : "STALE";
  const voidStatus: PrimitiveStatus = hasVoid
    ? "NAMED"
    : hasExistence
      ? "UNNAMED"
      : "IGNORED";

  const degraded = [hasExistence, hasBoundary, hasState, hasVoid].filter(
    (x) => !x,
  ).length;
  const conservationHolds = degraded === 0;

  const classifyLaw = (score: number): LawStatus => {
    if (score < 4) return "VIOLATED";
    if (score >= 7) return "SATISFIED";
    return "AT_RISK";
  };

  if (!hasExistence) {
    return {
      existence_status: existenceStatus,
      boundary_status: boundaryStatus,
      state_status: stateStatus,
      void_status: voidStatus,
      conservation_holds: false,
      degraded_count: degraded,
      law_statuses: LAWS.map((l) => ({
        ...l,
        status: "UNASSESSED" as LawStatus,
      })),
      overall_verdict: "NON_EXISTENT",
      prescription:
        "The system does not exist. Establish existence (∃) before assessing health.",
      station_source: false,
    };
  }

  const lawStatuses = LAWS.map((law, i) => ({
    ...law,
    status: classifyLaw(input.scores[i]),
  }));

  const violated = lawStatuses.filter((l) => l.status === "VIOLATED").length;
  const atRisk = lawStatuses.filter((l) => l.status === "AT_RISK").length;
  const satisfied = lawStatuses.filter((l) => l.status === "SATISFIED").length;

  let verdict: Verdict;
  let prescription: string;

  if (!conservationHolds && violated >= 2) {
    verdict = "CRITICAL";
    prescription = `Conservation stressed AND ${violated} laws violated. Fill missing primitives first, then address violated laws in order.`;
  } else if (!conservationHolds) {
    verdict = violated > 0 ? "DEGRADED" : "STRESSED";
    prescription = `Conservation stressed (${degraded} primitive${degraded > 1 ? "s" : ""} degraded). Fill the missing primitives to restore full conservation.`;
  } else if (violated >= 3) {
    verdict = "CRITICAL";
    prescription = `${violated} laws violated. Multiple system failure modes active. Address the most severe violations first.`;
  } else if (violated >= 1) {
    verdict = "DEGRADED";
    const violatedNames = lawStatuses
      .filter((l) => l.status === "VIOLATED")
      .map((l) => `${l.num} (${l.vice})`)
      .join(", ");
    prescription = `Law${violated > 1 ? "s" : ""} ${violatedNames} violated. Restore the corresponding virtue${violated > 1 ? "s" : ""} before compounding.`;
  } else if (atRisk >= 3) {
    verdict = "STRESSED";
    prescription = `${atRisk} laws at risk. No active violations but the system is under strain. Strengthen before degradation.`;
  } else if (satisfied === 8) {
    verdict = "HEALTHY";
    prescription =
      "All eight laws satisfied. The system endures — not because it is perfect, but because it corrects.";
  } else {
    verdict = "GUARDED";
    prescription = `${satisfied} laws satisfied, ${atRisk} at risk. System is functional. Address at-risk laws to build resilience.`;
  }

  return {
    existence_status: existenceStatus,
    boundary_status: boundaryStatus,
    state_status: stateStatus,
    void_status: voidStatus,
    conservation_holds: conservationHolds,
    degraded_count: degraded,
    law_statuses: lawStatuses,
    overall_verdict: verdict,
    prescription,
    station_source: false,
  };
}

/* ---------- Sub-components ---------- */

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PRESENT: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    CLEAR: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    OBSERVED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    NAMED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    SATISFIED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    HEALTHY: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    AT_RISK: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    AMBIGUOUS: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    INFERRED: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    UNNAMED: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    STRESSED: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    GUARDED: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    VIOLATED: "bg-red-500/20 text-red-400 border-red-500/30",
    ABSENT: "bg-red-500/20 text-red-400 border-red-500/30",
    DISSOLVED: "bg-red-500/20 text-red-400 border-red-500/30",
    STALE: "bg-red-500/20 text-red-400 border-red-500/30",
    IGNORED: "bg-red-500/20 text-red-400 border-red-500/30",
    DEGRADED: "bg-red-500/20 text-red-400 border-red-500/30",
    CRITICAL: "bg-red-500/20 text-red-400 border-red-500/30",
    NON_EXISTENT: "bg-red-500/20 text-red-400 border-red-500/30",
    UNASSESSED: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${colors[status] ?? "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"}`}
    >
      {status}
    </span>
  );
}

function VerdictIcon({ verdict }: { verdict: Verdict }) {
  switch (verdict) {
    case "HEALTHY":
      return <CheckCircle2 className="h-8 w-8 text-emerald-400" />;
    case "GUARDED":
      return <HelpCircle className="h-8 w-8 text-amber-400" />;
    case "STRESSED":
      return <AlertTriangle className="h-8 w-8 text-amber-400" />;
    case "DEGRADED":
      return <AlertTriangle className="h-8 w-8 text-red-400" />;
    case "CRITICAL":
      return <XCircle className="h-8 w-8 text-red-400" />;
    case "NON_EXISTENT":
      return <XCircle className="h-8 w-8 text-zinc-400" />;
  }
}

function ScoreSlider({
  value,
  onChange,
  label,
  question,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  question: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-white">{label}</label>
        <span className="text-sm font-bold text-cyan-400">{value}/10</span>
      </div>
      <p className="text-xs text-muted-foreground">{question}</p>
      <input
        type="range"
        min={0}
        max={10}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full accent-cyan-500"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>Vice dominant</span>
        <span>Virtue dominant</span>
      </div>
    </div>
  );
}

/* ---------- Main Page ---------- */

export default function CrystalbookToolPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Phase 1 inputs
  const [existence, setExistence] = useState("");
  const [boundary, setBoundary] = useState("");
  const [stateObs, setStateObs] = useState("");
  const [voidId, setVoidId] = useState("");

  // Phase 2 inputs — all 8 laws
  const [scores, setScores] = useState([5, 5, 5, 5, 5, 5, 5, 5]);

  // Result
  const [result, setResult] = useState<DiagnosticResult | null>(null);

  const updateScore = (idx: number, val: number) => {
    setScores((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const handleDiagnose = async () => {
    setLoading(true);

    // Client-side diagnostic (instant)
    const clientResult = runDiagnostic({
      existence,
      boundary,
      state: stateObs,
      void_id: voidId,
      scores,
    });

    // Try Station-enriched diagnostic via API
    try {
      const res = await fetch("/api/crystalbook/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemDescription: existence,
          answers: LAWS.map((law, i) => ({
            lawNum: law.num,
            status:
              scores[i] >= 7
                ? "healthy"
                : scores[i] >= 4
                  ? "at-risk"
                  : "violated",
          })),
        }),
      });

      if (res.ok) {
        clientResult.station_source = true;
      }
    } catch {
      // Station unavailable — client result stands
    }

    setResult(clientResult);
    setLoading(false);
    setStep(2);
  };

  const steps = [
    {
      title: "Does it exist?",
      description: "Check the 4 conservation primitives",
      content: (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Every system that persists must conserve four things: existence,
            boundaries, state, and nothing. Describe each for the system you are
            diagnosing.
          </p>

          <div className="space-y-4">
            {[
              {
                label:
                  "Existence (∃) — What evidence proves this system exists?",
                value: existence,
                set: setExistence,
                placeholder:
                  "e.g., Running process at pid 1234, artifact on disk, published API...",
              },
              {
                label: "Boundary (∂) — Where does this system begin and end?",
                value: boundary,
                set: setBoundary,
                placeholder:
                  "e.g., Scoped to the crystalbook plugin directory, bounded by Cargo.toml...",
              },
              {
                label: "State (ς) — What is the current observed state?",
                value: stateObs,
                set: setStateObs,
                placeholder:
                  "e.g., All tests passing, 8/8 laws loaded, last measured 2 hours ago...",
              },
              {
                label: "Nothing (∅) — What is absent? What gaps exist?",
                value: voidId,
                set: setVoidId,
                placeholder:
                  "e.g., No hooks wired, no MCP tools exposed, missing documentation...",
              },
            ].map((field) => (
              <div key={field.label}>
                <label className="mb-1 block text-sm font-medium text-white">
                  {field.label}
                </label>
                <textarea
                  value={field.value}
                  onChange={(e) => field.set(e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  rows={2}
                />
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "Is it healthy?",
      description: "Rate all 8 Laws of System Homeostasis",
      content: (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Rate how well the system practices each virtue on a scale of 0 (vice
            dominant) to 10 (virtue dominant).
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            {LAWS.map((law, i) => (
              <ScoreSlider
                key={law.num}
                value={scores[i]}
                onChange={(v) => updateScore(i, v)}
                label={`Law ${law.num}: ${law.virtue}`}
                question={LAW_QUESTIONS[i]}
              />
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "Diagnosis",
      description: "Conservation verdict and prescription",
      content: loading ? (
        <div className="flex flex-col items-center gap-4 py-12">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <p className="text-sm text-muted-foreground">
            Running diagnostic via Station...
          </p>
        </div>
      ) : result ? (
        <div className="space-y-6">
          {/* Verdict card */}
          <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-6">
            <VerdictIcon verdict={result.overall_verdict} />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Verdict</h3>
                <StatusBadge status={result.overall_verdict} />
                {result.station_source && (
                  <span className="text-[10px] text-cyan-400/60 border border-cyan-400/20 rounded px-1.5 py-0.5">
                    Station-verified
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {result.prescription}
              </p>
            </div>
          </div>

          {/* Conservation equation */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h4 className="mb-3 text-sm font-semibold text-white">
              Conservation Law: ∃ = ∂(×(ς, ∅))
            </h4>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { label: "Existence (∃)", status: result.existence_status },
                { label: "Boundary (∂)", status: result.boundary_status },
                { label: "State (ς)", status: result.state_status },
                { label: "Nothing (∅)", status: result.void_status },
              ].map((p) => (
                <div key={p.label} className="text-center">
                  <div className="text-xs text-muted-foreground">{p.label}</div>
                  <StatusBadge status={p.status} />
                </div>
              ))}
            </div>
            <div className="mt-3 text-center">
              <span className="text-xs text-muted-foreground">
                Conservation:{" "}
              </span>
              <StatusBadge
                status={result.conservation_holds ? "PRESENT" : "ABSENT"}
              />
              <span className="ml-2 text-xs text-muted-foreground">
                ({result.degraded_count} primitive
                {result.degraded_count !== 1 ? "s" : ""} degraded)
              </span>
            </div>
          </div>

          {/* All 8 Law assessments */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <h4 className="mb-3 text-sm font-semibold text-white">
              Eight-Law Assessment
            </h4>
            <div className="grid gap-2">
              {result.law_statuses.map((law) => (
                <div
                  key={law.num}
                  className="flex items-center justify-between rounded-md bg-white/5 px-3 py-2"
                >
                  <span className="text-xs text-muted-foreground">
                    Law {law.num}: {law.vice} → {law.virtue}
                  </span>
                  <StatusBadge status={law.status} />
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                setResult(null);
                setStep(0);
              }}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:bg-white/5 hover:text-white transition-colors"
            >
              Run Another Diagnostic
            </button>
            <a
              href="/crystalbook"
              className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/30 px-4 py-2 text-sm text-cyan-400 hover:bg-cyan-500/10 transition-colors"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Read The Crystalbook
            </a>
            <a
              href="/crystalbook/diagnostic"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:bg-white/5 hover:text-white transition-colors"
            >
              AI-Powered Diagnostic
            </a>
          </div>
        </div>
      ) : null,
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20">
            <Shield className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Crystalbook Diagnostic
            </h1>
            <p className="text-sm text-muted-foreground">
              Eight Laws of System Homeostasis — by Matthew A. Campion, PharmD
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Powered by AlgoVigilance Station at mcp.nexvigilant.com
        </p>
      </div>

      {/* Wizard */}
      <StepWizard
        steps={steps}
        currentStep={step}
        onNext={() => {
          if (step === 1) {
            handleDiagnose();
          } else {
            setStep((s) => Math.min(s + 1, steps.length - 1));
          }
        }}
        onBack={() => setStep((s) => Math.max(s - 1, 0))}
      />
    </div>
  );
}
