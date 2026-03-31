import Link from "next/link";
import { Bot, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createMetadata } from "@/lib/metadata";
import { CopyButton } from "./copy-button";
import {
  ToolCategoryGrid,
  TOTAL_TOOLS,
  CATEGORY_COUNT,
} from "./tool-categories";

export const metadata = createMetadata({
  title: "For Agents — 1,900+ PV Tools via MCP",
  description:
    "Connect any MCP-compatible AI agent to AlgoVigilance Station. 1,900+ pharmacovigilance tools — signal detection, causality assessment, drug safety databases, regulatory guidelines, and more.",
  path: "/agents",
  keywords: [
    "AI agents",
    "MCP server",
    "Model Context Protocol",
    "pharmacovigilance",
    "signal detection",
    "causality assessment",
    "MCP tools",
    "AlgoVigilance Station",
  ],
});

const MCP_CONFIG = `{
  "mcpServers": {
    "nexvigilant": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://mcp.nexvigilant.com/mcp"
      ]
    }
  }
}`;

export default function AgentsPage() {
  return (
    <div className="min-h-screen bg-nex-background" data-testid="agents-page">
      {/* Hero */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(82,197,199,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(212,175,55,0.05),transparent_60%)]" />

        <div className="container mx-auto max-w-4xl relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan/20 bg-cyan/5 text-cyan text-xs font-medium tracking-wide uppercase mb-8">
            <Bot className="h-3 w-3" aria-hidden="true" />
            AlgoVigilance Station
          </div>

          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-headline font-bold text-white mb-6"
            style={{ lineHeight: 1.1 }}
          >
            {TOTAL_TOOLS} pharmacovigilance tools.
            <br />
            <span className="text-cyan">One MCP endpoint.</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-dim max-w-2xl mx-auto mb-10 leading-relaxed">
            Connect any MCP-compatible AI agent to AlgoVigilance Station. Signal
            detection, causality assessment, drug safety databases, regulatory
            guidelines, clinical trials, and literature search — ready in one
            line of config.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" variant="glow" className="touch-target">
              <a href="#connect">
                Connect Your Agent
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/5 touch-target"
            >
              <a
                href="https://mcp.nexvigilant.com/tools"
                target="_blank"
                rel="noopener noreferrer"
              >
                Browse All Tools
                <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
          </div>

          {/* Live status badge */}
          <div className="mt-8 inline-flex items-center gap-2 text-xs text-slate-dim">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Live at mcp.nexvigilant.com
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="connect" className="py-16 px-4 border-t border-nex-light">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-headline font-bold text-white text-center mb-12">
            Connect in 60 seconds
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Add the endpoint",
                description:
                  "One entry in your MCP client config. Works with Claude, GPT, Gemini, or any MCP-compatible agent.",
              },
              {
                step: "2",
                title: "Discover tools",
                description:
                  "Your agent sees all 1,900+ tools instantly. Typed inputs, structured outputs, full descriptions.",
              },
              {
                step: "3",
                title: "Run PV analysis",
                description:
                  "Signal detection, causality assessment, drug lookups, literature search — real data, real results.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative p-6 rounded-xl border border-nex-light bg-nex-surface/50"
              >
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-cyan text-nex-deep flex items-center justify-center text-sm font-bold">
                  {item.step}
                </div>
                <h3 className="text-lg font-headline font-semibold text-white mb-2 mt-2">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-dim leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          {/* MCP Config snippet */}
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="rounded-xl border border-nex-light bg-nex-deep p-6 relative group">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-slate-dim uppercase tracking-wider">
                  Add to your MCP client config
                </p>
                <CopyButton text={MCP_CONFIG} />
              </div>
              <pre className="text-sm text-cyan font-mono overflow-x-auto">
                {MCP_CONFIG}
              </pre>
            </div>

            <p className="text-xs text-slate-dim text-center mt-4">
              MCP 2025-03-26 Streamable HTTP. No API key required. No
              authentication.
              <br />
              Works with{" "}
              <a
                href="https://docs.anthropic.com/en/docs/claude-code"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan hover:underline"
              >
                Claude Code
              </a>
              ,{" "}
              <a
                href="https://modelcontextprotocol.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan hover:underline"
              >
                any MCP client
              </a>
              , or direct HTTP at{" "}
              <code className="text-cyan/80">mcp.nexvigilant.com/tools</code>.
            </p>
          </div>
        </div>
      </section>

      {/* Tool Categories */}
      <section className="py-16 px-4 border-t border-nex-light">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-headline font-bold text-white text-center mb-4">
            {TOTAL_TOOLS} tools across {CATEGORY_COUNT} domains
          </h2>
          <p className="text-slate-dim text-center mb-12 max-w-xl mx-auto">
            Every major pharmacovigilance data source and computation method —
            accessible through a single endpoint.
          </p>

          <ToolCategoryGrid />
        </div>
      </section>

      {/* Data Sources */}
      <section className="py-16 px-4 border-t border-nex-light">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-headline font-bold text-white text-center mb-12">
            Connected to the sources that matter
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[
              { name: "FDA FAERS", sub: "Adverse events" },
              { name: "EudraVigilance", sub: "EU safety reports" },
              { name: "VigiAccess", sub: "WHO global data" },
              { name: "OpenVigil", sub: "Disproportionality" },
              { name: "DailyMed", sub: "Drug labeling" },
              { name: "DrugBank", sub: "Pharmacology" },
              { name: "RxNav", sub: "Nomenclature" },
              { name: "PubMed", sub: "Literature" },
              { name: "ClinicalTrials.gov", sub: "Trial data" },
              { name: "ICH", sub: "Guidelines" },
              { name: "CIOMS", sub: "Standards" },
              { name: "MedDRA", sub: "Terminology" },
              { name: "EMA", sub: "EU regulatory" },
              { name: "FDA", sub: "US regulatory" },
              { name: "WHO-UMC", sub: "Global PV" },
              { name: "AlgoVigilance", sub: "Computation" },
            ].map((source) => (
              <div
                key={source.name}
                className="p-4 rounded-xl border border-nex-light/50 bg-nex-surface/30 text-center"
              >
                <p className="text-sm font-medium text-white">{source.name}</p>
                <p className="text-xs text-slate-dim mt-1">{source.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 border-t border-nex-light">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-2xl md:text-3xl font-headline font-bold text-white mb-4">
            Give your agent pharmacovigilance capabilities
          </h2>
          <p className="text-slate-dim mb-8 max-w-lg mx-auto">
            AlgoVigilance Station is free, open, and live. No API key. No signup.
            Connect and start querying drug safety data in seconds.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" variant="glow" className="touch-target">
              <a href="#connect">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/5 touch-target"
            >
              <Link href="/contact">Talk to Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
