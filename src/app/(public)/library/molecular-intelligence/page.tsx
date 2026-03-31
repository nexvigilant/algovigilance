import type { Metadata } from "next";
import Link from "next/link";
import { FlaskConical, ArrowLeft, Database, BookOpen } from "lucide-react";
import { createMetadata } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Molecular Intelligence — Your Open-Source Pharmacovigilant",
  description:
    "Predict toxicity from molecular structure, analyze metabolites, check structural alerts, and compute PK parameters using ChEMBL, UniProt, and Reactome.",
  path: "/library/molecular-intelligence",
  keywords: [
    "molecular intelligence",
    "SMILES",
    "structural alerts",
    "toxicity prediction",
    "pharmacokinetics",
    "ChEMBL",
    "metabolite prediction",
    "Brenk rules",
    "drug structure",
  ],
});

export default function MolecularIntelligencePage() {
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
          <FlaskConical className="h-5 w-5 text-pink-400" />
          <p className="text-[11px] font-bold text-pink-400 uppercase tracking-[0.2em]">
            Capability Domain
          </p>
        </div>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          Molecular Intelligence
        </h1>
        <p className="mt-3 max-w-2xl text-base text-slate-400 leading-relaxed">
          Predict toxicity from molecular structure, analyze metabolites, check
          structural alerts, and compute PK parameters — connecting the
          chemistry of a molecule to its safety liabilities.
        </p>
      </header>

      {/* How It Works */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-white mb-4">How It Works</h2>
        <p className="text-sm text-slate-400 leading-relaxed mb-6">
          Molecular intelligence answers:{" "}
          <em>
            what does this molecule&apos;s structure tell us about how it will
            behave in the body?
          </em>{" "}
          Starting from a SMILES string, AlgoVigilance runs the full molecular
          pipeline — structural alerts, toxicity predictions, metabolite
          enumeration, and pharmacokinetic modeling.
        </p>

        {/* SMILES Parsing */}
        <div className="mb-6">
          <h3 className="text-base font-semibold text-white mb-3">
            Step 1 — SMILES Parsing and Fingerprinting
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            SMILES (Simplified Molecular Input Line Entry System) is the text
            encoding of a molecular structure. AlgoVigilance parses SMILES into a
            molecular graph, computes Morgan (ECFP4) and topological
            fingerprints, and uses them as inputs to downstream predictions.
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              {
                label: "ECFP4 Fingerprint",
                desc: "Circular fingerprint capturing atom environments up to 4 bonds — basis for similarity search",
              },
              {
                label: "Topological FP",
                desc: "Path-based fingerprint for substructure-aware comparison against known toxicophores",
              },
              {
                label: "Molecular Descriptors",
                desc: "MW, LogP, HBD, HBA, TPSA, rotatable bonds — inputs to PK and toxicity models",
              },
            ].map((p) => (
              <div
                key={p.label}
                className="rounded-lg border border-slate-800 bg-slate-900/50 p-3"
              >
                <p className="text-xs font-bold text-white font-mono">
                  {p.label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Structural Alerts */}
        <div className="mb-6">
          <h3 className="text-base font-semibold text-white mb-3">
            Step 2 — Structural Alert Detection (Brenk Rules)
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            Structural alerts are functional groups or substructures associated
            with toxicity, reactivity, or poor drug-like properties. AlgoVigilance
            applies the Brenk rule set (105 fragments), PAINS (Pan Assay
            Interference Compounds), and Michael acceptor filters.
          </p>
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">
                    Rule Set
                  </th>
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">
                    Fragments
                  </th>
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">
                    Concern
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  [
                    "Brenk Rules",
                    "105",
                    "Mutagenicity, genotoxicity, metabolic instability, reactive metabolite formation",
                  ],
                  [
                    "PAINS Filters",
                    "480",
                    "Pan-assay interference — false positives in HTS, not necessarily toxic",
                  ],
                  [
                    "Michael Acceptors",
                    "26",
                    "Electrophilic fragments that covalently modify proteins — idiosyncratic toxicity risk",
                  ],
                  [
                    "Ames Alerts",
                    "44",
                    "Substructures associated with bacterial mutagenicity in Ames test",
                  ],
                  [
                    "hERG Alerts",
                    "18",
                    "Cardiac ion channel (hERG) binding — QT prolongation and arrhythmia risk",
                  ],
                ].map(([rule, frags, concern]) => (
                  <tr key={rule} className="border-b border-slate-800/50">
                    <td className="py-2 px-3 text-pink-400 font-semibold whitespace-nowrap">
                      {rule}
                    </td>
                    <td className="py-2 px-3 text-slate-300 text-center font-mono">
                      {frags}
                    </td>
                    <td className="py-2 px-3 text-slate-400">{concern}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Toxicity Prediction */}
        <div className="mb-6">
          <h3 className="text-base font-semibold text-white mb-3">
            Step 3 — Toxicity Prediction from Molecular Descriptors
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            Quantitative Structure-Activity Relationship (QSAR) models trained
            on ChEMBL bioassay data predict toxicity endpoints from molecular
            descriptors. AlgoVigilance reports predictions with confidence
            intervals derived from the training set applicability domain.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              {
                endpoint: "Hepatotoxicity (DILI)",
                desc: "Drug-induced liver injury probability from molecular features — cross-referenced with FDA DILI concern labels",
              },
              {
                endpoint: "Cardiotoxicity (hERG)",
                desc: "hERG IC50 prediction — QT prolongation potential score with TdP risk stratification",
              },
              {
                endpoint: "Mutagenicity (Ames)",
                desc: "Bacterial mutagenicity prediction — ICH S2(R1) relevance assessment",
              },
              {
                endpoint: "Renal Toxicity",
                desc: "Nephrotoxicity probability from renal tubular transporter interactions (OAT1, OAT3, OCT2)",
              },
            ].map((e) => (
              <div
                key={e.endpoint}
                className="rounded-lg border border-slate-800 bg-slate-900/50 p-3"
              >
                <p className="text-sm font-bold text-white">{e.endpoint}</p>
                <p className="text-xs text-slate-400 mt-1">{e.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* PK Modeling */}
        <div className="mb-6">
          <h3 className="text-base font-semibold text-white mb-3">
            Step 4 — Pharmacokinetic Modeling
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            Pharmacokinetic parameters determine drug exposure — and exposure
            determines the probability of both efficacy and toxicity.
            AlgoVigilance computes PK parameters from molecular descriptors and
            known experimental data for structurally similar compounds.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                label: "Primary PK Parameters",
                color: "border-pink-500/30 bg-pink-950/20",
                params: [
                  {
                    name: "Clearance (CL)",
                    unit: "mL/min/kg",
                    note: "Hepatic + renal clearance from in vitro data",
                  },
                  {
                    name: "Volume of Distribution (Vd)",
                    unit: "L/kg",
                    note: "Tissue partitioning from lipophilicity and protein binding",
                  },
                  {
                    name: "Half-life (t½)",
                    unit: "hours",
                    note: "Derived from CL and Vd — governs dosing interval",
                  },
                ],
              },
              {
                label: "Derived PK Parameters",
                color: "border-slate-700 bg-slate-900/50",
                params: [
                  {
                    name: "AUC",
                    unit: "mg·h/L",
                    note: "Area under the curve — total drug exposure",
                  },
                  {
                    name: "Steady-State Cmax",
                    unit: "mg/L",
                    note: "Peak concentration at steady state — toxicity threshold comparison",
                  },
                  {
                    name: "Michaelis-Menten Km",
                    unit: "μM",
                    note: "Saturation kinetics — nonlinear PK risk flag",
                  },
                ],
              },
            ].map((group) => (
              <div
                key={group.label}
                className={`rounded-lg border p-4 ${group.color}`}
              >
                <p className="text-xs font-semibold text-slate-300 mb-2">
                  {group.label}
                </p>
                <div className="space-y-2">
                  {group.params.map((p) => (
                    <div key={p.name}>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-bold text-pink-400 font-mono">
                          {p.name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {p.unit}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{p.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Metabolite Prediction */}
        <div>
          <h3 className="text-base font-semibold text-white mb-3">
            Step 5 — Metabolite Prediction and Pathway Analysis
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Reactive metabolites are the proximate cause of many idiosyncratic
            adverse drug reactions. AlgoVigilance enumerates Phase I (CYP-mediated
            oxidation, reduction) and Phase II (glucuronidation, sulfation)
            metabolites using Reactome pathway data, then applies structural
            alert filters to each predicted metabolite. This identifies
            bioactivation liability — where a safe parent molecule is converted
            to a reactive species in vivo.
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
              label: "5 Computation Steps",
              desc: "SMILES parsing, structural alert detection (Brenk/PAINS/hERG), toxicity prediction, PK modeling (AUC, CL, Michaelis-Menten), fingerprint similarity",
            },
            {
              icon: Database,
              label: "ChEMBL Bioassay Data",
              desc: "2.4M compounds with experimental activity data — the training and reference base for all QSAR and PK predictions",
            },
            {
              icon: BookOpen,
              label: "3 Pathway Sources",
              desc: "UniProt protein annotations, Reactome metabolic pathways, and PharmGKB CYP substrate tables for metabolite enumeration",
            },
          ].map((t) => (
            <div
              key={t.label}
              className="rounded-lg border border-slate-800 bg-slate-900/50 p-4"
            >
              <t.icon className="h-4 w-4 text-pink-400 mb-2" />
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
            {["ChEMBL", "UniProt", "Reactome pathways"].map((s) => (
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
          Analyze any molecule&apos;s safety liability
        </h2>
        <p className="text-sm text-slate-400 mb-4">
          Connect your AI agent to{" "}
          <code className="text-cyan-400 text-xs bg-slate-800 px-1.5 py-0.5 rounded">
            mcp.nexvigilant.com
          </code>{" "}
          and run the full 5-step molecular pipeline from SMILES to PK
          parameters.
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
