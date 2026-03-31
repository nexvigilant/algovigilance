import type { Metadata } from "next";
import Link from "next/link";
import {
  Scale,
  ArrowLeft,
  Database,
  BookOpen,
  FlaskConical,
} from "lucide-react";
import { createMetadata } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Benefit-Risk Analysis — Your Open-Source Pharmacovigilant",
  description:
    "Quantify the balance between a drug's benefits and risks using the QBR framework with therapeutic window computation and NNH/NNT comparison.",
  path: "/library/benefit-risk",
  keywords: [
    "benefit-risk",
    "QBR",
    "QBRI",
    "pharmacovigilance",
    "therapeutic window",
    "NNH",
    "NNT",
    "drug safety",
    "benefit risk assessment",
  ],
});

export default function BenefitRiskPage() {
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
          <Scale className="h-5 w-5 text-emerald-400" />
          <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-[0.2em]">
            Capability Domain
          </p>
        </div>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          Benefit-Risk Analysis
        </h1>
        <p className="mt-3 max-w-2xl text-base text-slate-400 leading-relaxed">
          Quantify the balance between a drug&apos;s benefits and risks using
          the QBR framework with therapeutic window computation. Move from
          subjective judgment to reproducible, auditable numbers.
        </p>
      </header>

      {/* How It Works */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-white mb-4">How It Works</h2>
        <p className="text-sm text-slate-400 leading-relaxed mb-6">
          Benefit-risk analysis answers:{" "}
          <em>
            for this patient population, do the benefits outweigh the harms?
          </em>{" "}
          The QBR (Quantitative Benefit-Risk) framework treats benefits and
          risks symmetrically — both as contingency tables — then integrates
          them into a single dimensionless index.
        </p>

        {/* QBR Framework */}
        <div className="mb-6">
          <h3 className="text-base font-semibold text-white mb-3">
            Quantitative Benefit-Risk (QBR) Framework
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            QBR uses the same 2&times;2 contingency table structure as signal
            detection, applied separately to benefit outcomes and risk outcomes.
            Each cell captures observed vs. expected counts in treated vs.
            control populations.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                label: "Benefit Contingency Table",
                color: "text-emerald-400",
                border: "border-emerald-500/30 bg-emerald-950/20",
                desc: "Drug responders vs. non-responders. Captures NNT — how many patients need treatment for one to benefit.",
              },
              {
                label: "Risk Contingency Table",
                color: "text-red-400",
                border: "border-red-500/30 bg-red-950/20",
                desc: "Adverse event rates in treated vs. control. Captures NNH — how many patients need treatment for one to be harmed.",
              },
            ].map((t) => (
              <div
                key={t.label}
                className={`rounded-lg border p-4 ${t.border}`}
              >
                <p className={`text-sm font-bold ${t.color}`}>{t.label}</p>
                <p className="text-sm text-slate-400 mt-2">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* QBRI */}
        <div className="mb-6">
          <h3 className="text-base font-semibold text-white mb-3">
            QBRI — Integrated Benefit-Risk Index
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            QBRI (Quantitative Benefit-Risk Index) integrates the benefit and
            risk tables into a single value. A QBRI above 1.0 indicates benefit
            exceeds risk; below 1.0 indicates the opposite. The index is
            weighted by outcome severity using ICH E2A seriousness criteria.
          </p>
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            <p className="text-xs text-slate-500 mb-3 font-mono uppercase tracking-wider">
              QBRI Interpretation
            </p>
            <div className="space-y-2">
              {[
                {
                  range: "QBRI > 2.0",
                  label: "Strongly favorable",
                  color: "text-emerald-400",
                },
                {
                  range: "QBRI 1.0 – 2.0",
                  label: "Favorable — benefit exceeds risk",
                  color: "text-emerald-300",
                },
                {
                  range: "QBRI ~1.0",
                  label: "Balanced — context-dependent decision",
                  color: "text-yellow-400",
                },
                {
                  range: "QBRI < 1.0",
                  label: "Risk exceeds benefit — requires justification",
                  color: "text-red-400",
                },
              ].map((r) => (
                <div key={r.range} className="flex items-center gap-4">
                  <span className="font-mono text-xs text-slate-300 w-32 shrink-0">
                    {r.range}
                  </span>
                  <span className={`text-sm ${r.color}`}>{r.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Therapeutic Window */}
        <div className="mb-6">
          <h3 className="text-base font-semibold text-white mb-3">
            Therapeutic Window via Hill Curves
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            The therapeutic window is the dose range where the benefit curve
            (Hill equation for efficacy) is above the risk curve (Hill equation
            for toxicity). AlgoVigilance computes both curves from clinical trial
            data and identifies the window boundaries numerically.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                label: "E_max",
                desc: "Maximum achievable efficacy from the benefit Hill curve",
              },
              {
                label: "EC50 / TC50",
                desc: "Dose for 50% efficacy vs. dose for 50% toxicity",
              },
              {
                label: "Therapeutic Index",
                desc: "TC50 / EC50 — the wider this ratio, the safer the drug",
              },
            ].map((p) => (
              <div
                key={p.label}
                className="rounded-lg border border-slate-800 bg-slate-900/50 p-3"
              >
                <p className="text-sm font-bold text-emerald-400 font-mono">
                  {p.label}
                </p>
                <p className="text-xs text-slate-400 mt-1">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* NNT / NNH */}
        <div>
          <h3 className="text-base font-semibold text-white mb-3">
            NNT and NNH — Patient-Facing Numbers
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Number Needed to Treat (NNT) and Number Needed to Harm (NNH) are
            derived directly from the benefit and risk contingency tables. They
            translate statistical results into clinically interpretable
            quantities: for every NNT patients treated, one benefits; for every
            NNH patients treated, one is harmed. A high NNH/NNT ratio indicates
            a favorable benefit-risk profile.
          </p>
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
              label: "5 Computation Methods",
              desc: "QBR computation, QBRI integration, therapeutic window, seriousness classification, NNH/NNT from contingency tables",
            },
            {
              icon: Database,
              label: "Clinical Trial Data",
              desc: "SAE rates, efficacy endpoints, and study design from ClinicalTrials.gov — the primary source for benefit quantification",
            },
            {
              icon: BookOpen,
              label: "3 Reference Sources",
              desc: "FAERS outcomes for real-world risk, drug labeling for labeled safety events, and ICH E2A for seriousness weighting",
            },
          ].map((t) => (
            <div
              key={t.label}
              className="rounded-lg border border-slate-800 bg-slate-900/50 p-4"
            >
              <t.icon className="h-4 w-4 text-emerald-400 mb-2" />
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
            {["Clinical trial data", "FAERS outcomes", "Drug labeling"].map(
              (s) => (
                <span
                  key={s}
                  className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono"
                >
                  {s}
                </span>
              ),
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-6 text-center">
        <h2 className="text-lg font-semibold text-white mb-2">
          Compute benefit-risk for any drug
        </h2>
        <p className="text-sm text-slate-400 mb-4">
          Connect your AI agent to{" "}
          <code className="text-cyan-400 text-xs bg-slate-800 px-1.5 py-0.5 rounded">
            mcp.nexvigilant.com
          </code>{" "}
          and run QBR analysis with therapeutic window computation.
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
