/**
 * useChemistryData — React hook for fetching Hill dose-response data.
 *
 * Calls chemistry_hill_response via /api/nexcore MCP proxy and transforms
 * the result into an ObservatoryDataset for SurfacePlot3D.
 * Falls back to hardcoded demo data when no API response is available.
 *
 * Migrated to useSWRData for cross-page caching and request deduplication.
 */

"use client";

import { useSWRData } from "@/hooks/use-swr-data";
import { mcpFetch } from "@/lib/observatory/mcp-fetch";
import type { ObservatoryDataset } from "@/lib/observatory/adapter";
import type { GraphNode, GraphEdge } from "@/components/observatory";

// ─── MCP Response Type ────────────────────────────────────────────────────────

interface HillResponseResult {
  drug: string;
  ec50: number;
  hill_coefficient: number;
  emax: number;
  points: Array<{ dose: number; response: number }>;
}

// ─── State ────────────────────────────────────────────────────────────────────

interface ChemistryDataState {
  data: ObservatoryDataset;
  loading: boolean;
  error: string | null;
}

// ─── Demo Data ────────────────────────────────────────────────────────────────

/**
 * Generate a fallback Hill curve for demo purposes.
 * EC50=10, n=1.5, Emax=100, 50 log-spaced points from 0.001 to 1000.
 */
function generateDemoData(): ObservatoryDataset {
  const EC50 = 10;
  const HILL_N = 1.5;
  const EMAX = 100;
  const N_POINTS = 50;
  const MIN_DOSE = 0.001;
  const MAX_DOSE = 1000;

  const logMin = Math.log10(MIN_DOSE);
  const logMax = Math.log10(MAX_DOSE);

  const points = Array.from({ length: N_POINTS }, (_, i) => {
    const logDose = logMin + (i / (N_POINTS - 1)) * (logMax - logMin);
    const dose = Math.pow(10, logDose);
    const response =
      (EMAX * Math.pow(dose, HILL_N)) /
      (Math.pow(EC50, HILL_N) + Math.pow(dose, HILL_N));
    return { dose, response };
  });

  return transformHillResponse({
    drug: "aspirin (demo)",
    ec50: EC50,
    hill_coefficient: HILL_N,
    emax: EMAX,
    points,
  });
}

// ─── Color Assignment ─────────────────────────────────────────────────────────

function responseColor(normalizedResponse: number): string {
  if (normalizedResponse < 0.33) return "#7B95B5"; // low — steel blue
  if (normalizedResponse < 0.67) return "#eab308"; // mid — amber
  return "#ef4444"; // high — rose red
}

// ─── Transform ────────────────────────────────────────────────────────────────

function transformHillResponse(result: HillResponseResult): ObservatoryDataset {
  const responses = result.points.map((p) => p.response);
  const minResp = Math.min(...responses);
  const maxResp = Math.max(...responses);
  const respRange = maxResp - minResp || 1;

  const nodes: GraphNode[] = result.points.map((pt, i) => {
    const normResp = (pt.response - minResp) / respRange;
    const value = normResp * 3; // 0–3 range

    return {
      id: `dose-${i}`,
      label:
        pt.dose < 0.01
          ? `${pt.dose.toExponential(2)}`
          : pt.dose < 1
            ? pt.dose.toFixed(3)
            : pt.dose.toFixed(1),
      group: "domain",
      value,
      color: responseColor(normResp),
    };
  });

  const edges: GraphEdge[] = result.points.slice(0, -1).map((_, i) => ({
    source: `dose-${i}`,
    target: `dose-${i + 1}`,
    weight: 1,
  }));

  return {
    label: `Hill Response — ${result.drug}`,
    description: `Dose-response curve for ${result.drug}. EC50=${result.ec50.toFixed(2)}, Hill n=${result.hill_coefficient.toFixed(2)}, Emax=${result.emax.toFixed(1)}%.`,
    nodes,
    edges,
    dimension: 3,
    stem: {
      trait: "Measure",
      domain: "Science",
      t1: "ν Frequency",
      transfer: "Dose→Response — Hill equation pharmacokinetic modeling",
      crate: "nexcore-vigilance",
      tools: ["chemistry_hill_response", "chemistry_michaelis_menten"],
    },
    explorerType: "chemistry",
  };
}

// ─── Fetcher ─────────────────────────────────────────────────────────────────

const DEMO_DATA = generateDemoData();

async function fetchChemistry(compound: string): Promise<ObservatoryDataset> {
  const controller = new AbortController();
  const result = await mcpFetch<HillResponseResult>(
    "chemistry_hill_response",
    {
      drug: compound,
      min_dose: 0.001,
      max_dose: 1000,
      n_points: 50,
    },
    controller.signal,
  );

  return transformHillResponse(result);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useChemistryData(
  compound: string,
): ChemistryDataState & { refetch: () => void } {
  const trimmed = compound.trim();
  const key = trimmed.length >= 2 ? `chemistry-hill-${trimmed}` : null;

  const { data, error, isLoading, retry } = useSWRData<ObservatoryDataset>(
    key,
    () => fetchChemistry(trimmed),
    { dedupingInterval: 500, fallback: DEMO_DATA, showToast: false },
  );

  return {
    data: data ?? DEMO_DATA,
    loading: isLoading,
    error: error?.message ?? null,
    refetch: retry,
  };
}
