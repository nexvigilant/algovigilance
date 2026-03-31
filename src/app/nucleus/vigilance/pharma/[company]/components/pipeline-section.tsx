"use client";

import { useState, useEffect } from "react";
import type { SignalValidationResult } from "@/lib/pv-compute/surveillance";
import { FlaskConical } from "lucide-react";

interface Trial {
  nct_id: string;
  title: string;
  phase: string;
  status: string;
  conditions: string[];
  interventions: string[];
}

interface PipelineSectionProps {
  companyKey: string;
  companyName: string;
}

const PHASE_COLORS: Record<string, string> = {
  "Phase 1": "border-slate-500/40 bg-slate-500/10 text-slate-400",
  "Phase 2": "border-amber-500/40 bg-amber-500/10 text-amber-400",
  "Phase 3": "border-cyan-500/40 bg-cyan-500/10 text-cyan-400",
  "Phase 4": "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  "Phase 1/2": "border-amber-600/40 bg-amber-600/10 text-amber-300",
  "Phase 2/3": "border-cyan-600/40 bg-cyan-600/10 text-cyan-300",
};

const STATUS_COLORS: Record<string, string> = {
  Recruiting: "text-emerald-400",
  "Active, not recruiting": "text-cyan-400",
  Completed: "text-slate-dim/50",
  "Not yet recruiting": "text-amber-400",
  Terminated: "text-red-400",
  Suspended: "text-orange-400",
};

function getMockPipeline(companyKey: string): Trial[] {
  const pipelines: Record<string, Trial[]> = {
    pfizer: [
      {
        nct_id: "NCT05432023",
        title: "Study of PF-07799933 in Adults With Advanced Solid Tumors",
        phase: "Phase 1",
        status: "Recruiting",
        conditions: ["Solid Tumor"],
        interventions: ["PF-07799933"],
      },
      {
        nct_id: "NCT05801926",
        title:
          "Efficacy and Safety of Elranatamab in Relapsed or Refractory Multiple Myeloma",
        phase: "Phase 3",
        status: "Active, not recruiting",
        conditions: ["Multiple Myeloma"],
        interventions: ["elranatamab"],
      },
      {
        nct_id: "NCT05388786",
        title: "Study of Marstacimab in Hemophilia A Without Inhibitors",
        phase: "Phase 3",
        status: "Recruiting",
        conditions: ["Hemophilia A"],
        interventions: ["marstacimab"],
      },
      {
        nct_id: "NCT05908565",
        title: "Giroctocogene Fitelparvovec in Severe Hemophilia A",
        phase: "Phase 3",
        status: "Recruiting",
        conditions: ["Hemophilia A"],
        interventions: ["giroctocogene fitelparvovec"],
      },
    ],
    lilly: [
      {
        nct_id: "NCT04222218",
        title: "SURMOUNT-5: Tirzepatide Versus Semaglutide in Obesity",
        phase: "Phase 3",
        status: "Completed",
        conditions: ["Obesity", "Overweight"],
        interventions: ["tirzepatide", "semaglutide"],
      },
      {
        nct_id: "NCT05051969",
        title:
          "Donanemab in Early Symptomatic Alzheimer's Disease (TRAILBLAZER-ALZ 6)",
        phase: "Phase 3",
        status: "Recruiting",
        conditions: ["Alzheimer Disease"],
        interventions: ["donanemab"],
      },
      {
        nct_id: "NCT05717075",
        title: "Orforglipron in Adults With Type 2 Diabetes",
        phase: "Phase 3",
        status: "Active, not recruiting",
        conditions: ["Type 2 Diabetes"],
        interventions: ["orforglipron"],
      },
      {
        nct_id: "NCT05464459",
        title: "Lebrikizumab in Atopic Dermatitis (ADvocate)",
        phase: "Phase 3",
        status: "Completed",
        conditions: ["Atopic Dermatitis"],
        interventions: ["lebrikizumab"],
      },
    ],
    novonordisk: [
      {
        nct_id: "NCT04745390",
        title:
          "FLOW: Semaglutide 1.0mg in Chronic Kidney Disease With Type 2 Diabetes",
        phase: "Phase 3",
        status: "Completed",
        conditions: ["Chronic Kidney Disease", "Type 2 Diabetes"],
        interventions: ["semaglutide"],
      },
      {
        nct_id: "NCT04668183",
        title: "SELECT: Semaglutide CV Risk Reduction in Overweight/Obesity",
        phase: "Phase 3",
        status: "Completed",
        conditions: ["Obesity", "Cardiovascular Disease"],
        interventions: ["semaglutide"],
      },
      {
        nct_id: "NCT05903534",
        title: "CagriSema in Obesity (REDEFINE 1)",
        phase: "Phase 3",
        status: "Recruiting",
        conditions: ["Obesity"],
        interventions: ["cagrilintide", "semaglutide"],
      },
      {
        nct_id: "NCT05560308",
        title: "Mim8 in Severe Hemophilia A",
        phase: "Phase 3",
        status: "Recruiting",
        conditions: ["Hemophilia A"],
        interventions: ["Mim8"],
      },
    ],
    merck: [
      {
        nct_id: "NCT05537766",
        title:
          "KEYFORM-008: Pembrolizumab + Belzutifan in Clear Cell Renal Cell Carcinoma",
        phase: "Phase 3",
        status: "Recruiting",
        conditions: ["Renal Cell Carcinoma"],
        interventions: ["pembrolizumab", "belzutifan"],
      },
      {
        nct_id: "NCT05734066",
        title:
          "Sotatercept in Pulmonary Arterial Hypertension — Long-Term Extension",
        phase: "Phase 3",
        status: "Active, not recruiting",
        conditions: ["Pulmonary Arterial Hypertension"],
        interventions: ["sotatercept"],
      },
      {
        nct_id: "NCT05612646",
        title: "V116 (Pneumococcal Vaccine) in Immunocompromised Adults",
        phase: "Phase 3",
        status: "Active, not recruiting",
        conditions: ["Pneumococcal Infection"],
        interventions: ["V116"],
      },
    ],
  };

  if (pipelines[companyKey]) return pipelines[companyKey];

  return [
    {
      nct_id: "NCT00000001",
      title: "Phase 1 Study of Novel Compound in Healthy Volunteers",
      phase: "Phase 1",
      status: "Recruiting",
      conditions: ["Healthy Volunteers"],
      interventions: ["Compound X"],
    },
    {
      nct_id: "NCT00000002",
      title: "Phase 2 Efficacy Study in Target Indication",
      phase: "Phase 2",
      status: "Active, not recruiting",
      conditions: ["Target Disease"],
      interventions: ["Compound Y"],
    },
    {
      nct_id: "NCT00000003",
      title: "Phase 3 Confirmatory Trial",
      phase: "Phase 3",
      status: "Recruiting",
      conditions: ["Target Disease"],
      interventions: ["Compound Z"],
    },
  ];
}

export function PipelineSection({
  companyKey,
  companyName,
}: PipelineSectionProps) {
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("All");

  useEffect(() => {
    const timer = setTimeout(() => {
      setTrials(getMockPipeline(companyKey));
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [companyKey]);

  const phases = [
    "All",
    "Phase 1",
    "Phase 1/2",
    "Phase 2",
    "Phase 2/3",
    "Phase 3",
    "Phase 4",
  ];
  const filtered =
    filter === "All" ? trials : trials.filter((t) => t.phase === filter);

  return (
    <section className="border border-white/[0.10] bg-white/[0.03]">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
        <FlaskConical className="h-3.5 w-3.5 text-amber-400/60" />
        <span className="intel-label">Clinical Pipeline</span>
        <div className="h-px flex-1 bg-white/[0.06]" />
        {!loading && (
          <span className="text-[9px] font-mono text-slate-dim/40">
            {trials.length} active trials
          </span>
        )}
      </div>

      {loading ? (
        <div className="p-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="border border-white/[0.06] p-3 space-y-2 animate-pulse"
            >
              <div className="h-3 bg-white/[0.06] w-3/4" />
              <div className="h-2 bg-white/[0.04] w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Phase filter tabs */}
          <div className="flex gap-1 px-4 py-2.5 border-b border-white/[0.06] flex-wrap">
            {phases.map((phase) => {
              const count =
                phase === "All"
                  ? trials.length
                  : trials.filter((t) => t.phase === phase).length;
              if (count === 0 && phase !== "All") return null;
              return (
                <button
                  key={phase}
                  type="button"
                  onClick={() => setFilter(phase)}
                  className={`px-2.5 py-1 text-[9px] font-mono border transition-colors ${
                    filter === phase
                      ? "border-cyan/40 bg-cyan/10 text-cyan"
                      : "border-white/[0.08] bg-white/[0.02] text-slate-dim/40 hover:border-white/[0.15] hover:text-slate-dim/70"
                  }`}
                >
                  {phase} {count > 0 && `(${count})`}
                </button>
              );
            })}
          </div>

          {/* Trial cards */}
          <div className="p-4 space-y-3">
            {filtered.length === 0 ? (
              <p className="text-center text-[10px] font-mono text-slate-dim/30 py-6">
                No trials in this phase
              </p>
            ) : (
              filtered.map((trial) => (
                <div
                  key={trial.nct_id}
                  className="border border-white/[0.08] bg-black/20 p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-white leading-snug flex-1">
                      {trial.title}
                    </p>
                    <div className="flex-shrink-0 flex flex-col items-end gap-1">
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 border ${PHASE_COLORS[trial.phase] ?? "border-white/[0.10] text-slate-dim/50"}`}
                      >
                        {trial.phase}
                      </span>
                      <span
                        className={`text-[9px] font-mono ${STATUS_COLORS[trial.status] ?? "text-slate-dim/40"}`}
                      >
                        {trial.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[9px] font-mono text-slate-dim/40">
                    <span className="text-cyan/50">{trial.nct_id}</span>
                    <span>|</span>
                    <span>{trial.conditions.join(", ")}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </section>
  );
}
