"use client";

/**
 * useQbrData — React hook for QBR Therapeutic Window visualization.
 *
 * Builds dual Hill surfaces (efficacy vs toxicity) client-side and fetches
 * QBR (Quantitative Benefit-Risk) metric via the qbr_compute MCP tool.
 *
 * The difference surface (efficacy - toxicity) reveals the therapeutic window:
 *   z > 0 → efficacy dominates (safe therapeutic zone)
 *   z = 0 → boundary (therapeutic margin)
 *   z < 0 → toxicity dominates (danger zone)
 *
 * Migrated to useSWRData for cross-page caching and request deduplication.
 *
 * Grounding: κ(Comparison) + ∂(Boundary) + N(Quantity)
 */

import { useMemo } from "react";
import * as THREE from "three";
import type { Measured } from "@/lib/observatory/measured";
import { extractMeasured } from "@/lib/observatory/mcp-measured";
import { mcpFetch } from "@/lib/observatory/mcp-fetch";
import { useSWRData } from "@/hooks/use-swr-data";

// ─── Therapeutic Window Presets ───────────────────────────────────────────────

export interface QbrParams {
  ec50Efficacy: number;
  hillNEfficacy: number;
  ec50Toxicity: number;
  hillNToxicity: number;
  emax: number;
}

export const QBR_PRESETS: Record<string, QbrParams> = {
  warfarin: {
    ec50Efficacy: 0.5,
    hillNEfficacy: 2.0,
    ec50Toxicity: 2.0,
    hillNToxicity: 3.0,
    emax: 100,
  },
  digoxin: {
    ec50Efficacy: 0.8,
    hillNEfficacy: 1.8,
    ec50Toxicity: 1.5,
    hillNToxicity: 2.5,
    emax: 100,
  },
  theophylline: {
    ec50Efficacy: 10,
    hillNEfficacy: 1.5,
    ec50Toxicity: 20,
    hillNToxicity: 2.0,
    emax: 95,
  },
};

// ─── Hill Surface Builders ───────────────────────────────────────────────────

/**
 * Build a Hill dose-response surface: z = Emax × D^n / (EC50^n + D^n)
 * x = log10[dose], y = Hill coefficient variation
 */
function buildHillSurfaceFn(
  ec50: number,
  emax: number,
): (x: number, y: number) => number {
  return (x: number, y: number): number => {
    const dose = Math.pow(10, x);
    const n = 1.75 + y * (2.5 / 3); // maps [-1.5,1.5] → [0.5, 3]
    const nClamped = Math.max(0.1, n);
    const ec50n = Math.pow(ec50, nClamped);
    const doseN = Math.pow(dose, nClamped);
    return (emax * doseN) / (ec50n + doseN);
  };
}

// ─── Therapeutic Window Color ────────────────────────────────────────────────

const TEAL = new THREE.Color("#2dd4bf");
const RED = new THREE.Color("#ef4444");
const WHITE = new THREE.Color("#ffffff");

/**
 * Sign-based coloring for therapeutic window difference surface.
 * z > 0: efficacy dominates → teal
 * z = 0: therapeutic boundary → white
 * z < 0: toxicity dominates → red
 *
 * // CALIBRATION: linear interpolation, symmetric around zero
 */
export function therapeuticWindowColor(
  z: number,
  zMin: number,
  zMax: number,
): THREE.Color {
  const maxAbs = Math.max(Math.abs(zMin), Math.abs(zMax)) || 1;
  const t = Math.max(-1, Math.min(1, z / maxAbs));
  const result = new THREE.Color();
  if (t > 0) {
    result.lerpColors(WHITE, TEAL, t);
  } else {
    result.lerpColors(WHITE, RED, -t);
  }
  return result;
}

// ─── Fetcher ────────────────────────────────────────────────────────────────

async function fetchQbr(p: QbrParams): Promise<Measured<number> | null> {
  const controller = new AbortController();
  const json = await mcpFetch<unknown>(
    "qbr_compute",
    {
      ec50_efficacy: p.ec50Efficacy,
      hill_n_efficacy: p.hillNEfficacy,
      ec50_toxicity: p.ec50Toxicity,
      hill_n_toxicity: p.hillNToxicity,
      dose_range_start: 0.1,
      dose_range_end: 100,
    },
    controller.signal,
  );

  return extractMeasured(json);
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useQbrData(params: QbrParams) {
  // Build SWR key from all params to re-fetch when any changes
  const key = `qbr-${params.ec50Efficacy}-${params.hillNEfficacy}-${params.ec50Toxicity}-${params.hillNToxicity}-${params.emax}`;

  const {
    data: qbrValue,
    error,
    isLoading,
    retry,
  } = useSWRData<Measured<number> | null>(key, () => fetchQbr(params), {
    showToast: false,
  });

  // Build surface functions (client-side, no MCP needed)
  const fnEfficacy = useMemo(
    () => buildHillSurfaceFn(params.ec50Efficacy, params.emax),
    [params.ec50Efficacy, params.emax],
  );

  const fnToxicity = useMemo(
    () => buildHillSurfaceFn(params.ec50Toxicity, params.emax),
    [params.ec50Toxicity, params.emax],
  );

  return {
    fnEfficacy,
    fnToxicity,
    colorFn: therapeuticWindowColor,
    qbrValue: qbrValue ?? null,
    loading: isLoading,
    error: error?.message ?? null,
    refetch: retry,
  };
}
