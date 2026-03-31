import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Cable,
  FlaskConical,
  FileSearch,
  Scale,
  Search,
  Shield,
  Zap,
} from "lucide-react";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Glass Labs — Practice Pharmacovigilance with Real Data",
  description:
    "Hands-on PV labs powered by AlgoVigilance Station. Detect signals, assess causality, and evaluate benefit-risk using live FDA, EMA, and WHO data. Free, no account needed.",
  path: "/glass",
});

const LABS = [
  {
    title: "Signal Investigation Lab",
    description:
      "Detect safety signals using real FDA adverse event data. Run PRR, ROR, IC, and EBGM on any drug-event pair and interpret the results.",
    icon: Activity,
    difficulty: "Beginner" as const,
    duration: "15-30 min",
    tools: ["FAERS Search", "PRR/ROR/IC/EBGM", "DailyMed Labels"],
  },
  {
    title: "Causality Assessment Lab",
    description:
      "Evaluate whether a drug caused an adverse event using Naranjo scoring and WHO-UMC criteria on real case data.",
    icon: Search,
    difficulty: "Intermediate" as const,
    duration: "20-40 min",
    tools: ["Naranjo Algorithm", "WHO-UMC Assessment", "Case Reports"],
  },
  {
    title: "Benefit-Risk Assessment Lab",
    description:
      "Weigh the benefits of a drug against its risks using quantitative frameworks. Practice QBRI computation on real clinical and safety data.",
    icon: Scale,
    difficulty: "Intermediate" as const,
    duration: "25-45 min",
    tools: ["Trial Safety Data", "FAERS Outcomes", "QBRI Compute"],
  },
  {
    title: "Drug Investigator",
    description:
      "Run a complete safety profile investigation on any drug. Follow the guided 6-step workflow from name resolution through literature review.",
    icon: FileSearch,
    difficulty: "Beginner" as const,
    duration: "20-30 min",
    tools: ["RxNav", "FAERS", "DailyMed", "PubMed", "OpenVigil"],
  },
  {
    title: "Regulatory Intelligence Lab",
    description:
      "Navigate ICH guidelines, EMA EPARs, and FDA approval histories. Practice regulatory research with real regulatory databases.",
    icon: Shield,
    difficulty: "Advanced" as const,
    duration: "30-60 min",
    tools: ["ICH Guidelines", "EMA EPAR", "FDA Approvals"],
  },
];

const DIFFICULTY_COLORS = {
  Beginner: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Intermediate: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Advanced: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function GlassPage() {
  return (
    <main className="min-h-screen">
      <div className="max-w-5xl mx-auto px-golden-3 py-golden-5">
        {/* Hero */}
        <header className="text-center mb-golden-5">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-golden-3">
            <FlaskConical className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-golden-2xl md:text-golden-3xl font-bold text-foreground mb-golden-2">
            Glass Labs
          </h1>
          <p className="text-golden-base text-muted-foreground max-w-reading mx-auto">
            Practice pharmacovigilance with real data. Each lab connects to live
            databases through AlgoVigilance Station — the same tools used by AI
            agents and PV professionals worldwide.
          </p>
          <p className="text-sm text-cyan-400/80 mt-3">
            Free. No account needed. Powered by 1,900+ Station tools.
          </p>
        </header>

        {/* Connect CTA — the drawbridge */}
        <section className="mb-golden-5 rounded-xl border-2 border-emerald-500/30 bg-emerald-500/[0.03] p-golden-3">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
              <Cable className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="font-semibold text-foreground">
                Want these tools in your own AI?
              </p>
              <p className="text-sm text-muted-foreground">
                Connect AlgoVigilance Station to Claude in 60 seconds. Free, no
                API key required.
              </p>
            </div>
            <Link
              href="/station/connect"
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors shrink-0"
            >
              Connect Now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Lab Grid */}
        <section className="mb-golden-5">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {LABS.map((lab) => {
              const Icon = lab.icon;
              return (
                <div
                  key={lab.title}
                  className="group flex flex-col rounded-xl border border-border/50 bg-card/20 transition-colors hover:border-primary/40"
                >
                  <div className="flex-1 space-y-3 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${DIFFICULTY_COLORS[lab.difficulty]}`}
                      >
                        {lab.difficulty}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {lab.title}
                      </h3>
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
                  <div className="flex items-center justify-between border-t border-border/30 p-4">
                    <span className="text-xs text-muted-foreground">
                      {lab.duration}
                    </span>
                    <Link
                      href="/station/connect"
                      className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      Get Started <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* How it Works */}
        <section className="mb-golden-5">
          <h2 className="text-xl font-semibold text-foreground mb-golden-3 text-center">
            How Glass Labs Work
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex gap-3 rounded-xl border border-border/30 bg-card/20 p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-sm font-bold text-cyan-400">
                1
              </div>
              <div>
                <p className="font-medium text-foreground">Connect Station</p>
                <p className="text-sm text-muted-foreground">
                  Add the MCP URL to Claude — takes 60 seconds
                </p>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl border border-border/30 bg-card/20 p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-sm font-bold text-cyan-400">
                2
              </div>
              <div>
                <p className="font-medium text-foreground">Pick a lab</p>
                <p className="text-sm text-muted-foreground">
                  Choose a workflow and enter any drug name
                </p>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl border border-border/30 bg-card/20 p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-sm font-bold text-cyan-400">
                3
              </div>
              <div>
                <p className="font-medium text-foreground">
                  Analyze real data
                </p>
                <p className="text-sm text-muted-foreground">
                  Claude queries live databases and explains the results
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* See a worked example */}
        <section className="rounded-xl border border-gold/20 bg-gold/5 p-golden-3 text-center">
          <FlaskConical className="w-6 h-6 text-gold mx-auto mb-2" />
          <h2 className="font-semibold text-foreground mb-1">
            See It in Action
          </h2>
          <p className="text-sm text-muted-foreground mb-3 max-w-md mx-auto">
            Watch a complete signal investigation for semaglutide and
            pancreatitis — from FAERS data to regulatory verdict.
          </p>
          <Link
            href="/station/semaglutide"
            className="inline-flex items-center gap-2 rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500 transition-colors"
          >
            View Worked Example
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </div>
    </main>
  );
}
