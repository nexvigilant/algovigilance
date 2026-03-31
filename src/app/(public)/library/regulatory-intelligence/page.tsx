import type { Metadata } from "next";
import Link from "next/link";
import {
  FileText,
  ArrowLeft,
  Database,
  BookOpen,
  FlaskConical,
} from "lucide-react";
import { createMetadata } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Regulatory Intelligence — Your Open-Source Pharmacovigilant",
  description:
    "Navigate ICH guidelines, FDA guidance documents, EMA EPARs, and global regulatory requirements. Plain-English summaries of E2A, E2B, E2E and more.",
  path: "/library/regulatory-intelligence",
  keywords: [
    "regulatory intelligence",
    "ICH guidelines",
    "FDA guidance",
    "EMA EPAR",
    "E2A",
    "E2B",
    "E2E",
    "CIOMS",
    "pharmacovigilance regulations",
  ],
});

export default function RegulatoryIntelligencePage() {
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
          <FileText className="h-5 w-5 text-cyan-400" />
          <p className="text-[11px] font-bold text-cyan-400 uppercase tracking-[0.2em]">
            Capability Domain
          </p>
        </div>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          Regulatory Intelligence
        </h1>
        <p className="mt-3 max-w-2xl text-base text-slate-400 leading-relaxed">
          Navigate ICH guidelines, FDA guidance documents, EMA EPARs, and global
          regulatory requirements. Find the exact section you need without
          wading through hundreds of pages of regulatory text.
        </p>
      </header>

      {/* How It Works */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-white mb-4">How It Works</h2>
        <p className="text-sm text-slate-400 leading-relaxed mb-6">
          Regulatory intelligence answers:{" "}
          <em>
            what does the guidance say, and how does it apply to this situation?
          </em>{" "}
          AlgoVigilance indexes the authoritative sources — ICH, FDA, EMA, CIOMS —
          and extracts the specific provisions relevant to your question.
        </p>

        {/* ICH Hierarchy */}
        <div className="mb-6">
          <h3 className="text-base font-semibold text-white mb-3">
            ICH Guideline Hierarchy
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            The International Council for Harmonisation (ICH) guidelines are
            organized into four topic areas. Each letter represents a domain;
            the number represents the specific guideline within that domain.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                code: "E — Efficacy",
                color: "text-cyan-400",
                border: "border-cyan-500/30 bg-cyan-950/20",
                examples:
                  "E2A (expedited reporting), E2B (ICSR format), E2E (pharmacovigilance planning), E6 (GCP)",
              },
              {
                code: "S — Safety",
                color: "text-red-400",
                border: "border-red-500/30 bg-red-950/20",
                examples:
                  "S1 (carcinogenicity), S2 (genotoxicity), S7 (pharmacology studies), S9 (oncology)",
              },
              {
                code: "Q — Quality",
                color: "text-emerald-400",
                border: "border-emerald-500/30 bg-emerald-950/20",
                examples:
                  "Q8 (pharmaceutical development), Q9 (quality risk management), Q10 (pharmaceutical QS)",
              },
              {
                code: "M — Multidisciplinary",
                color: "text-violet-400",
                border: "border-violet-500/30 bg-violet-950/20",
                examples:
                  "M1 (MedDRA), M4 (CTD structure), M7 (mutagenic impurities), M8 (eCTD)",
              },
            ].map((t) => (
              <div key={t.code} className={`rounded-lg border p-4 ${t.border}`}>
                <p className={`text-sm font-bold font-mono ${t.color}`}>
                  {t.code}
                </p>
                <p className="text-xs text-slate-400 mt-2">{t.examples}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Key PV Guidelines */}
        <div className="mb-6">
          <h3 className="text-base font-semibold text-white mb-3">
            Key Pharmacovigilance Guidelines
          </h3>
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 px-3 text-slate-500 font-medium w-20">
                    Guideline
                  </th>
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">
                    Topic
                  </th>
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">
                    Key Requirement
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  [
                    "E2A",
                    "Expedited Reporting",
                    "7-day for fatal/life-threatening, 15-day for serious unexpected ICSRs",
                  ],
                  [
                    "E2B(R3)",
                    "ICSR Data Elements",
                    "ICH ICSR format, 195 data elements, HL7 FHIR-aligned",
                  ],
                  [
                    "E2C(R2)",
                    "PBRER",
                    "Periodic Benefit-Risk Evaluation Report structure and content",
                  ],
                  [
                    "E2D",
                    "Post-Approval Reporting",
                    "Definitions, case processing, minimum dataset requirements",
                  ],
                  [
                    "E2E",
                    "PV Planning",
                    "Risk characterization, pharmacoepidemiological studies, RMP planning",
                  ],
                  [
                    "E2F",
                    "DSUR",
                    "Development Safety Update Report — annual aggregate for trials",
                  ],
                ].map(([code, topic, req]) => (
                  <tr key={code} className="border-b border-slate-800/50">
                    <td className="py-2 px-3 text-cyan-400 font-semibold font-mono">
                      {code}
                    </td>
                    <td className="py-2 px-3 text-white whitespace-nowrap">
                      {topic}
                    </td>
                    <td className="py-2 px-3 text-slate-400">{req}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FDA Guidance */}
        <div className="mb-6">
          <h3 className="text-base font-semibold text-white mb-3">
            FDA Guidance Documents
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            FDA guidance documents provide FDA&apos;s current thinking on
            regulatory topics. They are organized by product type, therapeutic
            area, and regulatory activity. AlgoVigilance enables full-text search
            across FDA guidance with semantic query support.
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              {
                cat: "Safety Reporting",
                desc: "IND safety, postmarket surveillance, MedWatch 3500A",
              },
              {
                cat: "REMS",
                desc: "Risk Evaluation and Mitigation Strategies design and assessment",
              },
              {
                cat: "Labeling",
                desc: "Prescribing information, boxed warning criteria (21 CFR 201.57)",
              },
              {
                cat: "Pharmacoepidemiology",
                desc: "RWD studies, BEST framework, Sentinel System use",
              },
              {
                cat: "Drug-Drug Interactions",
                desc: "In vitro/in vivo studies, labeling recommendations",
              },
              {
                cat: "Benefit-Risk",
                desc: "Structured approach for NDA/BLA review and approval decisions",
              },
            ].map((c) => (
              <div
                key={c.cat}
                className="rounded-lg border border-slate-800 bg-slate-900/50 p-3"
              >
                <p className="text-xs font-bold text-white">{c.cat}</p>
                <p className="text-xs text-slate-500 mt-0.5">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* EMA & CIOMS */}
        <div>
          <h3 className="text-base font-semibold text-white mb-3">
            EMA EPARs and CIOMS Forms
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            European Public Assessment Reports (EPARs) document EMA&apos;s
            scientific conclusions for approved medicines, including
            benefit-risk assessment summaries and PRAC recommendations. CIOMS
            (Council for International Organizations of Medical Sciences) forms
            provide the international standard for individual case safety
            reporting.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                label: "EMA EPAR",
                color: "border-cyan-500/30 bg-cyan-950/20",
                points: [
                  "Scientific discussion and benefit-risk rationale",
                  "PRAC signal assessments",
                  "Risk Management Plan summaries",
                  "Post-authorisation safety studies",
                ],
              },
              {
                label: "CIOMS Forms",
                color: "border-slate-700 bg-slate-900/50",
                points: [
                  "CIOMS I — Individual case safety report",
                  "CIOMS II — Periodic safety update (forerunner to PBRER)",
                  "CIOMS VI — Signal management",
                  "CIOMS VIII — signal detection methods",
                ],
              },
            ].map((b) => (
              <div key={b.label} className={`rounded-lg border p-4 ${b.color}`}>
                <p className="text-sm font-bold text-white mb-2">{b.label}</p>
                <ul className="space-y-1">
                  {b.points.map((pt) => (
                    <li key={pt} className="text-xs text-slate-400 flex gap-2">
                      <span className="text-cyan-400 shrink-0">—</span>
                      {pt}
                    </li>
                  ))}
                </ul>
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
              label: "ICH Guideline Search",
              desc: "Full-text search across E2A, E2B, E2C, E2D, E2E, E2F, PBRER structure, DSUR content requirements",
            },
            {
              icon: Database,
              label: "Regulatory Primitives",
              desc: "Structured extraction of deadlines, definitions, and requirements from FDA, EMA, and PMDA sources",
            },
            {
              icon: BookOpen,
              label: "4 Authoritative Sources",
              desc: "ICH.org guidelines, FDA.gov guidance library, EMA EPAR database, CIOMS reports — all indexed live",
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
        <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs font-semibold text-slate-300 mb-2">
            Data Sources
          </p>
          <div className="flex flex-wrap gap-2">
            {["ICH.org", "FDA.gov", "EMA.europa.eu", "CIOMS"].map((s) => (
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
          Search regulatory guidance instantly
        </h2>
        <p className="text-sm text-slate-400 mb-4">
          Connect your AI agent to{" "}
          <code className="text-cyan-400 text-xs bg-slate-800 px-1.5 py-0.5 rounded">
            mcp.nexvigilant.com
          </code>{" "}
          and query ICH, FDA, and EMA sources in a single natural-language call.
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
