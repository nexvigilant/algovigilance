"use client";

import { useState, useCallback } from "react";
import {
  TipBox,
  RememberBox,
  WarningBox,
  TrafficLight,
  JargonBuster,
} from "@/components/pv-for-nexvigilants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  MapPin,
  Shield,
  TrendingUp,
  Layers,
  GitCompareArrows,
  Check,
  AlertTriangle,
} from "lucide-react";
import {
  DATA_STRINGS,
  createBoundary,
  threadBoundary,
  reconcileHierarchy,
  compareEpistemicLevels,
} from "@/lib/pv-compute";
import type {
  DataString,
  BoundaryType,
  IntersectionResult,
  SignalComparison,
} from "@/lib/pv-compute";

// ---------------------------------------------------------------------------
// Epistemic level → display config
// ---------------------------------------------------------------------------

function epistemicConfig(level: string): {
  trafficLevel: "green" | "yellow" | "red";
  label: string;
} {
  switch (level) {
    case "counted":
      return { trafficLevel: "green", label: "Counted" };
    case "estimated":
      return { trafficLevel: "yellow", label: "Estimated" };
    default:
      return { trafficLevel: "red", label: "Unknown" };
  }
}

// ---------------------------------------------------------------------------
// Demo scenario data
// (source: simulated values for demonstration — not real patient data)
// ---------------------------------------------------------------------------

interface DemoScenario {
  drug: string;
  event: string;
  faersPRR: number;
  boundaries: {
    type: BoundaryType;
    value: string;
    strings: string[];
    population: number;
    events: number;
  }[];
}

const DEMO_SCENARIOS: DemoScenario[] = [
  {
    drug: "Ibuprofen",
    event: "GI Bleeding",
    faersPRR: 3.2,
    boundaries: [
      {
        type: "national",
        value: "United States",
        strings: ["ncpdp", "part_d", "faers"],
        population: 4200000,
        events: 2100,
      },
      {
        type: "state",
        value: "Massachusetts",
        strings: ["ncpdp", "part_d"],
        population: 185000,
        events: 89,
      },
      {
        type: "zip",
        value: "02139 (Cambridge)",
        strings: ["ncpdp"],
        population: 12400,
        events: 6,
      },
    ],
  },
  {
    drug: "Atorvastatin",
    event: "Rhabdomyolysis",
    faersPRR: 4.5,
    boundaries: [
      {
        type: "national",
        value: "United States",
        strings: ["ncpdp", "part_d", "ehr"],
        population: 8900000,
        events: 445,
      },
      {
        type: "chain",
        value: "CVS Pharmacy",
        strings: ["ncpdp"],
        population: 3200000,
        events: 170,
      },
      {
        type: "chain",
        value: "Walgreens",
        strings: ["ncpdp"],
        population: 2800000,
        events: 125,
      },
    ],
  },
  {
    drug: "Metformin",
    event: "Lactic Acidosis",
    faersPRR: 5.8,
    boundaries: [
      {
        type: "national",
        value: "United States",
        strings: ["faers"],
        population: 0,
        events: 847,
      },
      {
        type: "state",
        value: "Florida",
        strings: ["pdmp", "ehr"],
        population: 1200000,
        events: 24,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function CensusExplorer() {
  const [selectedScenario, setSelectedScenario] = useState<number | null>(null);
  const [results, setResults] = useState<IntersectionResult[]>([]);
  const [comparison, setComparison] = useState<SignalComparison | null>(null);

  const runScenario = useCallback((index: number) => {
    const scenario = DEMO_SCENARIOS[index];
    setSelectedScenario(index);

    const intersections = scenario.boundaries.map((b, i) => {
      const strings = b.strings
        .map((id) => DATA_STRINGS.find((s) => s.id === id))
        .filter((s): s is DataString => s !== undefined);

      const parentPop = i > 0 ? scenario.boundaries[0].population : undefined;

      return threadBoundary(
        createBoundary(b.type, b.value),
        strings,
        b.population,
        b.events,
        parentPop,
      );
    });

    setResults(intersections);

    if (intersections.length > 0) {
      setComparison(
        compareEpistemicLevels(
          scenario.drug,
          scenario.event,
          scenario.faersPRR,
          intersections[0],
        ),
      );
    }
  }, []);

  const scenario =
    selectedScenario !== null ? DEMO_SCENARIOS[selectedScenario] : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900 dark:text-gray-100">
          <Layers className="h-8 w-8 text-blue-600" />
          Thread the Boundary
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Thread a{" "}
          <JargonBuster
            term="Boundary (∂)"
            definition="A defined partition of space — geographic, temporal, institutional. Like drawing a line on a map and counting everything inside it."
          >
            boundary
          </JargonBuster>{" "}
          through{" "}
          <JargonBuster
            term="Data Strings"
            definition="Parallel data streams — FAERS reports, pharmacy transactions, Medicare claims, EHR records. Each carries signal independently. Threading a boundary through all of them simultaneously produces verified knowledge."
          >
            data strings
          </JargonBuster>{" "}
          to produce{" "}
          <JargonBuster
            term="Counted Knowledge"
            definition="When the denominator (total exposed patients) is directly counted from transaction records — not estimated, not modeled, counted. This produces real incidence rates, not statistical artifacts."
          >
            counted knowledge
          </JargonBuster>{" "}
          instead of estimated signals.
        </p>
      </div>

      {/* source: NV-COR-WP-001 March 4 2026, epistemic level framework */}
      <RememberBox>
        The NexCore methodology (source: NV-COR-WP-001) divides a{" "}
        <strong>counted numerator</strong> by a{" "}
        <strong>counted denominator</strong> to produce verified incidence
        rates. The boundary is what makes the denominator countable.
      </RememberBox>

      {/* Data String Catalog */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Strings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* source: DATA_STRINGS from nexcore-census.ts */}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {DATA_STRINGS.map((s) => (
              <div key={s.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{s.name}</span>
                  <Badge
                    variant={
                      s.denominatorType === "complete"
                        ? "default"
                        : s.denominatorType === "partial"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {s.denominatorType}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-gray-500">{s.description}</p>
                <div className="mt-2 text-xs text-gray-400">
                  Coverage: {(s.coverage * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Scenario Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Choose a Drug-Event Pair
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* source: simulated demo scenarios for illustration */}
          <div className="grid gap-2 sm:grid-cols-3">
            {DEMO_SCENARIOS.map((s, i) => (
              <Button
                key={i}
                variant={selectedScenario === i ? "default" : "outline"}
                onClick={() => runScenario(i)}
                className="h-auto flex-col items-start p-4 text-left"
              >
                <span className="font-semibold">{s.drug}</span>
                <span className="text-sm opacity-80">{s.event}</span>
                <span className="mt-1 text-xs opacity-60">
                  FAERS PRR: {s.faersPRR}
                </span>
              </Button>
            ))}
          </div>

          {selectedScenario === null && (
            <TipBox>
              Select a drug-event pair to see how NexCore threads boundaries
              through data strings. Watch the epistemic level change as
              different strings contribute denominator data.
            </TipBox>
          )}
        </CardContent>
      </Card>

      {/* Epistemic Comparison */}
      {comparison && scenario && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitCompareArrows className="h-5 w-5" />
              Epistemic Comparison: {scenario.drug} → {scenario.event}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* FAERS column */}
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
                <div className="mb-2 flex items-center gap-2">
                  <TrafficLight level="red" label="Unknown" />
                  <span className="font-semibold">FAERS</span>
                </div>
                <div className="text-2xl font-bold text-red-700">
                  PRR {comparison.faersLevel.prr.toFixed(1)}
                </div>
                <p className="mt-2 text-sm text-red-600">
                  {comparison.faersLevel.interpretation}
                </p>
                <div className="mt-2 text-xs text-red-400">
                  Denominator confidence: 0%
                </div>
              </div>

              {/* NexCore column */}
              <div
                className={`rounded-lg border p-4 ${
                  comparison.nexcoreLevel.epistemicLevel === "counted"
                    ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
                    : comparison.nexcoreLevel.epistemicLevel === "estimated"
                      ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950"
                      : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <TrafficLight
                    level={
                      epistemicConfig(comparison.nexcoreLevel.epistemicLevel)
                        .trafficLevel
                    }
                    label={
                      epistemicConfig(comparison.nexcoreLevel.epistemicLevel)
                        .label
                    }
                  />
                  <span className="font-semibold">NexCore</span>
                </div>
                <div
                  className={`text-2xl font-bold ${
                    comparison.nexcoreLevel.epistemicLevel === "counted"
                      ? "text-green-700"
                      : "text-amber-700"
                  }`}
                >
                  {(comparison.nexcoreLevel.incidenceRate * 1000).toFixed(2)}{" "}
                  <span className="text-sm font-normal">per 1,000</span>
                </div>
                <p
                  className={`mt-2 text-sm ${
                    comparison.nexcoreLevel.epistemicLevel === "counted"
                      ? "text-green-600"
                      : "text-amber-600"
                  }`}
                >
                  {comparison.nexcoreLevel.interpretation}
                </p>
                <div className="mt-2 text-xs text-gray-500">
                  Denominator confidence:{" "}
                  {(
                    comparison.nexcoreLevel.denominatorConfidence * 100
                  ).toFixed(0)}
                  %
                </div>
              </div>
            </div>

            {/* Epistemic gain */}
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-800 dark:bg-indigo-950">
              <span className="text-sm font-medium text-indigo-800 dark:text-indigo-200">
                Epistemic Gain:{" "}
              </span>
              <span className="text-sm text-indigo-700 dark:text-indigo-300">
                {comparison.epistemicGain}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Boundary Intersections */}
      {results.length > 0 && scenario && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Boundary Intersections
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {results.map((r, i) => {
              const eConfig = epistemicConfig(r.epistemicLevel);
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <TrafficLight
                    level={eConfig.trafficLevel}
                    label={eConfig.label}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{r.boundary.type}</Badge>
                      <span className="font-medium">{r.boundary.value}</span>
                      <Badge variant="secondary" className="text-xs">
                        {r.boundary.resolution}
                      </Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-sm text-gray-600">
                      <span>
                        Population:{" "}
                        <strong>{r.exposurePopulation.toLocaleString()}</strong>
                      </span>
                      <span>
                        Events: <strong>{r.adverseEvents}</strong>
                      </span>
                      <span>
                        Rate:{" "}
                        <strong>
                          {(r.incidenceRate * 1000).toFixed(2)}/1K
                        </strong>
                      </span>
                      <span>
                        Denominator:{" "}
                        <strong>
                          {(r.denominatorConfidence * 100).toFixed(0)}%
                        </strong>
                      </span>
                    </div>
                    <div className="mt-1 flex gap-1">
                      {r.strings.map((s) => (
                        <Badge
                          key={s.id}
                          variant="outline"
                          className={`text-xs ${
                            s.denominatorType === "complete"
                              ? "border-green-300 text-green-700"
                              : s.denominatorType === "partial"
                                ? "border-amber-300 text-amber-700"
                                : "border-red-300 text-red-700"
                          }`}
                        >
                          {s.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {r.reconciles ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>
              );
            })}

            {/* Reconciliation check */}
            {results.length > 1 && (
              <div className="mt-2">
                {(() => {
                  const recon = reconcileHierarchy(
                    results[0],
                    results.slice(1),
                  );
                  return recon.allReconcile ? (
                    <TipBox>
                      All boundary levels reconcile upward. Coverage:{" "}
                      {(recon.totalCoverage * 100).toFixed(0)}% of parent
                      population accounted for at child boundaries.
                    </TipBox>
                  ) : (
                    <WarningBox>
                      Reconciliation discrepancies detected — numbers don&apos;t
                      sum correctly across boundary levels. This itself is a
                      data quality signal.
                      {recon.discrepancies.map((d, i) => (
                        <div key={i} className="mt-1 text-xs">
                          {d}
                        </div>
                      ))}
                    </WarningBox>
                  );
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Metformin warning — FAERS-only scenario */}
      {selectedScenario === 2 && results.length > 0 && (
        <WarningBox>
          The national-level intersection for Metformin uses{" "}
          <strong>FAERS only</strong> (source: demo scenario string
          configuration) — no pharmacy denominator data. The epistemic level
          shows &quot;Unknown&quot; despite 847 reports. The Florida state
          boundary threads PDMP + EHR strings, upgrading the epistemic level to
          &quot;Estimated.&quot; Adding NCPDP or Part D data would further
          upgrade it to &quot;Counted.&quot;
        </WarningBox>
      )}
    </div>
  );
}
