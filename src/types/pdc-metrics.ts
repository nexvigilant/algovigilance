/**
 * PDC Master Metrics Framework — 108 metrics across 17 categories.
 *
 * Types for the 4-stakeholder dashboard system:
 * Executive, Operational, Academic, Participant.
 */

export interface PdcMetric {
  id: string;
  name: string;
  category: PdcCategory;
  description: string;
  variable: string;
  operator: "gte" | "lte" | "eq";
  target: number;
  unit: string;
  frequency: MetricFrequency;
  stakeholders: StakeholderView[];
}

export type MetricFrequency =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "annual";

export type StakeholderView =
  | "executive"
  | "operational"
  | "academic"
  | "participant";

export type PdcCategory =
  | "PDC Program Effectiveness"
  | "Compliance and Quality"
  | "Efficiency and Productivity"
  | "Patient Safety"
  | "Digital Innovation"
  | "Business Value"
  | "Organizational Health"
  | "Strategic Goals"
  | "Competency Architecture"
  | "EPA Progression"
  | "CPA Integration"
  | "Program Excellence"
  | "Assessment and Validation"
  | "AI and Digital Transformation"
  | "Implementation and Operations"
  | "Global and Cultural"
  | "Infrastructure and Resource";

export interface MetricResult {
  metric: string;
  category: string;
  met: boolean;
  value: number | null;
  target: number;
  action: "on_track" | "remediate";
}

export interface DashboardSummary {
  totalMetrics: number;
  met: number;
  notMet: number;
  unmeasured: number;
  healthPct: number;
  byCategory: Record<string, { met: number; total: number }>;
}

export const CATEGORY_COLORS: Record<PdcCategory, string> = {
  "PDC Program Effectiveness": "text-cyan",
  "Compliance and Quality": "text-emerald-400",
  "Efficiency and Productivity": "text-amber-400",
  "Patient Safety": "text-rose-400",
  "Digital Innovation": "text-purple-400",
  "Business Value": "text-gold",
  "Organizational Health": "text-blue-400",
  "Strategic Goals": "text-orange-400",
  "Competency Architecture": "text-cyan",
  "EPA Progression": "text-emerald-400",
  "CPA Integration": "text-amber-400",
  "Program Excellence": "text-teal-400",
  "Assessment and Validation": "text-indigo-400",
  "AI and Digital Transformation": "text-violet-400",
  "Implementation and Operations": "text-sky-400",
  "Global and Cultural": "text-pink-400",
  "Infrastructure and Resource": "text-slate-light",
};

export const STAKEHOLDER_METRICS: Record<StakeholderView, string[]> = {
  executive: [
    "pdc-09-roi",
    "ca-13-l5-leadership",
    "epx-05-cpa8-achievement",
    "ci-05-cpa8-recognition",
    "ai-01-maturity-progression",
    "io-01-roadmap-achievement",
    "gc-01-cultural-competency",
    "bv-01-cost-avoidance",
    "bv-04-market-advantage",
    "sg-01-global-coverage",
    "sg-02-industry-influence",
    "oh-01-retention",
    "pdc-05-performance-premium",
    "pdc-10-external-recognition",
    "pe-10-smp-succession",
  ],
  operational: [
    "ep-01-epa-velocity",
    "ep-02-signal-cycle-time",
    "ep-03-ai-integration-efficiency",
    "ep-05-resource-optimization",
    "cq-01-training-completeness",
    "cq-02-assessment-validity",
    "cq-03-documentation-accuracy",
    "cq-04-audit-recurrence",
    "cq-05-global-consistency",
    "cq-06-behavioral-validation",
    "av-01-multi-modal",
    "av-02-calibration",
    "av-03-complexity-appropriateness",
    "av-04-development-loop",
    "io-02-change-management",
    "io-03-infrastructure-efficiency",
    "io-04-quality-maturation",
    "oh-04-vacancy-duration",
    "ir-01-toolkit-utilization",
    "ir-02-validation-integrity",
    "ir-03-resource-sustainability",
    "di-02-digital-utilization",
    "di-04-tech-roi",
    "pe-04-fellowship-gate-success",
    "pe-05-duration-optimization",
  ],
  academic: [
    "ca-01-domain-coverage",
    "ca-02-foundation-comm-integration",
    "ca-03-behavioral-anchor-accuracy",
    "ca-04-clinical-trial-pv",
    "ca-05-medication-error",
    "ca-06-adr-recognition",
    "ca-07-benefit-risk-comm",
    "ca-08-signal-comm",
    "ca-09-global-competency",
    "ca-10-ai-integration-domains",
    "ca-11-cluster-transition",
    "ca-12-cross-domain-integration",
    "ca-14-competency-innovation",
    "ca-15-module-synergy",
    "pe-01-appe-module-integration",
    "pe-02-appe-fellowship-transition",
    "pe-03-baseline-accuracy",
    "pe-06-module-mastery",
    "pe-08-smp-track-effectiveness",
    "av-02-calibration",
  ],
  participant: [
    "pdc-01-competency-progression",
    "pdc-02-epa-timeline",
    "pdc-03-gate-passage",
    "pdc-06-mentorship-effectiveness",
    "epx-01-entrustment-velocity",
    "epx-02-epa-competency-integration",
    "epx-04-ai-gateway",
    "epx-08-performance-quality",
    "epx-09-cluster-alignment",
    "epx-10-cross-epa-synthesis",
    "ci-01-cpa-epa-integration",
    "ci-02-complexity-management",
    "ci-03-professional-versatility",
    "ps-01-safety-knowledge",
    "ps-03-signal-accuracy",
    "oh-02-career-velocity",
    "oh-03-engagement",
    "pdc-04-fellowship-placement",
  ],
};

export const FREQUENCY_BADGE_COLORS: Record<MetricFrequency, string> = {
  daily: "bg-rose-400/10 text-rose-400 border-rose-400/30",
  weekly: "bg-amber-400/10 text-amber-400 border-amber-400/30",
  biweekly: "bg-orange-400/10 text-orange-400 border-orange-400/30",
  monthly: "bg-cyan/10 text-cyan border-cyan/30",
  quarterly: "bg-purple-400/10 text-purple-400 border-purple-400/30",
  annual: "bg-slate-400/10 text-slate-dim border-slate-400/30",
};
