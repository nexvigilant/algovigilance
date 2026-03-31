"use client";

import { useState, useMemo } from "react";
import { ShieldAlert, AlertTriangle } from "lucide-react";
import {
  classifySeriousness,
  computeReportingDeadline,
  isSeriousEvent,
  type SeriousnessCriteria,
  type SeriousnessResult,
  type DeadlineResult,
} from "@/lib/pv-compute";

const ICH_E2A_CRITERIA = [
  {
    id: "death",
    label: "Results in death",
    description: "The adverse event resulted in the patient's death",
  },
  {
    id: "life_threatening",
    label: "Life-threatening",
    description:
      "The patient was at substantial risk of dying at the time of the event",
  },
  {
    id: "hospitalization",
    label: "Requires/prolongs hospitalization",
    description:
      "Inpatient hospitalization or prolongation of existing hospitalization",
  },
  {
    id: "disability",
    label: "Persistent/significant disability",
    description:
      "Substantial disruption of ability to conduct normal life functions",
  },
  {
    id: "congenital_anomaly",
    label: "Congenital anomaly/birth defect",
    description: "Event resulted in a congenital anomaly or birth defect",
  },
  {
    id: "medically_important",
    label: "Other medically important condition",
    description:
      "May not be immediately life-threatening but may require intervention to prevent one of the above",
  },
];

export function SeriousnessClassifier() {
  const [criteria, setCriteria] = useState<Record<string, boolean>>({});
  const [eventDescription, setEventDescription] = useState("");

  // Wire to pv-compute: classifySeriousness mirrors case-seriousness.yaml
  const seriousnessInput = useMemo(
    (): SeriousnessCriteria => ({
      death: criteria.death,
      hospitalization: criteria.hospitalization,
      disability: criteria.disability,
      life_threatening: criteria.life_threatening,
      congenital_anomaly: criteria.congenital_anomaly,
      medically_important: criteria.medically_important,
    }),
    [criteria],
  );

  const result: SeriousnessResult = useMemo(
    () => classifySeriousness(seriousnessInput),
    [seriousnessInput],
  );

  const isSerious = result.seriousness === "SERIOUS";

  // Wire to pv-compute: computeReportingDeadline mirrors seriousness-to-deadline.yaml
  const deadline: DeadlineResult | null = useMemo(() => {
    if (!isSerious) return null;
    const boolResult = isSeriousEvent(result.seriousness, result.criterion);
    return computeReportingDeadline({
      is_fatal: boolResult.fatal,
      is_life_threatening: boolResult.life_threatening,
      is_serious: boolResult.serious,
      is_unexpected: true, // conservative: assume unexpected for deadline display
    });
  }, [isSerious, result]);

  const selectedCount = useMemo(
    () => Object.values(criteria).filter(Boolean).length,
    [criteria],
  );

  const toggle = (id: string) => {
    setCriteria((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="intel-status-active" />
          <span className="intel-label">
            Seriousness Assessment / ICH E2A Criteria
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-headline mb-2 text-white tracking-tight">
          Seriousness Classification
        </h1>
        <p className="text-sm text-slate-dim/60 max-w-lg mx-auto">
          Classify adverse events by ICH E2A seriousness criteria for regulatory
          reporting
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Criteria panel */}
        <div className="border border-white/[0.12] bg-white/[0.06]">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
            <ShieldAlert className="h-3.5 w-3.5 text-red-400/60" />
            <span className="intel-label">ICH E2A Criteria</span>
            <div className="h-px flex-1 bg-white/[0.08]" />
            <span className="text-[8px] font-mono text-slate-dim/30">
              Select all that apply
            </span>
          </div>
          <div className="p-4 space-y-1">
            {ICH_E2A_CRITERIA.map((c) => (
              <button
                key={c.id}
                onClick={() => toggle(c.id)}
                className={`w-full text-left px-4 py-3 border transition-all ${
                  criteria[c.id]
                    ? "border-red-500/40 bg-red-500/8 text-red-300/80"
                    : "border-white/[0.06] bg-black/20 text-slate-dim/50 hover:border-white/[0.12]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-3 w-3 border-2 flex items-center justify-center ${
                      criteria[c.id]
                        ? "border-red-400 bg-red-500/20"
                        : "border-slate-dim/30"
                    }`}
                  >
                    {criteria[c.id] && (
                      <div className="h-1.5 w-1.5 bg-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold font-mono uppercase tracking-wide">
                      {c.label}
                    </p>
                    <p className="text-[10px] text-slate-dim/40 mt-0.5">
                      {c.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}

            {/* Event description */}
            <div className="pt-4">
              <label className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40">
                Event Description (optional)
              </label>
              <textarea
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Describe the adverse event..."
                rows={3}
                className="w-full mt-2 bg-black/20 border border-white/[0.12] px-3 py-2 text-xs font-mono text-white placeholder:text-slate-dim/20 focus:border-cyan/40 focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Result panel */}
        <div className="space-y-4">
          {/* Classification result */}
          <div
            className={`border p-6 text-center ${
              isSerious
                ? "border-red-500/40 bg-red-500/5"
                : "border-emerald-500/40 bg-emerald-500/5"
            }`}
          >
            <p className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 mb-3">
              Classification
            </p>
            <div
              className={`inline-block px-6 py-2 border font-bold font-mono text-xl tracking-tight ${
                isSerious
                  ? "text-red-400 border-red-500/30 bg-red-500/10"
                  : "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
              }`}
            >
              {isSerious ? "SERIOUS" : "NON-SERIOUS"}
            </div>
            <p className="mt-3 text-xs text-slate-dim/50">
              {selectedCount > 0
                ? `${selectedCount} criterion${selectedCount > 1 ? "a" : ""} met`
                : "No seriousness criteria selected"}
            </p>
          </div>

          {/* Reporting deadline */}
          {isSerious && deadline && (
            <div className="border border-white/[0.12] bg-white/[0.06]">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
                <AlertTriangle className="h-3.5 w-3.5 text-gold/60" />
                <span className="intel-label">Reporting Deadline</span>
                <div className="h-px flex-1 bg-white/[0.08]" />
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40">
                    Deadline
                  </p>
                  <span
                    className={`px-2 py-1 border font-mono text-xs font-bold ${
                      deadline.deadline_days <= 7
                        ? "text-red-400 border-red-500/30 bg-red-500/10"
                        : deadline.deadline_days <= 15
                          ? "text-yellow-400 border-yellow-500/30 bg-yellow-500/10"
                          : "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                    }`}
                  >
                    {deadline.deadline_days} CALENDAR DAYS
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40">
                    Report Category
                  </p>
                  <span className="text-xs font-mono text-white uppercase">
                    {deadline.report_category}
                  </span>
                </div>
                <div className="py-2 border-b border-white/[0.06]">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 mb-1">
                    Regulatory Basis
                  </p>
                  <p className="text-xs font-mono text-slate-300/70">
                    {deadline.regulatory_basis}
                  </p>
                </div>
                <div className="py-2">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 mb-1">
                    Primary Criterion
                  </p>
                  <p className="text-xs font-mono text-white">
                    {result.criterion?.replace(/_/g, " ").toUpperCase() ?? "—"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Selected criteria summary */}
          {selectedCount > 0 && (
            <div className="border border-white/[0.08] bg-black/20 p-4">
              <p className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 mb-2">
                Active Criteria
              </p>
              <div className="flex flex-wrap gap-2">
                {ICH_E2A_CRITERIA.filter((c) => criteria[c.id]).map((c) => (
                  <span
                    key={c.id}
                    className="px-2 py-1 border border-red-500/20 bg-red-500/5 text-[9px] font-mono text-red-400/70"
                  >
                    {c.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
