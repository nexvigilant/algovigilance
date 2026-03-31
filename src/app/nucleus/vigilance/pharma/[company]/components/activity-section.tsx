"use client";

import { useState, useEffect } from "react";
import type { DeadlineUrgencyResult } from "@/lib/pv-compute/operations";
import { Bell, AlertTriangle } from "lucide-react";

interface LabelingChange {
  date: string;
  product: string;
  change_type: string;
  description: string;
}

interface Recall {
  date: string;
  product: string;
  classification: "Class I" | "Class II" | "Class III";
  reason: string;
  status: string;
}

interface ActivityData {
  labeling_changes: LabelingChange[];
  recalls: Recall[];
}

interface ActivitySectionProps {
  companyKey: string;
  companyName: string;
}

const RECALL_CLASS_COLORS: Record<string, string> = {
  "Class I": "border-red-500/50 bg-red-500/10 text-red-400",
  "Class II": "border-amber-500/50 bg-amber-500/10 text-amber-400",
  "Class III": "border-slate-500/50 bg-slate-500/10 text-slate-400",
};

const RECALL_CLASS_TITLE: Record<string, string> = {
  "Class I": "Class I — Most Serious",
  "Class II": "Class II — May Cause Adverse Effects",
  "Class III": "Class III — Unlikely to Cause Adverse Effects",
};

function getMockActivity(companyKey: string): ActivityData {
  const activities: Record<string, ActivityData> = {
    pfizer: {
      labeling_changes: [
        {
          date: "2026-01-14",
          product: "Eliquis",
          change_type: "Boxed Warning Update",
          description:
            "Updated premature discontinuation and spinal/epidural hematoma warnings in the BOXED WARNING section",
        },
        {
          date: "2025-11-03",
          product: "Ibrance",
          change_type: "Warnings and Precautions",
          description:
            "Added new warning regarding interstitial lung disease/pneumonitis based on post-marketing cases",
        },
        {
          date: "2025-08-22",
          product: "Paxlovid",
          change_type: "Drug Interactions",
          description:
            "Updated drug interactions section with additional CYP3A substrates and inhibitors",
        },
        {
          date: "2025-06-11",
          product: "Prevnar 20",
          change_type: "Adverse Reactions",
          description:
            "Post-marketing update to adverse reactions section including reports of anaphylaxis",
        },
      ],
      recalls: [
        {
          date: "2025-12-09",
          product: "Premarin 0.3mg Tablets",
          classification: "Class II",
          reason:
            "Out of specification dissolution results identified during stability testing",
          status: "Ongoing",
        },
        {
          date: "2025-09-14",
          product: "Xeljanz 5mg Film-Coated Tablets",
          classification: "Class II",
          reason:
            "Labeling error — wrong lot number referenced in the package insert",
          status: "Completed",
        },
      ],
    },
    lilly: {
      labeling_changes: [
        {
          date: "2026-02-03",
          product: "Mounjaro",
          change_type: "Warnings and Precautions",
          description:
            "Added warning regarding acute pancreatitis — patients should be monitored for signs/symptoms",
        },
        {
          date: "2025-10-17",
          product: "Verzenio",
          change_type: "Adverse Reactions",
          description:
            "Updated diarrhea management guidance and frequency data from MONARCH trials",
        },
        {
          date: "2025-07-28",
          product: "Zepbound",
          change_type: "Clinical Studies",
          description:
            "Added SURMOUNT-5 head-to-head data versus semaglutide 2.4mg",
        },
      ],
      recalls: [
        {
          date: "2025-11-22",
          product: "Humalog KwikPen 100 units/mL",
          classification: "Class II",
          reason:
            "Defective pen mechanism — potential for dose delivery failure",
          status: "Ongoing",
        },
      ],
    },
    novonordisk: {
      labeling_changes: [
        {
          date: "2026-01-28",
          product: "Ozempic",
          change_type: "Warnings and Precautions",
          description:
            "Updated gastroparesis warning based on post-marketing pharmacovigilance data",
        },
        {
          date: "2025-12-04",
          product: "Wegovy",
          change_type: "Adverse Reactions",
          description:
            "Added suicidal ideation and self-harm to adverse reactions based on FDA review",
        },
        {
          date: "2025-09-19",
          product: "Rybelsus",
          change_type: "Drug Interactions",
          description:
            "Added interaction with oral medications requiring threshold concentrations for efficacy",
        },
      ],
      recalls: [
        {
          date: "2025-10-31",
          product: "NovoLog FlexPen",
          classification: "Class II",
          reason:
            "Potential for insulin cartridge to become detached from pen device",
          status: "Completed",
        },
        {
          date: "2025-07-14",
          product: "Victoza 18mg/3mL",
          classification: "Class III",
          reason:
            "Label mismatch — outer carton NDC does not match vial label NDC",
          status: "Completed",
        },
      ],
    },
  };

  if (activities[companyKey]) return activities[companyKey];

  return {
    labeling_changes: [
      {
        date: "2026-01-10",
        product: "Product A",
        change_type: "Warnings and Precautions",
        description:
          "Updated warning section based on post-marketing surveillance data",
      },
      {
        date: "2025-09-05",
        product: "Product B",
        change_type: "Adverse Reactions",
        description:
          "Added new adverse reactions identified in phase 4 post-marketing studies",
      },
    ],
    recalls: [
      {
        date: "2025-11-15",
        product: "Product C Tablets",
        classification: "Class II",
        reason: "Subpotency identified during routine stability testing",
        status: "Completed",
      },
    ],
  };
}

export function ActivitySection({
  companyKey,
  companyName,
}: ActivitySectionProps) {
  const [data, setData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setData(getMockActivity(companyKey));
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [companyKey]);

  return (
    <section className="border border-white/[0.10] bg-white/[0.03]">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
        <Bell className="h-3.5 w-3.5 text-violet-400/60" />
        <span className="intel-label">Recent Regulatory Activity</span>
        <div className="h-px flex-1 bg-white/[0.06]" />
        <span className="text-[9px] font-mono text-slate-dim/40">
          Labeling &amp; Recalls
        </span>
      </div>

      {loading ? (
        <div className="p-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="border border-white/[0.06] p-3 space-y-2 animate-pulse"
            >
              <div className="h-2 bg-white/[0.06] w-1/3" />
              <div className="h-3 bg-white/[0.04] w-5/6" />
              <div className="h-2 bg-white/[0.03] w-2/3" />
            </div>
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.06]">
          {/* Labeling changes */}
          <div className="p-4">
            <p className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 mb-3 flex items-center gap-1.5">
              <Bell className="h-3 w-3" />
              Labeling Changes
            </p>
            <div className="space-y-3">
              {data.labeling_changes.length === 0 ? (
                <p className="text-[10px] font-mono text-slate-dim/30 py-2">
                  No recent labeling changes
                </p>
              ) : (
                data.labeling_changes.map((change, i) => (
                  <div
                    key={i}
                    className="border-l-2 border-violet-500/30 pl-3 py-0.5 space-y-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 border border-violet-500/30 bg-violet-500/10 text-violet-400 flex-shrink-0">
                        {change.change_type}
                      </span>
                      <span className="text-[9px] font-mono text-slate-dim/40 tabular-nums flex-shrink-0">
                        {change.date}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-white">
                      {change.product}
                    </p>
                    <p className="text-[10px] text-slate-dim/60 leading-relaxed">
                      {change.description}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recalls */}
          <div className="p-4">
            <p className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 mb-3 flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3" />
              Active &amp; Recent Recalls
            </p>
            <div className="space-y-3">
              {data.recalls.length === 0 ? (
                <p className="text-[10px] font-mono text-slate-dim/30 py-2">
                  No recent recalls
                </p>
              ) : (
                data.recalls.map((recall, i) => (
                  <div
                    key={i}
                    className="border border-white/[0.08] bg-black/20 p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 border flex-shrink-0 ${RECALL_CLASS_COLORS[recall.classification]}`}
                        title={RECALL_CLASS_TITLE[recall.classification]}
                      >
                        {recall.classification}
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 border ${
                            recall.status === "Ongoing"
                              ? "border-red-500/30 bg-red-500/5 text-red-400"
                              : "border-white/[0.08] bg-white/[0.02] text-slate-dim/40"
                          }`}
                        >
                          {recall.status}
                        </span>
                        <span className="text-[9px] font-mono text-slate-dim/40 tabular-nums">
                          {recall.date}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-white">
                      {recall.product}
                    </p>
                    <p className="text-[10px] text-slate-dim/60 leading-relaxed">
                      {recall.reason}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
