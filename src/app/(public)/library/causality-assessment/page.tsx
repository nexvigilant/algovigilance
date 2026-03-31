import type { Metadata } from "next";
import Link from "next/link";
import {
  Search,
  ArrowLeft,
  Database,
  BookOpen,
  FlaskConical,
} from "lucide-react";
import { createMetadata } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Causality Assessment — Your Open-Source Pharmacovigilant",
  description:
    "Evaluate whether a drug caused an adverse event using Naranjo algorithm, WHO-UMC system, and Bradford Hill criteria. Step-by-step causality scoring with plain-English results.",
  path: "/library/causality-assessment",
  keywords: [
    "causality assessment",
    "Naranjo algorithm",
    "WHO-UMC",
    "Bradford Hill",
    "pharmacovigilance",
    "adverse drug reaction",
    "RUCAM",
    "drug causality",
  ],
});

export default function CausalityAssessmentPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/library"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-cyan-400 mb-8 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Library
      </Link>

      <header className="mb-12">
        <div className="flex items-center gap-2.5 mb-3">
          <Search className="h-5 w-5 text-amber-400" />
          <p className="text-[11px] font-bold text-amber-400 uppercase tracking-[0.2em]">
            Capability Domain
          </p>
        </div>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          Causality Assessment
        </h1>
        <p className="mt-3 max-w-2xl text-base text-slate-400 leading-relaxed">
          Evaluate whether a drug caused an adverse event using the Naranjo
          algorithm, WHO-UMC system, and Bradford Hill criteria. Each method
          approaches the same question from a different analytical lens.
        </p>
      </header>

      {/* How It Works */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-white mb-4">How It Works</h2>
        <p className="text-sm text-slate-400 leading-relaxed mb-6">
          Causality assessment answers: <em>did this drug cause this event?</em>{" "}
          No single algorithm is definitive. AlgoVigilance runs all three
          established methods simultaneously so you can compare their verdicts
          and document the rationale required for regulatory submissions.
        </p>

        {/* Naranjo */}
        <div className="mb-6">
          <h3 className="text-base font-semibold text-white mb-3">
            Naranjo Algorithm — 10-Question Scoring
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            The Naranjo scale asks 10 structured questions about the case. Each
            answer contributes +2, +1, 0, or −1 to a running score. The total
            score places the case into one of four causality bands.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                band: "Definite",
                range: "Score >= 9",
                color: "text-red-400",
                border: "border-red-500/30 bg-red-950/20",
                desc: "Very strong evidence of drug causation",
              },
              {
                band: "Probable",
                range: "Score 5 – 8",
                color: "text-amber-400",
                border: "border-amber-500/30 bg-amber-950/20",
                desc: "Likely caused by the drug",
              },
              {
                band: "Possible",
                range: "Score 1 – 4",
                color: "text-yellow-400",
                border: "border-yellow-500/30 bg-yellow-950/20",
                desc: "Drug may have contributed",
              },
              {
                band: "Doubtful",
                range: "Score <= 0",
                color: "text-slate-400",
                border: "border-slate-700 bg-slate-900/50",
                desc: "Unlikely to be drug-related",
              },
            ].map((b) => (
              <div key={b.band} className={`rounded-lg border p-4 ${b.border}`}>
                <p className={`text-sm font-bold font-mono ${b.color}`}>
                  {b.band}
                </p>
                <p className="text-xs text-slate-500 mb-1">{b.range}</p>
                <p className="text-sm text-slate-400">{b.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Key questions: previous exposure, improvement on dechallenge,
            reappearance on rechallenge, alternative causes, placebo effect,
            drug levels, dose-response, prior experience, objective
            confirmation.
          </p>
        </div>

        {/* WHO-UMC */}
        <div className="mb-6">
          <h3 className="text-base font-semibold text-white mb-3">
            WHO-UMC System — 6 Categories
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            The World Health Organization Uppsala Monitoring Centre system
            classifies causality using a structured set of criteria for
            plausibility, timing, and clinical pattern.
          </p>
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">
                    Category
                  </th>
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">
                    Key Criteria
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  [
                    "Certain",
                    "Plausible time sequence, known reaction type, confirmed on rechallenge, no alternative explanation",
                  ],
                  [
                    "Probable/Likely",
                    "Plausible time, known reaction, improved on dechallenge, alternative explanation unlikely",
                  ],
                  [
                    "Possible",
                    "Plausible time, could be drug or disease, information on dechallenge lacking",
                  ],
                  [
                    "Unlikely",
                    "Time sequence improbable, other explanation plausible",
                  ],
                  [
                    "Conditional/Unclassified",
                    "More data needed for proper assessment",
                  ],
                  [
                    "Unassessable/Unclassifiable",
                    "Insufficient information, cannot be supplemented or verified",
                  ],
                ].map(([cat, criteria]) => (
                  <tr key={cat} className="border-b border-slate-800/50">
                    <td className="py-2 px-3 text-amber-400 font-semibold whitespace-nowrap">
                      {cat}
                    </td>
                    <td className="py-2 px-3 text-slate-400">{criteria}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bradford Hill */}
        <div>
          <h3 className="text-base font-semibold text-white mb-3">
            Bradford Hill Criteria — 9 Criteria for Causal Inference
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            Bradford Hill criteria are used when evaluating population-level
            causation rather than individual case attribution. Particularly
            useful for signal confirmation and regulatory submissions.
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              {
                name: "Strength",
                desc: "How large is the association (e.g., PRR, ROR)?",
              },
              {
                name: "Consistency",
                desc: "Replicated across different studies and populations?",
              },
              {
                name: "Specificity",
                desc: "Association limited to specific drug-event pair?",
              },
              {
                name: "Temporality",
                desc: "Drug exposure precedes the event?",
              },
              {
                name: "Biological Gradient",
                desc: "Higher dose → stronger effect?",
              },
              {
                name: "Plausibility",
                desc: "Biologically or mechanistically coherent?",
              },
              {
                name: "Coherence",
                desc: "Consistent with known natural history?",
              },
              { name: "Experiment", desc: "Reverses on drug removal?" },
              { name: "Analogy", desc: "Similar drug-event pairs known?" },
            ].map((c) => (
              <div
                key={c.name}
                className="rounded-lg border border-slate-800 bg-slate-900/50 p-3"
              >
                <p className="text-xs font-bold text-white">{c.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tools & Data Sources */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-white mb-4">
          Tools &amp; Data Sources
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              icon: FlaskConical,
              label: "4 Causality Methods",
              desc: "Naranjo scoring, WHO-UMC classification, RUCAM hepatotoxicity scale, and Bradford Hill multi-criterion analysis",
            },
            {
              icon: Database,
              label: "FAERS Case Narratives",
              desc: "Real-world case data from FDA's adverse event reporting system including dechallenge and rechallenge information",
            },
            {
              icon: BookOpen,
              label: "3 Reference Sources",
              desc: "DailyMed drug labeling, PubMed case reports, and FAERS outcomes — all queried live",
            },
          ].map((t) => (
            <div
              key={t.label}
              className="rounded-lg border border-slate-800 bg-slate-900/50 p-4"
            >
              <t.icon className="h-4 w-4 text-amber-400 mb-2" />
              <p className="text-sm font-semibold text-white">{t.label}</p>
              <p className="text-xs text-slate-400 mt-1">{t.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs font-semibold text-slate-300 mb-2">
            Data Sources
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              "FAERS case narratives",
              "DailyMed drug labeling",
              "PubMed case reports",
            ].map((s) => (
              <span
                key={s}
                className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-6 text-center">
        <h2 className="text-lg font-semibold text-white mb-2">
          Run a causality assessment
        </h2>
        <p className="text-sm text-slate-400 mb-4">
          Connect your AI agent to{" "}
          <code className="text-cyan-400 text-xs bg-slate-800 px-1.5 py-0.5 rounded">
            mcp.nexvigilant.com
          </code>{" "}
          and score any case using all three methods simultaneously.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href="/station/connect"
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-400"
          >
            Connect via MCP
          </Link>
          <Link
            href="/library"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-5 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:border-slate-600 hover:text-white"
          >
            Back to Library
          </Link>
        </div>
      </section>
    </div>
  );
}
