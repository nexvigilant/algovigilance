"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BookOpen,
  FlaskConical,
  Scale,
  Search,
  FileSearch,
  Shield,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";

// ─── Lab Cards ───────────────────────────────────────────────────────────────

interface LabCard {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  academyLink: string;
  academyLabel: string;
  tools: string[];
}

const LABS: LabCard[] = [
  {
    title: "Signal Investigation Lab",
    description:
      "Detect safety signals using real FDA adverse event data. Run PRR, ROR, IC, and EBGM on any drug-event pair and interpret the results.",
    href: "/nucleus/glass/signal-lab",
    icon: Activity,
    difficulty: "Beginner",
    duration: "15-30 min",
    academyLink: "/nucleus/academy/interactive/signal-investigation",
    academyLabel: "Signal Detection Course",
    tools: ["FAERS Search", "PRR/ROR/IC/EBGM", "DailyMed Labels"],
  },
  {
    title: "Causality Assessment Lab",
    description:
      "Evaluate whether a drug caused an adverse event using Naranjo scoring and WHO-UMC criteria on real case data.",
    href: "/nucleus/glass/causality-lab",
    icon: Search,
    difficulty: "Intermediate",
    duration: "20-40 min",
    academyLink: "/nucleus/academy/interactive/causality-assessment",
    academyLabel: "Causality Assessment Course",
    tools: ["Naranjo Algorithm", "WHO-UMC Assessment", "Case Reports"],
  },
  {
    title: "Benefit-Risk Assessment Lab",
    description:
      "Weigh the benefits of a drug against its risks using quantitative frameworks. Practice QBRI computation on real clinical and safety data.",
    href: "/nucleus/glass/benefit-risk-lab",
    icon: Scale,
    difficulty: "Intermediate",
    duration: "25-45 min",
    academyLink: "/nucleus/academy/interactive/benefit-risk",
    academyLabel: "Benefit-Risk Course",
    tools: ["Trial Safety Data", "FAERS Outcomes", "QBRI Compute"],
  },
  {
    title: "Drug Investigator",
    description:
      "Run a complete safety profile investigation on any drug. Follow the guided 6-step workflow from name resolution through literature review.",
    href: "/nucleus/glass/drug-investigator",
    icon: FileSearch,
    difficulty: "Beginner",
    duration: "20-30 min",
    academyLink: "/nucleus/academy/interactive/drug-comparison",
    academyLabel: "Drug Comparison Course",
    tools: ["RxNav", "FAERS", "DailyMed", "PubMed", "OpenVigil"],
  },
  {
    title: "Regulatory Intelligence Lab",
    description:
      "Navigate ICH guidelines, EMA EPARs, and FDA approval histories. Practice regulatory research with real regulatory databases.",
    href: "/nucleus/glass/regulatory-lab",
    icon: Shield,
    difficulty: "Advanced",
    duration: "30-60 min",
    academyLink: "/nucleus/academy/gvp-modules",
    academyLabel: "GVP Modules",
    tools: ["ICH Guidelines", "EMA EPAR", "FDA Approvals"],
  },
];

function DifficultyBadge({ level }: { level: LabCard["difficulty"] }) {
  const colors = {
    Beginner: "bg-green-500/10 text-green-600 border-green-500/20",
    Intermediate: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    Advanced: "bg-red-500/10 text-red-600 border-red-500/20",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${colors[level]}`}
    >
      {level}
    </span>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function GlassPage() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <FlaskConical className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Glass</h1>
            <p className="text-muted-foreground">
              Practice pharmacovigilance with real data
            </p>
          </div>
        </div>
        <p className="max-w-2xl text-muted-foreground">
          Glass is where learning becomes doing. Each lab connects to live
          pharmacovigilance databases through AlgoVigilance Station — the same
          tools used by AI agents and PV professionals worldwide. Pick a lab,
          follow the guided workflow, and build real skills with real data.
        </p>
      </div>

      {/* Learning Path Banner */}
      <div className="flex items-center gap-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
        <BookOpen className="h-5 w-5 shrink-0 text-primary" />
        <div className="flex-1">
          <p className="text-sm font-medium">Coming from Academy?</p>
          <p className="text-sm text-muted-foreground">
            Each lab links back to the course that teaches the concepts.
            Learn the theory in Academy, practice it here in Glass.
          </p>
        </div>
        <Link
          href="/nucleus/academy"
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Go to Academy <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Lab Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {LABS.map((lab) => {
          const Icon = lab.icon;
          return (
            <div
              key={lab.href}
              className="group flex flex-col rounded-lg border bg-card transition-colors hover:border-primary/40"
            >
              <div className="flex-1 space-y-3 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <DifficultyBadge level={lab.difficulty} />
                </div>
                <div>
                  <h3 className="font-semibold">{lab.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {lab.description}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {lab.tools.map((tool) => (
                    <span
                      key={tool}
                      className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      <Zap className="mr-1 h-3 w-3" />
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between border-t p-4">
                <Link
                  href={lab.academyLink}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                >
                  <BookOpen className="h-3 w-3" />
                  {lab.academyLabel}
                </Link>
                <Link
                  href={lab.href}
                  className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  Start Lab <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* How it Works */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">How Glass Works</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex gap-3 rounded-lg border p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              1
            </div>
            <div>
              <p className="font-medium">Pick a drug</p>
              <p className="text-sm text-muted-foreground">
                Choose from preset scenarios or enter any drug name
              </p>
            </div>
          </div>
          <div className="flex gap-3 rounded-lg border p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              2
            </div>
            <div>
              <p className="font-medium">Follow the workflow</p>
              <p className="text-sm text-muted-foreground">
                Each step queries real databases and explains the results
              </p>
            </div>
          </div>
          <div className="flex gap-3 rounded-lg border p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              3
            </div>
            <div>
              <p className="font-medium">Build your judgment</p>
              <p className="text-sm text-muted-foreground">
                Interpret findings, make decisions, and compare to expert
                assessments
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Station Connection */}
      <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-4">
        <Sparkles className="h-5 w-5 shrink-0 text-primary" />
        <p className="text-sm text-muted-foreground">
          Powered by{" "}
          <span className="font-medium text-foreground">
            AlgoVigilance Station
          </span>{" "}
          — 1,954 pharmacovigilance tools accessible via MCP at
          mcp.nexvigilant.com
        </p>
      </div>
    </div>
  );
}
