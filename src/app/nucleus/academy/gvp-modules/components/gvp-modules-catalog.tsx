"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { BookOpen, ExternalLink, Shield, ArrowRight, Zap } from "lucide-react";

interface GvpModule {
  code: string;
  title: string;
  status: "Final" | "Void";
  note: string;
  pathway: string;
  ksbDomains: string[];
  guardianSeed: { drug: string; event: string; count: number };
}

/** Maps GVP modules to their corresponding hands-on PV tool */
const MODULE_TOOL_MAP: Record<string, { href: string; label: string }> = {
  I: { href: "/nucleus/vigilance/sop", label: "Quality Systems Tool" },
  V: { href: "/benefit-risk", label: "Benefit-Risk Calculator" },
  VI: { href: "/icsr-processing", label: "ICSR Processing Tool" },
  VII: { href: "/pbrer-assessment", label: "PBRER Assessment Tool" },
  VIII: { href: "/surveillance", label: "Surveillance Dashboard" },
  IX: { href: "/prr-signal-detection", label: "Signal Detection Tool" },
  X: { href: "/signal-trending", label: "Signal Trending Dashboard" },
  XV: { href: "/reporting-deadlines", label: "Reporting Deadlines Tool" },
  XVI: { href: "/benefit-risk", label: "Risk Minimisation Calculator" },
};

const EMA_GVP_URL =
  "https://www.ema.europa.eu/en/human-regulatory-overview/post-authorisation/pharmacovigilance-post-authorisation/good-pharmacovigilance-practices-gvp";

const GVP_MODULES: GvpModule[] = [
  {
    code: "I",
    title: "Pharmacovigilance systems and their quality systems",
    status: "Final",
    note: "Core PV quality framework.",
    pathway: "PV Governance Foundations",
    ksbDomains: ["D01", "D02", "D05"],
    guardianSeed: { drug: "adalimumab", event: "serious-infection", count: 18 },
  },
  {
    code: "II",
    title: "Pharmacovigilance system master file",
    status: "Final",
    note: "PSMF structure and governance.",
    pathway: "PV Governance Foundations",
    ksbDomains: ["D02", "D04", "D06"],
    guardianSeed: { drug: "atorvastatin", event: "liver-injury", count: 11 },
  },
  {
    code: "III",
    title: "Pharmacovigilance inspections",
    status: "Final",
    note: "Inspection readiness and conduct.",
    pathway: "Inspection Readiness",
    ksbDomains: ["D04", "D06", "D11"],
    guardianSeed: { drug: "clopidogrel", event: "hemorrhage", count: 9 },
  },
  {
    code: "IV",
    title: "Pharmacovigilance audits",
    status: "Final",
    note: "Audit strategy and lifecycle.",
    pathway: "Inspection Readiness",
    ksbDomains: ["D04", "D05", "D11"],
    guardianSeed: {
      drug: "methotrexate",
      event: "myelosuppression",
      count: 13,
    },
  },
  {
    code: "V",
    title: "Risk management systems",
    status: "Final",
    note: "RMP planning and updates.",
    pathway: "Risk & Benefit Management",
    ksbDomains: ["D07", "D10", "D12"],
    guardianSeed: { drug: "isotretinoin", event: "teratogenicity", count: 7 },
  },
  {
    code: "VI",
    title:
      "Collection, management and submission of reports of suspected adverse reactions",
    status: "Final",
    note: "ICSR handling and EudraVigilance submission.",
    pathway: "Case Processing Excellence",
    ksbDomains: ["D03", "D06", "D08"],
    guardianSeed: { drug: "warfarin", event: "bleeding", count: 42 },
  },
  {
    code: "VII",
    title: "Periodic safety update report",
    status: "Final",
    note: "PSUR/PBRER requirements.",
    pathway: "Regulatory Reporting",
    ksbDomains: ["D04", "D09", "D10"],
    guardianSeed: { drug: "amoxicillin", event: "anaphylaxis", count: 6 },
  },
  {
    code: "VIII",
    title: "Post-authorisation safety studies",
    status: "Final",
    note: "PASS design, conduct and reporting.",
    pathway: "Evidence & Studies",
    ksbDomains: ["D09", "D12", "D13"],
    guardianSeed: { drug: "semaglutide", event: "pancreatitis", count: 8 },
  },
  {
    code: "IX",
    title: "Signal management",
    status: "Final",
    note: "Signal detection, validation and assessment.",
    pathway: "Signal Intelligence",
    ksbDomains: ["D08", "D10", "D12"],
    guardianSeed: { drug: "clozapine", event: "agranulocytosis", count: 5 },
  },
  {
    code: "X",
    title: "Additional monitoring",
    status: "Final",
    note: "Black triangle and enhanced surveillance.",
    pathway: "Signal Intelligence",
    ksbDomains: ["D08", "D09", "D14"],
    guardianSeed: {
      drug: "carbamazepine",
      event: "stevens-johnson-syndrome",
      count: 4,
    },
  },
  {
    code: "XI",
    title: "Void",
    status: "Void",
    note: "Planned topic handled in other EMA guidance.",
    pathway: "Reserved / External Guidance",
    ksbDomains: ["D14"],
    guardianSeed: { drug: "metformin", event: "lactic-acidosis", count: 3 },
  },
  {
    code: "XII",
    title: "Void",
    status: "Void",
    note: "Planned topic handled in other EMA guidance.",
    pathway: "Reserved / External Guidance",
    ksbDomains: ["D14"],
    guardianSeed: { drug: "metformin", event: "lactic-acidosis", count: 3 },
  },
  {
    code: "XIII",
    title: "Void",
    status: "Void",
    note: "Planned topic handled in other EMA guidance.",
    pathway: "Reserved / External Guidance",
    ksbDomains: ["D14"],
    guardianSeed: { drug: "metformin", event: "lactic-acidosis", count: 3 },
  },
  {
    code: "XIV",
    title: "Void",
    status: "Void",
    note: "Planned topic handled in other EMA guidance.",
    pathway: "Reserved / External Guidance",
    ksbDomains: ["D14"],
    guardianSeed: { drug: "metformin", event: "lactic-acidosis", count: 3 },
  },
  {
    code: "XV",
    title: "Safety communication",
    status: "Final",
    note: "Safety communication planning and execution.",
    pathway: "Stakeholder Communication",
    ksbDomains: ["D10", "D11", "D15"],
    guardianSeed: { drug: "valproate", event: "pregnancy-exposure", count: 10 },
  },
  {
    code: "XVI",
    title: "Risk minimisation measures",
    status: "Final",
    note: "RMM selection and effectiveness evaluation.",
    pathway: "Risk & Benefit Management",
    ksbDomains: ["D07", "D10", "D15"],
    guardianSeed: {
      drug: "codeine",
      event: "respiratory-depression",
      count: 12,
    },
  },
];

const PATHWAY_COLORS: Record<string, string> = {
  "PV Governance Foundations": "text-blue-400",
  "Inspection Readiness": "text-amber-400",
  "Risk & Benefit Management": "text-purple-400",
  "Case Processing Excellence": "text-red-400",
  "Regulatory Reporting": "text-cyan-400",
  "Evidence & Studies": "text-emerald-400",
  "Signal Intelligence": "text-rose-400",
  "Reserved / External Guidance": "text-slate-500",
  "Stakeholder Communication": "text-teal-400",
};

export function GvpModulesCatalog() {
  const [pathwayFilter, setPathwayFilter] = useState("All");

  const filtered = useMemo(() => {
    if (pathwayFilter === "All") return GVP_MODULES;
    return GVP_MODULES.filter((m) => m.pathway === pathwayFilter);
  }, [pathwayFilter]);

  const finalCount = GVP_MODULES.filter((m) => m.status === "Final").length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-[0.2em] font-mono">
            EMA Curriculum
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/40 to-transparent" />
        </div>
        <h1 className="text-3xl font-black text-white font-mono uppercase tracking-tight">
          GVP Modules I-XVI
        </h1>
        <p className="mt-2 text-slate-400 max-w-3xl text-sm">
          Integrated reference track for all EMA Good Pharmacovigilance Practice
          modules. Modules XI-XIV remain void per EMA and map to external
          guidance.
        </p>

        {/* Action links */}
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={EMA_GVP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-cyan-600 px-4 py-2 text-[10px] font-bold text-white hover:bg-cyan-500 transition-colors uppercase tracking-widest font-mono inline-flex items-center gap-1.5"
          >
            Open EMA Source <ExternalLink className="w-3 h-3" />
          </a>
          <Link
            href="/nucleus/academy/gvp-curriculum"
            className="border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-[10px] font-bold text-cyan-300 hover:text-cyan-200 transition-colors uppercase tracking-widest font-mono"
          >
            Curriculum
          </Link>
          <Link
            href="/nucleus/academy/gvp-progress"
            className="border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-[10px] font-bold text-emerald-300 hover:text-emerald-200 transition-colors uppercase tracking-widest font-mono"
          >
            Track Progress
          </Link>
          <Link
            href="/nucleus/academy/gvp-assessments"
            className="border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-[10px] font-bold text-amber-300 hover:text-amber-200 transition-colors uppercase tracking-widest font-mono"
          >
            Assessments
          </Link>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="border border-slate-800 bg-slate-900/50 p-3 text-center">
          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest font-mono">
            Total Modules
          </p>
          <p className="text-lg font-black text-white font-mono">16</p>
        </div>
        <div className="border border-slate-800 bg-slate-900/50 p-3 text-center">
          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest font-mono">
            Final
          </p>
          <p className="text-lg font-black text-emerald-400 font-mono">
            {finalCount}
          </p>
        </div>
        <div className="border border-slate-800 bg-slate-900/50 p-3 text-center">
          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest font-mono">
            Void
          </p>
          <p className="text-lg font-black text-amber-400 font-mono">
            {16 - finalCount}
          </p>
        </div>
      </div>

      {/* Pathway filter */}
      <div className="mb-6">
        <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 font-mono">
          Pathway
        </p>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              "All",
              ...Array.from(new Set(GVP_MODULES.map((m) => m.pathway))),
            ] as string[]
          ).map((p) => (
            <button
              key={p}
              onClick={() => setPathwayFilter(p)}
              className={`px-3 py-1.5 text-[10px] font-bold font-mono uppercase tracking-widest transition-all ${
                pathwayFilter === p
                  ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-400"
                  : "border border-slate-700 text-slate-500 hover:border-slate-500"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Module grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((m) => (
          <article
            key={m.code}
            className="border border-slate-800 bg-slate-900/40 p-5 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                  Module {m.code}
                </p>
                <h2 className="mt-1 text-base font-semibold text-white leading-snug">
                  {m.title}
                </h2>
              </div>
              <span
                className={`px-2.5 py-1 border text-[10px] font-bold uppercase tracking-widest font-mono flex-shrink-0 ${
                  m.status === "Final"
                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                    : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                }`}
              >
                {m.status}
              </span>
            </div>

            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              {m.note}
            </p>

            {/* Pathway + KSB domains */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`text-[9px] font-bold font-mono uppercase tracking-widest ${PATHWAY_COLORS[m.pathway] ?? "text-slate-400"}`}
              >
                {m.pathway}
              </span>
              <span className="text-slate-700">|</span>
              {m.ksbDomains.map((d) => (
                <span
                  key={d}
                  className="px-1.5 py-0.5 bg-slate-800 text-[8px] font-bold text-slate-400 font-mono"
                >
                  {d}
                </span>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-4 flex items-center gap-4">
              {m.status === "Final" && (
                <>
                  <Link
                    href={`/nucleus/academy/gvp-modules/${m.code}`}
                    className="inline-flex items-center gap-1.5 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-widest font-mono"
                  >
                    Open Module <ArrowRight className="w-3 h-3" />
                  </Link>
                  <Link
                    href={`/nucleus/vigilance/signals?drug=${m.guardianSeed.drug}&event=${m.guardianSeed.event}`}
                    className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-widest font-mono"
                  >
                    <Shield className="w-3 h-3" /> Apply in Guardian
                  </Link>
                  {MODULE_TOOL_MAP[m.code] && (
                    <Link
                      href={MODULE_TOOL_MAP[m.code].href}
                      className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-400 hover:text-amber-300 transition-colors uppercase tracking-widest font-mono"
                    >
                      <Zap className="w-3 h-3" /> Practice This Skill
                    </Link>
                  )}
                </>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
