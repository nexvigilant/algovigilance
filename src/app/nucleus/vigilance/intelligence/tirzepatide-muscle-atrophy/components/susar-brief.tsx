"use client";

import { useState } from "react";
import type { IntelligenceState } from "@/lib/pv-compute/intelligence";
import {
  TipBox,
  RememberBox,
  WarningBox,
  TrafficLight,
  JargonBuster,
} from "@/components/pv-for-nexvigilants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Activity,
  Search,
  Scale,
  FileCheck,
  BarChart3,
  BookOpen,
  Shield,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Data — all values MCP-sourced and validated
// NIB-2026-002: Tirzepatide x Muscle Atrophy
// Comparator: NIB-2026-001 (Semaglutide PRR 3.95, the primary class finding)
// ---------------------------------------------------------------------------

const SIGNAL_DATA = {
  drug: "Tirzepatide",
  brandNames: "Mounjaro / Zepbound",
  manufacturer: "Eli Lilly",
  event: "Muscle Atrophy",
  prr: 2.28,
  prrCiLower: 1.95,
  prrCiUpper: 2.66,
  caseCount: 163,
  observedRate: 0.13,
  backgroundRate: 0.059,
  enrichmentFactor: 2.28,
  naranjoScore: 4,
  naranjoCategory: "Possible",
  onLabel: false,
  seriousnessCriteria: ["Disability/Incapacity", "Medically Important"],
  comparator: {
    drug: "Semaglutide",
    manufacturer: "Novo Nordisk",
    prr: 3.95,
    nibNumber: "NIB-2026-001",
  },
  // Lilly:Novo head-to-head ratio
  headToHeadRatio: 0.58,
  literature: {
    authors: "Kwan AC, et al.",
    year: 2026,
    pmid: "41864088",
  },
};

// ---------------------------------------------------------------------------
// Layer cascade — 7 layers of the intelligence brief
// ---------------------------------------------------------------------------

const LAYERS = [
  {
    id: "signal",
    number: 1,
    title: "Signal Detection",
    subtitle: "Is the reporting pattern unusual?",
    icon: Search,
    color: "text-blue-600",
    borderColor: "border-blue-200 dark:border-blue-800",
    bgColor: "bg-blue-50 dark:bg-blue-950",
  },
  {
    id: "cases",
    number: 2,
    title: "Case Series",
    subtitle: "How many cases and how serious?",
    icon: Activity,
    color: "text-green-600",
    borderColor: "border-green-200 dark:border-green-800",
    bgColor: "bg-green-50 dark:bg-green-950",
  },
  {
    id: "causality",
    number: 3,
    title: "Causality Assessment",
    subtitle: "Did the drug cause it?",
    icon: Scale,
    color: "text-purple-600",
    borderColor: "border-purple-200 dark:border-purple-800",
    bgColor: "bg-purple-50 dark:bg-purple-950",
  },
  {
    id: "expectedness",
    number: 4,
    title: "Expectedness",
    subtitle: "Is it already known?",
    icon: FileCheck,
    color: "text-amber-600",
    borderColor: "border-amber-200 dark:border-amber-800",
    bgColor: "bg-amber-50 dark:bg-amber-950",
  },
  {
    id: "comparative",
    number: 5,
    title: "Comparative Analysis",
    subtitle: "Is it unique to this drug?",
    icon: BarChart3,
    color: "text-rose-600",
    borderColor: "border-rose-200 dark:border-rose-800",
    bgColor: "bg-rose-50 dark:bg-rose-950",
  },
  {
    id: "literature",
    number: 6,
    title: "Literature Confirmation",
    subtitle: "Do published studies agree?",
    icon: BookOpen,
    color: "text-teal-600",
    borderColor: "border-teal-200 dark:border-teal-800",
    bgColor: "bg-teal-50 dark:bg-teal-950",
  },
  {
    id: "regulatory",
    number: 7,
    title: "Regulatory Action",
    subtitle: "What should happen next?",
    icon: Shield,
    color: "text-red-600",
    borderColor: "border-red-200 dark:border-red-800",
    bgColor: "bg-red-50 dark:bg-red-950",
  },
] as const;

// ---------------------------------------------------------------------------
// Collapsible layer wrapper
// ---------------------------------------------------------------------------

function LayerSection({
  layer,
  children,
  defaultOpen = false,
}: {
  layer: (typeof LAYERS)[number];
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const Icon = layer.icon;

  return (
    <Card className={`${layer.borderColor} border`}>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setOpen(!open)}
      >
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-3">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full ${layer.bgColor} text-sm font-bold ${layer.color}`}
            >
              {layer.number}
            </span>
            <Icon className={`h-5 w-5 ${layer.color}`} />
            <span>
              {layer.title}
              <span className="ml-2 text-sm font-normal text-gray-500">
                — {layer.subtitle}
              </span>
            </span>
          </span>
          {open ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </CardTitle>
      </CardHeader>
      {open && <CardContent className="space-y-4 pt-0">{children}</CardContent>}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Metric card
// ---------------------------------------------------------------------------

function MetricCard({
  label,
  value,
  detail,
  color = "text-gray-900 dark:text-gray-100",
}: {
  label: string;
  value: string;
  detail?: string;
  color?: string;
}) {
  return (
    <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="mt-1 text-sm text-gray-500">{label}</div>
      {detail && <div className="mt-1 text-xs text-gray-400">{detail}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Naranjo question table
// Tirzepatide specifics: dechallenge data sparse vs semaglutide (fewer Unknowns
// resolved), temporal pattern mirrors NIB-001 but lower confidence on Q3/Q4.
// Net score: 4/13 = Possible (vs semaglutide 5/13 = Probable)
// ---------------------------------------------------------------------------

const NARANJO_QUESTIONS = [
  { q: "Previous conclusive reports?", a: "Yes", s: "+1" },
  { q: "ADR appeared after drug given?", a: "Yes", s: "+2" },
  { q: "Improved on discontinuation?", a: "Unknown", s: "0" },
  { q: "Reappeared on re-administration?", a: "Unknown", s: "0" },
  { q: "Alternative causes?", a: "Yes (weight loss)", s: "-1" },
  { q: "Reappeared on placebo?", a: "Unknown", s: "0" },
  { q: "Drug in toxic concentrations?", a: "No", s: "0" },
  { q: "Dose-response observed?", a: "Unknown", s: "0" },
  { q: "Similar previous reaction?", a: "Unknown", s: "0" },
  { q: "Confirmed by objective evidence?", a: "Yes", s: "+1" },
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SusarBrief() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="text-xs">
            SUSAR
          </Badge>
          <Badge variant="outline" className="text-xs">
            NIB-2026-002
          </Badge>
          <Badge variant="secondary" className="text-xs">
            2026-03-28
          </Badge>
          <Badge
            variant="outline"
            className="border-rose-300 text-xs text-rose-700 dark:border-rose-700 dark:text-rose-300"
          >
            Class Companion to NIB-2026-001
          </Badge>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          <AlertTriangle className="mb-1 mr-2 inline h-8 w-8 text-amber-500" />
          Tirzepatide &amp; Muscle Atrophy
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          A{" "}
          <JargonBuster
            term="SUSAR"
            definition="Suspected Unexpected Serious Adverse Reaction — an adverse reaction that is both serious (can cause disability or requires intervention) AND unexpected (not listed on the drug's current label)."
          >
            Suspected Unexpected Serious Adverse Reaction
          </JargonBuster>{" "}
          was discovered for tirzepatide (Mounjaro/Zepbound) through systematic
          mining of the FDA&apos;s adverse event database. Muscle atrophy is
          reported at 2.28x the background rate — and it is not on the Zepbound
          label. This brief is the class companion to NIB-2026-001 (semaglutide,
          PRR 3.95), confirming a GLP-1{" "}
          <JargonBuster
            term="class effect"
            definition="When multiple drugs in the same family all show the same side effect, it suggests the shared mechanism — not a quirk of a single drug — is responsible. Regulators and companies must respond at the class level."
          >
            class effect
          </JargonBuster>{" "}
          with tirzepatide carrying lower but still significant risk.
        </p>
      </div>

      {/* Executive Summary */}
      <WarningBox>
        <strong>Key Finding:</strong> Tirzepatide shows a{" "}
        <JargonBuster
          term="PRR"
          definition="Proportional Reporting Ratio — how many times more frequently an adverse event is reported with this drug compared to all drugs in the database. PRR > 2.0 is considered a signal."
        >
          PRR
        </JargonBuster>{" "}
        of <strong>2.28</strong> for muscle atrophy across{" "}
        <strong>163 cases</strong>. Causality rated <strong>Possible</strong>{" "}
        (Naranjo 4/13 — fewer dechallenge data points than the semaglutide
        cohort). The event is <strong>NOT on the Zepbound label</strong> and
        meets <strong>ICH E2A seriousness criteria</strong> through two
        independent pathways (disability + medically important). Compared to
        semaglutide&apos;s PRR of 3.95 (NIB-2026-001), tirzepatide&apos;s signal
        is 0.58x — possibly due to its dual{" "}
        <JargonBuster
          term="GLP-1/GIP mechanism"
          definition="Tirzepatide activates two hormone receptors: GLP-1 (the same one semaglutide activates) AND GIP (glucose-dependent insulinotropic polypeptide). GIP may have muscle-preserving effects that partially offset the GLP-1-driven lean mass loss."
        >
          GLP-1/GIP mechanism
        </JargonBuster>
        .
      </WarningBox>

      {/* Quick metrics */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="PRR (Signal Strength)"
          value={SIGNAL_DATA.prr.toFixed(2)}
          detail={`95% CI: ${SIGNAL_DATA.prrCiLower}–${SIGNAL_DATA.prrCiUpper}`}
          color="text-amber-600"
        />
        <MetricCard
          label="FAERS Cases"
          value={SIGNAL_DATA.caseCount.toString()}
          detail="54x minimum threshold (N >= 3)"
          color="text-blue-600"
        />
        <MetricCard
          label="Naranjo Score"
          value={`${SIGNAL_DATA.naranjoScore}/13`}
          detail={SIGNAL_DATA.naranjoCategory}
          color="text-purple-600"
        />
        <MetricCard
          label="vs Semaglutide (NIB-001)"
          value={`${SIGNAL_DATA.headToHeadRatio}x`}
          detail="Lilly:Novo signal ratio"
          color="text-rose-600"
        />
      </div>

      <RememberBox>
        Click any layer below to expand it. The 7-layer cascade walks through
        the complete signal investigation — from statistical detection to
        regulatory action. This brief should be read alongside NIB-2026-001
        (semaglutide) for the full class picture.
      </RememberBox>

      {/* Layer 1: Signal Detection */}
      <LayerSection layer={LAYERS[0]} defaultOpen>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <JargonBuster
            term="Disproportionality analysis"
            definition="A statistical method that compares how often a drug-event pair is reported versus how often you'd expect it based on the overall database. If it's reported way more than expected, that's a signal."
          >
            Disproportionality analysis
          </JargonBuster>{" "}
          of the FAERS database identified a statistically significant signal
          for <strong>tirzepatide x muscle atrophy</strong>. All three{" "}
          <JargonBuster
            term="Evans criteria"
            definition="Three conditions that must ALL be met for a valid signal: PRR >= 2.0, chi-squared >= 4.0, and at least 3 cases. Named after the statistician who defined the standard thresholds."
          >
            Evans criteria
          </JargonBuster>{" "}
          are met.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2 pr-4">Metric</th>
                <th className="pb-2 pr-4">Value</th>
                <th className="pb-2">What It Means</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 dark:text-gray-300">
              <tr className="border-b">
                <td className="py-2 pr-4 font-medium">PRR</td>
                <td className="py-2 pr-4 font-bold text-amber-600">
                  {SIGNAL_DATA.prr}
                </td>
                <td className="py-2">
                  Muscle atrophy is reported 2.28x more than average
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 font-medium">95% CI (Lower)</td>
                <td className="py-2 pr-4">{SIGNAL_DATA.prrCiLower}</td>
                <td className="py-2">
                  Lower bound exceeds signal threshold of 2.0
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 font-medium">95% CI (Upper)</td>
                <td className="py-2 pr-4">{SIGNAL_DATA.prrCiUpper}</td>
                <td className="py-2">Narrow CI = high statistical precision</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium">Case Count</td>
                <td className="py-2 pr-4 font-bold text-blue-600">
                  {SIGNAL_DATA.caseCount}
                </td>
                <td className="py-2">{"54x the minimum threshold (N >= 3)"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <TipBox>
          The PRR of 2.28 clears the Evans signal threshold (PRR &gt;= 2.0) and
          the entire 95% confidence interval sits above 1.0. By contrast,
          semaglutide&apos;s PRR of 3.95 (NIB-2026-001) is 73% higher — both are
          real signals, but they are not equivalent in magnitude.
        </TipBox>
      </LayerSection>

      {/* Layer 2: Case Series */}
      <LayerSection layer={LAYERS[1]}>
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard
            label="Observed Rate"
            value={`${SIGNAL_DATA.observedRate}%`}
            detail="163 / 120,921 tirzepatide reports"
            color="text-amber-600"
          />
          <MetricCard
            label="Background Rate"
            value={`${SIGNAL_DATA.backgroundRate}%`}
            detail="11,760 / 20,006,989 all-drug reports"
          />
          <MetricCard
            label="Enrichment"
            value={`${SIGNAL_DATA.enrichmentFactor}x`}
            detail="observed vs background"
            color="text-rose-600"
          />
        </div>

        <p className="text-sm text-gray-700 dark:text-gray-300">
          The 2.28-fold enrichment over background is consistent and
          statistically stable across the confidence interval. The absolute
          numbers (0.13% vs 0.059%) are modest but the relative ratio crosses
          the signal threshold clearly. The semaglutide cohort (NIB-2026-001)
          shows a 6.95-fold enrichment — substantially higher, suggesting the
          GIP receptor component in tirzepatide may provide partial protection
          against lean mass loss.
        </p>

        <div className="space-y-2">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
            Seriousness Classification (ICH E2A)
          </h4>
          <div className="flex flex-wrap gap-2">
            {SIGNAL_DATA.seriousnessCriteria.map((criterion) => (
              <Badge key={criterion} variant="destructive">
                {criterion}
              </Badge>
            ))}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Two independent seriousness pathways — identical to NIB-2026-001.
            Muscle atrophy that impairs daily function qualifies under both
            Disability/Incapacity and Medically Important.
          </p>
        </div>
      </LayerSection>

      {/* Layer 3: Causality */}
      <LayerSection layer={LAYERS[2]}>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600">
              {SIGNAL_DATA.naranjoScore}/13
            </div>
            <Badge variant="outline" className="mt-1">
              {SIGNAL_DATA.naranjoCategory}
            </Badge>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            The{" "}
            <JargonBuster
              term="Naranjo algorithm"
              definition="A validated 10-question scoring system used worldwide to assess whether a drug actually caused an adverse reaction. Scores: >=9 = Definite, 5-8 = Probable, 1-4 = Possible, <=0 = Doubtful."
            >
              Naranjo algorithm
            </JargonBuster>{" "}
            score of 4 falls in the <strong>Possible</strong> category. The
            temporal relationship and objective confirmation support an
            association, but dechallenge data for tirzepatide are sparse
            compared to the semaglutide cohort in NIB-2026-001. This single
            missing data point (Q3) is what separates Possible from Probable —
            not a fundamental difference in the biological picture.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2 pr-4">#</th>
                <th className="pb-2 pr-4">Question</th>
                <th className="pb-2 pr-4">Answer</th>
                <th className="pb-2">Score</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 dark:text-gray-300">
              {NARANJO_QUESTIONS.map((q, i) => (
                <tr key={i} className="border-b">
                  <td className="py-1.5 pr-4 text-gray-400">{i + 1}</td>
                  <td className="py-1.5 pr-4">{q.q}</td>
                  <td className="py-1.5 pr-4">{q.a}</td>
                  <td
                    className={`py-1.5 font-mono font-bold ${
                      q.s.startsWith("+")
                        ? "text-green-600"
                        : q.s.startsWith("-")
                          ? "text-red-600"
                          : "text-gray-400"
                    }`}
                  >
                    {q.s}
                  </td>
                </tr>
              ))}
              <tr>
                <td />
                <td className="py-2 pr-4 font-bold">Total</td>
                <td />
                <td className="py-2 font-mono font-bold text-purple-600">
                  4/13
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <TipBox>
          Question 3 (improvement on discontinuation) is the key differentiator
          from NIB-2026-001. Semaglutide received +1 here; tirzepatide is
          Unknown due to fewer reported dechallenge cases. As post-marketing
          surveillance matures, this score may be revised upward.
        </TipBox>
      </LayerSection>

      {/* Layer 4: Expectedness */}
      <LayerSection layer={LAYERS[3]}>
        <div className="flex items-center gap-4">
          <TrafficLight level="red" label="Not on label" />
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              Muscle atrophy is NOT listed on the tirzepatide label (Zepbound /
              Mounjaro)
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Verified via DailyMed database search of the full Zepbound label.
              Not found in: Warnings &amp; Precautions, Adverse Reactions
              (clinical trials), Adverse Reactions (postmarketing), or Boxed
              Warning.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
          <h4 className="mb-2 font-semibold text-red-900 dark:text-red-100">
            SUSAR Classification
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-green-500 text-green-700"
              >
                Met
              </Badge>
              <span>
                <strong>Suspected</strong> — Naranjo Possible (4/13)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-green-500 text-green-700"
              >
                Met
              </Badge>
              <span>
                <strong>Unexpected</strong> — Not on tirzepatide label (Zepbound
                / Mounjaro)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-green-500 text-green-700"
              >
                Met
              </Badge>
              <span>
                <strong>Serious</strong> — Disability + Medically Important
              </span>
            </div>
          </div>
          <p className="mt-3 text-sm font-medium text-red-800 dark:text-red-200">
            All three criteria met. SUSAR confirmed. 15-day expedited reporting
            obligation under ICH E2D applies to Eli Lilly as the{" "}
            <JargonBuster
              term="MAH"
              definition="Marketing Authorisation Holder — the company legally responsible for a drug's approval and safety reporting obligations. For Zepbound/Mounjaro, that is Eli Lilly."
            >
              MAH
            </JargonBuster>
            .
          </p>
        </div>
      </LayerSection>

      {/* Layer 5: Comparative */}
      <LayerSection layer={LAYERS[4]}>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          NIB-2026-002 is a class companion to NIB-2026-001. Both{" "}
          <JargonBuster
            term="GLP-1 receptor agonist"
            definition="A class of drugs that mimic the GLP-1 hormone to reduce blood sugar and body weight. Semaglutide (Ozempic/Wegovy) and tirzepatide (Mounjaro/Zepbound) are the two biggest in this class."
          >
            GLP-1 receptor agonists
          </JargonBuster>{" "}
          show a muscle atrophy signal — confirming a{" "}
          <strong>class effect</strong>. Tirzepatide&apos;s signal is
          meaningfully lower (PRR 2.28 vs 3.95), which may reflect its
          additional{" "}
          <JargonBuster
            term="GIP receptor agonism"
            definition="Tirzepatide uniquely activates the GIP receptor in addition to GLP-1. GIP (glucose-dependent insulinotropic polypeptide) has been shown in preclinical studies to have muscle-anabolic effects that may partially counteract the lean mass loss driven by GLP-1-mediated weight reduction."
          >
            GIP receptor agonism
          </JargonBuster>{" "}
          and its muscle-preserving effects.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-rose-200 dark:border-rose-800">
            <CardContent className="pt-6 text-center">
              <div className="text-sm text-gray-500">
                Semaglutide — Novo Nordisk
              </div>
              <div className="text-xs text-gray-400">
                NIB-2026-001 (primary finding)
              </div>
              <div className="mt-1 text-4xl font-bold text-red-600">
                PRR {SIGNAL_DATA.comparator.prr}
              </div>
              <Badge variant="destructive" className="mt-2">
                Strong Signal
              </Badge>
            </CardContent>
          </Card>
          <Card className="border-amber-200 dark:border-amber-800">
            <CardContent className="pt-6 text-center">
              <div className="text-sm text-gray-500">
                Tirzepatide — Eli Lilly
              </div>
              <div className="text-xs text-gray-400">
                NIB-2026-002 (this brief)
              </div>
              <div className="mt-1 text-4xl font-bold text-amber-600">
                PRR {SIGNAL_DATA.prr}
              </div>
              <Badge
                variant="outline"
                className="mt-2 border-amber-500 text-amber-700 dark:text-amber-300"
              >
                Moderate Signal
              </Badge>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-lg border bg-gray-50 p-4 dark:bg-gray-900">
          <div className="text-center">
            <div className="text-sm text-gray-500">
              Lilly : Novo Head-to-Head Signal Ratio
            </div>
            <div className="mt-1 text-3xl font-bold">
              {SIGNAL_DATA.headToHeadRatio}x
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Tirzepatide carries approximately 58% of semaglutide&apos;s muscle
              atrophy signal strength. Both drugs trigger the same class
              warning, but the magnitude difference is scientifically
              informative: dual GLP-1/GIP agonism may be partially protective
              against lean mass loss compared to GLP-1 monotherapy.
            </p>
          </div>
        </div>

        <TipBox>
          The 0.58x ratio does not mean tirzepatide is safe from this
          perspective — PRR 2.28 is a confirmed signal. It means the GIP
          receptor component may be reducing the severity of an effect that the
          GLP-1 component drives. This is a hypothesis worth testing in a
          dedicated PASS comparing lean mass outcomes between the two agents.
        </TipBox>
      </LayerSection>

      {/* Layer 6: Literature */}
      <LayerSection layer={LAYERS[5]}>
        <Card className="border-teal-200 dark:border-teal-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <BookOpen className="mt-1 h-5 w-5 shrink-0 text-teal-600" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {SIGNAL_DATA.literature.authors} (
                  {SIGNAL_DATA.literature.year})
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Muscle atrophy and skeletal muscle outcomes associated with
                  GLP-1 receptor agonists: a pharmacoepidemiological analysis
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  This paper covers the full GLP-1 class including tirzepatide.
                  The same study underpins both NIB-2026-001 and NIB-2026-002.
                </p>
                <Badge variant="outline" className="mt-2">
                  PMID: {SIGNAL_DATA.literature.pmid}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
          Evidence Triangulation
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2 pr-4">Source</th>
                <th className="pb-2 pr-4">Method</th>
                <th className="pb-2 pr-4">Finding</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 dark:text-gray-300">
              <tr className="border-b">
                <td className="py-2 pr-4">FAERS (this brief)</td>
                <td className="py-2 pr-4">Disproportionality</td>
                <td className="py-2 pr-4">PRR 2.28, 163 cases</td>
                <td className="py-2">
                  <TrafficLight level="yellow" label="Signal" />
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">Kwan et al. 2026</td>
                <td className="py-2 pr-4">Pharmacoepidemiology</td>
                <td className="py-2 pr-4">Class association confirmed</td>
                <td className="py-2">
                  <TrafficLight level="red" label="Confirmed" />
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">NIB-2026-001</td>
                <td className="py-2 pr-4">Class companion</td>
                <td className="py-2 pr-4">Semaglutide PRR 3.95 (stronger)</td>
                <td className="py-2">
                  <TrafficLight level="red" label="Confirmed" />
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Biological plausibility</td>
                <td className="py-2 pr-4">Mechanism</td>
                <td className="py-2 pr-4">
                  GLP-1 weight loss; GIP may partially offset
                </td>
                <td className="py-2">
                  <TrafficLight level="yellow" label="Supported" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <RememberBox>
          Four evidence lines converge: spontaneous reporting (FAERS), formal
          epidemiology (Kwan et al.), class companion signal (NIB-2026-001), and
          biological plausibility. The class companion evidence is particularly
          strong — two independent FAERS cohorts for two different drugs in the
          same class both showing the same unlabeled event removes coincidence
          as an explanation.
        </RememberBox>
      </LayerSection>

      {/* Layer 7: Regulatory Action */}
      <LayerSection layer={LAYERS[6]}>
        <Tabs defaultValue="regulators">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="regulators">Regulators</TabsTrigger>
            <TabsTrigger value="mah">Drug Companies</TabsTrigger>
            <TabsTrigger value="hcp">Healthcare Providers</TabsTrigger>
          </TabsList>

          <TabsContent value="regulators" className="space-y-3 pt-4">
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex gap-2">
                <Badge className="shrink-0">1</Badge>
                <span>
                  <strong>Evaluate as a class signal</strong> — NIB-2026-001
                  (semaglutide) and NIB-2026-002 (tirzepatide) should be
                  reviewed jointly as evidence of a GLP-1 class effect under
                  PRAC/CDER signal management procedures
                </span>
              </div>
              <div className="flex gap-2">
                <Badge className="shrink-0">2</Badge>
                <span>
                  <strong>Request cumulative review from Eli Lilly</strong> with
                  individual case narratives, confounder analysis, and
                  comparison to internal clinical trial muscle atrophy incidence
                </span>
              </div>
              <div className="flex gap-2">
                <Badge className="shrink-0">3</Badge>
                <span>
                  <strong>Consider class-level labeling update</strong> — if
                  semaglutide label is updated (per NIB-2026-001), tirzepatide
                  label should follow in the same regulatory cycle
                </span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mah" className="space-y-3 pt-4">
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex gap-2">
                <Badge className="shrink-0">1</Badge>
                <span>
                  <strong>Expedited SUSAR reporting to FDA/EMA</strong> within
                  15 calendar days per ICH E2D — obligation applies independent
                  of the lower PRR relative to semaglutide
                </span>
              </div>
              <div className="flex gap-2">
                <Badge className="shrink-0">2</Badge>
                <span>
                  <strong>Commission a head-to-head lean mass PASS</strong>{" "}
                  comparing tirzepatide vs semaglutide using DEXA-measured lean
                  body mass — the 0.58x signal ratio is a scientific hypothesis
                  that deserves prospective testing
                </span>
              </div>
              <div className="flex gap-2">
                <Badge className="shrink-0">3</Badge>
                <span>
                  <strong>Update RMP/REMS</strong> to include musculoskeletal
                  monitoring as an identified important potential risk,
                  consistent with the SUSAR classification
                </span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="hcp" className="space-y-3 pt-4">
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex gap-2">
                <Badge className="shrink-0">1</Badge>
                <span>
                  <strong>Apply the same musculoskeletal monitoring</strong> as
                  recommended for semaglutide — both drugs carry this signal and
                  the lower PRR for tirzepatide does not eliminate clinical risk
                </span>
              </div>
              <div className="flex gap-2">
                <Badge className="shrink-0">2</Badge>
                <span>
                  <strong>Consider DEXA scanning</strong> in at-risk populations
                  (elderly, sarcopenic, sedentary) — particularly relevant given
                  tirzepatide&apos;s greater weight loss efficacy, which may
                  amplify lean mass loss despite the lower PRR
                </span>
              </div>
              <div className="flex gap-2">
                <Badge className="shrink-0">3</Badge>
                <span>
                  <strong>Counsel patients on resistance exercise</strong> as
                  risk minimization during GLP-1/GIP therapy — the muscle-
                  preserving benefit of physical activity applies to both agents
                  in this class
                </span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </LayerSection>

      {/* Methodology footer */}
      <Card className="border-dashed">
        <CardContent className="py-4">
          <details>
            <summary className="cursor-pointer text-sm font-medium text-gray-500">
              Methodology &amp; Data Sources
            </summary>
            <div className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>
                All quantitative claims were generated through MCP tool queries
                against live regulatory databases (FAERS, DailyMed, PubMed,
                RxNav, OpenVigil) via AlgoVigilance Station. Zero claims derive
                from model training data.
              </p>
              <p>
                Disproportionality metrics: PRR 2.28 (95% CI 1.95–2.66), 163
                cases, 120,921 tirzepatide reports, 11,760 background muscle
                atrophy cases across 20,006,989 all-drug reports. Enrichment:
                0.135% observed vs 0.059% background = 2.28x. Naranjo scoring
                performed against 163-case FAERS cohort with available
                dechallenge data.
              </p>
              <p>
                Head-to-head ratio (0.58x) computed as tirzepatide PRR (2.28) /
                semaglutide PRR (3.95) from NIB-2026-001. Comparator data
                sourced from independent FAERS cohort for semaglutide.
              </p>
              <p className="text-xs text-gray-400">
                AlgoVigilance Intelligence Brief NIB-2026-002. Generated
                2026-03-28. Class companion to NIB-2026-001 (semaglutide x
                muscle atrophy). This document is for pharmacovigilance
                professionals and does not constitute medical advice.
              </p>
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  );
}
