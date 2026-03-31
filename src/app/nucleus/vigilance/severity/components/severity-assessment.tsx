"use client";

import { useState, useMemo } from "react";
import { Gauge, AlertTriangle, Info } from "lucide-react";
import {
  ctcaeGradeToScore,
  classifySeverity,
  type SeverityResult as PvSeverityResult,
} from "@/lib/pv-compute";

type SeverityGrade = "mild" | "moderate" | "severe" | null;

interface SeverityResult {
  grade: SeverityGrade;
  ctcae_grade: number;
  description: string;
}

const SEVERITY_GRADES: {
  grade: SeverityGrade;
  label: string;
  ctcae: number;
  definition: string;
  examples: string[];
}[] = [
  {
    grade: "mild",
    label: "Mild",
    ctcae: 1,
    definition:
      "Awareness of signs or symptoms, but easily tolerated. No limitation of usual activities. No medical intervention required.",
    examples: [
      "Mild headache",
      "Minor rash (localized)",
      "Slight nausea without vomiting",
      "Mild fatigue",
    ],
  },
  {
    grade: "moderate",
    label: "Moderate",
    ctcae: 2,
    definition:
      "Discomfort sufficient to interfere with usual activities. May require minimal, local, or non-invasive intervention.",
    examples: [
      "Persistent headache requiring analgesics",
      "Rash covering >50% body surface",
      "Vomiting (2-5 episodes/day)",
      "Fatigue limiting instrumental ADL",
    ],
  },
  {
    grade: "severe",
    label: "Severe",
    ctcae: 3,
    definition:
      "Significant interference with usual activities. May require medical or surgical intervention. Incapacitating.",
    examples: [
      "Migraine requiring ER visit",
      "Generalized desquamation",
      "Intractable vomiting requiring IV fluids",
      "Fatigue limiting self-care ADL",
    ],
  },
];

export function SeverityAssessment() {
  const [selectedGrade, setSelectedGrade] = useState<SeverityGrade>(null);
  const [eventName, setEventName] = useState("");
  const [functionalImpact, setFunctionalImpact] = useState<string | null>(null);
  const [interventionNeeded, setInterventionNeeded] = useState<string | null>(
    null,
  );

  // Auto-suggest severity based on functional impact + intervention
  const suggestedGrade = useMemo((): SeverityResult | null => {
    if (!functionalImpact && !interventionNeeded) return null;

    if (
      functionalImpact === "incapacitating" ||
      interventionNeeded === "medical_surgical"
    ) {
      return {
        grade: "severe",
        ctcae_grade: 3,
        description: "Incapacitating or requires medical/surgical intervention",
      };
    }
    if (functionalImpact === "interferes" || interventionNeeded === "minimal") {
      return {
        grade: "moderate",
        ctcae_grade: 2,
        description:
          "Interferes with usual activities or requires minimal intervention",
      };
    }
    if (functionalImpact === "tolerable" || interventionNeeded === "none") {
      return {
        grade: "mild",
        ctcae_grade: 1,
        description: "Easily tolerated, no intervention needed",
      };
    }
    return null;
  }, [functionalImpact, interventionNeeded]);

  const activeGrade = selectedGrade || suggestedGrade?.grade;

  // Wire to pv-compute: ctcaeGradeToScore + classifySeverity mirror severity-grading.yaml
  const pvSeverity: PvSeverityResult | null = useMemo(() => {
    const ctcae =
      activeGrade === "severe"
        ? 3
        : activeGrade === "moderate"
          ? 2
          : activeGrade === "mild"
            ? 1
            : null;
    if (ctcae === null) return null;
    const score = ctcaeGradeToScore(ctcae);
    return classifySeverity(score);
  }, [activeGrade]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="intel-status-active" />
          <span className="intel-label">
            Intensity Assessment / Independent of Seriousness
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-headline mb-2 text-white tracking-tight">
          Severity Assessment
        </h1>
        <p className="text-sm text-slate-dim/60 max-w-lg mx-auto">
          Grade event intensity (mild / moderate / severe) — an independent
          dimension from seriousness per ICH E2A
        </p>
      </header>

      {/* Critical Axiom Banner */}
      <div className="border border-gold/20 bg-gold/5 p-4 mb-6 flex items-start gap-3">
        <Info className="h-4 w-4 text-gold/60 mt-0.5 shrink-0" />
        <div>
          <p className="text-[10px] font-mono font-bold text-gold/80 uppercase tracking-widest">
            Critical Axiom — ICH E2A
          </p>
          <p className="text-xs text-slate-300/80 mt-1 leading-relaxed">
            Seriousness and severity are{" "}
            <span className="text-white font-bold">independent dimensions</span>
            . A <span className="text-white">severe headache</span> is not
            serious. A{" "}
            <span className="text-white">mild cardiac arrhythmia</span> may be
            serious. Conflating these is the most common definitional error in
            pharmacovigilance.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Assessment Input */}
        <div className="space-y-4">
          <div className="border border-white/[0.12] bg-white/[0.06]">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
              <Gauge className="h-3.5 w-3.5 text-cyan/60" />
              <span className="intel-label">Event Details</span>
              <div className="h-px flex-1 bg-white/[0.08]" />
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 block mb-1">
                  Event Name
                </label>
                <input
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="e.g., Headache, Rash, Nausea..."
                  className="w-full bg-black/20 border border-white/[0.08] px-3 py-2 text-sm font-mono text-white placeholder:text-slate-dim/30 focus:border-cyan/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 block mb-2">
                  Functional Impact
                </label>
                <div className="space-y-1">
                  {[
                    {
                      value: "tolerable",
                      label: "Easily tolerated — no limitation of activities",
                    },
                    {
                      value: "interferes",
                      label: "Interferes with usual activities",
                    },
                    {
                      value: "incapacitating",
                      label:
                        "Incapacitating — unable to perform usual activities",
                    },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFunctionalImpact(opt.value)}
                      className={`w-full text-left px-3 py-2 border transition-all text-xs font-mono ${
                        functionalImpact === opt.value
                          ? "border-cyan/40 bg-cyan/5 text-cyan"
                          : "border-white/[0.08] text-slate-dim/50 hover:border-white/[0.15]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 block mb-2">
                  Intervention Required
                </label>
                <div className="space-y-1">
                  {[
                    { value: "none", label: "No medical intervention needed" },
                    {
                      value: "minimal",
                      label: "Minimal / local / non-invasive intervention",
                    },
                    {
                      value: "medical_surgical",
                      label: "Medical or surgical intervention required",
                    },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setInterventionNeeded(opt.value)}
                      className={`w-full text-left px-3 py-2 border transition-all text-xs font-mono ${
                        interventionNeeded === opt.value
                          ? "border-cyan/40 bg-cyan/5 text-cyan"
                          : "border-white/[0.08] text-slate-dim/50 hover:border-white/[0.15]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Severity Scale + Result */}
        <div className="space-y-4">
          {/* Grade Selection */}
          <div className="border border-white/[0.12] bg-white/[0.06]">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
              <AlertTriangle className="h-3.5 w-3.5 text-gold/60" />
              <span className="intel-label">Severity Grade</span>
              <div className="h-px flex-1 bg-white/[0.08]" />
            </div>
            <div className="p-4 space-y-2">
              {SEVERITY_GRADES.map((g) => {
                const isActive = activeGrade === g.grade;
                const isSuggested =
                  suggestedGrade?.grade === g.grade && !selectedGrade;
                const colors =
                  g.grade === "mild"
                    ? {
                        border: "border-emerald-500/40",
                        bg: "bg-emerald-500/5",
                        text: "text-emerald-400",
                      }
                    : g.grade === "moderate"
                      ? {
                          border: "border-yellow-500/40",
                          bg: "bg-yellow-500/5",
                          text: "text-yellow-400",
                        }
                      : {
                          border: "border-red-500/40",
                          bg: "bg-red-500/5",
                          text: "text-red-400",
                        };

                return (
                  <button
                    key={g.grade}
                    onClick={() =>
                      setSelectedGrade(
                        selectedGrade === g.grade ? null : g.grade,
                      )
                    }
                    className={`w-full text-left p-3 border transition-all ${
                      isActive
                        ? `${colors.border} ${colors.bg}`
                        : "border-white/[0.08] hover:border-white/[0.15]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono font-bold text-sm ${isActive ? colors.text : "text-white"}`}
                        >
                          {g.label}
                        </span>
                        <span className="text-[8px] font-mono text-slate-dim/30">
                          CTCAE Grade {g.ctcae}
                        </span>
                      </div>
                      {isSuggested && (
                        <span className="text-[8px] font-mono text-cyan/60 border border-cyan/20 px-1.5 py-0.5">
                          suggested
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-dim/50 font-mono leading-relaxed">
                      {g.definition}
                    </p>
                    {isActive && (
                      <div className="mt-2 pt-2 border-t border-white/[0.06]">
                        <p className="text-[8px] font-mono uppercase tracking-widest text-slate-dim/30 mb-1">
                          Examples
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {g.examples.map((ex) => (
                            <span
                              key={ex}
                              className="px-1.5 py-0.5 text-[8px] font-mono border border-white/[0.06] text-slate-dim/40"
                            >
                              {ex}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* pv-compute Severity Tier */}
          {pvSeverity && (
            <div className="border border-white/[0.12] bg-white/[0.06]">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
                <Gauge className="h-3.5 w-3.5 text-cyan/60" />
                <span className="intel-label">Severity Tier (pv-compute)</span>
                <div className="h-px flex-1 bg-white/[0.08]" />
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 mb-1">
                    Classification
                  </p>
                  <p
                    className={`text-sm font-bold font-mono ${
                      pvSeverity.tier === "CRITICAL"
                        ? "text-red-400"
                        : pvSeverity.tier === "HIGH"
                          ? "text-orange-400"
                          : pvSeverity.tier === "MEDIUM"
                            ? "text-yellow-400"
                            : "text-emerald-400"
                    }`}
                  >
                    {pvSeverity.tier}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 mb-1">
                    Priority
                  </p>
                  <p className="text-sm font-bold font-mono text-white">
                    {pvSeverity.priority}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Dimension Comparison */}
          <div className="border border-white/[0.12] bg-white/[0.06]">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
              <Info className="h-3.5 w-3.5 text-slate-dim/40" />
              <span className="intel-label">Severity vs. Seriousness</span>
              <div className="h-px flex-1 bg-white/[0.08]" />
            </div>
            <div className="p-4">
              <table className="w-full text-[9px] font-mono">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th className="text-left py-1.5 text-slate-dim/40 uppercase tracking-widest">
                      Dimension
                    </th>
                    <th className="text-left py-1.5 text-slate-dim/40 uppercase tracking-widest">
                      Measures
                    </th>
                    <th className="text-left py-1.5 text-slate-dim/40 uppercase tracking-widest">
                      Scale
                    </th>
                  </tr>
                </thead>
                <tbody className="text-slate-300/70">
                  <tr className="border-b border-white/[0.06]">
                    <td className="py-1.5 text-cyan/60 font-bold">Severity</td>
                    <td className="py-1.5">Intensity / how bad it feels</td>
                    <td className="py-1.5">Mild → Moderate → Severe</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 text-red-400/60 font-bold">
                      Seriousness
                    </td>
                    <td className="py-1.5">Outcome / regulatory threshold</td>
                    <td className="py-1.5">
                      Serious (6 criteria) or Not Serious
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="px-2 py-1.5 border border-white/[0.06]">
                  <p className="text-[8px] font-mono text-slate-dim/40">
                    Severe + Not Serious
                  </p>
                  <p className="text-[9px] font-mono text-white/70">
                    Severe headache (no criteria met)
                  </p>
                </div>
                <div className="px-2 py-1.5 border border-white/[0.06]">
                  <p className="text-[8px] font-mono text-slate-dim/40">
                    Mild + Serious
                  </p>
                  <p className="text-[9px] font-mono text-white/70">
                    Mild arrhythmia (hospitalization)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Station wire */}
      <div className="mt-6 rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-violet-400 mb-1">AlgoVigilance Station</p>
          <p className="text-[10px] text-white/40">Severity grading via ICH E2A criteria. AI agents classify severity at mcp.nexvigilant.com.</p>
        </div>
        <a href="/nucleus/glass/causality-lab" className="shrink-0 ml-4 rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-medium text-violet-300 hover:bg-violet-500/20 transition-colors">Glass Causality Lab</a>
      </div>
    </div>
  );
}
