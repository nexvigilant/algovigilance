"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Download,
  FileSearch,
  FlaskConical,
  Scale,
  Search,
  Shield,
  Swords,
  Target,
  Zap,
  type LucideIcon,
} from "lucide-react";

// ─── Workflow Cards ─────────────────────────────────────────────────────────

interface WorkflowCard {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  steps: number;
  deliverable: string;
  tools: string[];
  color: string;
}

const WORKFLOWS: WorkflowCard[] = [
  {
    title: "Drug Safety Profile",
    description:
      "Complete safety profile for any drug. Resolves identity, pulls FAERS data, computes signals, reviews labeling, and searches literature.",
    href: "/nucleus/dashboards/drug-safety",
    icon: FileSearch,
    steps: 6,
    deliverable: "Drug Safety Profile Report (PDF)",
    tools: ["RxNav", "FAERS", "PRR/ROR/IC/EBGM", "DailyMed", "PubMed"],
    color: "text-blue-500",
  },
  {
    title: "Signal Investigation",
    description:
      "Investigate a specific drug-event pair. Runs disproportionality analysis, checks label status, finds published evidence, and renders a signal verdict.",
    href: "/nucleus/dashboards/signal",
    icon: Activity,
    steps: 6,
    deliverable: "Signal Assessment Report (PDF)",
    tools: ["FAERS", "OpenVigil", "PRR/ROR/IC/EBGM", "DailyMed", "PubMed"],
    color: "text-amber-500",
  },
  {
    title: "Causality Assessment",
    description:
      "Determine whether a drug caused an adverse event using standardized algorithms. Interactive Naranjo scoring and WHO-UMC categorization.",
    href: "/nucleus/dashboards/causality",
    icon: Search,
    steps: 5,
    deliverable: "Causality Assessment Report (PDF)",
    tools: ["Naranjo Algorithm", "WHO-UMC", "FAERS Context", "Case Reports"],
    color: "text-purple-500",
  },
  {
    title: "Benefit-Risk Assessment",
    description:
      "Weigh drug benefits against safety risks using quantitative frameworks. Pulls trial data, FAERS outcomes, and labeling to compute QBRI scores.",
    href: "/nucleus/dashboards/benefit-risk",
    icon: Scale,
    steps: 5,
    deliverable: "Benefit-Risk Assessment Report (PDF)",
    tools: ["ClinicalTrials.gov", "FAERS Outcomes", "DailyMed", "QBRI"],
    color: "text-green-500",
  },
  {
    title: "Regulatory Intelligence",
    description:
      "Navigate the regulatory landscape for any drug. Search ICH guidelines, FDA approval history, and EMA safety communications.",
    href: "/nucleus/dashboards/regulatory",
    icon: Shield,
    steps: 4,
    deliverable: "Regulatory Intelligence Brief (PDF)",
    tools: ["ICH Guidelines", "FDA Approvals", "EMA Signals", "DailyMed"],
    color: "text-red-500",
  },
  {
    title: "Competitive Landscape",
    description:
      "Compare safety profiles across drugs in the same class. Head-to-head disproportionality, clinical trial activity, and pipeline analysis.",
    href: "/nucleus/dashboards/competitive",
    icon: Swords,
    steps: 4,
    deliverable: "Competitive Landscape Report (PDF)",
    tools: ["FAERS Compare", "ClinicalTrials.gov", "PRR/ROR", "PubMed"],
    color: "text-cyan-500",
  },
];

// ─── Page ───────────────────────────────────────────────────────────────────

export default function DashboardsPage() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              PV Dashboards
            </h1>
            <p className="text-muted-foreground">
              Run complete pharmacovigilance workflows and download professional
              reports
            </p>
          </div>
        </div>
        <p className="max-w-3xl text-muted-foreground">
          Each dashboard guides you through a standard PV workflow step by step,
          calling live databases through AlgoVigilance Station. At the end of each
          workflow, download a structured report ready for review, filing, or
          sharing.
        </p>
      </div>

      {/* How it Works */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <Target className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium">1. Choose a Workflow</p>
            <p className="text-xs text-muted-foreground">
              Pick the PV process you need to run
            </p>
          </div>
        </div>
        <div className="flex gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <Zap className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium">2. Follow the Steps</p>
            <p className="text-xs text-muted-foreground">
              Each step queries live databases with real data
            </p>
          </div>
        </div>
        <div className="flex gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <Download className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium">3. Download Your Report</p>
            <p className="text-xs text-muted-foreground">
              Professional PDF with all findings and citations
            </p>
          </div>
        </div>
      </div>

      {/* Workflow Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {WORKFLOWS.map((w) => {
          const Icon = w.icon;
          return (
            <Link
              key={w.href}
              href={w.href}
              className="group flex flex-col rounded-lg border bg-card transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex-1 space-y-3 p-6">
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted ${w.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {w.steps} steps
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold group-hover:text-primary">
                    {w.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {w.description}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {w.tools.map((tool) => (
                    <span
                      key={tool}
                      className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between border-t p-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Download className="h-3 w-3" />
                  {w.deliverable}
                </div>
                <span className="flex items-center gap-1 text-sm font-medium text-primary">
                  Start <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Station Connection */}
      <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-4">
        <FlaskConical className="h-5 w-5 shrink-0 text-primary" />
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">
            Powered by{" "}
            <span className="font-medium text-foreground">
              AlgoVigilance Station
            </span>{" "}
            at mcp.nexvigilant.com — every query hits live pharmacovigilance
            databases in real time. All data is sourced from FDA FAERS, DailyMed,
            PubMed, ClinicalTrials.gov, and other public databases.
          </p>
        </div>
      </div>
    </div>
  );
}
