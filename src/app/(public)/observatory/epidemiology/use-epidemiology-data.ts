/**
 * useEpidemiologyData — React hook for population risk surface data.
 *
 * POSTs to /api/nexcore/api/v1/mcp/epidemiology_relative_risk when a cohort
 * query of at least 2 characters is provided. Falls back to hardcoded demo
 * data for the 5 reference population cohorts when the API fails or the
 * query is empty.
 *
 * Migrated to useSWRData for cross-page caching and request deduplication.
 */

"use client";

import { useMemo } from "react";
import { useSWRData } from "@/hooks/use-swr-data";
import { mcpFetch } from "@/lib/observatory/mcp-fetch";

// ─── MCP Response Types ───────────────────────────────────────────────────────

interface EpiResult {
  relative_risk: number;
  confidence_interval: [number, number];
  attributable_fraction: number;
  nnt: number;
}

// ─── Domain Types ─────────────────────────────────────────────────────────────

export interface SurvivalPoint {
  time: number;
  probability: number;
}

export interface EpiCohort {
  name: string;
  population: number;
  incidenceRate: number;
  prevalence: number;
  relativeRisk: number;
  attributableFraction: number;
  survivalCurve: SurvivalPoint[];
}

export interface EpiDataset {
  cohorts: EpiCohort[];
  selectedCohort: string;
  surfaceFn: (x: number, y: number) => number;
}

// ─── Demo Survival Curves ────────────────────────────────────────────────────

/** Generate a Kaplan-Meier–like survival curve with realistic shape. */
function makeSurvivalCurve(
  baseHazard: number,
  acceleration: number,
): SurvivalPoint[] {
  const N = 20;
  return Array.from({ length: N }, (_, i) => {
    const t = (i / (N - 1)) * 10;
    // Weibull-like decay: S(t) = exp(-lambda * t^kappa)
    const lambda = baseHazard;
    const kappa = 1 + acceleration;
    const probability = Math.exp(-lambda * Math.pow(t, kappa));
    return { time: t, probability: Math.max(0, Math.min(1, probability)) };
  });
}

// ─── Demo Data ────────────────────────────────────────────────────────────────

const DEMO_COHORTS: EpiCohort[] = [
  {
    name: "General Population",
    population: 1_000_000,
    incidenceRate: 0.05,
    prevalence: 0.12,
    relativeRisk: 1.0,
    attributableFraction: 0.0,
    survivalCurve: makeSurvivalCurve(0.025, 0.1),
  },
  {
    name: "Elderly (65+)",
    population: 280_000,
    incidenceRate: 0.14,
    prevalence: 0.31,
    relativeRisk: 2.8,
    attributableFraction: 0.64,
    survivalCurve: makeSurvivalCurve(0.07, 0.4),
  },
  {
    name: "Pediatric (<18)",
    population: 220_000,
    incidenceRate: 0.018,
    prevalence: 0.04,
    relativeRisk: 0.36,
    attributableFraction: -1.78,
    survivalCurve: makeSurvivalCurve(0.009, 0.05),
  },
  {
    name: "Renal Impairment",
    population: 65_000,
    incidenceRate: 0.22,
    prevalence: 0.48,
    relativeRisk: 4.4,
    attributableFraction: 0.77,
    survivalCurve: makeSurvivalCurve(0.12, 0.6),
  },
  {
    name: "Hepatic Impairment",
    population: 42_000,
    incidenceRate: 0.19,
    prevalence: 0.41,
    relativeRisk: 3.8,
    attributableFraction: 0.74,
    survivalCurve: makeSurvivalCurve(0.1, 0.55),
  },
];

// ─── Surface Function Builder ─────────────────────────────────────────────────

function buildSurfaceFn(
  cohorts: EpiCohort[],
): (x: number, y: number) => number {
  const sorted = [...cohorts].sort((a, b) => a.relativeRisk - b.relativeRisk);
  const n = sorted.length;

  return (x: number, y: number): number => {
    const time = ((x + 5) / 10) * 10;
    const riskFactor = (y + 5) / 10;

    const scaledIdx = riskFactor * (n - 1);
    const loIdx = Math.max(0, Math.min(n - 2, Math.floor(scaledIdx)));
    const hiIdx = loIdx + 1;
    const t = scaledIdx - loIdx;

    const loCohort = sorted[loIdx];
    const hiCohort = sorted[hiIdx];

    if (!loCohort || !hiCohort) return 1;

    function survivalAt(cohort: EpiCohort, timePoint: number): number {
      const curve = cohort.survivalCurve;
      if (curve.length === 0) return 1;

      const lastPt = curve[curve.length - 1];
      if (!lastPt) return 1;
      if (timePoint >= lastPt.time) return lastPt.probability;

      const firstPt = curve[0];
      if (!firstPt) return 1;
      if (timePoint <= firstPt.time) return firstPt.probability;

      for (let i = 0; i < curve.length - 1; i++) {
        const a = curve[i];
        const b = curve[i + 1];
        if (!a || !b) continue;
        if (timePoint >= a.time && timePoint <= b.time) {
          const frac =
            b.time === a.time ? 0 : (timePoint - a.time) / (b.time - a.time);
          return a.probability + frac * (b.probability - a.probability);
        }
      }
      return 1;
    }

    const loProb = survivalAt(loCohort, time);
    const hiProb = survivalAt(hiCohort, time);

    const blended = loProb + t * (hiProb - loProb);
    return (blended - 0.5) * 2;
  };
}

// ─── Demo Dataset ─────────────────────────────────────────────────────────────

function buildDemoDataset(): EpiDataset {
  return {
    cohorts: DEMO_COHORTS,
    selectedCohort: "General Population",
    surfaceFn: buildSurfaceFn(DEMO_COHORTS),
  };
}

const DEMO_DATASET = buildDemoDataset();

// ─── API Transform ────────────────────────────────────────────────────────────

function mergeApiResult(
  base: EpiDataset,
  result: EpiResult,
  cohortName: string,
): EpiDataset {
  const updatedCohorts = base.cohorts.map((c) => {
    if (c.name !== cohortName) return c;
    return {
      ...c,
      relativeRisk: result.relative_risk,
      attributableFraction: result.attributable_fraction,
    };
  });

  return {
    cohorts: updatedCohorts,
    selectedCohort: cohortName,
    surfaceFn: buildSurfaceFn(updatedCohorts),
  };
}

// ─── Fetcher ──────────────────────────────────────────────────────────────────

async function fetchEpidemiology(cohortName: string): Promise<EpiDataset> {
  const controller = new AbortController();
  const result = await mcpFetch<EpiResult>(
    "epidemiology_relative_risk",
    {
      exposed_events: 50,
      exposed_total: 1000,
      unexposed_events: 20,
      unexposed_total: 1000,
    },
    controller.signal,
  );
  return mergeApiResult(DEMO_DATASET, result, cohortName);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useEpidemiologyData(cohort: string = ""): {
  data: EpiDataset;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const trimmed = cohort.trim();
  const key = trimmed.length >= 2 ? `epi-${trimmed}` : null;

  const {
    data: apiData,
    error,
    isLoading,
    retry,
  } = useSWRData<EpiDataset>(key, () => fetchEpidemiology(trimmed), {
    dedupingInterval: 500,
    showToast: false,
  });

  const dataset = apiData ?? DEMO_DATASET;

  // Expose stable surfaceFn via useMemo so referential identity is preserved
  const stableSurfaceFn = useMemo(() => dataset.surfaceFn, [dataset.surfaceFn]);

  return {
    data: {
      cohorts: dataset.cohorts,
      selectedCohort: dataset.selectedCohort,
      surfaceFn: stableSurfaceFn,
    },
    loading: isLoading,
    error: error?.message ?? null,
    refetch: retry,
  };
}
