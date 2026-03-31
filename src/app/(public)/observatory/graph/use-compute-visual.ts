/**
 * useComputeVisual — React hook for MCP-computed visual curves.
 *
 * Routes through AlgoVigilance Station cloud (mcp.nexvigilant.com) using
 * graph_analyze for betweenness centrality, graph_construct for 3D layout,
 * and viz_force_field_energy for entropy + glow curves.
 * Falls back to demo data when Station tools are unavailable.
 *
 * Primitive formula: μ(∂) — mapping applied at the gateway boundary.
 */

"use client";

import { useSWRData } from "@/hooks/use-swr-data";
import { mcpFetch } from "@/lib/observatory/mcp-fetch";
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

// ─── Station Response Shapes ────────────────────────────────────────────────

interface AnalyzeNode {
  id: string;
  centrality?: number;
}

interface GraphAnalyzeResult {
  nodes?: AnalyzeNode[];
  result?: { nodes?: AnalyzeNode[] };
}

interface GraphConstructResult {
  nodes?: Array<{ id: string; x?: number; y?: number; z?: number }>;
  result?: {
    nodes?: Array<{ id: string; x?: number; y?: number; z?: number }>;
  };
}

interface ForceFieldResult {
  energy?: number;
  entropy?: number;
  glow_curve?: number[];
  result?: { energy?: number; entropy?: number; glow_curve?: number[] };
}

// ─── Demo Fallback ──────────────────────────────────────────────────────────

function buildDemoResult(dataset: Dataset): ComputeVisualResult {
  const betweenness: Record<string, number> = {};
  const layout3d: Record<string, [number, number, number]> = {};
  const n = dataset.nodes.length;

  for (let i = 0; i < n; i++) {
    const node = dataset.nodes[i];
    betweenness[node.id] = (n - i) / n;
    const angle = (2 * Math.PI * i) / n;
    const r = 50 + Math.random() * 30;
    layout3d[node.id] = [
      r * Math.cos(angle),
      r * Math.sin(angle),
      (Math.random() - 0.5) * 40,
    ];
  }

  const glowCurve = Array.from({ length: 32 }, (_, i) =>
    Math.exp(-((i - 16) ** 2) / 50),
  );

  return { betweenness, layout3d, entropy: 0.5 + Math.random() * 0.5, glowCurve };
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useComputeVisual(dataset: Dataset | null): ComputeVisualState {
  const key =
    dataset && dataset.nodes.length > 0
      ? `compute-visual:${dataset.label}:${dataset.nodes.length}`
      : null;

  const { data, error, isLoading } = useSWRData<ComputeVisualResult>(
    key,
    async () => {
      const controller = new AbortController();
      const nodeIds = dataset!.nodes.map((n) => n.id);
      const edgeList = dataset!.edges.map((e) => ({
        source: e.source,
        target: e.target,
        weight: e.weight ?? 1,
      }));

      try {
        // Parallel fetch: betweenness, layout, and energy from Station
        const [analyzeRes, constructRes, energyRes] = await Promise.allSettled([
          mcpFetch<GraphAnalyzeResult>(
            "graph_analyze",
            { nodes: nodeIds, edges: edgeList, metrics: ["betweenness_centrality"] },
            controller.signal,
          ),
          mcpFetch<GraphConstructResult>(
            "graph_construct",
            { nodes: nodeIds, edges: edgeList, layout: "force_3d" },
            controller.signal,
          ),
          mcpFetch<ForceFieldResult>(
            "viz_force_field_energy",
            { nodes: nodeIds, edges: edgeList },
            controller.signal,
          ),
        ]);

        // Map betweenness centrality
        const betweenness: Record<string, number> = {};
        if (analyzeRes.status === "fulfilled") {
          const raw = analyzeRes.value;
          const nodes = raw.nodes ?? raw.result?.nodes ?? [];
          for (const n of nodes) {
            if (n.centrality !== undefined) betweenness[n.id] = n.centrality;
          }
        }

        // Map 3D layout positions
        const layout3d: Record<string, [number, number, number]> = {};
        if (constructRes.status === "fulfilled") {
          const raw = constructRes.value;
          const nodes = raw.nodes ?? raw.result?.nodes ?? [];
          for (const n of nodes) {
            layout3d[n.id] = [n.x ?? 0, n.y ?? 0, n.z ?? 0];
          }
        }

        // Map entropy and glow curve
        let entropy = 0;
        let glowCurve: number[] = [];
        if (energyRes.status === "fulfilled") {
          const raw = energyRes.value;
          entropy = raw.entropy ?? raw.result?.entropy ?? raw.energy ?? raw.result?.energy ?? 0;
          glowCurve = raw.glow_curve ?? raw.result?.glow_curve ?? [];
        }

        // If all three failed, fall back to demo data
        const allFailed =
          analyzeRes.status === "rejected" &&
          constructRes.status === "rejected" &&
          energyRes.status === "rejected";
        if (allFailed) return buildDemoResult(dataset!);

        // Fill gaps with demo values where individual calls failed
        if (Object.keys(betweenness).length === 0) {
          const n = dataset!.nodes.length;
          for (let i = 0; i < n; i++) {
            betweenness[dataset!.nodes[i].id] = (n - i) / n;
          }
        }
        if (Object.keys(layout3d).length === 0) {
          const n = dataset!.nodes.length;
          for (let i = 0; i < n; i++) {
            const angle = (2 * Math.PI * i) / n;
            const r = 50 + Math.random() * 30;
            layout3d[dataset!.nodes[i].id] = [
              r * Math.cos(angle),
              r * Math.sin(angle),
              (Math.random() - 0.5) * 40,
            ];
          }
        }
        if (glowCurve.length === 0) {
          glowCurve = Array.from({ length: 32 }, (_, i) =>
            Math.exp(-((i - 16) ** 2) / 50),
          );
        }

        return { betweenness, layout3d, entropy, glowCurve };
      } catch {
        // Station entirely unreachable — return demo data
        return buildDemoResult(dataset!);
      }
    },
    { dedupingInterval: 500, showToast: false },
  );

  return {
    data: data ?? null,
    loading: isLoading,
    error: error?.message ?? null,
  };
}
