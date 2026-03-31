/**
 * PV Tools Registry — For AlgoVigilances
 *
 * Centralized registry of all pharmacovigilance tool pages.
 * Organized by workflow stage for hub navigation and "next step" routing.
 */

import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpen,
  ClipboardCheck,
  FileSearch,
  FlaskConical,
  Gauge,
  GitCompare,
  HeartPulse,
  Layers,
  Lock,
  PieChart,
  Route,
  Scale,
  Search,
  Shield,
  Stethoscope,
  Target,
  Timer,
  TrendingUp,
  Zap,
} from "lucide-react";
import { VIGILANCE_ROUTES } from "@/lib/routes";

// ─── Types ──────────────────────────────────────────────────────────────────

export type WorkflowStage =
  | "intake"
  | "signal-detection"
  | "causality"
  | "classification"
  | "reporting"
  | "monitoring";

export interface PvTool {
  /** URL path */
  href: string;
  /** Display name */
  label: string;
  /** One-line plain English description */
  description: string;
  /** Lucide icon */
  icon: LucideIcon;
  /** Workflow stage for grouping */
  stage: WorkflowStage;
  /** Suggested next tools after completing this one */
  nextSteps: string[];
}

// ─── Workflow Stages ────────────────────────────────────────────────────────

export const WORKFLOW_STAGES: Record<
  WorkflowStage,
  { label: string; description: string; color: string }
> = {
  intake: {
    label: "Case Intake",
    description: "Receive and validate adverse event reports",
    color: "text-blue-400",
  },
  "signal-detection": {
    label: "Signal Detection",
    description: "Identify potential safety signals from data",
    color: "text-nex-cyan",
  },
  causality: {
    label: "Causality Assessment",
    description: "Determine if the drug caused the adverse event",
    color: "text-amber-400",
  },
  classification: {
    label: "Classification",
    description: "Categorize severity, harm type, and risk level",
    color: "text-orange-400",
  },
  reporting: {
    label: "Regulatory Reporting",
    description: "Meet reporting obligations and deadlines",
    color: "text-red-400",
  },
  monitoring: {
    label: "Ongoing Monitoring",
    description: "Track portfolio risk and compliance over time",
    color: "text-emerald-400",
  },
};

// ─── Tool Registry ──────────────────────────────────────────────────────────

export const PV_TOOLS: PvTool[] = [
  // ── Intake ──
  {
    href: VIGILANCE_ROUTES.CASE_TRIAGE,
    label: "Case Triage",
    description:
      "Classify adverse event seriousness and determine reporting deadlines",
    icon: ClipboardCheck,
    stage: "intake",
    nextSteps: [
      VIGILANCE_ROUTES.NARANJO_CAUSALITY,
      VIGILANCE_ROUTES.REPORTING_DEADLINES,
    ],
  },
  {
    href: VIGILANCE_ROUTES.ICSR_PROCESSING,
    label: "ICSR Processing",
    description: "Validate and process Individual Case Safety Reports",
    icon: FileSearch,
    stage: "intake",
    nextSteps: [
      VIGILANCE_ROUTES.CASE_TRIAGE,
      VIGILANCE_ROUTES.EXPECTEDNESS_CHECK,
    ],
  },
  {
    href: VIGILANCE_ROUTES.EXPECTEDNESS_CHECK,
    label: "Expectedness Check",
    description: "Determine if an adverse event is listed or unexpected",
    icon: BookOpen,
    stage: "intake",
    nextSteps: [
      VIGILANCE_ROUTES.REPORTING_DEADLINES,
      VIGILANCE_ROUTES.HARM_CLASSIFICATION,
    ],
  },

  // ── Signal Detection ──
  {
    href: VIGILANCE_ROUTES.PRR_SIGNAL_DETECTION,
    label: "PRR Signal Detection",
    description:
      "Calculate Proportional Reporting Ratio and other signal metrics",
    icon: Activity,
    stage: "signal-detection",
    nextSteps: [
      VIGILANCE_ROUTES.SURVEILLANCE,
      VIGILANCE_ROUTES.NARANJO_CAUSALITY,
    ],
  },
  {
    href: VIGILANCE_ROUTES.DRUG_COMPARISON,
    label: "Drug Comparison",
    description: "Compare safety profiles between two drugs",
    icon: GitCompare,
    stage: "signal-detection",
    nextSteps: [
      VIGILANCE_ROUTES.PRR_SIGNAL_DETECTION,
      VIGILANCE_ROUTES.PORTFOLIO_RISK,
    ],
  },
  {
    href: VIGILANCE_ROUTES.SURVEILLANCE,
    label: "Signal Surveillance",
    description: "Validate and route detected safety signals",
    icon: Search,
    stage: "signal-detection",
    nextSteps: [
      VIGILANCE_ROUTES.NARANJO_CAUSALITY,
      VIGILANCE_ROUTES.RISK_SCORING,
    ],
  },

  // ── Causality ──
  {
    href: VIGILANCE_ROUTES.NARANJO_CAUSALITY,
    label: "Naranjo Scale",
    description:
      "Score the probability that an adverse reaction was caused by the drug",
    icon: Stethoscope,
    stage: "causality",
    nextSteps: [
      VIGILANCE_ROUTES.WHO_UMC_CAUSALITY,
      VIGILANCE_ROUTES.REPORTING_DEADLINES,
    ],
  },
  {
    href: VIGILANCE_ROUTES.WHO_UMC_CAUSALITY,
    label: "WHO-UMC Assessment",
    description:
      "Apply the WHO-UMC system for standardized causality categories",
    icon: HeartPulse,
    stage: "causality",
    nextSteps: [
      VIGILANCE_ROUTES.RUCAM_CAUSALITY,
      VIGILANCE_ROUTES.BENEFIT_RISK,
    ],
  },
  {
    href: VIGILANCE_ROUTES.RUCAM_CAUSALITY,
    label: "RUCAM Assessment",
    description:
      "Evaluate drug-induced liver injury causality with the RUCAM scale",
    icon: FlaskConical,
    stage: "causality",
    nextSteps: [
      VIGILANCE_ROUTES.HARM_CLASSIFICATION,
      VIGILANCE_ROUTES.REPORTING_DEADLINES,
    ],
  },

  // ── Classification ──
  {
    href: VIGILANCE_ROUTES.SEVERITY_GRADING,
    label: "Severity Grading",
    description: "Grade adverse event severity from Low to Critical",
    icon: Gauge,
    stage: "classification",
    nextSteps: [
      VIGILANCE_ROUTES.HARM_CLASSIFICATION,
      VIGILANCE_ROUTES.RISK_SCORING,
    ],
  },
  {
    href: VIGILANCE_ROUTES.HARM_CLASSIFICATION,
    label: "Harm Classification",
    description: "Classify harm type (A-H) and determine response protocol",
    icon: AlertTriangle,
    stage: "classification",
    nextSteps: [
      VIGILANCE_ROUTES.RISK_SCORING,
      VIGILANCE_ROUTES.IRREVERSIBILITY,
    ],
  },
  {
    href: VIGILANCE_ROUTES.RISK_SCORING,
    label: "Risk Scoring",
    description: "Compute composite risk score from multiple safety factors",
    icon: Target,
    stage: "classification",
    nextSteps: [
      VIGILANCE_ROUTES.BENEFIT_RISK,
      VIGILANCE_ROUTES.REPORTING_DEADLINES,
    ],
  },
  {
    href: VIGILANCE_ROUTES.BENEFIT_RISK,
    label: "Benefit-Risk (QBRI)",
    description: "Calculate the Quantitative Benefit-Risk Index for a drug",
    icon: Scale,
    stage: "classification",
    nextSteps: [
      VIGILANCE_ROUTES.PORTFOLIO_RISK,
      VIGILANCE_ROUTES.REPORTING_DEADLINES,
    ],
  },
  {
    href: VIGILANCE_ROUTES.SAFETY_MARGIN,
    label: "Safety Margin",
    description:
      "Compute safety margin zones between therapeutic and toxic doses",
    icon: Shield,
    stage: "classification",
    nextSteps: [VIGILANCE_ROUTES.RISK_SCORING, VIGILANCE_ROUTES.BENEFIT_RISK],
  },
  {
    href: VIGILANCE_ROUTES.IRREVERSIBILITY,
    label: "Irreversibility",
    description: "Assess the point-of-no-return for pharmacovigilance actions",
    icon: Lock,
    stage: "classification",
    nextSteps: [
      VIGILANCE_ROUTES.REPORTING_DEADLINES,
      VIGILANCE_ROUTES.WORKFLOW_ROUTER,
    ],
  },

  // ── Reporting ──
  {
    href: VIGILANCE_ROUTES.REPORTING_DEADLINES,
    label: "Reporting Deadlines",
    description:
      "Calculate regulatory reporting timelines and expedited routes",
    icon: Timer,
    stage: "reporting",
    nextSteps: [
      VIGILANCE_ROUTES.PBRER_ASSESSMENT,
      VIGILANCE_ROUTES.PMR_COMPLIANCE,
    ],
  },
  {
    href: VIGILANCE_ROUTES.WORKFLOW_ROUTER,
    label: "Workflow Router",
    description: "Route cases to the correct workflow based on data",
    icon: Route,
    stage: "reporting",
    nextSteps: [
      VIGILANCE_ROUTES.REPORTING_DEADLINES,
      VIGILANCE_ROUTES.CASE_TRIAGE,
    ],
  },

  // ── Monitoring ──
  {
    href: VIGILANCE_ROUTES.PORTFOLIO_RISK,
    label: "Portfolio Risk",
    description: "Rank and monitor risk across your entire drug portfolio",
    icon: PieChart,
    stage: "monitoring",
    nextSteps: [
      VIGILANCE_ROUTES.DRUG_COMPARISON,
      VIGILANCE_ROUTES.PBRER_ASSESSMENT,
    ],
  },
  {
    href: VIGILANCE_ROUTES.PBRER_ASSESSMENT,
    label: "PBRER Assessment",
    description:
      "Assess section completeness for Periodic Benefit-Risk Evaluation Reports",
    icon: Layers,
    stage: "monitoring",
    nextSteps: [
      VIGILANCE_ROUTES.DOSSIER_COMPLETENESS,
      VIGILANCE_ROUTES.PMR_COMPLIANCE,
    ],
  },
  {
    href: VIGILANCE_ROUTES.PMR_COMPLIANCE,
    label: "PMR Compliance",
    description: "Track Post-Marketing Requirement delays and applicant risk",
    icon: BarChart3,
    stage: "monitoring",
    nextSteps: [
      VIGILANCE_ROUTES.PORTFOLIO_RISK,
      VIGILANCE_ROUTES.DOSSIER_COMPLETENESS,
    ],
  },
  {
    href: VIGILANCE_ROUTES.DOSSIER_COMPLETENESS,
    label: "Dossier Completeness",
    description: "Score safety dossier completeness for regulatory submissions",
    icon: TrendingUp,
    stage: "monitoring",
    nextSteps: [
      VIGILANCE_ROUTES.PBRER_ASSESSMENT,
      VIGILANCE_ROUTES.PORTFOLIO_RISK,
    ],
  },
];

// ─── Utilities ──────────────────────────────────────────────────────────────

/** Get tools grouped by workflow stage */
export function getToolsByStage(): Record<WorkflowStage, PvTool[]> {
  const grouped = {} as Record<WorkflowStage, PvTool[]>;
  for (const stage of Object.keys(WORKFLOW_STAGES) as WorkflowStage[]) {
    grouped[stage] = PV_TOOLS.filter((t) => t.stage === stage);
  }
  return grouped;
}

/** Get a tool by its href */
export function getToolByHref(href: string): PvTool | undefined {
  return PV_TOOLS.find((t) => t.href === href);
}

/** Get next step tools for a given tool href */
export function getNextSteps(href: string): PvTool[] {
  const tool = getToolByHref(href);
  if (!tool) return [];
  return tool.nextSteps
    .map((h) => getToolByHref(h))
    .filter((t): t is PvTool => t !== undefined);
}
