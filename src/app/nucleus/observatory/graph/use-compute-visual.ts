/**
 * useComputeVisual — React hook for MCP-computed visual curves.
 *
 * Calls the /api/nexcore/compute-visual endpoint to get Rust-computed
 * betweenness centrality, 3D layout, entropy, and glow curves.
 * Falls back gracefully when the NexCore server is unavailable.
 */

"use client";

import { useSWRData } from "@/hooks/use-swr-data";
import type { Dataset } from "./graph-datasets";

export interface ComputeVisualResult {
  betweenness: Record<string, number>;
  layout3d: Record<string, [number, number, number]>;
  entropy: number;
  glowCurve: number[];
}

interface ComputeVisualState {
  data: ComputeVisualResult | null;
  loading: boolean;
  error: string | null;
}

export function useComputeVisual(dataset: Dataset | null): ComputeVisualState {
  const key =
    dataset && dataset.nodes.length > 0
      ? `compute-visual:${dataset.label}:${dataset.nodes.length}`
      : null;

  const { data, error, isLoading } = useSWRData<ComputeVisualResult>(
    key,
    async () => {
      const res = await fetch("/api/nexcore/compute-visual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataset: dataset!.label,
          nodes: dataset!.nodes.map((n) => ({
            id: n.id,
            value: n.value,
            group: n.group,
          })),
          edges: dataset!.edges.map((e) => ({
            source: e.source,
            target: e.target,
            weight: e.weight,
          })),
        }),
      });
      if (!res.ok) throw new Error(`compute-visual: ${res.status}`);
      return res.json() as Promise<ComputeVisualResult>;
    },
    { dedupingInterval: 500, showToast: false },
  );

  return {
    data: data ?? null,
    loading: isLoading,
    error: error?.message ?? null,
  };
}
