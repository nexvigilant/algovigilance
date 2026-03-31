import Link from "next/link";
import {
  Cable,
  ArrowRight,
  Zap,
  BookOpen,
  FlaskConical,
  HelpCircle,
  CheckCircle2,
  MousePointerClick,
  ClipboardPaste,
  MessageSquare,
} from "lucide-react";
import { CopyUrlButton } from "./copy-url-button";
import { ConnectAccordions } from "./connect-accordions";

import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Connect Station to Your AI",
  description:
    "Add AlgoVigilance Station to Claude in 3 steps. 2,000+ pharmacovigilance tools — FAERS, DailyMed, PubMed, ClinicalTrials.gov, and more. No API key required.",
  path: "/station/connect",
});

const MCP_URL = "https://mcp.nexvigilant.com/mcp";

const EXAMPLE_PROMPTS = [
  {
    prompt: "Investigate semaglutide and pancreatitis",
    description:
      "Full signal detection pipeline — FAERS, disproportionality, labeling, literature",
  },
  {
    prompt: "What are the adverse reactions for metformin?",
    description: "Drug labeling lookup via DailyMed",
  },
  {
    prompt: "Compare the safety profiles of warfarin and apixaban",
    description: "Head-to-head FAERS analysis with disproportionality",
  },
  {
    prompt: "Search for clinical trials studying statin-related myopathy",
    description: "ClinicalTrials.gov safety endpoint search",
  },
  {
    prompt: "Run a benefit-risk assessment for ibuprofen",
    description: "Multi-source assessment: trials, FAERS, labeling, literature",
  },
];

const GUIDED_COURSES = [
  {
    name: "Drug Safety Profile",
    steps: 6,
    description: "Name → FAERS → ADRs → Literature → EU → WHO",
  },
  {
    name: "Signal Investigation",
    steps: 6,
    description:
      "FAERS → Disproportionality → EU → Case Reports → Trials → PRAC",
  },
  {
    name: "Causality Assessment",
    steps: 4,
    description: "FAERS → Disproportionality → WHO-UMC → Case Reports",
  },
  {
    name: "Benefit-Risk Assessment",
    steps: 4,
    description: "Trials → FAERS → Labels → EU RMP",
  },
  {
    name: "Regulatory Intelligence",
    steps: 3,
    description: "ICH → EU EPAR → FDA Approvals",
  },
  {
    name: "Competitive Landscape",
    steps: 3,
    description: "Targets → Head-to-Head → Pipeline",
  },
];

export default function ConnectPage() {
  return (
    <main className="min-h-screen">
      <div className="max-w-3xl mx-auto px-golden-3 py-golden-5">
        {/* Header */}
        <header className="text-center mb-golden-5">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 mb-golden-3">
            <Cable className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-golden-2xl md:text-golden-3xl font-bold text-foreground mb-golden-2">
            Give Your AI Drug Safety Superpowers
          </h1>
          <p className="text-golden-base text-muted-foreground max-w-reading mx-auto">
            Connect AlgoVigilance Station to Claude and get instant access to
            2,000+ pharmacovigilance tools — FDA adverse event data, drug
            labeling, clinical trials, published literature, and more.
          </p>
          <p className="text-sm text-cyan-400/80 mt-3">
            Free. No API key. No account needed. Takes about 60 seconds.
          </p>
        </header>

        {/* What Is This? — for people who don't know what MCP is */}
        <section className="mb-golden-5 rounded-xl border border-border/30 bg-card/20 p-golden-3">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground mb-2">
            <HelpCircle className="w-5 h-5 text-muted-foreground" />
            What is this, exactly?
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            AlgoVigilance Station is a{" "}
            <strong className="text-foreground">tool server</strong> that gives
            Claude (the AI you chat with on{" "}
            <a
              href="https://claude.ai"
              className="text-cyan-400 hover:text-cyan-300"
              target="_blank"
              rel="noopener noreferrer"
            >
              claude.ai
            </a>
            ) the ability to look up real drug safety data. Without it, Claude
            answers from memory. With it, Claude can search live FDA databases,
            compute safety statistics, and cite real evidence — just like a
            pharmacovigilance analyst would.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mt-2">
            Think of it like installing an app on your phone. You&apos;re giving
            Claude a new capability. The setup takes 3 clicks.
          </p>
        </section>

        {/* 3 Steps — visual, beginner-friendly */}
        <section className="mb-golden-5">
          <h2 className="text-lg font-bold text-foreground mb-golden-3 text-center">
            Setup in 3 Steps
          </h2>

          <div className="space-y-4">
            {/* Step 1 */}
            <div className="rounded-xl border border-border/50 bg-card/30 p-golden-3">
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-1">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 text-base font-bold border border-cyan-500/20">
                    1
                  </span>
                  <MousePointerClick className="w-4 h-4 text-cyan-400/50" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-base mb-1">
                    Open Claude&apos;s Settings
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Go to{" "}
                    <a
                      href="https://claude.ai"
                      className="text-cyan-400 hover:text-cyan-300 font-medium"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      claude.ai
                    </a>{" "}
                    and look for the{" "}
                    <strong className="text-foreground">gear icon</strong> (
                    Settings) in the bottom-left corner of the sidebar.
                  </p>
                  <div className="rounded-lg bg-slate-900/80 border border-slate-700/50 p-3 text-xs text-slate-400 space-y-1.5">
                    <p>
                      <span className="text-foreground font-medium">
                        Click:
                      </span>{" "}
                      Settings (gear icon, bottom-left)
                    </p>
                    <p>
                      <span className="text-foreground font-medium">
                        Then click:
                      </span>{" "}
                      &ldquo;Integrations&rdquo; in the left menu
                    </p>
                    <p>
                      <span className="text-foreground font-medium">
                        Then click:
                      </span>{" "}
                      &ldquo;Add More&rdquo; or &ldquo;Add Integration&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Connector line */}
            <div className="flex justify-center">
              <div className="w-px h-4 bg-border/30" />
            </div>

            {/* Step 2 */}
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/[0.03] p-golden-3">
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-1">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 text-base font-bold border border-cyan-500/20">
                    2
                  </span>
                  <ClipboardPaste className="w-4 h-4 text-cyan-400/50" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-base mb-1">
                    Paste This URL
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    When Claude asks for a server URL, paste this. That&apos;s
                    the address of our tool server.
                  </p>
                  <div className="flex items-center gap-2 rounded-lg bg-slate-900 border-2 border-cyan-500/30 p-3">
                    <code className="flex-1 text-sm md:text-base text-cyan-300 font-mono select-all break-all">
                      {MCP_URL}
                    </code>
                    <CopyUrlButton text={MCP_URL} />
                  </div>
                  <p className="text-xs text-cyan-400/60 mt-2">
                    Click the copy button, then paste into Claude&apos;s URL
                    field. No name or other settings needed.
                  </p>
                </div>
              </div>
            </div>

            {/* Connector line */}
            <div className="flex justify-center">
              <div className="w-px h-4 bg-border/30" />
            </div>

            {/* Step 3 */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.03] p-golden-3">
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-1">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-base font-bold border border-emerald-500/20">
                    3
                  </span>
                  <MessageSquare className="w-4 h-4 text-emerald-400/50" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-base mb-1">
                    Ask a Drug Safety Question
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Go back to a Claude conversation and ask any drug safety
                    question. Claude will automatically use AlgoVigilance Station
                    to search live databases and give you evidence-based answers.
                  </p>
                  <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3">
                    <p className="text-sm text-emerald-300 font-medium">
                      Try typing:
                    </p>
                    <p className="text-sm text-foreground mt-1 italic">
                      &ldquo;Investigate the safety signal for semaglutide and
                      pancreatitis&rdquo;
                    </p>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Claude will search FDA data, compute disproportionality
                      scores, check drug labels, and search published
                      literature.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Success state */}
            <div className="flex items-center justify-center gap-2 py-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <p className="text-sm font-medium text-emerald-400">
                That&apos;s it. You now have 2,000+ PV tools in Claude.
              </p>
            </div>
          </div>
        </section>

        {/* Troubleshooting — expandable */}
        <ConnectAccordions />

        {/* Example Prompts */}
        <section className="mb-golden-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-golden-3">
            <Zap className="w-5 h-5 text-gold" />
            Things You Can Ask
          </h2>
          <p className="text-sm text-muted-foreground mb-3">
            Once connected, try any of these. Claude will use AlgoVigilance Station
            tools automatically.
          </p>
          <div className="space-y-2">
            {EXAMPLE_PROMPTS.map((example) => (
              <div
                key={example.prompt}
                className="rounded-lg border border-border/30 bg-card/20 p-3 hover:border-border/50 transition-colors"
              >
                <p className="text-sm font-medium text-foreground mb-0.5">
                  &ldquo;{example.prompt}&rdquo;
                </p>
                <p className="text-xs text-muted-foreground">
                  {example.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Guided Courses */}
        <section className="mb-golden-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-golden-3">
            <BookOpen className="w-5 h-5 text-gold" />
            Guided Research Workflows
          </h2>
          <p className="text-sm text-muted-foreground mb-golden-2">
            For structured investigations, tell Claude to{" "}
            <em className="text-foreground">
              &ldquo;chart a course for [topic]&rdquo;
            </em>
            . It will follow a multi-step research protocol:
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {GUIDED_COURSES.map((course) => (
              <div
                key={course.name}
                className="rounded-lg border border-border/30 bg-card/20 p-3"
              >
                <p className="text-sm font-medium text-foreground">
                  {course.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {course.steps} steps: {course.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* See it in action */}
        <section className="rounded-xl border border-gold/20 bg-gold/5 p-golden-3 text-center">
          <FlaskConical className="w-6 h-6 text-gold mx-auto mb-2" />
          <h2 className="font-semibold text-foreground mb-1">
            Want to See It First?
          </h2>
          <p className="text-sm text-muted-foreground mb-3 max-w-md mx-auto">
            Watch a complete signal investigation run in your browser — no
            setup required. Then come back and connect your own Claude.
          </p>
          <Link
            href="/station/semaglutide"
            className="inline-flex items-center gap-2 rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500 transition-colors"
          >
            Watch the Semaglutide Demo
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        {/* Technical details — collapsed by default for beginners */}
        <details className="mt-golden-5 pt-golden-4 border-t border-border/30">
          <summary className="text-sm font-semibold text-foreground cursor-pointer hover:text-cyan-400 transition-colors">
            Technical Details (for developers)
          </summary>
          <dl className="text-xs text-muted-foreground space-y-1 mt-3">
            <div className="flex gap-2">
              <dt className="font-medium text-foreground w-28 shrink-0">
                Protocol
              </dt>
              <dd>MCP (Model Context Protocol) 2025-03-26 — Streamable HTTP</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-foreground w-28 shrink-0">
                Endpoint
              </dt>
              <dd>
                <code className="text-cyan-400">{MCP_URL}</code>
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-foreground w-28 shrink-0">
                Authentication
              </dt>
              <dd>None required — public tools are open access</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-foreground w-28 shrink-0">
                Tools available
              </dt>
              <dd>2,000+ tools across 243 data source configurations</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-foreground w-28 shrink-0">
                Data sources
              </dt>
              <dd>
                FDA FAERS, DailyMed, PubMed, ClinicalTrials.gov, RxNav,
                OpenVigil, EMA, WHO-UMC, ICH, MedDRA, DrugBank, CIOMS
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-foreground w-28 shrink-0">
                CORS
              </dt>
              <dd>Open (Access-Control-Allow-Origin: *)</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-foreground w-28 shrink-0">
                Claude Desktop
              </dt>
              <dd>
                <code className="text-cyan-400">
                  {`{"mcpServers":{"nexvigilant":{"url":"${MCP_URL}"}}}`}
                </code>
              </dd>
            </div>
          </dl>
        </details>
      </div>
    </main>
  );
}
