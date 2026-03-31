import type { Metadata } from "next";
import Link from "next/link";
import { Zap, Bot, Terminal } from "lucide-react";
import { createMetadata } from "@/lib/metadata";
import { SkillsGallery } from "./skills-gallery";
import { TOTAL_SKILLS, TOTAL_CATEGORIES } from "@/data/skills-catalog";

export const metadata: Metadata = createMetadata({
  title: `${TOTAL_SKILLS} Skills — The Claude Code App Store`,
  description: `${TOTAL_SKILLS} specialized skills across ${TOTAL_CATEGORIES} categories: pharmacovigilance, Rust development, signal detection, quality compliance, knowledge management, and more. Each skill injects domain expertise directly into your Claude Code session.`,
  path: "/skills",
  keywords: [
    "Claude Code",
    "skills",
    "AI tools",
    "pharmacovigilance",
    "Rust development",
    "signal detection",
    "MCP",
    "AlgoVigilance",
  ],
});

export default function SkillsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10">
        <p className="text-[11px] font-bold text-cyan-400 uppercase tracking-[0.2em] mb-2">
          Skill Catalog
        </p>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          {TOTAL_SKILLS} Skills for Claude Code
        </h1>
        <p className="mt-3 max-w-2xl text-base text-slate-400">
          Each skill injects specialized domain knowledge directly into your
          Claude Code session. Zero latency, zero subprocess — pure context
          injection. Invoke with a slash command or the Skill tool.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Terminal className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                Invoke
              </span>
            </div>
            <p className="text-sm text-slate-300">
              Type{" "}
              <code className="rounded bg-slate-800 px-1.5 py-0.5 text-cyan-300 text-xs font-mono">
                /skill-name
              </code>{" "}
              in any Claude Code session
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Zero Latency
              </span>
            </div>
            <p className="text-sm text-slate-300">
              No subprocess, no network call. Pure markdown injected into
              context.
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                {TOTAL_CATEGORIES} Categories
              </span>
            </div>
            <p className="text-sm text-slate-300">
              PV, Rust, quality, infrastructure, theory, strategy, and more
            </p>
          </div>
        </div>
      </header>

      <SkillsGallery />

      <section className="mt-12 rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-2">For AI Agents</h2>
        <p className="text-sm text-slate-400 mb-4">
          Skills are designed for Claude Code but the knowledge they encode is
          available through AlgoVigilance Station as MCP tools. Connect your agent
          to{" "}
          <code className="rounded bg-slate-800 px-1.5 py-0.5 text-cyan-300 text-xs font-mono">
            https://mcp.nexvigilant.com/mcp
          </code>{" "}
          to access 1,900+ PV tools programmatically.
        </p>
        <Link
          href="/agents"
          className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          Connect via MCP &rarr;
        </Link>
      </section>
    </div>
  );
}
