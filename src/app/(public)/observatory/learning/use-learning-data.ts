/**
 * useLearningData — React hook for fetching learning DAG data.
 *
 * Primary: AlgoVigilance Station cloud (learning_dag_resolve tool)
 * Fallback: Local nexcore-api gateway
 * Backed by useSWRData for cross-page caching and request deduplication.
 */

"use client";

import { useSWRData } from "@/hooks/use-swr-data";
import { mcpFetch } from "@/lib/observatory/mcp-fetch";
import {
  buildLearningDataset,
  type LearningDataset,
  type LearningDagResponse,
} from "./learning-adapter";

const DEFAULT_PATHWAY = "pv-foundations";

function makeFetcher(pid: string): () => Promise<LearningDataset> {
  return async () => {
    const ac = new AbortController();
    const data = await mcpFetch<LearningDagResponse>(
      "learning_dag_resolve",
      { pathway_id: pid },
      ac.signal,
    );
    return buildLearningDataset(data);
  };
}

export function useLearningData(pathwayId?: string): {
  data: LearningDataset | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const pid = pathwayId ?? DEFAULT_PATHWAY;
  const key = pathwayId
    ? `observatory-learning-${pathwayId}`
    : "observatory-learning";

  const { data, error, isLoading, retry } = useSWRData<LearningDataset>(
    key,
    makeFetcher(pid),
  );

  return {
    data,
    loading: isLoading,
    error: error?.message ?? null,
    refetch: retry,
  };
}
