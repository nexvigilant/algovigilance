import type { Metadata } from "next";
import Link from "next/link";
import {
  Shield,
  ArrowLeft,
  Database,
  BookOpen,
  FlaskConical,
} from "lucide-react";
import { createMetadata } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Drug Safety Profiles — Your Open-Source Pharmacovigilant",
  description:
    "Build comprehensive drug safety profiles from FDA labeling, clinical trial data, post-market surveillance, and pharmacogenomics in one structured view.",
  path: "/library/drug-safety-profiles",
  keywords: [
    "drug safety profile",
    "DailyMed",
    "ClinicalTrials",
    "PharmGKB",
    "pharmacogenomics",
    "boxed warning",
    "adverse drug reactions",
    "drug safety",
    "post-market surveillance",
  ],
});

export default function DrugSafetyProfilesPage() {
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
          <Shield className="h-5 w-5 text-violet-400" />
          <p className="text-[11px] font-bold text-violet-400 uppercase tracking-[0.2em]">
            Capability Domain
          </p>
        </div>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          Drug Safety Profiles
        </h1>
        <p className="mt-3 max-w-2xl text-base text-slate-400 leading-relaxed">
          Build comprehensive safety profiles from FDA labeling, clinical trial
          data, post-market surveillance, and pharmacogenomics — all in one
          structured, auditable view.
        </p>
      </header>

      {/* How It Works */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-white mb-4">How It Works</h2>
        <p className="text-sm text-slate-400 leading-relaxed mb-6">
          A drug safety profile answers:{" "}
          <em>
            what is known about this drug&apos;s harms, and from which sources?
          </em>{" "}
          AlgoVigilance assembles evidence from four distinct layers — label,
          trials, surveillance, and genomics — into one coherent profile with
          source attribution for every finding.
        </p>

        {/* Layer 1: DailyMed */}
        <div className="mb-6">
          <h3 className="text-base font-semibold text-white mb-3">
            Layer 1 — DailyMed Drug Labeling
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            The FDA-approved prescribing information is the regulatory ground
            truth for drug safety. AlgoVigilance extracts structured data from
            each section of the label via DailyMed (NIH National Library of
            Medicine).
          </p>
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">
                    Label Section
                  </th>
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">
                    What It Contains
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  [
                    "Boxed Warning (Section 5.x)",
                    "Highest-severity FDA safety warnings — black box events requiring prominent labeling",
                  ],
                  [
                    "Warnings & Precautions (5.x)",
                    "Serious risks requiring monitoring, dose adjustment, or contraindication consideration",
                  ],
                  [
                    "Adverse Reactions (6.1, 6.2)",
                    "Clinical trial ADRs (6.1) and post-marketing experience (6.2) with incidence rates",
                  ],
                  [
                    "Drug Interactions (7)",
                    "Pharmacokinetic and pharmacodynamic interactions with clinical consequences",
                  ],
                  [
                    "Use in Specific Populations (8)",
                    "Pregnancy, lactation, pediatric, geriatric, and renal/hepatic impairment data",
                  ],
                  [
                    "Clinical Pharmacology (12)",
                    "Mechanism of action, pharmacokinetics, pharmacodynamics",
                  ],
                ].map(([section, content]) => (
                  <tr key={section} className="border-b border-slate-800/50">
                    <td className="py-2 px-3 text-violet-400 font-semibold whitespace-nowrap text-[11px]">
                      {section}
                    </td>
                    <td className="py-2 px-3 text-slate-400">{content}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Layer 2: Clinical Trials */}
        <div className="mb-6">
          <h3 className="text-base font-semibold text-white mb-3">
            Layer 2 — ClinicalTrials.gov Safety Data
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            Clinical trial registrations include the study design parameters
            and, for completed trials, results — including Serious Adverse Event
            (SAE) tables. AlgoVigilance queries ClinicalTrials.gov for trials
            involving the drug and extracts SAE incidence by system organ class.
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              {
                label: "SAE Tables",
                desc: "System-organ-class breakdown of serious adverse events from completed trials",
              },
              {
                label: "Study Design",
                desc: "Phase, population, comparator arm, and dose regimens affecting safety interpretation",
              },
              {
                label: "Arm Comparison",
                desc: "Drug vs. placebo vs. active comparator SAE rates for absolute and relative risk",
              },
            ].map((p) => (
              <div
                key={p.label}
                className="rounded-lg border border-slate-800 bg-slate-900/50 p-3"
              >
                <p className="text-xs font-bold text-white">{p.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Layer 3: PharmGKB */}
        <div className="mb-6">
          <h3 className="text-base font-semibold text-white mb-3">
            Layer 3 — PharmGKB Pharmacogenomics
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            PharmGKB (Stanford) curates gene-drug relationships from the
            published literature. Pharmacogenomic (PGx) annotations explain why
            some patients experience toxicity at standard doses — due to CYP
            enzyme polymorphisms, transporter variants, or target sensitivity
            differences.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                label: "CYP Metabolizer Status",
                color: "border-violet-500/30 bg-violet-950/20",
                desc: "Poor/intermediate/normal/ultrarapid metabolizer phenotypes from CYP2D6, CYP2C19, CYP3A4/5 — affects drug exposure by up to 10-fold",
              },
              {
                label: "FDA PGx Biomarker Labels",
                color: "border-slate-700 bg-slate-900/50",
                desc: "FDA-required pharmacogenomic biomarkers in labeling — genotype-based dosing recommendations and contraindications",
              },
            ].map((b) => (
              <div key={b.label} className={`rounded-lg border p-4 ${b.color}`}>
                <p className="text-sm font-bold text-white mb-1">{b.label}</p>
                <p className="text-sm text-slate-400">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Layer 4: OpenTargets */}
        <div>
          <h3 className="text-base font-semibold text-white mb-3">
            Layer 4 — Open Targets Safety
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Open Targets integrates target safety information from toxicology
            studies, genetic associations, and experimental data. For any drug
            target (protein), it surfaces safety liability evidence — which
            tissues express it, what effects genetic perturbation causes, and
            which safety parameters have been flagged in the literature. This
            layer is particularly valuable for evaluating mechanism-based
            toxicity risks early in development.
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
              label: "4 Profile Methods",
              desc: "DailyMed label extraction, ClinicalTrials SAE tables, pharmacogenomic annotations, drug class comparison across all four layers",
            },
            {
              icon: Database,
              label: "Post-Market Surveillance",
              desc: "FAERS real-world reporting rates complement label and trial data with actual clinical practice experience",
            },
            {
              icon: BookOpen,
              label: "5 Reference Sources",
              desc: "DailyMed, ClinicalTrials.gov, PharmGKB, Open Targets, DrugBank — integrated into a single drug-level view",
            },
          ].map((t) => (
            <div
              key={t.label}
              className="rounded-lg border border-slate-800 bg-slate-900/50 p-4"
            >
              <t.icon className="h-4 w-4 text-violet-400 mb-2" />
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
              "DailyMed",
              "ClinicalTrials.gov",
              "PharmGKB",
              "Open Targets",
              "DrugBank",
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
          Build a safety profile for any drug
        </h2>
        <p className="text-sm text-slate-400 mb-4">
          Connect your AI agent to{" "}
          <code className="text-cyan-400 text-xs bg-slate-800 px-1.5 py-0.5 rounded">
            mcp.nexvigilant.com
          </code>{" "}
          and assemble a four-layer safety profile in one guided workflow.
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
