import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  Database,
  BookOpen,
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { createMetadata } from "@/lib/metadata";
import { SignalDetectionForm } from "./signal-form";

export const metadata: Metadata = createMetadata({
  title: "Signal Detection — Your Open-Source Pharmacovigilant",
  description:
    "Detect drug safety signals from real-world adverse event data using PRR, ROR, IC, and EBGM. Worked example: semaglutide and pancreatitis.",
  path: "/library/signal-detection",
  keywords: [
    "signal detection",
    "pharmacovigilance",
    "PRR",
    "ROR",
    "EBGM",
    "FAERS",
    "disproportionality",
    "adverse events",
  ],
});

// ---------------------------------------------------------------------------
// Semaglutide × Pancreatitis — worked example data (FAERS, 2026-03-30)
// ---------------------------------------------------------------------------
const EXAMPLE = {
  drug: "Semaglutide",
  rxcui: "1991302",
  event: "Pancreatitis",
  sourceDate: "March 30, 2026",
  faers: { totalSerious: 40_562, drugEventCases: 2_047 },
  contingency: { a: 2_068, b: 76_216, c: 75_999, d: 19_852_706 },
  get observedRate() {
    return this.contingency.a / (this.contingency.a + this.contingency.b);
  },
  get expectedRate() {
    return this.contingency.c / (this.contingency.c + this.contingency.d);
  },
  scores: {
    prr: { value: 6.93, ciLower: 6.63, ciUpper: 7.23 },
    ror: { value: 7.09, ciLower: 6.78, ciUpper: 7.41 },
    ic: { value: 2.76, ciLower: 2.69, ciUpper: 2.82 },
    ebgm: { value: 6.7, ciLower: 6.35, ciUpper: 7.12 },
  },
  literature: { caseReports: 14 },
} as const;

const fmt = (n: number, d = 4) => n.toFixed(d);
const fmtN = (n: number) => n.toLocaleString();

export default function SignalDetectionPage() {
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
          <Activity className="h-5 w-5 text-red-400" />
          <p className="text-[11px] font-bold text-red-400 uppercase tracking-[0.2em]">
            Capability Domain
          </p>
        </div>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          Signal Detection
        </h1>
        <p className="mt-3 max-w-2xl text-base text-slate-400 leading-relaxed">
          Detect safety signals from real-world adverse event data using the
          same disproportionality methods regulators use — PRR, ROR, IC, and
          EBGM. All open source, all verifiable.
        </p>
      </header>

      {/* What it does */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-white mb-4">How It Works</h2>
        <p className="text-sm text-slate-400 leading-relaxed mb-6">
          Signal detection answers a simple question:{" "}
          <em>
            is this drug-event combination reported more often than expected?
          </em>{" "}
          AlgoVigilance queries the FDA Adverse Event Reporting System (FAERS),
          computes a 2&times;2 contingency table, and runs four statistical
          methods that each answer the question from a different mathematical
          perspective.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              method: "PRR",
              full: "Proportional Reporting Ratio",
              perspective: "How many times more often?",
              threshold: ">= 2.0",
            },
            {
              method: "ROR",
              full: "Reporting Odds Ratio",
              perspective: "What are the odds?",
              threshold: ">= 2.0",
            },
            {
              method: "IC",
              full: "Information Component",
              perspective: "How many bits of surprise?",
              threshold: ">= 0.0",
            },
            {
              method: "EBGM",
              full: "Empirical Bayes Geometric Mean",
              perspective: "What does Bayesian analysis say?",
              threshold: "EB05 >= 2.0",
            },
          ].map((m) => (
            <div
              key={m.method}
              className="rounded-lg border border-slate-800 bg-slate-900/50 p-4"
            >
              <p className="text-sm font-bold text-white font-mono">
                {m.method}
              </p>
              <p className="text-xs text-slate-500 mb-1">{m.full}</p>
              <p className="text-sm text-slate-400">{m.perspective}</p>
              <p className="text-[11px] text-slate-500 mt-1 font-mono">
                Signal threshold: {m.threshold}
              </p>
            </div>
          ))}
        </div>
        {/* Conservation Law Visual */}
        <div className="mt-8 rounded-lg border border-cyan-500/20 bg-cyan-950/10 p-6">
          <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-4">
            The Conservation Law — One Equation, Four Perspectives
          </h3>

          {/* The equation */}
          <div className="text-center mb-6">
            <p className="text-lg font-mono text-white">
              <span className="text-cyan-400">&exist;</span>{" "}
              <span className="text-slate-500">=</span>{" "}
              <span className="text-amber-400">&part;</span>
              <span className="text-slate-500">(</span>
              <span className="text-emerald-400">&times;</span>
              <span className="text-slate-500">(</span>
              <span className="text-violet-400">&varsigma;</span>
              <span className="text-slate-500">,</span>{" "}
              <span className="text-pink-400">&empty;</span>
              <span className="text-slate-500">))</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              existence = boundary(product(observed, expected))
            </p>
          </div>

          {/* Contingency table */}
          <div className="mb-6 overflow-x-auto">
            <p className="text-xs text-slate-500 mb-2 font-medium">
              2&times;2 Contingency Table (semaglutide &times; pancreatitis,
              FAERS)
            </p>
            <table className="w-full max-w-md mx-auto text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="py-1.5 pr-4 text-left text-slate-500" />
                  <th className="py-1.5 px-3 text-right text-slate-400">
                    Pancreatitis
                  </th>
                  <th className="py-1.5 px-3 text-right text-slate-400">
                    No Pancreatitis
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-800">
                  <td className="py-1.5 pr-4 text-slate-400">Semaglutide</td>
                  <td className="py-1.5 px-3 text-right text-white font-bold">
                    a = {fmtN(EXAMPLE.contingency.a)}
                  </td>
                  <td className="py-1.5 px-3 text-right text-slate-400">
                    b = {fmtN(EXAMPLE.contingency.b)}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 pr-4 text-slate-400">Other drugs</td>
                  <td className="py-1.5 px-3 text-right text-slate-400">
                    c = {fmtN(EXAMPLE.contingency.c)}
                  </td>
                  <td className="py-1.5 px-3 text-right text-slate-400">
                    d = {fmtN(EXAMPLE.contingency.d)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Shared rates */}
          <div className="grid grid-cols-2 gap-4 mb-6 max-w-md mx-auto">
            <div className="rounded border border-slate-800 bg-slate-900/60 p-3 text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                Observed rate{" "}
                <span className="text-violet-400 font-mono">&varsigma;</span>
              </p>
              <p className="text-sm font-mono text-white">
                a/(a+b) ={" "}
                <span className="text-violet-400 font-bold">
                  {fmt(EXAMPLE.observedRate)}
                </span>
              </p>
              <p className="text-[10px] text-slate-500">
                {(EXAMPLE.observedRate * 100).toFixed(2)}% of semaglutide
                reports mention pancreatitis
              </p>
            </div>
            <div className="rounded border border-slate-800 bg-slate-900/60 p-3 text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                Expected rate{" "}
                <span className="text-pink-400 font-mono">&empty;</span>
              </p>
              <p className="text-sm font-mono text-white">
                c/(c+d) ={" "}
                <span className="text-pink-400 font-bold">
                  {fmt(EXAMPLE.expectedRate)}
                </span>
              </p>
              <p className="text-[10px] text-slate-500">
                {(EXAMPLE.expectedRate * 100).toFixed(2)}% background rate
                across all other drugs
              </p>
            </div>
          </div>

          {/* Four perspectives branching from one root */}
          <div className="relative">
            {/* Vertical connector line */}
            <div className="hidden sm:block absolute left-1/2 top-0 h-4 w-px bg-slate-700" />
            <div className="hidden sm:block absolute left-1/2 -translate-x-1/2 top-0 text-[10px] text-slate-600 -mt-1">
              &darr;
            </div>

            <p className="text-center text-[10px] text-slate-500 mb-3">
              Same inputs, four{" "}
              <span className="text-amber-400 font-mono">&part;</span> operators
            </p>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  op: "∂_ratio",
                  method: "PRR",
                  formula: "ς / ∅",
                  result: EXAMPLE.scores.prr.value,
                  color: "text-red-400",
                  borderColor: "border-red-500/30",
                  question: "How many times more?",
                },
                {
                  op: "∂_odds",
                  method: "ROR",
                  formula: "[ς/(1−ς)] / [∅/(1−∅)]",
                  result: EXAMPLE.scores.ror.value,
                  color: "text-orange-400",
                  borderColor: "border-orange-500/30",
                  question: "What are the odds?",
                },
                {
                  op: "∂_info",
                  method: "IC",
                  formula: "log₂(ς / ∅)",
                  result: EXAMPLE.scores.ic.value,
                  color: "text-blue-400",
                  borderColor: "border-blue-500/30",
                  question: "How many bits of surprise?",
                },
                {
                  op: "∂_bayes",
                  method: "EBGM",
                  formula: "E[λ | a,b,c,d]",
                  result: EXAMPLE.scores.ebgm.value,
                  color: "text-emerald-400",
                  borderColor: "border-emerald-500/30",
                  question: "What does the data believe?",
                },
              ].map((d) => (
                <div
                  key={d.method}
                  className={`rounded-lg border ${d.borderColor} bg-slate-900/60 p-3 text-center`}
                >
                  <p
                    className={`text-[10px] font-mono ${d.color} uppercase tracking-wider`}
                  >
                    {d.op}
                  </p>
                  <p className={`text-xl font-bold font-mono ${d.color} mt-1`}>
                    {d.result}
                  </p>
                  <p className="text-xs font-mono text-slate-500 mt-1">
                    {d.formula}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1.5 italic">
                    {d.question}
                  </p>
                  <p className={`text-[10px] font-bold ${d.color} mt-1`}>
                    {d.method}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-slate-500 mt-5">
            All four agree:{" "}
            <strong className="text-white">strong signal</strong>. They differ
            on magnitude because{" "}
            <span className="text-amber-400 font-mono">&part;</span> is a
            perspective, not a fact.
          </p>
        </div>
      </section>

      {/* Interactive Form */}
      <section className="mb-12">
        <SignalDetectionForm />
      </section>

      {/* Worked Example */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-white mb-2">
          Worked Example: Semaglutide &amp; Pancreatitis
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          Real data from the FDA FAERS database, queried live via AlgoVigilance
          Station on {EXAMPLE.sourceDate}.
        </p>

        {/* Pipeline steps */}
        <div className="space-y-4 mb-8">
          <Step number={1} title="Resolve Drug Identity" source="RxNav (NIH)">
            {EXAMPLE.drug} resolves to <strong>RxCUI {EXAMPLE.rxcui}</strong>.
            Canonical name confirmed across 9 RxNorm entries.
          </Step>
          <Step number={2} title="Query FAERS" source="openFDA">
            <strong>{fmtN(EXAMPLE.faers.totalSerious)}</strong> total serious
            adverse event reports for semaglutide.{" "}
            <strong>{fmtN(EXAMPLE.faers.drugEventCases)}</strong> reports
            specifically mention pancreatitis. Multiple reports show semaglutide
            as the sole suspect drug.
          </Step>
          <Step
            number={3}
            title="Compute Disproportionality"
            source="OpenVigil + AlgoVigilance Compute"
          >
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-1.5 pr-4 text-slate-500 font-medium">
                      Metric
                    </th>
                    <th className="text-right py-1.5 pr-4 text-slate-500 font-medium">
                      Value
                    </th>
                    <th className="text-right py-1.5 pr-4 text-slate-500 font-medium">
                      95% CI Lower
                    </th>
                    <th className="text-right py-1.5 pr-4 text-slate-500 font-medium">
                      95% CI Upper
                    </th>
                    <th className="text-right py-1.5 text-slate-500 font-medium">
                      Signal?
                    </th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {(
                    [
                      ["PRR", EXAMPLE.scores.prr],
                      ["ROR", EXAMPLE.scores.ror],
                      ["IC", EXAMPLE.scores.ic],
                      ["EBGM", EXAMPLE.scores.ebgm],
                    ] as const
                  ).map(([label, s], i) => (
                    <tr
                      key={label}
                      className={i < 3 ? "border-b border-slate-800" : ""}
                    >
                      <td className="py-1.5 pr-4 text-white">{label}</td>
                      <td className="text-right py-1.5 pr-4 text-red-400 font-bold">
                        {s.value.toFixed(2)}
                      </td>
                      <td className="text-right py-1.5 pr-4 text-slate-400">
                        {s.ciLower.toFixed(2)}
                      </td>
                      <td className="text-right py-1.5 pr-4 text-slate-400">
                        {s.ciUpper.toFixed(2)}
                      </td>
                      <td className="text-right py-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-red-400 inline" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Step>
          <Step number={4} title="Check Drug Label" source="DailyMed (NIH)">
            <strong>On Label: Yes.</strong> Acute pancreatitis listed in
            Warnings and Precautions (Section 5.2) and Adverse Reactions
            (Sections 6.1, 6.2). Post-marketing reports include necrotizing
            pancreatitis, sometimes fatal.
          </Step>
          <Step number={5} title="Literature Search" source="PubMed (NIH)">
            <strong>
              {EXAMPLE.literature.caseReports} published case reports
            </strong>{" "}
            documenting semaglutide-associated pancreatitis, including a 2024
            case of fatal acute pancreatitis after 4 years of use (PMID:
            39429379) and a 2026 case in a patient with multimorbidity (PMID:
            41728571).
          </Step>
        </div>

        {/* Verdict */}
        <div className="rounded-lg border border-red-500/30 bg-red-950/20 p-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <h3 className="text-lg font-bold text-white">
              Signal Verdict: Strong
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {[
                  ["Drug", `${EXAMPLE.drug} (RxCUI ${EXAMPLE.rxcui})`, "RxNav"],
                  ["Event", EXAMPLE.event, "FAERS"],
                  [
                    "Cases",
                    `${fmtN(EXAMPLE.faers.drugEventCases)} serious reports`,
                    "openFDA",
                  ],
                  [
                    "PRR",
                    `${EXAMPLE.scores.prr.value} (CI: ${EXAMPLE.scores.prr.ciLower}-${EXAMPLE.scores.prr.ciUpper})`,
                    "OpenVigil",
                  ],
                  [
                    "ROR",
                    `${EXAMPLE.scores.ror.value} (CI: ${EXAMPLE.scores.ror.ciLower}-${EXAMPLE.scores.ror.ciUpper})`,
                    "OpenVigil",
                  ],
                  [
                    "IC",
                    `${EXAMPLE.scores.ic.value} (CI: ${EXAMPLE.scores.ic.ciLower}-${EXAMPLE.scores.ic.ciUpper})`,
                    "AlgoVigilance Compute",
                  ],
                  [
                    "EBGM",
                    `${EXAMPLE.scores.ebgm.value.toFixed(2)} (EB05: ${EXAMPLE.scores.ebgm.ciLower})`,
                    "AlgoVigilance Compute",
                  ],
                  ["On Label", "Yes — W&P 5.2, ADR 6.1, 6.2", "DailyMed"],
                  [
                    "Literature",
                    `${EXAMPLE.literature.caseReports} case reports`,
                    "PubMed",
                  ],
                  ["Consensus", "4/4 methods agree: strong signal", "Pipeline"],
                ].map(([dim, val, src]) => (
                  <tr key={dim} className="border-b border-slate-800/50">
                    <td className="py-1.5 pr-4 text-slate-400 whitespace-nowrap">
                      {dim}
                    </td>
                    <td className="py-1.5 pr-4 text-white font-mono text-xs">
                      {val}
                    </td>
                    <td className="py-1.5 text-slate-500 text-xs">{src}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-slate-300">
            <strong>Recommendation:</strong> Known safety signal — on label. For
            any new case: initiate causality assessment using Naranjo or
            WHO-UMC, review for expedited regulatory reporting.
          </p>
        </div>
      </section>

      {/* Tools used */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-white mb-4">
          Tools &amp; Data Sources
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              icon: Database,
              label: "19 FAERS Tools",
              desc: "Search, filter, compare adverse events from FDA's post-market surveillance database",
            },
            {
              icon: FlaskConical,
              label: "6 Disproportionality Methods",
              desc: "PRR, ROR, IC, EBGM, chi-squared, and full contingency table analysis",
            },
            {
              icon: BookOpen,
              label: "5 Regulatory Sources",
              desc: "openFDA, DailyMed, PubMed, OpenVigil, RxNav — all queried live",
            },
          ].map((t) => (
            <div
              key={t.label}
              className="rounded-lg border border-slate-800 bg-slate-900/50 p-4"
            >
              <t.icon className="h-4 w-4 text-cyan-400 mb-2" />
              <p className="text-sm font-semibold text-white">{t.label}</p>
              <p className="text-xs text-slate-400 mt-1">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-6 text-center">
        <h2 className="text-lg font-semibold text-white mb-2">
          Run your own signal detection
        </h2>
        <p className="text-sm text-slate-400 mb-4">
          Connect your AI agent to{" "}
          <code className="text-cyan-400 text-xs bg-slate-800 px-1.5 py-0.5 rounded">
            mcp.nexvigilant.com
          </code>{" "}
          and run the full 6-step pipeline on any drug-event combination.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href="/station/connect"
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-400"
          >
            Connect via MCP
          </Link>
          <Link
            href="/drugs"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-5 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:border-slate-600 hover:text-white"
          >
            Browse Drug Profiles
          </Link>
        </div>
      </section>
    </div>
  );
}

function Step({
  number,
  title,
  source,
  children,
}: {
  number: number;
  title: string;
  source: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
      <div className="flex items-center gap-3 mb-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-cyan-400">
          {number}
        </span>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <span className="ml-auto text-[10px] text-slate-500 font-mono">
          {source}
        </span>
      </div>
      <div className="text-sm text-slate-400 leading-relaxed pl-9">
        {children}
      </div>
    </div>
  );
}
