import { createMetadata } from "@/lib/metadata";
import {
  Wrench,
  Terminal,
  Brain,
  Code2,
  ShieldCheck,
  FlaskConical,
  Bug,
  Gauge,
  Network,
  Database,
  Waypoints,
  Store,
  GitCompare,
  ScanSearch,
  FileText,
  GitBranch,
  BookOpen,
  Upload,
  Gavel,
} from "lucide-react";
import Link from "next/link";

export const metadata = createMetadata({
  title: "Engineering Studio",
  description:
    "NexCore development and analysis tools — API explorer, code generation, brain viewer, and more.",
  path: "/nucleus/tools",
  keywords: ["tools", "API", "code generation", "brain", "development"],
});

const TOOLS = [
  {
    href: "/nucleus/tools/code-gen",
    title: "Code Generator",
    description:
      "Automated generation of Rust boilerplate, API clients, and PVDSL logic.",
    icon: Code2,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    href: "/nucleus/tools/debug",
    title: "Debug Assistant",
    description:
      "AI-powered analysis of stack traces, logs, and logical anomalies.",
    icon: Bug,
    color: "text-red-400",
    bg: "bg-red-500/10",
  },
  {
    href: "/nucleus/tools/perf",
    title: "Performance Analyzer",
    description:
      "Optimization analysis for async workflows and high-throughput data pipelines.",
    icon: Gauge,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    href: "/nucleus/tools/brain",
    title: "Brain Storage",
    description: "Working memory and persistent artifacts from AI sessions.",
    icon: Brain,
    color: "text-amber-300",
    bg: "bg-amber-500/10",
  },
  {
    href: "/nucleus/tools/api-explorer",
    title: "API Explorer",
    description:
      "Interactive documentation and testing for NexCore telemetry endpoints.",
    icon: Terminal,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    href: "/nucleus/tools/visualizer",
    title: "Architecture Visualizer",
    description:
      "Decompose system designs into fundamental primitives (Lex Primitiva).",
    icon: Network,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    href: "/nucleus/forge",
    title: "Primitive Forge",
    description:
      "Game-theory roguelike for symbol collection and code forging.",
    icon: FlaskConical,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    href: "/nucleus/tools/registry",
    title: "Registry HUD",
    description: "Monitor Kellnr registry status and crate lifecycle events.",
    icon: Database,
    color: "text-slate-400",
    bg: "bg-slate-500/10",
  },
  {
    href: "/nucleus/tools/mesh",
    title: "Ecosystem Mesh",
    description:
      "Full node-to-node navigation graph across all domains and app surfaces.",
    icon: Waypoints,
    color: "text-cyan-200",
    bg: "bg-cyan-500/10",
  },
  {
    href: "/nucleus/tools/store",
    title: "App Store",
    description: "Browse ecosystem apps directly in Nucleus.",
    icon: Store,
    color: "text-cyan-300",
    bg: "bg-cyan-500/10",
  },
  {
    href: "/nucleus/guardian",
    title: "Guardian",
    description:
      "Signal detection, adverse event search, and homeostasis monitoring.",
    icon: ShieldCheck,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    href: "/nucleus/tools/fuzzy-matcher",
    title: "Fuzzy Matcher",
    description:
      "Compare drug names, medical terms, and adverse events using edit distance algorithms.",
    icon: GitCompare,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
  },
  {
    href: "/nucleus/tools/ai-detector",
    title: "AI Detector",
    description:
      "Analyze text for AI-generation markers using statistical fingerprints.",
    icon: ScanSearch,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
  },
  {
    href: "/nucleus/tools/text-optimizer",
    title: "Text Optimizer",
    description:
      "Score and compress prose for density using the Compendious Machine.",
    icon: FileText,
    color: "text-teal-400",
    bg: "bg-teal-500/10",
  },
  {
    href: "/nucleus/tools/decision-tree",
    title: "Decision Tree",
    description:
      "Train, visualize, and predict with CART decision trees on your data.",
    icon: GitBranch,
    color: "text-lime-400",
    bg: "bg-lime-500/10",
  },
  {
    href: "/nucleus/tools/epub-publisher",
    title: "EPUB Publisher",
    description:
      "Convert Word documents to publication-ready EPUB 3.0 ebooks with KDP compliance checks.",
    icon: Upload,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
  },
  {
    href: "/nucleus/tools/epub-reader",
    title: "EPUB Reader",
    description:
      "Open and read EPUB ebooks directly in your browser with keyboard navigation.",
    icon: BookOpen,
    color: "text-sky-400",
    bg: "bg-sky-500/10",
  },
  {
    href: "/nucleus/tools/bid-generator",
    title: "Bid Generator",
    description:
      "Fill out an RFP-style form and get an instant AlgoVigilance consulting proposal with pricing and deliverables.",
    icon: Gavel,
    color: "text-gold",
    bg: "bg-gold/10",
  },
] as const;

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-golden-4">
        <div className="flex items-center gap-golden-2 mb-golden-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-cyan-400/30 bg-cyan-400/5">
            <Wrench className="h-5 w-5 text-cyan-400" aria-hidden="true" />
          </div>
          <div>
            <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-cyan-400/60">
              AlgoVigilance Engineering
            </p>
            <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Engineering Studio
            </h1>
          </div>
        </div>
        <p className="text-sm text-slate-dim/70 max-w-xl leading-golden">
          Capability accelerators for automated code generation, AI-assisted
          debugging, and performance optimization.
        </p>
      </header>

      <div className="grid gap-golden-2 md:grid-cols-2 lg:grid-cols-4">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.href}
              href={tool.href}
              className="border border-white/[0.12] bg-white/[0.06]/50 p-golden-3 hover:border-cyan/30 transition-all group flex flex-col h-full"
            >
              <div
                className={`text-2xl font-mono mb-golden-2 ${tool.color} group-hover:scale-110 transition-transform w-fit`}
              >
                <Icon className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors mb-golden-1">
                {tool.title}
              </h3>
              <p className="text-[11px] text-slate-dim leading-golden flex-1">
                {tool.description}
              </p>
              <div className="mt-golden-2 text-[10px] font-bold text-slate-dim/50 uppercase tracking-widest font-mono group-hover:text-cyan-400 transition-colors">
                Launch tool
              </div>
            </Link>
          );
        })}
      </div>

      {/* Grounding note */}
      <div className="mt-golden-5 border border-white/[0.12] bg-white/[0.06]/30 p-golden-4 flex flex-col items-center text-center">
        <div className="h-10 w-10 border border-white/[0.12] bg-black/30 flex items-center justify-center text-cyan-400 text-lg font-mono mb-golden-2">
          T1
        </div>
        <h3 className="text-lg font-bold text-white mb-golden-2">
          Grounding to Lex Primitiva
        </h3>
        <p className="text-slate-dim max-w-2xl text-sm leading-golden">
          Every tool in the Engineering Studio is designed to reduce entropy and
          ensure that our software architectures remain grounded to the 16 Lex
          Primitiva symbols.
        </p>
      </div>
    </div>
  );
}
