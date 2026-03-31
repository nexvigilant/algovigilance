"use client";

import {
  TrendingUp,
  Database,
  BookOpen,
  FlaskConical,
  Scale,
  Pill,
  Zap,
} from "lucide-react";

const TOOL_CATEGORIES = [
  {
    name: "Signal Detection & PV Compute",
    count: 110,
    icon: TrendingUp,
    description:
      "PRR, ROR, IC, EBGM, confidence intervals, benefit-risk analysis, causality assessment, survival analysis, and preemptive signal detection.",
    examples: [
      "compute_prr",
      "compute_ror",
      "compute_ic",
      "compute_ebgm",
      "assess_naranjo_causality",
    ],
    color: "cyan" as const,
  },
  {
    name: "Regulatory & Guidelines",
    count: 89,
    icon: Scale,
    description:
      "ICH guidelines, CIOMS forms, EMA safety signals, MedDRA terminology, FDA labeling changes, WHO-UMC methodology, and compliance assessment.",
    examples: [
      "get_guideline",
      "get_cioms_form",
      "search_terms",
      "get_safety_signals",
    ],
    color: "gold" as const,
  },
  {
    name: "Drug Safety Databases",
    count: 100,
    icon: Database,
    description:
      "FDA FAERS adverse events, EudraVigilance, VigiAccess, OpenVigil disproportionality, FDA safety communications, and 5 national regulators.",
    examples: [
      "search_adverse_events",
      "get_event_outcomes",
      "compute_disproportionality",
    ],
    color: "cyan" as const,
  },
  {
    name: "Drug Information",
    count: 64,
    icon: Pill,
    description:
      "DailyMed labeling, DrugBank pharmacology, RxNav nomenclature, PharmGKB pharmacogenomics, ChEMBL bioactivities, and drug interactions.",
    examples: [
      "get_drug_label",
      "get_adverse_reactions",
      "get_interactions",
      "get_rxcui",
    ],
    color: "gold" as const,
  },
  {
    name: "Literature & Research",
    count: 55,
    icon: BookOpen,
    description:
      "PubMed articles, ClinicalTrials.gov, case reports, Open Targets, UniProt, Reactome pathways, and signal literature.",
    examples: [
      "search_articles",
      "search_trials",
      "search_case_reports",
      "get_pathway",
    ],
    color: "cyan" as const,
  },
  {
    name: "AI & Decision Programs",
    count: 67,
    icon: FlaskConical,
    description:
      "1,900+ microgram decision trees, heligram chains, causality pipelines, and algorithmovigilance — sub-microsecond PV logic.",
    examples: [
      "run_naranjo_quick",
      "run_case_assessment_pipeline",
      "run_prr_signal",
      "run_workflow_router",
    ],
    color: "gold" as const,
  },
  {
    name: "Pharma Intelligence",
    count: 287,
    icon: Zap,
    description:
      "Safety profiles, pipeline data, labeling changes, head-to-head comparisons, and recalls across 15 major pharma companies.",
    examples: [
      "get_safety_profile",
      "get_pipeline",
      "get_labeling_changes",
      "get_head_to_head",
    ],
    color: "cyan" as const,
  },
];

export const TOTAL_TOOLS = TOOL_CATEGORIES.reduce(
  (sum, cat) => sum + cat.count,
  0,
);

export const CATEGORY_COUNT = TOOL_CATEGORIES.length;

export function ToolCategoryGrid() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {TOOL_CATEGORIES.map((cat) => (
        <div
          key={cat.name}
          className="group p-6 rounded-xl border border-nex-light bg-nex-surface/50 hover:border-cyan/30 transition-colors"
        >
          <div className="flex items-start gap-4">
            <div
              className={`p-2 rounded-lg ${cat.color === "gold" ? "bg-gold/10" : "bg-cyan/10"}`}
            >
              <cat.icon
                className={`h-6 w-6 ${cat.color === "gold" ? "text-gold" : "text-cyan"}`}
                aria-hidden="true"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-2">
                <h3 className="text-lg font-headline font-semibold text-white">
                  {cat.name}
                </h3>
                <span className="text-xs text-slate-dim">
                  {cat.count} tools
                </span>
              </div>
              <p className="text-sm text-slate-dim leading-relaxed mb-4">
                {cat.description}
              </p>

              <div className="flex flex-wrap gap-1.5">
                {cat.examples.map((ex) => (
                  <code
                    key={ex}
                    className="px-2 py-0.5 rounded text-xs border border-cyan/20 text-cyan/80 bg-cyan/5 font-mono"
                  >
                    {ex}
                  </code>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
