"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ChevronLeft,
  Loader2,
  Check,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import {
  DIAGNOSTIC_QUESTIONS,
  scoreDiagnostic,
  type LawStatus,
} from "@/data/crystalbook-diagnostic";

type Phase = "intro" | "questions" | "generating" | "report";

interface LawAnswer {
  lawNum: string;
  status: LawStatus;
}

const STATUS_OPTIONS: { value: LawStatus; label: string; color: string }[] = [
  { value: "healthy", label: "Healthy", color: "emerald" },
  { value: "at-risk", label: "At Risk", color: "amber" },
  { value: "violated", label: "Violated", color: "red" },
];

interface AIReport {
  summary: string;
  lawAnalyses: {
    lawNum: string;
    lawTitle: string;
    status: LawStatus;
    observation: string;
    correction: string;
  }[];
  prognosis: string;
}

export function DiagnosticWizard() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [systemDescription, setSystemDescription] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<LawAnswer[]>([]);
  const [report, setReport] = useState<AIReport | null>(null);
  const [_error, setError] = useState<string | null>(null);

  const handleStartAssessment = () => {
    if (!systemDescription.trim()) return;
    setPhase("questions");
  };

  const handleAnswer = (status: LawStatus) => {
    const question = DIAGNOSTIC_QUESTIONS[currentQuestion];
    const newAnswers = [
      ...answers.filter((a) => a.lawNum !== question.lawNum),
      { lawNum: question.lawNum, status },
    ];
    setAnswers(newAnswers);

    if (currentQuestion < DIAGNOSTIC_QUESTIONS.length - 1) {
      setCurrentQuestion((c) => c + 1);
    } else {
      generateReport(newAnswers);
    }
  };

  const generateReport = async (finalAnswers: LawAnswer[]) => {
    setPhase("generating");
    setError(null);

    try {
      const response = await fetch("/api/crystalbook/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemDescription,
          answers: finalAnswers,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      const data = await response.json();
      setReport(data);
      setPhase("report");
    } catch {
      // Fallback — generate a basic report without AI
      const fallbackReport: AIReport = {
        summary: `Assessment of "${systemDescription}" across the Eight Laws of System Homeostasis.`,
        lawAnalyses: finalAnswers.map((a) => {
          const q = DIAGNOSTIC_QUESTIONS.find((q) => q.lawNum === a.lawNum)!;
          return {
            lawNum: a.lawNum,
            lawTitle: q.lawTitle,
            status: a.status,
            observation:
              a.status === "healthy"
                ? q.healthySignal
                : a.status === "at-risk"
                  ? q.riskSignal
                  : q.violatedSignal,
            correction:
              a.status !== "healthy"
                ? `Restore ${q.virtue} — the corrective force for ${q.vice}.`
                : "No correction needed.",
          };
        }),
        prognosis:
          finalAnswers.filter((a) => a.status === "violated").length >= 3
            ? "This system is losing coherence. Without intervention on the violated laws, degradation will compound."
            : finalAnswers.filter((a) => a.status === "violated").length >= 1
              ? "This system is functional but carries risk. Address violated laws before they cascade."
              : "This system shows resilience. Maintain the current health checks and stay vigilant.",
      };
      setReport(fallbackReport);
      setPhase("report");
    }
  };

  const handleReset = () => {
    setPhase("intro");
    setSystemDescription("");
    setCurrentQuestion(0);
    setAnswers([]);
    setReport(null);
    setError(null);
  };

  const currentAnswer = answers.find(
    (a) => a.lawNum === DIAGNOSTIC_QUESTIONS[currentQuestion]?.lawNum,
  );

  // ─── INTRO PHASE ───────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-headline font-bold text-white mb-4">
            System Health Diagnostic
          </h2>
          <p className="text-slate-dim leading-relaxed">
            Every system that persists does so because it corrects. The Eight
            Laws identify the eight ways a system loses its ability to
            self-correct. This diagnostic checks yours.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="system" className="text-white">
              What system are you assessing?
            </Label>
            <p className="text-xs text-slate-dim">
              A team, a company, a process, a product, a relationship — any
              system that you want to persist.
            </p>
            <Textarea
              id="system"
              placeholder="e.g., Our product development process, My leadership team, The company's safety reporting workflow..."
              className="min-h-[100px]"
              value={systemDescription}
              onChange={(e) => setSystemDescription(e.target.value)}
              maxLength={500}
            />
          </div>

          <Button
            onClick={handleStartAssessment}
            disabled={!systemDescription.trim()}
            className="w-full bg-cyan text-nex-deep hover:bg-cyan-glow font-semibold touch-target"
          >
            Begin Assessment
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    );
  }

  // ─── QUESTIONS PHASE ───────────────────────────────────────────────
  if (phase === "questions") {
    const q = DIAGNOSTIC_QUESTIONS[currentQuestion];

    return (
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <nav aria-label="Assessment progress" className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-dim uppercase tracking-wide">
              Law {q.lawNum} of VIII
            </span>
            <span className="text-xs text-cyan">
              {currentQuestion + 1} / {DIAGNOSTIC_QUESTIONS.length}
            </span>
          </div>
          <div className="flex gap-1">
            {DIAGNOSTIC_QUESTIONS.map((_, i) => {
              const answer = answers.find(
                (a) => a.lawNum === DIAGNOSTIC_QUESTIONS[i].lawNum,
              );
              return (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-all duration-300",
                    i === currentQuestion
                      ? "bg-cyan"
                      : answer?.status === "healthy"
                        ? "bg-emerald-500"
                        : answer?.status === "at-risk"
                          ? "bg-amber-500"
                          : answer?.status === "violated"
                            ? "bg-red-500"
                            : "bg-white/10",
                  )}
                />
              );
            })}
          </div>
        </nav>

        {/* Question */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-slate-dim uppercase tracking-wide mb-3">
            <span>The Law of {q.lawTitle}</span>
            <span className="text-white/20">|</span>
            <span>
              {q.vice} → {q.virtue}
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-headline font-bold text-white mb-3">
            {q.question}
          </h3>
          <p className="text-slate-dim leading-relaxed">{q.description}</p>
        </div>

        {/* Answer options */}
        <div className="space-y-3 mb-8">
          {STATUS_OPTIONS.map((option) => {
            const isSelected = currentAnswer?.status === option.value;
            const q = DIAGNOSTIC_QUESTIONS[currentQuestion];
            const signal =
              option.value === "healthy"
                ? q.healthySignal
                : option.value === "at-risk"
                  ? q.riskSignal
                  : q.violatedSignal;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleAnswer(option.value)}
                className={cn(
                  "w-full text-left p-4 rounded-xl border transition-all duration-200",
                  isSelected
                    ? option.color === "emerald"
                      ? "border-emerald-500/50 bg-emerald-500/10"
                      : option.color === "amber"
                        ? "border-amber-500/50 bg-amber-500/10"
                        : "border-red-500/50 bg-red-500/10"
                    : "border-nex-light bg-nex-surface/50 hover:border-white/30",
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border text-xs",
                      option.color === "emerald" &&
                        "border-emerald-500/50 text-emerald-400",
                      option.color === "amber" &&
                        "border-amber-500/50 text-amber-400",
                      option.color === "red" &&
                        "border-red-500/50 text-red-400",
                    )}
                  >
                    {option.color === "emerald" ? (
                      <ShieldCheck className="h-3 w-3" />
                    ) : option.color === "amber" ? (
                      <AlertTriangle className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">
                      {option.label}
                    </p>
                    <p className="text-xs text-slate-dim mt-0.5">{signal}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Back button */}
        {currentQuestion > 0 && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setCurrentQuestion((c) => c - 1)}
            className="text-slate-dim hover:text-white"
          >
            <ChevronLeft className="h-4 w-4 mr-1" aria-hidden="true" />
            Previous Law
          </Button>
        )}
      </div>
    );
  }

  // ─── GENERATING PHASE ──────────────────────────────────────────────
  if (phase === "generating") {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-cyan mx-auto mb-6" />
        <h3 className="text-xl font-headline font-bold text-white mb-2">
          Generating Your Diagnosis
        </h3>
        <p className="text-slate-dim">
          Analyzing your system against the Eight Laws...
        </p>
      </div>
    );
  }

  // ─── REPORT PHASE ─────────────────────────────────────────────────
  if (phase === "report" && report) {
    const score = scoreDiagnostic(answers);

    const gradeColor =
      score.grade === "Resilient"
        ? "text-emerald-400"
        : score.grade === "Stable"
          ? "text-cyan"
          : score.grade === "Under Stress"
            ? "text-amber-400"
            : "text-red-400";

    return (
      <div className="max-w-3xl mx-auto">
        {/* Report Header */}
        <div className="text-center mb-10 pb-8 border-b border-nex-light">
          <p className="text-xs text-slate-dim uppercase tracking-widest mb-3">
            Crystalbook Health Report
          </p>
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-white mb-2">
            {systemDescription}
          </h2>
          <div className="flex items-center justify-center gap-6 mt-6">
            <div className="text-center">
              <p className={cn("text-4xl font-bold", gradeColor)}>
                {score.grade}
              </p>
              <p className="text-xs text-slate-dim mt-1">Overall Status</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-8 mt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">
                {score.satisfied}
              </p>
              <p className="text-xs text-slate-dim">Healthy</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-400">
                {score.atRisk}
              </p>
              <p className="text-xs text-slate-dim">At Risk</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">
                {score.violated}
              </p>
              <p className="text-xs text-slate-dim">Violated</p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-10">
          <p className="text-slate-dim leading-relaxed">{report.summary}</p>
        </div>

        {/* Law-by-Law Analysis */}
        <div className="space-y-6 mb-10">
          {report.lawAnalyses.map((law) => (
            <div
              key={law.lawNum}
              className={cn(
                "p-5 rounded-xl border",
                law.status === "healthy"
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : law.status === "at-risk"
                    ? "border-amber-500/20 bg-amber-500/5"
                    : "border-red-500/20 bg-red-500/5",
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                    law.status === "healthy"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : law.status === "at-risk"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-red-500/20 text-red-400",
                  )}
                >
                  {law.status === "healthy" ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : law.status === "at-risk" ? (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5" />
                  )}
                </div>
                <h4 className="font-headline font-semibold text-white">
                  Law {law.lawNum} — {law.lawTitle}
                </h4>
              </div>
              <p className="text-sm text-slate-dim mb-2">{law.observation}</p>
              {law.status !== "healthy" && (
                <p className="text-sm text-cyan">{law.correction}</p>
              )}
            </div>
          ))}
        </div>

        {/* Prognosis */}
        <div className="p-6 rounded-xl border border-nex-light bg-nex-surface/50 mb-10">
          <h4 className="text-xs text-slate-dim uppercase tracking-wide mb-2">
            Prognosis
          </h4>
          <p className="text-white font-medium leading-relaxed">
            {report.prognosis}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Button
            onClick={handleReset}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/5"
          >
            <RotateCcw className="h-4 w-4 mr-2" aria-hidden="true" />
            New Assessment
          </Button>
          <Button
            asChild
            className="bg-cyan text-nex-deep hover:bg-cyan-glow font-semibold"
          >
            <a href="/crystalbook">Read The Crystalbook</a>
          </Button>
        </div>

        {/* Attribution */}
        <p className="text-center text-xs text-slate-dim mt-10">
          Based on The Crystalbook v2.0 — Eight Laws of System Homeostasis
          <br />
          By Matthew A. Campion, PharmD — Founder, AlgoVigilance
        </p>
      </div>
    );
  }

  return null;
}
