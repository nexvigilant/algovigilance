/**
 * useDriftData — Temporal drift detection for signal distributions.
 *
 * Calls three MCP drift detection tools in parallel:
 *   - drift_ks_test: Kolmogorov-Smirnov two-sample test
 *   - drift_psi:     Population Stability Index
 *   - drift_jsd:     Jensen-Shannon Divergence
 *
 * Primitive formula: ν(Frequency) + κ(Comparison) + ∂(Boundary) + N(Quantity)
 */

"use client";

import { useState, useCallback } from "react";
import { useSWRData } from "@/hooks/use-swr-data";

// ─── Result Types ───────────────────────────────────────────────────────────

export interface KSResult {
  statistic: number;
  p_value: number;
  significant: boolean;
}

export interface PSIResult {
  psi: number;
  severity: "stable" | "moderate" | "significant";
}

export interface JSDResult {
  jsd: number;
  normalized: number;
}

export interface DriftState {
  ks: KSResult | null;
  psi: PSIResult | null;
  jsd: JSDResult | null;
  loading: boolean;
  error: string | null;
}

// ─── Default distributions (quarterly AE reporting counts) ──────────────────

const REFERENCE_DIST = [120, 135, 128, 142, 130, 138, 125, 140, 132, 136];
const CURRENT_DIST = [145, 162, 155, 178, 168, 190, 175, 195, 182, 201];

// ─── MCP Response Types ─────────────────────────────────────────────────────

interface KSRaw {
  statistic?: number;
  p_value?: number;
  significant?: boolean;
  result?: { statistic?: number; p_value?: number; significant?: boolean };
}
interface PSIRaw {
  psi?: number;
  result?: { psi?: number };
}
interface JSDRaw {
  jsd?: number;
  normalized?: number;
  result?: { jsd?: number; normalized?: number };
}

interface DriftResult {
  ks: KSResult | null;
  psi: PSIResult | null;
  jsd: JSDResult | null;
  demo: boolean;
}

// ─── Params ─────────────────────────────────────────────────────────────────

interface DriftParams {
  reference: number[];
  current: number[];
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useDriftData() {
  const [params, setParams] = useState<DriftParams | null>(null);

  const key = params
    ? `drift-data:${params.reference.join(",")}:${params.current.join(",")}`
    : null;

  const { data, error, isLoading } = useSWRData<DriftResult>(
    key,
    async () => {
      const mcpCall = async <T>(
        tool: string,
        body: Record<string, unknown>,
      ): Promise<T | null> => {
        try {
          const res = await fetch(`/api/nexcore/api/v1/mcp/${tool}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ params: body }),
          });
          if (!res.ok) return null;
          return (await res.json()) as T;
        } catch {
          return null;
        }
      };

      const [ksRaw, psiRaw, jsdRaw] = await Promise.allSettled([
        mcpCall<KSRaw>("drift_ks_test", {
          reference: params!.reference,
          current: params!.current,
          alpha: 0.05,
        }),
        mcpCall<PSIRaw>("drift_psi", {
          reference: params!.reference,
          current: params!.current,
        }),
        mcpCall<JSDRaw>("drift_jsd", {
          reference: params!.reference,
          current: params!.current,
        }),
      ]);

      // Parse KS
      let ks: KSResult | null = null;
      if (ksRaw.status === "fulfilled" && ksRaw.value) {
        const r = ksRaw.value.result ?? ksRaw.value;
        ks = {
          statistic: r.statistic ?? 0,
          p_value: r.p_value ?? 1,
          significant: r.significant ?? false,
        };
      }

      // Parse PSI
      let psi: PSIResult | null = null;
      if (psiRaw.status === "fulfilled" && psiRaw.value) {
        const r = psiRaw.value.result ?? psiRaw.value;
        const psiVal = r.psi ?? 0;
        psi = {
          psi: psiVal,
          severity:
            psiVal > 0.25
              ? "significant"
              : psiVal > 0.1
                ? "moderate"
                : "stable",
        };
      }

      // Parse JSD
      let jsd: JSDResult | null = null;
      if (jsdRaw.status === "fulfilled" && jsdRaw.value) {
        const r = jsdRaw.value.result ?? jsdRaw.value;
        jsd = { jsd: r.jsd ?? 0, normalized: r.normalized ?? 0 };
      }

      // If all three failed, use demo fallback
      if (!ks && !psi && !jsd) {
        return {
          ks: { statistic: 0.45, p_value: 0.012, significant: true },
          psi: { psi: 0.31, severity: "significant" as const },
          jsd: { jsd: 0.087, normalized: 0.42 },
          demo: true,
        };
      }

      return { ks, psi, jsd, demo: false };
    },
    { dedupingInterval: 500, showToast: false },
  );

  const computeDrift = useCallback(
    (
      reference: number[] = REFERENCE_DIST,
      current: number[] = CURRENT_DIST,
    ) => {
      setParams({ reference, current });
    },
    [],
  );

  const resolved = data ?? { ks: null, psi: null, jsd: null, demo: false };

  return {
    ks: resolved.ks,
    psi: resolved.psi,
    jsd: resolved.jsd,
    loading: isLoading,
    error: resolved.demo
      ? "MCP tools unavailable — demo values shown"
      : (error?.message ?? null),
    computeDrift,
  };
}
