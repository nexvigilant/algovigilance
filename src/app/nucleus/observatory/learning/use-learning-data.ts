/**
 * useLearningData — React hook for fetching learning DAG data.
 *
 * Calls the Rust learning_dag_resolve endpoint via the Studio proxy,
 * then transforms to Observatory Dataset format.
 * Backed by useSWRData for cross-page caching and request deduplication.
 */

"use client";

import { useSWRData } from "@/hooks/use-swr-data";
import {
  buildLearningDataset,
  type LearningDataset,
  type LearningDagResponse,
} from "./learning-adapter";

const DEFAULT_PATHWAY = "pv-foundations";

function makeFetcher(pid: string): () => Promise<LearningDataset> {
  return async () => {
    const params = new URLSearchParams({ pathway_id: pid });
    const res = await fetch(`/api/nexcore/learning?${params.toString()}`);
    if (!res.ok) throw new Error(`Learning API returned ${res.status}`);
    const data: LearningDagResponse = await res.json();
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
