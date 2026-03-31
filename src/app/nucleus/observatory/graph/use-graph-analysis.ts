"use client";

/**
 * useGraphAnalysis — React hook for graph theory MCP enrichment.
 *
 * Calls graph_analyze to compute PageRank, Louvain communities, and
 * betweenness centrality. Results map back to GraphNode fields:
 *   pagerank → node.value (size)
 *   community → node.community (color grouping)
 *   centrality → node.centrality (glow intensity)
 *
 * Grounding: μ(Mapping) + N(Quantity) + κ(Comparison)
 */

import { useState, useCallback } from "react";
import { useSWRData } from "@/hooks/use-swr-data";
import type { GraphNode, GraphEdge } from "@/components/observatory";

// ─── MCP Response Types ─────────────────────────────────────────────────────

interface GraphAnalyzeNode {
  id: string;
  pagerank?: number;
  community?: number;
  centrality?: number;
}

interface GraphAnalyzeResponse {
  nodes?: GraphAnalyzeNode[];
  result?: {
    nodes?: GraphAnalyzeNode[];
  };
}

// ─── State ──────────────────────────────────────────────────────────────────

export interface GraphAnalysis {
  /** PageRank scores per node ID */
  pagerank: Map<string, number>;
  /** Louvain community ID per node ID */
  communities: Map<string, number>;
  /** Betweenness centrality per node ID */
  centrality: Map<string, number>;
  /** Number of unique communities detected */
  communityCount: number;
}

// ─── Community Colors ───────────────────────────────────────────────────────

const COMMUNITY_COLORS = [
  "#06b6d4",
  "#a855f7",
  "#22c55e",
  "#f97316",
  "#ef4444",
  "#eab308",
  "#ec4899",
  "#14b8a6",
  "#8b5cf6",
  "#f43f5e",
];

export function communityColor(communityId: number): string {
  return COMMUNITY_COLORS[communityId % COMMUNITY_COLORS.length] ?? "#7B95B5";
}

// ─── Transform ──────────────────────────────────────────────────────────────

function parseGraphAnalysis(json: GraphAnalyzeResponse): GraphAnalysis {
  const resultNodes = json.nodes ?? json.result?.nodes ?? [];

  const pagerank = new Map<string, number>();
  const communities = new Map<string, number>();
  const centrality = new Map<string, number>();
  const communitySet = new Set<number>();

  for (const n of resultNodes) {
    if (n.pagerank !== undefined) pagerank.set(n.id, n.pagerank);
    if (n.community !== undefined) {
      communities.set(n.id, n.community);
      communitySet.add(n.community);
    }
    if (n.centrality !== undefined) centrality.set(n.id, n.centrality);
  }

  return {
    pagerank,
    communities,
    centrality,
    communityCount: communitySet.size,
  };
}

// ─── Hook ───────────────────────────────────────────────────────────────────

interface AnalyzeParams {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function useGraphAnalysis() {
  const [params, setParams] = useState<AnalyzeParams | null>(null);

  const key = params
    ? `graph-analysis:${params.nodes.map((n) => n.id).join(",")}`
    : null;

  const {
    data: analysis,
    error,
    isLoading,
    mutate,
  } = useSWRData<GraphAnalysis>(
    key,
    async () => {
      const nodeIds = params!.nodes.map((n) => n.id);
      const edgeList = params!.edges.map((e) => ({
        source: e.source,
        target: e.target,
        weight: e.weight ?? 1,
      }));

      const res = await fetch("/api/nexcore/api/v1/mcp/graph_analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodes: nodeIds,
          edges: edgeList,
          metrics: ["pagerank", "louvain", "betweenness_centrality"],
        }),
      });
      if (!res.ok) throw new Error(`graph_analyze returned ${res.status}`);
      const json = (await res.json()) as GraphAnalyzeResponse;
      return parseGraphAnalysis(json);
    },
    { dedupingInterval: 500, showToast: false },
  );

  /**
   * Run graph analysis on the given nodes and edges.
   * Calls graph_analyze MCP tool for PageRank + Louvain + centrality.
   */
  const analyze = useCallback(
    (nodes: GraphNode[], edges: GraphEdge[]) => {
      setParams({ nodes, edges });
      // If params are the same key, force revalidation
      void mutate();
    },
    [mutate],
  );

  /**
   * Apply analysis results to node array — returns enriched copy.
   * PageRank → value (normalized to 0.5–3.0 range)
   * Community → community field + color override
   * Centrality → centrality field
   */
  const enrichNodes = useCallback(
    (nodes: GraphNode[], graphAnalysis: GraphAnalysis | null): GraphNode[] => {
      if (!graphAnalysis) return nodes;
      const maxPR = Math.max(
        ...Array.from(graphAnalysis.pagerank.values()),
        0.001,
      );

      return nodes.map((n) => {
        const pr = graphAnalysis.pagerank.get(n.id);
        const comm = graphAnalysis.communities.get(n.id);
        const cent = graphAnalysis.centrality.get(n.id);
        return {
          ...n,
          value: pr !== undefined ? 0.5 + (pr / maxPR) * 2.5 : n.value,
          community: comm,
          centrality: cent,
          color: comm !== undefined ? communityColor(comm) : n.color,
          pagerank: pr,
        };
      });
    },
    [],
  );

  return {
    analysis: analysis ?? null,
    loading: isLoading,
    error: error ? "Graph analysis unavailable" : null,
    analyze,
    enrichNodes,
  };
}
