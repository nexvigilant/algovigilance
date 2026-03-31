import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  Search,
  Scale,
  FileText,
  Shield,
  FlaskConical,
  GitBranch,
  BookOpen,
  Database,
  Cpu,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { createMetadata } from "@/lib/metadata";
import { LibraryGallery } from "./library-gallery";

export const metadata: Metadata = createMetadata({
  title: "Library — Your Open-Source Pharmacovigilant",
  description:
    "AlgoVigilance is your open-source pharmacovigilant in the AI age. 278 Rust crates, 1,900+ MCP tools, and 1,900+ decision programs — all open, all verifiable, all yours.",
  path: "/library",
  keywords: [
    "pharmacovigilance",
    "open source",
    "drug safety",
    "AI agents",
    "signal detection",
    "adverse events",
    "MCP tools",
    "AlgoVigilance",
  ],
});

const CAPABILITY_DOMAINS = [
  {
    icon: Activity,
    name: "Signal Detection",
    description:
      "Detect safety signals from real-world adverse event data using PRR, ROR, IC, and EBGM — the same algorithms regulators use.",
    tools:
      "19 FAERS tools, 6 disproportionality methods, signal velocity tracking",
    color: "text-red-400",
    borderColor: "hover:border-red-400/40",
    link: "/library/signal-detection",
  },
  {
    icon: Search,
    name: "Causality Assessment",
    description:
      "Evaluate whether a drug caused an adverse event using Naranjo, WHO-UMC, and Bradford Hill criteria — structured, reproducible, auditable.",
    tools: "Naranjo scoring, WHO-UMC classification, RUCAM hepatotoxicity",
    color: "text-amber-400",
    borderColor: "hover:border-amber-400/40",
    link: "/library/causality-assessment",
  },
  {
    icon: Scale,
    name: "Benefit-Risk Analysis",
    description:
      "Quantify the balance between a drug's benefits and risks using the QBR framework with therapeutic window computation.",
    tools:
      "QBR/QBRI computation, therapeutic window, seriousness classification",
    color: "text-emerald-400",
    borderColor: "hover:border-emerald-400/40",
    link: "/library/benefit-risk",
  },
  {
    icon: FileText,
    name: "Regulatory Intelligence",
    description:
      "Navigate ICH guidelines, FDA guidance documents, EMA EPARs, and global regulatory requirements with structured lookups.",
    tools: "ICH guideline search, FDA guidance, EMA EPAR access, CIOMS forms",
    color: "text-cyan-400",
    borderColor: "hover:border-cyan-400/40",
    link: "/library/regulatory-intelligence",
  },
  {
    icon: Shield,
    name: "Drug Safety Profiles",
    description:
      "Build comprehensive safety profiles from FDA labeling, clinical trial data, post-market surveillance, and pharmacogenomics.",
    tools: "DailyMed labels, ClinicalTrials.gov, PharmGKB, boxed warnings",
    color: "text-violet-400",
    borderColor: "hover:border-violet-400/40",
    link: "/library/drug-safety-profiles",
  },
  {
    icon: FlaskConical,
    name: "Molecular Intelligence",
    description:
      "Predict toxicity from molecular structure, analyze metabolites, check structural alerts, and compute pharmacokinetic parameters.",
    tools:
      "SMILES parsing, toxicity prediction, structural alerts, PK modeling",
    color: "text-pink-400",
    borderColor: "hover:border-pink-400/40",
    link: "/library/molecular-intelligence",
  },
];

const THREE_LAYERS = [
  {
    icon: GitBranch,
    name: "Open-Source Code",
    stat: "278 Rust crates",
    description:
      "The computational engine. Signal detection, causality algorithms, epidemiology, benefit-risk math, and pharmacokinetics — MIT/Apache-2.0 on crates.io.",
    color: "text-orange-400",
    link: "/open-source",
    linkLabel: "Browse crates",
  },
  {
    icon: BookOpen,
    name: "Decision Intelligence",
    stat: "1,900+ micrograms",
    description:
      "Atomic decision programs encoding PV domain knowledge as executable YAML trees. Chain into workflows: signal detection to causality to regulatory action.",
    color: "text-emerald-400",
    link: "/capabilities",
    linkLabel: "See capabilities",
  },
  {
    icon: Database,
    name: "AI-Ready Tools",
    stat: "1,900+ MCP tools",
    description:
      "Every capability exposed as a Model Context Protocol tool at mcp.nexvigilant.com — plug any AI agent into the full pharmacovigilance stack.",
    color: "text-cyan-400",
    link: "/station",
    linkLabel: "Connect via MCP",
  },
];

export default function LibraryPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero */}
      <header className="mb-16">
        <p className="text-[11px] font-bold text-cyan-400 uppercase tracking-[0.2em] mb-3">
          Open Source &middot; AI-Powered &middot; Verifiable
        </p>
        <h1 className="text-3xl font-bold text-white sm:text-5xl leading-tight">
          Your Open-Source
          <br />
          <span className="text-cyan-400">Pharmacovigilant</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-400 leading-relaxed">
          Drug safety shouldn&apos;t be locked behind enterprise paywalls.
          AlgoVigilance is an open-source pharmacovigilance intelligence system —
          278 Rust crates, 1,900+ AI tools, and 1,900+ decision programs, all
          built to make drug safety accessible in the AI age.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/station"
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-400"
          >
            <Cpu className="h-4 w-4" />
            Connect Your AI Agent
          </Link>
          <Link
            href="/open-source"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-5 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:border-slate-600 hover:text-white"
          >
            <GitBranch className="h-4 w-4" />
            Browse Source Code
          </Link>
        </div>
      </header>

      {/* What can it do */}
      <section className="mb-16">
        <h2 className="text-xl font-bold text-white mb-2">
          What Your Pharmacovigilant Can Do
        </h2>
        <p className="text-sm text-slate-400 mb-8">
          Six capability domains covering the full pharmacovigilance lifecycle —
          from signal detection to regulatory action.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITY_DOMAINS.map((domain) => (
            <Link
              key={domain.name}
              href={domain.link}
              className={`group rounded-lg border border-slate-800 bg-slate-900/50 p-5 transition-all ${domain.borderColor} hover:bg-slate-900/80`}
            >
              <div className="flex items-center gap-2.5 mb-3">
                <domain.icon className={`h-5 w-5 ${domain.color}`} />
                <h3 className="text-sm font-semibold text-white">
                  {domain.name}
                </h3>
                <ChevronRight className="ml-auto h-4 w-4 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-400" />
              </div>
              <p className="text-sm text-slate-400 leading-relaxed mb-3">
                {domain.description}
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                {domain.tools}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Three layers */}
      <section className="mb-16">
        <h2 className="text-xl font-bold text-white mb-2">
          Three Layers, One Stack
        </h2>
        <p className="text-sm text-slate-400 mb-8">
          Everything is open. Use the crates directly, run the decision trees,
          or connect via MCP — your choice, your infrastructure.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {THREE_LAYERS.map((layer) => (
            <div
              key={layer.name}
              className="rounded-lg border border-slate-800 bg-slate-900/50 p-5"
            >
              <div className="flex items-center gap-2 mb-1">
                <layer.icon className={`h-4 w-4 ${layer.color}`} />
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${layer.color}`}
                >
                  {layer.name}
                </span>
              </div>
              <p className="text-2xl font-bold text-white mb-2">{layer.stat}</p>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                {layer.description}
              </p>
              <Link
                href={layer.link}
                className={`text-sm font-semibold ${layer.color} hover:underline inline-flex items-center gap-1`}
              >
                {layer.linkLabel}
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* The Principle */}
      <section className="mb-16 rounded-lg border border-cyan-500/20 bg-cyan-950/20 p-6 sm:p-8">
        <h2 className="text-lg font-bold text-white mb-3">Why Open Source?</h2>
        <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
          <p>
            Pharmacovigilance protects patients. The tools that do this work
            should be inspectable, reproducible, and available to everyone — not
            locked in proprietary black boxes that regulators can&apos;t audit
            and small teams can&apos;t afford.
          </p>
          <p>
            Every signal detection algorithm, every causality assessment method,
            every decision tree in AlgoVigilance is open source. You can read the
            code, verify the math, fork it, improve it, or run it on your own
            infrastructure. The AI tools at{" "}
            <Link href="/station" className="text-cyan-400 hover:text-cyan-300">
              mcp.nexvigilant.com
            </Link>{" "}
            give any AI agent instant access to the same capabilities.
          </p>
          <p className="text-slate-400 italic">
            PV knowledge belongs to everyone. Clarity scales.
          </p>
        </div>
      </section>

      {/* Under the Hood — the original gallery */}
      <section>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-2">Under the Hood</h2>
          <p className="text-sm text-slate-400">
            The autonomous infrastructure that powers AlgoVigilance — AI agents,
            event-driven hooks, and cognitive output styles. This is what runs
            when you connect.
          </p>
        </div>
        <LibraryGallery />
      </section>

      {/* Connect CTA */}
      <section className="mt-12 rounded-lg border border-slate-800 bg-slate-900/50 p-6 text-center">
        <h2 className="text-lg font-semibold text-white mb-2">
          Ready to connect?
        </h2>
        <p className="text-sm text-slate-400 mb-4 max-w-lg mx-auto">
          Point your AI agent at{" "}
          <code className="text-cyan-400 text-xs bg-slate-800 px-1.5 py-0.5 rounded">
            mcp.nexvigilant.com
          </code>{" "}
          and get instant access to the full pharmacovigilance stack. Or browse
          the source and run it yourself.
        </p>
        <div className="flex justify-center gap-3 flex-wrap">
          <Link
            href="/station/connect"
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-400"
          >
            Connect via MCP
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/open-source"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-5 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:border-slate-600 hover:text-white"
          >
            View Source
            <GitBranch className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/station/demo"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-5 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:border-slate-600 hover:text-white"
          >
            Try Live Demo
            <FlaskConical className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
