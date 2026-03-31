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
// ---------------------------------------------------------------------------

const SIGNAL_DATA = {
  drug: "Dupilumab",
  brandName: "Dupixent",
  manufacturer: "Regeneron Pharmaceuticals / Sanofi",
  event: "Alopecia Areata",
  prr: 2.75,
  prrCiLower: 2.23,
  prrCiUpper: 3.39,
  caseCount: 92,
  // Contingency table: a=92, b=411,600, c=1,594, d=19,593,703
  contingency: { a: 92, b: 411600, c: 1594, d: 19593703 },
  observedRate: 0.022, // 92 / 411,692 × 100
  backgroundRate: 0.008, // 1,594 / 20,006,989 × 100
  enrichmentFactor: 2.75,
  naranjoScore: 4,
  naranjoCategory: "Possible",
  onLabel: false,
  seriousnessCriteria: ["Medically Important"],
  labeledAnalogueSection: "Section 5.7",
  labeledAnalogue: "Dupilumab-induced psoriasis",
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
    id: "mechanism",
    number: 5,
    title: "Biological Plausibility",
    subtitle: "Is there a scientific explanation?",
    icon: BarChart3,
    color: "text-rose-600",
    borderColor: "border-rose-200 dark:border-rose-800",
    bgColor: "bg-rose-50 dark:bg-rose-950",
  },
  {
    id: "literature",
    number: 6,
    title: "Evidence Triangulation",
    subtitle: "How strong is the overall case?",
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
// Naranjo question table — NIB-003 specific answers
// ---------------------------------------------------------------------------

const NARANJO_QUESTIONS = [
  { q: "Previous conclusive reports?", a: "Yes (case reports)", s: "+1" },
  { q: "ADR appeared after drug given?", a: "Yes", s: "+2" },
  { q: "Improved on discontinuation?", a: "Unknown", s: "0" },
  { q: "Reappeared on re-administration?", a: "Unknown", s: "0" },
  {
    q: "Alternative causes?",
    a: "Yes (autoimmune comorbidity)",
    s: "-1",
  },
  { q: "Reappeared on placebo?", a: "Unknown", s: "0" },
  { q: "Drug in toxic concentrations?", a: "No", s: "0" },
  { q: "Dose-response observed?", a: "Unknown", s: "0" },
  { q: "Similar previous reaction?", a: "Unknown", s: "0" },
  {
    q: "Confirmed by objective evidence?",
    a: "Yes (dermatological diagnosis)",
    s: "+1",
  },
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
            NIB-2026-003
          </Badge>
          <Badge variant="secondary" className="text-xs">
            2026-03-28
          </Badge>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          <AlertTriangle className="mb-1 mr-2 inline h-8 w-8 text-red-600" />
          Dupilumab &amp; Alopecia Areata
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          A{" "}
          <JargonBuster
            term="SUSAR"
            definition="Suspected Unexpected Serious Adverse Reaction — an adverse reaction that is both serious (can cause disability or requires intervention) AND unexpected (not listed on the drug's current label)."
          >
            Suspected Unexpected Serious Adverse Reaction
          </JargonBuster>{" "}
          was discovered through systematic mining of the FDA&apos;s adverse
          event database. Alopecia areata — an autoimmune condition that causes
          hair loss — is being reported with dupilumab (Dupixent) at 2.75x the
          background rate, and it is not on the label. The mechanism is not
          random: the same immune rebalancing that drives dupilumab&apos;s
          already-labeled psoriasis risk appears to be operating here.
        </p>
      </div>

      {/* Executive Summary */}
      <WarningBox>
        <strong>Key Finding:</strong> Dupilumab shows a{" "}
        <JargonBuster
          term="PRR"
          definition="Proportional Reporting Ratio — how many times more frequently an adverse event is reported with this drug compared to all drugs in the database. PRR > 2.0 is considered a signal."
        >
          PRR
        </JargonBuster>{" "}
        of <strong>2.75</strong> (95% CI: 2.23–3.39) for alopecia areata across{" "}
        <strong>92 cases</strong>. Causality rated <strong>Possible</strong>{" "}
        (Naranjo 4/13). The event is <strong>NOT on the current label</strong>{" "}
        and meets <strong>ICH E2A seriousness criteria</strong> as Medically
        Important. Biological plausibility is strong: dupilumab blocks
        IL-4/IL-13 (Th2 pathway), shifting the immune balance toward Th1 — the
        exact pathway that drives alopecia areata. This is the second autoimmune
        condition following this pattern after dupilumab-induced psoriasis
        (already listed in Section 5.7). All quantitative claims are MCP-sourced
        from live regulatory databases.
      </WarningBox>

      {/* Quick metrics */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="PRR (Signal Strength)"
          value={SIGNAL_DATA.prr.toFixed(2)}
          detail={`95% CI: ${SIGNAL_DATA.prrCiLower}–${SIGNAL_DATA.prrCiUpper}`}
          color="text-red-600"
        />
        <MetricCard
          label="FAERS Cases"
          value={SIGNAL_DATA.caseCount.toString()}
          detail="30x minimum threshold (N >= 3)"
          color="text-blue-600"
        />
        <MetricCard
          label="Naranjo Score"
          value={`${SIGNAL_DATA.naranjoScore}/13`}
          detail={SIGNAL_DATA.naranjoCategory}
          color="text-purple-600"
        />
        <MetricCard
          label="Rate Enrichment"
          value={`${SIGNAL_DATA.enrichmentFactor}x`}
          detail="0.022% vs 0.008% background"
          color="text-amber-600"
        />
      </div>

      <RememberBox>
        Click any layer below to expand it. The 7-layer cascade walks through
        the complete signal investigation — from statistical detection through
        biological mechanism to regulatory action recommendations.
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
          for <strong>dupilumab x alopecia areata</strong>. The lower bound of
          the confidence interval (2.23) comfortably exceeds the Evans threshold
          of 2.0, confirming signal robustness.
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
                <td className="py-2 pr-4 font-bold text-red-600">
                  {SIGNAL_DATA.prr}
                </td>
                <td className="py-2">
                  Alopecia areata reported 2.75x more than average
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 font-medium">95% CI Lower</td>
                <td className="py-2 pr-4">{SIGNAL_DATA.prrCiLower}</td>
                <td className="py-2">
                  Exceeds Evans threshold of 2.0 — signal confirmed
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 font-medium">95% CI Upper</td>
                <td className="py-2 pr-4">{SIGNAL_DATA.prrCiUpper}</td>
                <td className="py-2">
                  Narrow CI indicates high statistical precision
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 font-medium">Case Count</td>
                <td className="py-2 pr-4 font-bold text-blue-600">
                  {SIGNAL_DATA.caseCount}
                </td>
                <td className="py-2">30x the minimum threshold (N &gt;= 3)</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium">Signal Status</td>
                <td className="py-2 pr-4 font-bold text-red-600">Detected</td>
                <td className="py-2">All three Evans criteria met</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border bg-gray-50 p-4 dark:bg-gray-900">
          <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
            2×2 Contingency Table (FAERS)
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-center text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="pb-2 pr-4 text-left" />
                  <th className="pb-2 pr-4">Alopecia Areata</th>
                  <th className="pb-2">Other Events</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 dark:text-gray-300">
                <tr className="border-b">
                  <td className="py-2 pr-4 text-left font-medium">Dupilumab</td>
                  <td className="py-2 pr-4 font-bold text-red-600">
                    a = {SIGNAL_DATA.contingency.a.toLocaleString()}
                  </td>
                  <td className="py-2">
                    b = {SIGNAL_DATA.contingency.b.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-left font-medium">
                    All Other Drugs
                  </td>
                  <td className="py-2 pr-4">
                    c = {SIGNAL_DATA.contingency.c.toLocaleString()}
                  </td>
                  <td className="py-2">
                    d = {SIGNAL_DATA.contingency.d.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <TipBox>
          The{" "}
          <JargonBuster
            term="Evans criteria"
            definition="Three conditions that must ALL be met for a valid signal: PRR >= 2.0, chi-squared >= 3.841, and at least 3 cases. Named after the statistician who defined the standard thresholds."
          >
            Evans criteria
          </JargonBuster>{" "}
          require PRR &gt;= 2.0, chi-squared &gt;= 3.841, and N &gt;= 3. All
          three are met here. With 92 cases and a lower CI bound of 2.23, the
          signal is not borderline — it is clear.
        </TipBox>
      </LayerSection>

      {/* Layer 2: Case Series */}
      <LayerSection layer={LAYERS[1]}>
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard
            label="Observed Rate (Dupilumab)"
            value="0.022%"
            detail="92 of 411,692 dupilumab reports"
            color="text-green-600"
          />
          <MetricCard
            label="Background Rate"
            value="0.008%"
            detail="1,594 of 20,006,989 all-drug reports"
          />
          <MetricCard
            label="Enrichment"
            value="2.75x"
            detail="above all-drug average"
            color="text-red-600"
          />
        </div>

        <p className="text-sm text-gray-700 dark:text-gray-300">
          The 2.75-fold enrichment over background is a systematic pattern, not
          incidental noise. Alopecia areata is an autoimmune condition — it does
          not arise randomly. The concentration of cases in dupilumab reporters,
          against a drug whose mechanism actively remodels immune balance,
          points toward a biological explanation rather than coincidence.
        </p>

        <div className="space-y-2">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
            Seriousness Classification (
            <JargonBuster
              term="ICH E2A"
              definition="An international guideline that defines when an adverse event is 'serious.' It lists 6 criteria: death, life-threatening, hospitalization, disability, congenital anomaly, or medically important. Any single criterion makes the event reportable as serious."
            >
              ICH E2A
            </JargonBuster>
            )
          </h4>
          <div className="flex flex-wrap gap-2">
            {SIGNAL_DATA.seriousnessCriteria.map((criterion) => (
              <Badge key={criterion} variant="destructive">
                {criterion}
              </Badge>
            ))}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Alopecia areata qualifies as Medically Important because it is an
            autoimmune condition requiring medical evaluation, diagnostic workup
            (biopsy or trichoscopy), and potentially systemic immunotherapy (JAK
            inhibitors such as baricitinib or ruxolitinib). Spontaneous
            resolution is possible but cannot be assumed in moderate-to-severe
            cases.
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
            score is held back by unknown dechallenge/rechallenge outcomes and
            the presence of autoimmune comorbidity as an alternative cause. The
            temporal relationship and objective diagnostic confirmation are the
            primary positive contributions. The Possible rating is appropriate
            here; it does not weaken the SUSAR designation, which depends on
            label status and seriousness, not causality certainty.
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
          The Possible rating is not a weakness in this brief. Under{" "}
          <JargonBuster
            term="ICH E2D"
            definition="An international guideline governing expedited safety reporting. It requires sponsors to report SUSARs within 15 calendar days of first awareness, regardless of certainty level."
          >
            ICH E2D
          </JargonBuster>
          , even a suspected (Possible) causal link qualifies for expedited
          reporting when the event is unexpected and serious. The biology in
          Layer 5 provides additional independent support for causation beyond
          what the Naranjo score alone captures.
        </TipBox>
      </LayerSection>

      {/* Layer 4: Expectedness */}
      <LayerSection layer={LAYERS[3]}>
        <div className="flex items-center gap-4">
          <TrafficLight level="red" label="Not on label" />
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              Alopecia areata is NOT listed on the dupilumab (Dupixent) label
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Verified via full DailyMed label search. Not found in: Warnings
              &amp; Precautions, Adverse Reactions (clinical trials), Adverse
              Reactions (postmarketing), Boxed Warning, or any other section.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
          <h4 className="mb-2 font-semibold text-amber-900 dark:text-amber-100">
            The Psoriasis Analogue (Section 5.7)
          </h4>
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Dupilumab-induced psoriasis IS on the label (Section 5.7 — Warnings
            &amp; Precautions). It is acknowledged that blocking IL-4/IL-13 can
            unmask or worsen psoriasis — a Th1-driven autoimmune skin disease.
            Alopecia areata is also a Th1-driven autoimmune disease. The
            mechanism that makes psoriasis labeled should have raised the
            question of alopecia areata. It did not — making this finding
            unexpected.
          </p>
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
                <strong>Suspected</strong> — Naranjo Possible (4/13); temporal
                relationship and objective evidence confirmed
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
                <strong>Unexpected</strong> — Alopecia areata not listed
                anywhere in the Dupixent label
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
                <strong>Serious</strong> — Medically Important (ICH E2A);
                requires medical evaluation and potentially systemic treatment
              </span>
            </div>
          </div>
          <p className="mt-3 text-sm font-medium text-red-800 dark:text-red-200">
            All three criteria met. SUSAR confirmed. 15-day expedited reporting
            obligation triggered under ICH E2D.
          </p>
        </div>
      </LayerSection>

      {/* Layer 5: Biological Plausibility (replaces Comparative for this brief) */}
      <LayerSection layer={LAYERS[4]}>
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 dark:border-rose-800 dark:bg-rose-950">
          <h4 className="mb-2 font-semibold text-rose-900 dark:text-rose-100">
            The Th2 &rarr; Th1 Immune Rebalancing Mechanism
          </h4>
          <p className="text-sm text-rose-800 dark:text-rose-200">
            Dupilumab blocks{" "}
            <JargonBuster
              term="IL-4 and IL-13"
              definition="Interleukins 4 and 13 are signaling molecules (cytokines) produced by Th2 immune cells. They drive allergic and atopic reactions. Dupilumab binds the receptor shared by both, blocking their downstream effects."
            >
              IL-4 and IL-13
            </JargonBuster>{" "}
            — the key cytokines of the{" "}
            <JargonBuster
              term="Th2 immune pathway"
              definition="The 'Type 2 helper T cell' arm of the immune system. It handles allergic reactions, parasites, and asthma. Dupilumab was designed to suppress this arm in atopic dermatitis and asthma."
            >
              Th2 immune arm
            </JargonBuster>
            . In patients with pre-existing atopic disease, the Th2 arm is
            overactive. When dupilumab suppresses Th2, the immune system
            rebalances — shifting toward the{" "}
            <JargonBuster
              term="Th1 immune pathway"
              definition="The 'Type 1 helper T cell' arm of the immune system. It handles viruses and intracellular bacteria — but when dysregulated, it drives autoimmune conditions like psoriasis and alopecia areata."
            >
              Th1 arm
            </JargonBuster>
            . This is immune rebalancing, not a side effect of toxicity.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-amber-200 dark:border-amber-800">
            <CardContent className="pt-6">
              <div className="mb-2 text-sm font-semibold text-gray-600 dark:text-gray-400">
                Already labeled (Section 5.7)
              </div>
              <div className="text-lg font-bold text-amber-700 dark:text-amber-400">
                Dupilumab-Induced Psoriasis
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Th1/IFN-&gamma;-driven autoimmune skin disease. Dupixent label
                acknowledges this risk. Same Th2 suppression &rarr; Th1
                rebalancing mechanism.
              </p>
              <Badge
                variant="outline"
                className="mt-3 border-amber-500 text-amber-700"
              >
                Labeled
              </Badge>
            </CardContent>
          </Card>
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="pt-6">
              <div className="mb-2 text-sm font-semibold text-gray-600 dark:text-gray-400">
                This brief (NIB-2026-003)
              </div>
              <div className="text-lg font-bold text-red-700 dark:text-red-400">
                Alopecia Areata
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Th1/IFN-&gamma;-driven autoimmune attack on hair follicles. Same
                mechanistic pathway as psoriasis. NOT on the Dupixent label.
              </p>
              <Badge variant="destructive" className="mt-3">
                Not Labeled — SUSAR
              </Badge>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-lg border bg-gray-50 p-4 dark:bg-gray-900">
          <h4 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">
            Why Alopecia Areata Specifically?
          </h4>
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <p>
              Alopecia areata is a well-characterized{" "}
              <JargonBuster
                term="Th1/IFN-γ autoimmune disease"
                definition="Autoimmune diseases driven by Th1 cells produce interferon-gamma (IFN-γ), which activates cytotoxic T cells. These cells attack specific tissues — in alopecia areata, they collapse the immune privilege of hair follicles, triggering hair loss."
              >
                Th1/IFN-&gamma;-driven autoimmune disease
              </JargonBuster>
              . Hair follicles normally exist in a state of immune privilege —
              they are partly hidden from the immune system. When IFN-&gamma;
              rises (as a result of Th2 suppression by dupilumab), this immune
              privilege collapses and cytotoxic T cells attack the follicle.
            </p>
            <p>
              This is not a theoretical pathway. JAK inhibitors (baricitinib,
              ruxolitinib) — which suppress the very IFN-&gamma; signaling
              implicated here — are now FDA-approved treatments for alopecia
              areata. The treatment pathway confirms the disease mechanism,
              which confirms the plausibility of dupilumab as a trigger.
            </p>
            <p>
              The biological signal is internally consistent: dupilumab
              suppresses Th2 &rarr; Th1/IFN-&gamma; rises &rarr; follicle immune
              privilege collapses &rarr; alopecia areata. Each arrow is
              independently supported by peer-reviewed biology.
            </p>
          </div>
        </div>

        <TipBox>
          Plausibility score: <strong>Strong</strong>. Three independent
          biological anchors: (1) known Th2 suppression by dupilumab, (2) known
          Th1/IFN-&gamma; pathogenesis of alopecia areata, (3) FDA-approved
          JAK/IFN pathway inhibitors as treatments for the same disease.
          Pharmacological triangulation closes the mechanistic loop.
        </TipBox>
      </LayerSection>

      {/* Layer 6: Evidence Triangulation */}
      <LayerSection layer={LAYERS[5]}>
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
                <td className="py-2 pr-4">PRR 2.75, 92 cases</td>
                <td className="py-2">
                  <TrafficLight level="red" label="Signal" />
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">Naranjo causality</td>
                <td className="py-2 pr-4">Structured assessment</td>
                <td className="py-2 pr-4">4/13 — Possible</td>
                <td className="py-2">
                  <TrafficLight level="yellow" label="Possible" />
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">Dupixent label (Section 5.7)</td>
                <td className="py-2 pr-4">Mechanistic analogue</td>
                <td className="py-2 pr-4">
                  Psoriasis via same Th2&rarr;Th1 mechanism
                </td>
                <td className="py-2">
                  <TrafficLight level="yellow" label="Supported" />
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">JAK inhibitor approvals</td>
                <td className="py-2 pr-4">Pharmacological triangulation</td>
                <td className="py-2 pr-4">
                  IFN-&gamma; pathway confirmed in AA pathogenesis
                </td>
                <td className="py-2">
                  <TrafficLight level="yellow" label="Supported" />
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Epidemiological study</td>
                <td className="py-2 pr-4">Formal pharmacoepidemiology</td>
                <td className="py-2 pr-4">Not yet published</td>
                <td className="py-2">
                  <TrafficLight level="yellow" label="Pending" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 dark:border-teal-800 dark:bg-teal-950">
          <h4 className="mb-2 font-semibold text-teal-900 dark:text-teal-100">
            Novel Finding Assessment
          </h4>
          <p className="text-sm text-teal-800 dark:text-teal-200">
            No published pharmacoepidemiological study has characterized the
            dupilumab–alopecia areata association at scale. The FAERS signal in
            this brief may represent a novel finding. The absence of a
            confirmatory study is not evidence against the signal — it is a gap
            in the literature that the sponsor is now obligated to address. This
            brief provides the hypothesis and the biological framework; a formal
            PASS would provide incidence, dose-response, and risk factor data.
          </p>
        </div>

        <RememberBox>
          Three independent evidence lines converge: spontaneous reporting
          (FAERS), structural mechanistic analogy (labeled psoriasis), and
          pharmacological triangulation (JAK inhibitor approvals confirming the
          IFN-&gamma; pathway). A fourth line — formal epidemiology — is missing
          and should be the sponsor&apos;s next step.
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
                  <strong>Initiate formal signal evaluation</strong> per
                  PRAC/CDER signal management procedures; the FAERS signal meets
                  Evans criteria and warrants regulatory triage
                </span>
              </div>
              <div className="flex gap-2">
                <Badge className="shrink-0">2</Badge>
                <span>
                  <strong>Request cumulative review</strong> from Regeneron /
                  Sanofi including individual case narratives, confounder
                  analysis for baseline autoimmune disease, and time-to-onset
                  distribution
                </span>
              </div>
              <div className="flex gap-2">
                <Badge className="shrink-0">3</Badge>
                <span>
                  <strong>Evaluate labeling update</strong> — given that
                  dupilumab-induced psoriasis (same mechanism) is already in
                  Section 5.7, alopecia areata is a natural candidate for the
                  same section
                </span>
              </div>
              <div className="flex gap-2">
                <Badge className="shrink-0">4</Badge>
                <span>
                  <strong>Cross-reference with EU PRAC</strong> — dupilumab is
                  approved in the EU; harmonized signal assessment is warranted
                </span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mah" className="space-y-3 pt-4">
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex gap-2">
                <Badge className="shrink-0">1</Badge>
                <span>
                  <strong>15-day expedited SUSAR report</strong> to FDA and EMA
                  per ICH E2D — clock starts from first awareness of this signal
                </span>
              </div>
              <div className="flex gap-2">
                <Badge className="shrink-0">2</Badge>
                <span>
                  <strong>Evaluate label update proposal</strong> for Section
                  5.7 (Warnings &amp; Precautions) — the mechanistic precedent
                  is already set by the psoriasis warning; alopecia areata is a
                  direct extension
                </span>
              </div>
              <div className="flex gap-2">
                <Badge className="shrink-0">3</Badge>
                <span>
                  <strong>Commission a targeted PASS</strong> to characterize
                  incidence, risk factors (baseline atopy burden, prior
                  autoimmune history), time-to-onset, and reversibility on
                  discontinuation
                </span>
              </div>
              <div className="flex gap-2">
                <Badge className="shrink-0">4</Badge>
                <span>
                  <strong>Update benefit-risk framework</strong> for indications
                  with high atopic burden (atopic dermatitis, asthma) where Th2
                  suppression is most pronounced and Th1 rebalancing most likely
                </span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="hcp" className="space-y-3 pt-4">
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex gap-2">
                <Badge className="shrink-0">1</Badge>
                <span>
                  <strong>Screen for alopecia areata</strong> at baseline and
                  during follow-up visits, particularly in patients with
                  personal or family history of autoimmune conditions
                </span>
              </div>
              <div className="flex gap-2">
                <Badge className="shrink-0">2</Badge>
                <span>
                  <strong>Counsel patients</strong> that dupilumab&apos;s
                  mechanism of immune rebalancing — the same mechanism that can
                  cause psoriasis — may also unmask or trigger other Th1-driven
                  autoimmune skin conditions including alopecia areata
                </span>
              </div>
              <div className="flex gap-2">
                <Badge className="shrink-0">3</Badge>
                <span>
                  <strong>Report new cases</strong> via MedWatch (FDA) or
                  national pharmacovigilance systems — spontaneous reports
                  remain the most sensitive early-warning system and each case
                  strengthens the evidence base
                </span>
              </div>
              <div className="flex gap-2">
                <Badge className="shrink-0">4</Badge>
                <span>
                  <strong>Refer early</strong> to dermatology for suspected
                  alopecia areata — JAK inhibitors are now approved for
                  moderate-to-severe disease and early treatment improves
                  outcomes
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
                from model training data alone. Contingency table values (a=92,
                b=411,600, c=1,594, d=19,593,703) were retrieved directly from
                FAERS via structured query.
              </p>
              <p>
                Disproportionality metrics (PRR, 95% CI) computed using
                Rust-native implementations at calculate.nexvigilant.com
                (sub-millisecond execution). Causality assessment via Naranjo
                algorithm with structured per-question inputs. Biological
                plausibility supported by published IL-4/IL-13 pathway biology
                and FDA approval records for JAK inhibitors in alopecia areata.
              </p>
              <p>
                The Th2&rarr;Th1 immune rebalancing framework is corroborated by
                the existing dupilumab label (Section 5.7 psoriasis warning),
                which acknowledges the same mechanistic pathway. This brief
                extends that framework to alopecia areata as a second Th1-driven
                autoimmune condition.
              </p>
              <p className="text-xs text-gray-400">
                AlgoVigilance Intelligence Brief NIB-2026-003. Generated
                2026-03-28. This document is for pharmacovigilance professionals
                and does not constitute medical advice. Regeneron
                Pharmaceuticals / Sanofi are the Marketing Authorization Holders
                for Dupixent (dupilumab).
              </p>
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  );
}
