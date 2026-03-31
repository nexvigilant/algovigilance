import type { Metadata } from "next";
import Link from "next/link";
import { createMetadata } from "@/lib/metadata";
import { ToolsGallery } from "./tools-gallery";

export const metadata: Metadata = createMetadata({
  title: "PV Tools — Free Pharmacovigilance Calculators",
  description:
    "22 free pharmacovigilance tools: signal detection (PRR, ROR, IC, EBGM), causality assessment (Naranjo, WHO-UMC), benefit-risk analysis, regulatory reporting, and more.",
  path: "/tools",
});

export default function PublicToolsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10">
        <p className="text-[11px] font-bold text-cyan-400 uppercase tracking-[0.2em] mb-2">
          Free PV Tools
        </p>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          Pharmacovigilance Toolkit
        </h1>
        <p className="mt-3 max-w-2xl text-base text-slate-400">
          22 interactive tools covering the full PV workflow — from case intake
          through signal detection, causality assessment, and regulatory
          reporting. All computation runs in your browser. No data leaves your
          device.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 rounded-md bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500 transition-colors"
          >
            Sign Up Free
          </Link>
          <Link
            href="/station"
            className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors"
          >
            Use via MCP Agent
          </Link>
        </div>
      </header>

      <ToolsGallery />

      <section className="mt-12 rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-2">For AI Agents</h2>
        <p className="text-sm text-slate-400 mb-4">
          Every tool in this catalog is also available as an MCP tool on
          AlgoVigilance Station. Connect your AI agent to{" "}
          <code className="rounded bg-slate-800 px-1.5 py-0.5 text-cyan-300 text-xs font-mono">
            https://mcp.nexvigilant.com/mcp
          </code>{" "}
          to access 1,900+ PV tools programmatically — no auth required.
        </p>
        <Link
          href="/station"
          className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          Browse Station Tools &rarr;
        </Link>
      </section>
    </div>
  );
}
