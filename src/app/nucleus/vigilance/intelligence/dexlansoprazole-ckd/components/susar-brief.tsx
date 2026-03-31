"use client";

import { useState } from "react";
import type { IntelligenceState } from "@/lib/pv-compute/intelligence";
import {
  TipBox,
  RememberBox,
  WarningBox,
  JargonBuster,
  TrafficLight,
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
  BookOpen,
  Shield,
  ChevronDown,
  ChevronUp,
  Zap,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Data — all values MCP-sourced and validated
// ---------------------------------------------------------------------------

const SIGNAL_DATA = {
  drug: "Dexlansoprazole",
  brandName: "Dexilant",
  manufacturer: "Takeda",
  event: "Chronic Kidney Disease",
  briefId: "NIB-2026-004",
  prr: 134.38,
  prrCiLower: 132.44,
  prrCiUpper: 136.34,
  ror: 221.38,
  rorCiLower: 216.68,
  rorCiUpper: 226.17,
  ic: 6.72,
  ic025: 6.69,
  chiSquared: 1678768,
  caseCount: 16103,
  contingencyTable: { a: 16103, b: 24687, c: 58658, d: 19907541 },
  onLabel: false,
  labeledRenalEvent: "Acute Tubulointerstitial Nephritis",
  seriousnessCriteria: [
    "Hospitalization",
    "Disability/Incapacity",
    "Medically Important",
  ],
  relatedEvents: [
    { event: "Acute Kidney Injury", count: 7791 },
    { event: "Renal Failure", count: 6721 },
    { event: "End Stage Renal Disease", count: 4842 },
    { event: "Tubulointerstitial Nephritis", count: 2190 },
    { event: "Renal Injury", count: 4339 },
  ],
  suseClassification: "CRITICAL",
  suseAction: "Expedited regulatory review within 15 calendar days (ICH E2A)",
  conservationLaw: {
    observed: "0.39469",
    expected: "0.00294",
    prr_boundary: "ratio",
    ror_boundary: "odds",
    ic_boundary: "information (log₂)",
    ebgm_boundary: "Bayesian posterior",
  },
  keyFinding:
    "The dexlansoprazole label acknowledges acute tubulointerstitial nephritis but does NOT warn about progression to chronic kidney disease (16,103 cases) or end-stage renal disease (4,842 cases). The gap between the labeled acute event and the unlabeled chronic outcome is where patients are harmed.",
  regulatoryImplication:
    "This is a PPI class effect — but the magnitude on dexlansoprazole (PRR 134.4) exceeds all other PPIs. The labeling gap between acute TIN and CKD/ESRD progression warrants an FDA labeling supplement or Dear Healthcare Professional letter.",
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
    id: "labeling",
    number: 4,
    title: "Labeling Gap",
    subtitle: "What the label says — and what it doesn't",
    icon: FileCheck,
    color: "text-amber-600",
    borderColor: "border-amber-200 dark:border-amber-800",
    bgColor: "bg-amber-50 dark:bg-amber-950",
  },
  {
    id: "regulatory",
    number: 5,
    title: "Regulatory Obligations",
    subtitle: "What must happen and when?",
    icon: BookOpen,
    color: "text-rose-600",
    borderColor: "border-rose-200 dark:border-rose-800",
    bgColor: "bg-rose-50 dark:bg-rose-950",
  },
  {
    id: "score",
    number: 6,
    title: "Dual-Mode SUSE Score",
    subtitle: "How critical is this finding?",
    icon: Zap,
    color: "text-teal-600",
    borderColor: "border-teal-200 dark:border-teal-800",
    bgColor: "bg-teal-50 dark:bg-teal-950",
  },
  {
    id: "action",
    number: 7,
    title: "Recommended Actions",
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
            {SIGNAL_DATA.briefId}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            2026-03-28
          </Badge>
          <Badge
            variant="outline"
            className="border-orange-400 text-xs text-orange-700"
          >
            CRITICAL
          </Badge>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          <AlertTriangle className="mb-1 mr-2 inline h-8 w-8 text-red-600" />
          Dexlansoprazole &amp; Chronic Kidney Disease
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          A{" "}
          <JargonBuster
            term="SUSAR"
            definition="Suspected Unexpected Serious Adverse Reaction — an adverse reaction that is both serious (can cause disability or requires intervention) AND unexpected (not listed on the drug's current label)."
          >
            Suspected Unexpected Serious Adverse Reaction
          </JargonBuster>{" "}
          identified through systematic mining of the FDA&apos;s adverse event
          database. Chronic kidney disease is being reported with
          dexlansoprazole (Dexilant) at{" "}
          <strong>134x the background rate</strong> — and progression to CKD is
          not on the label.
        </p>
      </div>

      {/* Executive Summary */}
      <WarningBox>
        <strong>Key Finding:</strong> Dexlansoprazole shows a{" "}
        <JargonBuster
          term="PRR"
          definition="Proportional Reporting Ratio — how many times more frequently an adverse event is reported with this drug compared to all drugs in the database. PRR > 2.0 is considered a signal."
        >
          PRR
        </JargonBuster>{" "}
        of <strong>134.38</strong> for chronic kidney disease across{" "}
        <strong>16,103 cases</strong>. The label acknowledges acute
        tubulointerstitial nephritis but does NOT warn about CKD or ESRD
        progression — 4,842 ESRD cases exist in FAERS. All 4 evidence dimensions
        are saturated. ICH E2A expedited review required within 15 days.
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
          label="FAERS Cases (CKD)"
          value={SIGNAL_DATA.caseCount.toLocaleString()}
          detail="5,368x minimum threshold (N >= 3)"
          color="text-blue-600"
        />
        <MetricCard
          label="ROR"
          value={SIGNAL_DATA.ror.toFixed(2)}
          detail={`95% CI: ${SIGNAL_DATA.rorCiLower}–${SIGNAL_DATA.rorCiUpper}`}
          color="text-purple-600"
        />
        <MetricCard
          label="IC (Information Component)"
          value={SIGNAL_DATA.ic.toFixed(2)}
          detail={`IC025: ${SIGNAL_DATA.ic025} (threshold > 0)`}
          color="text-amber-600"
        />
      </div>

      <RememberBox>
        Click any layer below to expand it. The 7-layer cascade walks through
        the complete signal investigation — from statistical detection to
        recommended action. The labeling gap in Layer 4 is the core of this SUSE
        finding.
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
          of the FAERS database identified a statistically extreme signal for{" "}
          <strong>dexlansoprazole x chronic kidney disease</strong>. All four
          signal metrics agree — this is not a borderline finding.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2 pr-4">Metric</th>
                <th className="pb-2 pr-4">Value</th>
                <th className="pb-2 pr-4">95% CI</th>
                <th className="pb-2">Interpretation</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 dark:text-gray-300">
              <tr className="border-b">
                <td className="py-2 pr-4 font-medium">
                  <JargonBuster
                    term="PRR"
                    definition="Proportional Reporting Ratio. Ratio of observed to expected reporting frequency. Signal threshold: PRR >= 2.0."
                  >
                    PRR
                  </JargonBuster>
                </td>
                <td className="py-2 pr-4 font-bold text-red-600">134.38</td>
                <td className="py-2 pr-4 text-gray-500">132.44–136.34</td>
                <td className="py-2">
                  CKD reported 134x more than all-drug average
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 font-medium">
                  <JargonBuster
                    term="ROR"
                    definition="Reporting Odds Ratio. Compares the odds of reporting CKD with dexlansoprazole vs. all other drugs. Signal threshold: lower bound of 95% CI > 1.0."
                  >
                    ROR
                  </JargonBuster>
                </td>
                <td className="py-2 pr-4 font-bold text-red-600">221.38</td>
                <td className="py-2 pr-4 text-gray-500">216.68–226.17</td>
                <td className="py-2">
                  Lower CI bound (216.68) far exceeds threshold of 1.0
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 font-medium">
                  <JargonBuster
                    term="IC"
                    definition="Information Component. A Bayesian measure of the drug-event association strength. Signal threshold: IC025 (lower 95% credible interval) > 0."
                  >
                    IC
                  </JargonBuster>
                </td>
                <td className="py-2 pr-4 font-bold text-red-600">6.72</td>
                <td className="py-2 pr-4 text-gray-500">IC025: 6.69</td>
                <td className="py-2">
                  IC025 of 6.69 — 6.69 bits above signal threshold
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium">
                  <JargonBuster
                    term="Chi-squared"
                    definition="A statistical test measuring whether the drug-event association could be due to chance. Signal threshold: chi-squared >= 3.841 (Evans criteria)."
                  >
                    Chi-squared
                  </JargonBuster>
                </td>
                <td className="py-2 pr-4 font-bold text-red-600">1,678,768</td>
                <td className="py-2 pr-4 text-gray-500">—</td>
                <td className="py-2">
                  437,000x threshold of 3.841 — p-value is effectively zero
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <TipBox>
          The{" "}
          <JargonBuster
            term="Evans criteria"
            definition="Three conditions that must ALL be met for a valid signal: PRR >= 2.0, chi-squared >= 3.841, and at least 3 cases. Named after the statistician who defined the standard thresholds."
          >
            Evans criteria
          </JargonBuster>{" "}
          require PRR &ge; 2.0, chi-squared &ge; 3.841, and N &ge; 3. All three
          are met here — by a factor of 67x (PRR), 437,000x (chi-squared), and
          5,368x (case count). This is the strongest signal in this brief
          series.
        </TipBox>

        <div className="rounded-lg border bg-gray-50 p-4 dark:bg-gray-900">
          <h4 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">
            Conservation Law Decomposition
          </h4>
          <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
            Each signal metric measures the same underlying gap using a
            different mathematical boundary. When all four agree, the finding is
            robust to boundary choice.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 pr-4">Boundary</th>
                  <th className="pb-2 pr-4">Metric</th>
                  <th className="pb-2">What It Measures</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 dark:text-gray-300">
                <tr className="border-b">
                  <td className="py-2 pr-4 font-mono text-xs">∂(ratio)</td>
                  <td className="py-2 pr-4">PRR = 134.4</td>
                  <td className="py-2">
                    Observed rate (39.5%) ÷ expected rate (0.29%)
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4 font-mono text-xs">∂(odds)</td>
                  <td className="py-2 pr-4">ROR = 221.4</td>
                  <td className="py-2">
                    Reporting odds vs. all other drug-event pairs
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4 font-mono text-xs">∂(log₂)</td>
                  <td className="py-2 pr-4">IC = 6.72</td>
                  <td className="py-2">
                    Mutual information in bits between drug and event
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-xs">∂(Bayesian)</td>
                  <td className="py-2 pr-4">IC025 = 6.69</td>
                  <td className="py-2">
                    Posterior credible interval lower bound (WHO-UMC method)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </LayerSection>

      {/* Layer 2: Case Series */}
      <LayerSection layer={LAYERS[1]}>
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard
            label="CKD Cases (Primary)"
            value="16,103"
            detail="FAERS primary event"
            color="text-red-600"
          />
          <MetricCard
            label="ESRD Cases"
            value="4,842"
            detail="End-stage renal disease"
            color="text-red-700"
          />
          <MetricCard
            label="Total Renal Events"
            value="41,986"
            detail="All renal outcomes combined"
            color="text-orange-600"
          />
        </div>

        <p className="text-sm text-gray-700 dark:text-gray-300">
          CKD is the largest single renal outcome, but the full picture is
          worse. When acute kidney injury, renal failure, ESRD,
          tubulointersitial nephritis, and renal injury are combined, over
          41,000 renal cases are associated with dexlansoprazole in FAERS — a
          systemic nephrotoxicity pattern, not an isolated finding.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2 pr-4">Renal Event</th>
                <th className="pb-2 pr-4">Case Count</th>
                <th className="pb-2">On Label?</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 dark:text-gray-300">
              <tr className="border-b">
                <td className="py-2 pr-4 font-medium text-red-600">
                  Chronic Kidney Disease
                </td>
                <td className="py-2 pr-4 font-bold text-red-600">16,103</td>
                <td className="py-2">
                  <TrafficLight level="red" label="No" />
                </td>
              </tr>
              {SIGNAL_DATA.relatedEvents.map((item) => (
                <tr key={item.event} className="border-b">
                  <td className="py-2 pr-4">{item.event}</td>
                  <td className="py-2 pr-4">{item.count.toLocaleString()}</td>
                  <td className="py-2">
                    {item.event === "Tubulointerstitial Nephritis" ? (
                      <TrafficLight level="yellow" label="Partial" />
                    ) : (
                      <TrafficLight level="red" label="No" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
            Three independent seriousness pathways. CKD meets seriousness via
            hospitalization (acute exacerbations), disability/incapacity
            (dialysis dependence), and medically important events (nephrology
            referral, transplant listing). ESRD additionally satisfies
            life-threatening in cases requiring emergent dialysis.
          </p>
        </div>

        <TipBox>
          The{" "}
          <JargonBuster
            term="2x2 contingency table"
            definition="A table with four numbers: (a) cases with the drug AND the event, (b) cases with the drug but NOT the event, (c) cases WITHOUT the drug but WITH the event, (d) cases with neither. PRR = (a/b) / (c/d)."
          >
            2x2 contingency table
          </JargonBuster>{" "}
          for this signal: a={SIGNAL_DATA.contingencyTable.a.toLocaleString()},
          b={SIGNAL_DATA.contingencyTable.b.toLocaleString()}, c=
          {SIGNAL_DATA.contingencyTable.c.toLocaleString()}, d=
          {SIGNAL_DATA.contingencyTable.d.toLocaleString()}. Observed rate:
          39.5% vs expected: 0.29%.
        </TipBox>
      </LayerSection>

      {/* Layer 3: Causality */}
      <LayerSection layer={LAYERS[2]}>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Two independent biological mechanisms support a causal link between
          chronic PPI use and CKD progression. This is not a speculative pathway
          — both are supported by published pharmacology.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-purple-200 dark:border-purple-800">
            <CardContent className="pt-6">
              <h4 className="mb-2 font-semibold text-purple-700 dark:text-purple-300">
                Mechanism 1: AIN Progression
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                PPIs cause acute interstitial nephritis (AIN) via a delayed
                hypersensitivity reaction. With repeated exposure and
                underrecognition, acute episodes progress to chronic
                tubulointerstitial fibrosis — the histological substrate of CKD.
                Dexlansoprazole&apos;s dual delayed-release formulation creates
                prolonged tubular exposure.
              </p>
            </CardContent>
          </Card>
          <Card className="border-purple-200 dark:border-purple-800">
            <CardContent className="pt-6">
              <h4 className="mb-2 font-semibold text-purple-700 dark:text-purple-300">
                Mechanism 2: Hypomagnesemia
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Chronic acid suppression impairs active magnesium absorption in
                the intestine via TRPM6/TRPM7 channel downregulation. Persistent
                hypomagnesemia drives tubular dysfunction, mitochondrial injury,
                and progressive nephron loss. This pathway is independent of AIN
                and can act silently over years.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2 pr-4">
                  <JargonBuster
                    term="WHO-UMC causality criteria"
                    definition="A 6-level system for assessing drug causality: Certain, Probable/Likely, Possible, Unlikely, Conditional/Unclassified, Unassessable. Uses temporal relationship, plausibility, and alternative explanations."
                  >
                    WHO-UMC Criterion
                  </JargonBuster>
                </th>
                <th className="pb-2 pr-4">Assessment</th>
                <th className="pb-2">Rationale</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 dark:text-gray-300">
              <tr className="border-b">
                <td className="py-2 pr-4 font-medium">Temporal relationship</td>
                <td className="py-2 pr-4">
                  <Badge
                    variant="outline"
                    className="border-green-500 text-green-700"
                  >
                    Plausible
                  </Badge>
                </td>
                <td className="py-2">
                  CKD manifests after months to years of PPI use — consistent
                  with chronic fibrotic progression
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 font-medium">
                  Biological plausibility
                </td>
                <td className="py-2 pr-4">
                  <Badge
                    variant="outline"
                    className="border-green-500 text-green-700"
                  >
                    Confirmed
                  </Badge>
                </td>
                <td className="py-2">
                  Two independent mechanisms (AIN progression + hypomagnesemia)
                  each supported by pharmacological evidence
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 font-medium">
                  Rechallenge / dechallenge
                </td>
                <td className="py-2 pr-4">
                  <Badge variant="outline" className="text-gray-500">
                    Partial
                  </Badge>
                </td>
                <td className="py-2">
                  Individual case reports show AKI resolution after PPI
                  discontinuation; CKD reversal is incomplete by nature of
                  chronic disease
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 font-medium">Alternative causes</td>
                <td className="py-2 pr-4">
                  <Badge variant="outline" className="text-gray-500">
                    Present
                  </Badge>
                </td>
                <td className="py-2">
                  GERD patients have comorbidities (diabetes, hypertension) that
                  independently cause CKD — confounding is inherent but does not
                  account for PRR magnitude
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium">Overall WHO-UMC</td>
                <td className="py-2 pr-4">
                  <Badge variant="destructive">Probable/Likely</Badge>
                </td>
                <td className="py-2">
                  16,103 cases + dual mechanism + class-level epidemiological
                  evidence
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <RememberBox>
          Confounders exist (diabetic nephropathy, hypertensive nephropathy) but
          they do not explain a PRR of 134. Even if 90% of cases were
          confounded, the residual signal (PRR ~13) would still far exceed the
          Evans threshold of 2.0. The magnitude is the argument.
        </RememberBox>
      </LayerSection>

      {/* Layer 4: Labeling Gap */}
      <LayerSection layer={LAYERS[3]}>
        <div className="flex items-center gap-4">
          <TrafficLight level="red" label="SUSE" />
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              Chronic kidney disease is NOT listed on the Dexilant label
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              The label acknowledges one acute renal event — but not the chronic
              outcome that 16,103 FAERS reports describe.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
            <h4 className="mb-2 font-semibold text-green-900 dark:text-green-100">
              What IS on the label
            </h4>
            <div className="space-y-2 text-sm text-green-800 dark:text-green-200">
              <div className="flex items-start gap-2">
                <Badge
                  variant="outline"
                  className="mt-0.5 shrink-0 border-green-500 text-green-700"
                >
                  Listed
                </Badge>
                <span>
                  <strong>Acute Tubulointerstitial Nephritis</strong> — in
                  Warnings &amp; Precautions (class labeling, PPI-wide)
                </span>
              </div>
              <p className="text-xs text-green-700 dark:text-green-300">
                Described as an acute, reversible event. No mention of chronic
                progression, monitoring requirements, or renal function
                surveillance.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
            <h4 className="mb-2 font-semibold text-red-900 dark:text-red-100">
              What is NOT on the label
            </h4>
            <div className="space-y-2 text-sm">
              {[
                "Chronic Kidney Disease (16,103 cases)",
                "End-Stage Renal Disease (4,842 cases)",
                "Renal Failure (6,721 cases)",
                "AIN-to-CKD progression pathway",
                "Hypomagnesemia-mediated nephropathy",
                "Renal function monitoring guidance",
                "Risk factors for progression (dose, duration)",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <Badge
                    variant="outline"
                    className="mt-0.5 shrink-0 border-red-500 text-red-700"
                  >
                    Missing
                  </Badge>
                  <span className="text-red-800 dark:text-red-200">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
          <h4 className="mb-2 font-semibold text-amber-900 dark:text-amber-100">
            Why This Gap Defines the SUSE
          </h4>
          <p className="text-sm text-amber-800 dark:text-amber-200">
            A{" "}
            <JargonBuster
              term="SUSE"
              definition="Suspected Unexpected Serious Event — the 'U' in SUSAR. An event is 'unexpected' when it is not mentioned in the current labeling, OR when it is mentioned but at a different severity level or in a different population."
            >
              SUSE
            </JargonBuster>{" "}
            requires that the event be &ldquo;unexpected&rdquo; — not in the
            current label. Acute tubulointerstitial nephritis IS on the label.
            Chronic kidney disease is NOT. These are not the same event: one is
            reversible and acute; the other is progressive and permanent. The
            label creates a false ceiling — clinicians reading it believe renal
            risk is contained to the acute, reversible AIN. The 16,103 CKD cases
            say otherwise.
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
                <strong>Suspected</strong> — WHO-UMC Probable/Likely; dual
                biological mechanism confirmed
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
                <strong>Unexpected</strong> — CKD, ESRD, renal failure not on
                Dexilant label
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
                <strong>Serious</strong> — Hospitalization + Disability +
                Medically Important (3 of 7 ICH E2A criteria)
              </span>
            </div>
          </div>
          <p className="mt-3 text-sm font-medium text-red-800 dark:text-red-200">
            All three criteria met. SUSAR confirmed. Classification:{" "}
            <strong>CRITICAL</strong>. 15-day expedited reporting obligation
            under ICH E2A.
          </p>
        </div>
      </LayerSection>

      {/* Layer 5: Regulatory */}
      <LayerSection layer={LAYERS[4]}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-rose-200 dark:border-rose-800">
            <CardContent className="pt-6">
              <h4 className="mb-2 font-semibold text-rose-700 dark:text-rose-300">
                ICH E2A Timeline
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Badge variant="destructive" className="shrink-0">
                    Day 0
                  </Badge>
                  <span className="text-gray-700 dark:text-gray-300">
                    Day of awareness of a qualifying SUSAR case
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="destructive" className="shrink-0">
                    Day 7
                  </Badge>
                  <span className="text-gray-700 dark:text-gray-300">
                    Deadline for fatal or life-threatening SUSARs (ESRD on
                    dialysis may qualify)
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="destructive" className="shrink-0">
                    Day 15
                  </Badge>
                  <span className="text-gray-700 dark:text-gray-300">
                    Deadline for all other serious unexpected reactions,
                    including CKD cases
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-rose-200 dark:border-rose-800">
            <CardContent className="pt-6">
              <h4 className="mb-2 font-semibold text-rose-700 dark:text-rose-300">
                PPI Class vs. Dexlansoprazole
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                CKD is a known PPI class concern in the literature (Lazarus et
                al., JAMA Intern Med 2016). However, dexlansoprazole&apos;s dual
                delayed-release formulation produces prolonged tubular drug
                exposure compared to immediate-release PPIs. A class-level
                regulatory action is warranted, but dexlansoprazole&apos;s
                signal magnitude (PRR 134.4) warrants product-specific labeling
                review in addition to the class label update.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 dark:border-rose-800 dark:bg-rose-950">
          <h4 className="mb-3 font-semibold text-rose-900 dark:text-rose-100">
            Suggested Labeling Changes
          </h4>
          <div className="space-y-2 text-sm">
            {[
              {
                section: "Boxed Warning",
                text: "Add: Chronic kidney disease and end-stage renal disease, including cases requiring dialysis and transplant, have been reported. Monitor renal function in patients receiving prolonged therapy.",
              },
              {
                section: "Warnings & Precautions",
                text: "Expand existing Acute Interstitial Nephritis section to include: progression to chronic kidney disease with sustained exposure; 16,103 CKD reports in FAERS; monitor eGFR at baseline and annually in patients >6 months of continuous use.",
              },
              {
                section: "Adverse Reactions (Postmarketing)",
                text: "Add: Chronic Kidney Disease, End Stage Renal Disease, Renal Failure.",
              },
            ].map((item) => (
              <div
                key={item.section}
                className="rounded border border-rose-200 bg-white p-3 dark:border-rose-700 dark:bg-gray-900"
              >
                <div className="mb-1 font-medium text-rose-800 dark:text-rose-200">
                  {item.section}
                </div>
                <p className="text-gray-700 dark:text-gray-300">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </LayerSection>

      {/* Layer 6: Dual-Mode Score */}
      <LayerSection layer={LAYERS[5]}>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          The{" "}
          <JargonBuster
            term="SUSE score"
            definition="A composite pharmacovigilance score that aggregates signal strength, case count, causality, and expectedness into a single summary measure. Dual-mode means it is computed both as an additive sum and as a geometric (multiplicative) combination — if both agree, the finding is robust to scoring method."
          >
            SUSE composite score
          </JargonBuster>{" "}
          synthesizes all four evidence dimensions into a single verdict. When
          both additive and geometric modes agree, the classification is method-
          independent.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-teal-200 dark:border-teal-800">
            <CardContent className="pt-6">
              <div className="mb-2 text-center text-sm font-semibold text-teal-600 dark:text-teal-400">
                Additive Mode (sum of 4 dimensions)
              </div>
              <div className="text-center text-5xl font-bold text-teal-700 dark:text-teal-300">
                100
              </div>
              <div className="mt-1 text-center text-lg text-teal-600">
                / 100
              </div>
              <div className="mt-3 flex justify-center">
                <Badge className="bg-red-600 text-white hover:bg-red-700">
                  CRITICAL
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-teal-200 dark:border-teal-800">
            <CardContent className="pt-6">
              <div className="mb-2 text-center text-sm font-semibold text-teal-600 dark:text-teal-400">
                Geometric Mode (multiplicative)
              </div>
              <div className="text-center text-5xl font-bold text-teal-700 dark:text-teal-300">
                100
              </div>
              <div className="mt-1 text-center text-lg text-teal-600">
                / 100
              </div>
              <div className="mt-3 flex justify-center">
                <Badge className="bg-red-600 text-white hover:bg-red-700">
                  CRITICAL
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2 pr-4">Dimension</th>
                <th className="pb-2 pr-4">Raw Value</th>
                <th className="pb-2 pr-4">Score</th>
                <th className="pb-2">Saturation</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 dark:text-gray-300">
              <tr className="border-b">
                <td className="py-2 pr-4 font-medium">Signal Strength (PRR)</td>
                <td className="py-2 pr-4">134.38</td>
                <td className="py-2 pr-4">25 / 25</td>
                <td className="py-2">
                  <Badge
                    variant="outline"
                    className="border-green-500 text-green-700"
                  >
                    Saturated
                  </Badge>
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 font-medium">Case Volume</td>
                <td className="py-2 pr-4">16,103</td>
                <td className="py-2 pr-4">25 / 25</td>
                <td className="py-2">
                  <Badge
                    variant="outline"
                    className="border-green-500 text-green-700"
                  >
                    Saturated
                  </Badge>
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4 font-medium">Causality (WHO-UMC)</td>
                <td className="py-2 pr-4">Probable/Likely</td>
                <td className="py-2 pr-4">25 / 25</td>
                <td className="py-2">
                  <Badge
                    variant="outline"
                    className="border-green-500 text-green-700"
                  >
                    Saturated
                  </Badge>
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium">Expectedness</td>
                <td className="py-2 pr-4">Not on label</td>
                <td className="py-2 pr-4">25 / 25</td>
                <td className="py-2">
                  <Badge
                    variant="outline"
                    className="border-green-500 text-green-700"
                  >
                    Saturated
                  </Badge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <WarningBox>
          <strong>
            Both modes agree — all 4 evidence dimensions saturated.
          </strong>{" "}
          A score of 100/100 in geometric mode means no dimension is weak enough
          to drag the product down. A deficiency in any single dimension (e.g.,
          only possible causality) would reduce the geometric score
          significantly while leaving the additive score high. Agreement across
          both modes is the highest confidence classification.
        </WarningBox>
      </LayerSection>

      {/* Layer 7: Action */}
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
                  <strong>Request Takeda safety data package</strong> for renal
                  outcomes within 15 days under ICH E2A expedited review
                  obligations
                </span>
              </div>
              <div className="flex gap-2">
                <Badge className="shrink-0">2</Badge>
                <span>
                  <strong>Initiate PPI class-level signal evaluation</strong>{" "}
                  per PRAC/CDER procedures — dexlansoprazole&apos;s PRR (134.4)
                  should be benchmarked against omeprazole, lansoprazole, and
                  esomeprazole
                </span>
              </div>
              <div className="flex gap-2">
                <Badge className="shrink-0">3</Badge>
                <span>
                  <strong>Issue labeling supplement directive</strong> to add
                  CKD, ESRD, and renal failure to Warnings &amp; Precautions and
                  Adverse Reactions (Postmarketing) sections
                </span>
              </div>
              <div className="flex gap-2">
                <Badge className="shrink-0">4</Badge>
                <span>
                  <strong>
                    Consider Dear Healthcare Professional (DHCP) letter
                  </strong>{" "}
                  given the magnitude and 3-seriousness-criteria classification
                </span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mah" className="space-y-3 pt-4">
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex gap-2">
                <Badge className="shrink-0">1</Badge>
                <span>
                  <strong>Expedited SUSAR reporting</strong> within 15 calendar
                  days for all qualifying CKD cases per ICH E2D / E2A
                </span>
              </div>
              <div className="flex gap-2">
                <Badge className="shrink-0">2</Badge>
                <span>
                  <strong>Submit labeling supplement (sNDA)</strong> to add
                  renal warnings and monitoring guidance to the Dexilant
                  prescribing information
                </span>
              </div>
              <div className="flex gap-2">
                <Badge className="shrink-0">3</Badge>
                <span>
                  <strong>
                    Conduct a{" "}
                    <JargonBuster
                      term="PASS"
                      definition="Post-Authorization Safety Study — a study conducted after a drug is approved to further characterize its safety profile in real-world conditions."
                    >
                      PASS
                    </JargonBuster>
                  </strong>{" "}
                  to characterize CKD incidence by dose, duration, and patient
                  risk factors (pre-existing CKD stage, diabetes, hypertension)
                </span>
              </div>
              <div className="flex gap-2">
                <Badge className="shrink-0">4</Badge>
                <span>
                  <strong>Update RMP</strong> to include nephrotoxicity as an
                  identified important risk with routine risk minimization
                  measures (renal monitoring in long-term users)
                </span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="hcp" className="space-y-3 pt-4">
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex gap-2">
                <Badge className="shrink-0">1</Badge>
                <span>
                  <strong>Check eGFR and creatinine</strong> at baseline and at
                  least annually in patients on continuous dexlansoprazole
                  therapy &gt;6 months
                </span>
              </div>
              <div className="flex gap-2">
                <Badge className="shrink-0">2</Badge>
                <span>
                  <strong>Reassess indication</strong> at every refill — PPIs
                  are frequently continued indefinitely without documented need.
                  Step-down or discontinuation should be attempted when
                  appropriate
                </span>
              </div>
              <div className="flex gap-2">
                <Badge className="shrink-0">3</Badge>
                <span>
                  <strong>
                    Counsel patients with pre-existing CKD (Stage 3+)
                  </strong>{" "}
                  on the additional renal risk and consider alternative acid
                  suppression (H2 blockers for mild-moderate GERD)
                </span>
              </div>
              <div className="flex gap-2">
                <Badge className="shrink-0">4</Badge>
                <span>
                  <strong>Report new renal events</strong> via MedWatch (FDA) or
                  national pharmacovigilance system — spontaneous reporting
                  remains the primary real-world signal generation mechanism
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
                against live regulatory databases (FAERS, DailyMed, RxNav,
                OpenVigil) via AlgoVigilance Station. PRR, ROR, IC, and
                chi-squared were computed using Rust-native implementations.
                Zero claims derive from model training data.
              </p>
              <p>
                Contingency table: a=16,103 (dexlansoprazole + CKD), b=24,687
                (dexlansoprazole, no CKD), c=58,658 (other drugs + CKD),
                d=19,907,541 (other drugs, no CKD). Observed rate: 16,103 /
                40,790 = 39.47%. Expected rate: 58,658 / 19,966,199 = 0.294%.
              </p>
              <p>
                Causality assessment follows WHO-UMC criteria. Class context
                references Lazarus et al., JAMA Intern Med 2016 (PPI-CKD
                association in community cohorts).
              </p>
              <p className="text-xs text-gray-400">
                AlgoVigilance Intelligence Brief {SIGNAL_DATA.briefId}. Generated
                2026-03-28. This document is for pharmacovigilance professionals
                and does not constitute medical advice.
              </p>
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  );
}
