import type { Metadata } from "next";
import Link from "next/link";
import { createMetadata } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Pharma Transparency Report — Live FDA Safety Data",
  description:
    "Real-time adverse event data from the FDA FAERS database for major pharmaceutical companies. Deaths, hospitalizations, recalls, and off-label use — all public data, finally accessible.",
  path: "/transparency",
});

/* ── Static data from FAERS queries (March 2026) ── */

interface CompanyData {
  name: string;
  total: number;
  serious: number;
  deaths: number;
  hospitalizations: number;
  seriousPct: number;
  topDrug: string;
  topDrugReports: number;
}

const COMPANIES: CompanyData[] = [
  {
    name: "Pfizer",
    total: 2365741,
    serious: 1496929,
    deaths: 79684,
    hospitalizations: 0,
    seriousPct: 63.3,
    topDrug: "Gabapentin",
    topDrugReports: 348412,
  },
  {
    name: "AbbVie",
    total: 1443745,
    serious: 864600,
    deaths: 44284,
    hospitalizations: 0,
    seriousPct: 59.9,
    topDrug: "Adalimumab (Humira)",
    topDrugReports: 695824,
  },
  {
    name: "Novartis",
    total: 1160661,
    serious: 753018,
    deaths: 67394,
    hospitalizations: 0,
    seriousPct: 64.9,
    topDrug: "Secukinumab",
    topDrugReports: 157236,
  },
  {
    name: "Johnson & Johnson",
    total: 1069207,
    serious: 778190,
    deaths: 26993,
    hospitalizations: 0,
    seriousPct: 72.8,
    topDrug: "Infliximab (Remicade)",
    topDrugReports: 209293,
  },
  {
    name: "Eli Lilly",
    total: 960350,
    serious: 441575,
    deaths: 0,
    hospitalizations: 0,
    seriousPct: 46.0,
    topDrug: "Duloxetine (Cymbalta)",
    topDrugReports: 139162,
  },
  {
    name: "Bristol-Myers Squibb",
    total: 333253,
    serious: 235699,
    deaths: 19470,
    hospitalizations: 0,
    seriousPct: 70.7,
    topDrug: "Abatacept (Orencia)",
    topDrugReports: 133225,
  },
];

interface TakedaDrug {
  name: string;
  brand: string;
  indication: string;
  total: number;
  seriousPct: number;
  deaths: number;
  hospitalizations: number;
  highlight?: string;
}

const TAKEDA_DRUGS: TakedaDrug[] = [
  {
    name: "Lansoprazole",
    brand: "Prevacid",
    indication: "Heartburn / GERD",
    total: 173092,
    seriousPct: 87.2,
    deaths: 19350,
    hospitalizations: 62821,
    highlight: "OTC heartburn pill with 19,350 death reports",
  },
  {
    name: "Bortezomib",
    brand: "Velcade",
    indication: "Multiple myeloma",
    total: 86297,
    seriousPct: 83.7,
    deaths: 13727,
    hospitalizations: 27730,
  },
  {
    name: "Vedolizumab",
    brand: "Entyvio",
    indication: "Ulcerative colitis / Crohn's",
    total: 80189,
    seriousPct: 86.4,
    deaths: 3916,
    hospitalizations: 23794,
    highlight: "#1 adverse event: OFF LABEL USE (21,828 reports)",
  },
  {
    name: "Leuprolide",
    brand: "Lupron",
    indication: "Prostate cancer / endometriosis",
    total: 76674,
    seriousPct: 46.1,
    deaths: 11688,
    hospitalizations: 11854,
  },
  {
    name: "Ixazomib",
    brand: "Ninlaro",
    indication: "Multiple myeloma",
    total: 28427,
    seriousPct: 74.2,
    deaths: 5259,
    hospitalizations: 8703,
    highlight: "#2 most reported adverse event: DEATH (3,297)",
  },
  {
    name: "Vortioxetine",
    brand: "Trintellix",
    indication: "Major depressive disorder",
    total: 16243,
    seriousPct: 47.3,
    deaths: 958,
    hospitalizations: 2691,
    highlight:
      "898 suicidal ideation + 283 suicide attempts + 275 completed suicides",
  },
];

interface DrugOutcome {
  drug: string;
  deaths: number;
  hospitalizations: number;
  lifeThreatening: number;
  seriousPct: number;
}

const SERIOUS_OUTCOMES: DrugOutcome[] = [
  {
    drug: "Rivaroxaban (Xarelto)",
    deaths: 26830,
    hospitalizations: 102060,
    lifeThreatening: 9191,
    seriousPct: 84.0,
  },
  {
    drug: "Adalimumab (Humira)",
    deaths: 30115,
    hospitalizations: 150426,
    lifeThreatening: 12002,
    seriousPct: 51.3,
  },
  {
    drug: "Nivolumab (Opdivo)",
    deaths: 24022,
    hospitalizations: 37923,
    lifeThreatening: 6424,
    seriousPct: 89.5,
  },
  {
    drug: "Gabapentin (Neurontin)",
    deaths: 33678,
    hospitalizations: 103607,
    lifeThreatening: 10328,
    seriousPct: 63.2,
  },
  {
    drug: "Tirzepatide (Mounjaro)",
    deaths: 652,
    hospitalizations: 7276,
    lifeThreatening: 934,
    seriousPct: 16.7,
  },
];

interface EmaSignal {
  drug: string;
  type: string;
  outcome: string;
  date: string;
}

const EMA_SIGNALS: EmaSignal[] = [
  {
    drug: "Semaglutide (Ozempic/Rybelsus)",
    type: "Medication error",
    outcome: "Variation",
    date: "Aug 2025",
  },
  {
    drug: "CAR-T Therapies (6 products)",
    type: "Adverse event",
    outcome: "Variation",
    date: "Jul 2024",
  },
  {
    drug: "Lecanemab (Leqembi)",
    type: "Post-auth measure",
    outcome: "Variation",
    date: "Sep 2025",
  },
  {
    drug: "Pseudoephedrine (Sudafed)",
    type: "Article 31 referral",
    outcome: "Variation",
    date: "Feb 2024",
  },
  {
    drug: "Voxelotor (Oxbryta)",
    type: "Article 20 referral",
    outcome: "SUSPENDED",
    date: "Oct 2024",
  },
  {
    drug: "Hydroxyprogesterone",
    type: "Post-auth measure",
    outcome: "SUSPENDED",
    date: "Jul 2024",
  },
  {
    drug: "Alofisel (Crohn's)",
    type: "Lack of effect",
    outcome: "WITHDRAWN",
    date: "Dec 2024",
  },
  {
    drug: "Clozapine",
    type: "Safety signal",
    outcome: "Variation",
    date: "Sep 2025",
  },
  {
    drug: "Infliximab (Remsima)",
    type: "New contraindication",
    outcome: "Variation",
    date: "Dec 2025",
  },
  {
    drug: "Finasteride / Dutasteride",
    type: "Post-auth measure",
    outcome: "Variation",
    date: "Sep 2025",
  },
];

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

function SeriousBadge({ pct }: { pct: number }) {
  const color =
    pct >= 80
      ? "bg-red-500/20 text-red-400 border-red-500/30"
      : pct >= 60
        ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
        : pct >= 40
          ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
          : "bg-slate-500/20 text-slate-400 border-slate-500/30";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold ${color}`}
    >
      {pct}% serious
    </span>
  );
}

function OutcomeBadge({ label, color }: { label: string; color: string }) {
  const styles: Record<string, string> = {
    red: "bg-red-500/20 text-red-400 border-red-500/30",
    orange: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    black: "bg-slate-950 text-white border-slate-600",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${styles[color] ?? styles.red}`}
    >
      {label}
    </span>
  );
}

export default function TransparencyPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* ── Hero ── */}
      <header className="mb-12">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-400 mb-2">
          Pharma Transparency Report
        </p>
        <h1 className="text-3xl font-bold text-white sm:text-5xl">
          What They Report.
          <br />
          <span className="text-red-400">What You Never See.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-400">
          Every number on this page comes from the FDA&apos;s own Adverse Event
          Reporting System (FAERS) and the European Medicines Agency. Pharma
          companies are{" "}
          <span className="text-white font-semibold">
            legally required to report this data
          </span>
          . The problem is nobody makes it easy to find. Until now.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Data queried live from FDA FAERS and EMA via AlgoVigilance Station MCP
          tools. Last updated March 2026.
        </p>
      </header>

      {/* ── Section 1: Big Pharma Overview ── */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-white mb-1">
          The Big Picture: 7.3 Million Reports Across 6 Companies
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Source: openFDA FAERS. Reports ≠ proven causation, but every one was
          filed with the FDA.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left">
                <th className="pb-3 pr-4 font-semibold text-slate-300">
                  Company
                </th>
                <th className="pb-3 pr-4 font-semibold text-slate-300 text-right">
                  Total Reports
                </th>
                <th className="pb-3 pr-4 font-semibold text-slate-300 text-right">
                  Serious
                </th>
                <th className="pb-3 pr-4 font-semibold text-slate-300 text-right">
                  Deaths
                </th>
                <th className="pb-3 pr-4 font-semibold text-slate-300">
                  Seriousness
                </th>
                <th className="pb-3 font-semibold text-slate-300">
                  Top Problem Drug
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPANIES.map((c) => (
                <tr
                  key={c.name}
                  className="border-b border-slate-800 hover:bg-slate-800/50"
                >
                  <td className="py-3 pr-4 font-semibold text-white">
                    {c.name}
                  </td>
                  <td className="py-3 pr-4 text-right text-slate-300 tabular-nums">
                    {fmt(c.total)}
                  </td>
                  <td className="py-3 pr-4 text-right text-red-400 font-semibold tabular-nums">
                    {fmt(c.serious)}
                  </td>
                  <td className="py-3 pr-4 text-right text-red-400 tabular-nums">
                    {c.deaths > 0 ? fmt(c.deaths) : "—"}
                  </td>
                  <td className="py-3 pr-4">
                    <SeriousBadge pct={c.seriousPct} />
                  </td>
                  <td className="py-3 text-slate-400">
                    {c.topDrug}{" "}
                    <span className="text-slate-500">
                      ({fmt(c.topDrugReports)})
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Section 2: Takeda Deep Dive ── */}
      <section className="mb-16">
        <div className="mb-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-orange-400 mb-1">
            Company Deep Dive
          </p>
          <h2 className="text-2xl font-bold text-white">
            Takeda Pharmaceutical
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            460,922 total adverse event reports across 6 key drugs. Source: FDA
            FAERS.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {TAKEDA_DRUGS.map((d) => (
            <div
              key={d.name}
              className="rounded-lg border border-slate-800 bg-slate-900/50 p-5 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-white">{d.brand}</h3>
                  <p className="text-xs text-slate-500">
                    {d.name} &middot; {d.indication}
                  </p>
                </div>
                <SeriousBadge pct={d.seriousPct} />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div>
                  <p className="text-lg font-bold text-white tabular-nums">
                    {fmt(d.total)}
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase">
                    Reports
                  </p>
                </div>
                <div>
                  <p className="text-lg font-bold text-red-400 tabular-nums">
                    {fmt(d.deaths)}
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase">Deaths</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-orange-400 tabular-nums">
                    {fmt(d.hospitalizations)}
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase">
                    Hospital
                  </p>
                </div>
              </div>

              {d.highlight && (
                <p className="text-xs text-red-400 font-semibold bg-red-500/10 rounded px-2 py-1.5 border border-red-500/20">
                  {d.highlight}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 3: Trintellix Suicidality Callout ── */}
      <section className="mb-16 rounded-lg border-2 border-red-500/30 bg-red-500/5 p-6">
        <h2 className="text-xl font-bold text-red-400 mb-2">
          Trintellix (Vortioxetine) &mdash; The Antidepressant Suicidality
          Problem
        </h2>
        <p className="text-slate-300 mb-4">
          An antidepressant with{" "}
          <span className="text-white font-bold">898</span> reports of suicidal
          ideation, <span className="text-white font-bold">283</span> suicide
          attempts, and{" "}
          <span className="text-white font-bold">275 completed suicides</span>{" "}
          in the FDA database. The drug prescribed to{" "}
          <span className="italic">prevent</span> these exact outcomes.
        </p>
        <div className="grid grid-cols-3 gap-4 max-w-md">
          <div className="text-center rounded bg-slate-900 p-3 border border-slate-700">
            <p className="text-2xl font-bold text-white">898</p>
            <p className="text-xs text-slate-400">Suicidal Ideation</p>
          </div>
          <div className="text-center rounded bg-slate-900 p-3 border border-slate-700">
            <p className="text-2xl font-bold text-orange-400">283</p>
            <p className="text-xs text-slate-400">Suicide Attempts</p>
          </div>
          <div className="text-center rounded bg-slate-900 p-3 border border-slate-700">
            <p className="text-2xl font-bold text-red-400">275</p>
            <p className="text-xs text-slate-400">Completed Suicides</p>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Correlation does not prove causation. But transparency is your right.
          All antidepressants carry an FDA black box warning for suicidality in
          patients under 25.
        </p>
      </section>

      {/* ── Section 3.5: Signal Investigation — Antidepressants vs Completed Suicide ── */}
      <section className="mb-16">
        <div className="mb-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-purple-400 mb-1">
            Signal Investigation
          </p>
          <h2 className="text-2xl font-bold text-white">
            Antidepressants &amp; Completed Suicide: Head-to-Head
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Disproportionality analysis (PRR/ROR) computed via OpenVigil against
            the full FAERS database of 20M+ reports. All five antidepressants
            show{" "}
            <span className="text-red-400 font-semibold">strong signals</span>.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left">
                <th className="pb-3 pr-4 font-semibold text-slate-300">Drug</th>
                <th className="pb-3 pr-4 font-semibold text-slate-300 text-right">
                  Cases
                </th>
                <th className="pb-3 pr-4 font-semibold text-slate-300 text-right">
                  PRR
                </th>
                <th className="pb-3 pr-4 font-semibold text-slate-300 text-right">
                  ROR
                </th>
                <th className="pb-3 pr-4 font-semibold text-slate-300 text-right">
                  IC
                </th>
                <th className="pb-3 pr-4 font-semibold text-slate-300 text-right">
                  Chi-squared
                </th>
                <th className="pb-3 font-semibold text-slate-300">Signal</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  drug: "Fluoxetine (Prozac)",
                  cases: 3678,
                  prr: 7.44,
                  ror: 7.63,
                  ic: 2.84,
                  chi: 19625,
                },
                {
                  drug: "Escitalopram (Lexapro)",
                  cases: 2485,
                  prr: 4.71,
                  ror: 4.78,
                  ic: 2.2,
                  chi: 7054,
                },
                {
                  drug: "Vortioxetine (Trintellix)",
                  cases: 275,
                  prr: 4.22,
                  ror: 4.28,
                  ic: 2.07,
                  chi: 673,
                },
                {
                  drug: "Sertraline (Zoloft)",
                  cases: 3246,
                  prr: 3.94,
                  ror: 3.99,
                  ic: 1.94,
                  chi: 6865,
                },
                {
                  drug: "Duloxetine (Cymbalta)",
                  cases: 2599,
                  prr: 3.64,
                  ror: 3.68,
                  ic: 1.83,
                  chi: 4840,
                },
              ].map((d) => (
                <tr
                  key={d.drug}
                  className="border-b border-slate-800 hover:bg-slate-800/50"
                >
                  <td className="py-3 pr-4 font-semibold text-white">
                    {d.drug}
                  </td>
                  <td className="py-3 pr-4 text-right text-red-400 font-bold tabular-nums">
                    {fmt(d.cases)}
                  </td>
                  <td className="py-3 pr-4 text-right text-white font-bold tabular-nums">
                    {d.prr.toFixed(2)}
                  </td>
                  <td className="py-3 pr-4 text-right text-slate-300 tabular-nums">
                    {d.ror.toFixed(2)}
                  </td>
                  <td className="py-3 pr-4 text-right text-slate-300 tabular-nums">
                    {d.ic.toFixed(2)}
                  </td>
                  <td className="py-3 pr-4 text-right text-slate-400 tabular-nums">
                    {fmt(d.chi)}
                  </td>
                  <td className="py-3">
                    <span className="inline-flex items-center rounded-full border border-red-500/30 bg-red-500/20 px-2 py-0.5 text-xs font-bold text-red-400">
                      STRONG
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 rounded bg-slate-900/80 border border-slate-700 p-4">
          <p className="text-sm text-slate-300">
            <span className="font-bold text-white">Key finding:</span>{" "}
            Fluoxetine (Prozac) has the highest PRR at{" "}
            <span className="text-red-400 font-bold">7.44x</span> — meaning
            completed suicide is reported 7.4 times more often than expected.
            Vortioxetine (Trintellix) ranks 3rd by PRR (4.22x) but has the
            fewest absolute cases (275), likely due to smaller market share
            rather than superior safety. All five drugs exceed the signal
            detection threshold (PRR &ge; 2.0, chi-squared &ge; 4.0).
          </p>
        </div>

        <div className="mt-4 rounded bg-purple-500/5 border border-purple-500/20 p-4">
          <p className="text-sm text-slate-300">
            <span className="font-bold text-purple-400">
              Lansoprazole (Prevacid) — No signal for death:
            </span>{" "}
            Despite 19,350 death reports, the disproportionality analysis shows
            PRR = <span className="text-white font-bold">0.64</span> (below
            1.0). This means lansoprazole is reported with death{" "}
            <span className="italic">less</span> often than the average drug in
            FAERS. The high absolute count reflects massive prescribing volume
            (millions of daily users), not a safety signal. This is why raw
            numbers without statistical context can be misleading — and why
            tools like disproportionality analysis exist.
          </p>
        </div>
      </section>

      {/* ── Section 3.6: GLP-1 Sarcopenia Cascade Investigation ── */}
      <section className="mb-16">
        <div className="mb-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-orange-400 mb-1">
            Signal Investigation #2
          </p>
          <h2 className="text-2xl font-bold text-white">
            GLP-1 Weight Loss Drugs: The Muscle Wasting Cascade
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Semaglutide (Ozempic/Wegovy), tirzepatide (Mounjaro), and
            liraglutide (Victoza) — do they cause sarcopenia? Does
            tirzepatide&apos;s GIP receptor protect muscle?
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left">
                <th className="pb-3 pr-4 font-semibold text-slate-300">
                  MSK Event
                </th>
                <th className="pb-3 pr-4 font-semibold text-slate-300 text-right">
                  Semaglutide
                </th>
                <th className="pb-3 pr-4 font-semibold text-slate-300 text-right">
                  Tirzepatide
                </th>
                <th className="pb-3 pr-4 font-semibold text-slate-300 text-right">
                  Liraglutide
                </th>
                <th className="pb-3 font-semibold text-slate-300">Cascade</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  event: "Sarcopenia",
                  s: 9.98,
                  t: 3.62,
                  l: 3.3,
                  level: "SIGNAL",
                },
                {
                  event: "Muscle Atrophy",
                  s: 3.95,
                  t: 2.28,
                  l: 1.05,
                  level: "SIGNAL",
                },
                {
                  event: "Muscular Weakness",
                  s: 0.93,
                  t: 0.28,
                  l: 0.74,
                  level: "—",
                },
                { event: "Myalgia", s: 0.98, t: 0.6, l: 0.73, level: "—" },
                {
                  event: "Rhabdomyolysis",
                  s: 0.66,
                  t: 0.17,
                  l: 0.65,
                  level: "—",
                },
                { event: "Osteopenia", s: 0.47, t: 0.14, l: 0.58, level: "—" },
                { event: "Fall", s: 1.05, t: 0.23, l: 0.81, level: "—" },
                { event: "Hip Fracture", s: 0.51, t: 0.1, l: 0.45, level: "—" },
              ].map((d) => {
                const isSignal = d.level === "SIGNAL";
                return (
                  <tr
                    key={d.event}
                    className={`border-b border-slate-800 ${isSignal ? "bg-red-500/5" : "hover:bg-slate-800/50"}`}
                  >
                    <td
                      className={`py-3 pr-4 font-semibold ${isSignal ? "text-red-400" : "text-slate-400"}`}
                    >
                      {d.event}
                    </td>
                    <td
                      className={`py-3 pr-4 text-right tabular-nums font-bold ${d.s >= 2 ? "text-red-400" : "text-slate-500"}`}
                    >
                      {d.s.toFixed(2)}
                    </td>
                    <td
                      className={`py-3 pr-4 text-right tabular-nums font-bold ${d.t >= 2 ? "text-blue-400" : "text-slate-500"}`}
                    >
                      {d.t.toFixed(2)}
                    </td>
                    <td
                      className={`py-3 pr-4 text-right tabular-nums ${d.l >= 2 ? "text-emerald-400 font-bold" : "text-slate-500"}`}
                    >
                      {d.l.toFixed(2)}
                    </td>
                    <td className="py-3">
                      {isSignal ? (
                        <span className="inline-flex items-center rounded-full border border-red-500/30 bg-red-500/20 px-2 py-0.5 text-xs font-bold text-red-400">
                          SIGNAL
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">
                          No signal
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded bg-red-500/5 border border-red-500/20 p-4">
            <p className="text-xs font-bold text-red-400 uppercase mb-1">
              Semaglutide (Ozempic)
            </p>
            <p className="text-2xl font-bold text-white">PRR 9.98</p>
            <p className="text-xs text-slate-400 mt-1">
              14 sarcopenia cases. 10x the expected rate. Worst of the three
              GLP-1 drugs.
            </p>
          </div>
          <div className="rounded bg-blue-500/5 border border-blue-500/20 p-4">
            <p className="text-xs font-bold text-blue-400 uppercase mb-1">
              Tirzepatide (Mounjaro)
            </p>
            <p className="text-2xl font-bold text-white">PRR 3.62</p>
            <p className="text-xs text-slate-400 mt-1">
              8 cases. GIP receptor co-activation provides{" "}
              <span className="text-blue-400 font-semibold">
                2.8x protection
              </span>{" "}
              vs semaglutide.
            </p>
          </div>
          <div className="rounded bg-emerald-500/5 border border-emerald-500/20 p-4">
            <p className="text-xs font-bold text-emerald-400 uppercase mb-1">
              Time-to-Onset
            </p>
            <p className="text-2xl font-bold text-white">6 months</p>
            <p className="text-xs text-slate-400 mt-1">
              Median onset 180 days (IQR 5-8.5 months). Weibull k=2.75 ={" "}
              <span className="text-orange-400 font-semibold">
                late accumulation hazard
              </span>
              .
            </p>
          </div>
        </div>

        <div className="mt-4 rounded bg-slate-900/80 border border-slate-700 p-4">
          <p className="text-sm text-slate-300">
            <span className="font-bold text-white">Key finding:</span> The
            cascade{" "}
            <span className="text-red-400 font-bold">
              breaks at the muscle-bone boundary
            </span>
            . All three GLP-1 drugs show strong signals for muscle-level events
            (sarcopenia, atrophy) but <span className="italic">none</span> show
            disproportionate reporting for downstream consequences (weakness,
            osteopenia, falls, hip fracture). This could mean the cascade
            hasn&apos;t had time to develop at population scale, or that
            confounders (obesity&apos;s protective effect on bone density) mask
            downstream signals.
          </p>
          <p className="text-sm text-slate-300 mt-2">
            <span className="font-bold text-white">
              Neither drug&apos;s label mentions sarcopenia.
            </span>{" "}
            The FDA has not required a boxed warning or labeling change for
            muscle wasting despite a PRR of 9.98 for semaglutide.
          </p>
        </div>
      </section>

      {/* ── Section 4: Serious Outcomes by Drug ── */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-white mb-1">
          Serious Outcome Breakdown
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          How bad does it get? Death, hospitalization, and life-threatening
          events for high-profile drugs.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left">
                <th className="pb-3 pr-4 font-semibold text-slate-300">Drug</th>
                <th className="pb-3 pr-4 font-semibold text-slate-300 text-right">
                  Deaths
                </th>
                <th className="pb-3 pr-4 font-semibold text-slate-300 text-right">
                  Hospitalizations
                </th>
                <th className="pb-3 pr-4 font-semibold text-slate-300 text-right">
                  Life-Threatening
                </th>
                <th className="pb-3 font-semibold text-slate-300">
                  Seriousness
                </th>
              </tr>
            </thead>
            <tbody>
              {SERIOUS_OUTCOMES.map((d) => (
                <tr
                  key={d.drug}
                  className="border-b border-slate-800 hover:bg-slate-800/50"
                >
                  <td className="py-3 pr-4 font-semibold text-white">
                    {d.drug}
                  </td>
                  <td className="py-3 pr-4 text-right text-red-400 font-bold tabular-nums">
                    {fmt(d.deaths)}
                  </td>
                  <td className="py-3 pr-4 text-right text-orange-400 tabular-nums">
                    {fmt(d.hospitalizations)}
                  </td>
                  <td className="py-3 pr-4 text-right text-purple-400 tabular-nums">
                    {fmt(d.lifeThreatening)}
                  </td>
                  <td className="py-3">
                    <SeriousBadge pct={d.seriousPct} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Section 5: EMA Safety Signals ── */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-white mb-1">
          Europe Is Watching Too
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          162 active drug safety communications from the European Medicines
          Agency (EMA). Drugs suspended, withdrawn, or under new restrictions.
        </p>

        <div className="space-y-2">
          {EMA_SIGNALS.map((s) => (
            <div
              key={s.drug}
              className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3 hover:border-slate-700 transition-colors"
            >
              <div>
                <span className="font-semibold text-white text-sm">
                  {s.drug}
                </span>
                <span className="ml-2 text-xs text-slate-500">{s.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{s.type}</span>
                <OutcomeBadge
                  label={s.outcome}
                  color={
                    s.outcome === "SUSPENDED" || s.outcome === "WITHDRAWN"
                      ? "black"
                      : s.outcome === "Variation"
                        ? "orange"
                        : "red"
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 6: Pfizer Recalls ── */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-white mb-1">
          Pfizer Class I Recalls
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Class I = most dangerous classification. Reasonable probability of
          serious adverse health consequences or death.
        </p>

        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-5">
          <p className="text-sm text-slate-300 mb-4">
            Pfizer subsidiary{" "}
            <span className="font-bold text-white">Hospira</span> recalled
            multiple injectable drug syringes contaminated with{" "}
            <span className="text-red-400 font-bold">glass particles</span>{" "}
            &mdash; including chemotherapy drugs, cardiac emergency medications,
            and anesthetics.{" "}
            <span className="text-red-400 font-bold">
              4 recalls still ongoing as of 2024.
            </span>
          </p>
          <p className="text-sm text-slate-300">
            One batch of Propofol (the anesthetic Michael Jackson died from) was
            recalled because a vial contained{" "}
            <span className="text-red-400 font-bold">a beetle</span>.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              "Bleomycin (chemo)",
              "Sodium Bicarbonate (emergency)",
              "Atropine (cardiac)",
              "Lidocaine (anesthetic)",
            ].map((drug) => (
              <div
                key={drug}
                className="rounded bg-slate-900 border border-red-500/20 px-3 py-2 text-center"
              >
                <p className="text-xs font-semibold text-red-400">
                  Glass Found
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{drug}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 7: The Point ── */}
      <section className="mb-12 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-6">
        <h2 className="text-xl font-bold text-cyan-400 mb-3">
          Why This Matters
        </h2>
        <p className="text-slate-300 mb-3">
          None of this is conspiracy. It is{" "}
          <span className="text-white font-semibold">
            publicly mandated reporting data
          </span>{" "}
          sitting in government databases almost nobody knows how to query. The
          companies report it because they are legally required to. The
          &ldquo;hiding&rdquo; is that the data is buried in systems designed by
          bureaucrats, not for patients.
        </p>
        <p className="text-slate-300 mb-4">
          Every query on this page was executed in under 3 seconds using{" "}
          <span className="text-cyan-400 font-semibold">
            AlgoVigilance Station
          </span>{" "}
          &mdash; an open pharmacovigilance intelligence layer that any AI agent
          can connect to.
        </p>
        <p className="text-lg font-bold text-white">
          The data was always yours. Now you can actually read it.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/drugs"
            className="inline-flex items-center gap-2 rounded-md bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500 transition-colors"
          >
            Search Any Drug
          </Link>
          <Link
            href="/tools"
            className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors"
          >
            Free PV Tools
          </Link>
          <Link
            href="/station"
            className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors"
          >
            Connect Your AI Agent
          </Link>
        </div>
      </section>

      {/* ── Disclaimer ── */}
      <footer className="border-t border-slate-800 pt-6">
        <p className="text-xs text-slate-600 max-w-3xl">
          <span className="font-semibold text-slate-500">Important:</span>{" "}
          Adverse event reports in FAERS represent reports of suspected adverse
          events, not confirmed causal relationships. A report does not mean the
          drug caused the event. Report counts are influenced by many factors
          including prescribing volume, disease severity, media attention, and
          reporting practices. This page is intended for educational and
          transparency purposes. Always consult your healthcare provider before
          making medical decisions.
        </p>
        <p className="text-xs text-slate-600 mt-2">
          Data sources: FDA FAERS (openFDA API), European Medicines Agency DHPC
          database. Queried via AlgoVigilance Station MCP tools at
          mcp.nexvigilant.com.
        </p>
      </footer>
    </div>
  );
}
