/**
 * useCareerData — React hook for fetching career transition graph data.
 *
 * Primary: AlgoVigilance Station cloud (career_transitions tool)
 * Fallback: Local nexcore-api gateway
 * Backed by useSWRData for cross-page caching and request deduplication.
 */

"use client";

import { useSWRData } from "@/hooks/use-swr-data";
import { mcpFetch } from "@/lib/observatory/mcp-fetch";
import {
  buildCareerDataset,
  type CareerDataset,
  type CareerTransitionsResponse,
} from "./career-adapter";

async function fetchCareerData(): Promise<CareerDataset> {
  const ac = new AbortController();
  const data = await mcpFetch<CareerTransitionsResponse>(
    "career_transitions",
    { include_salary: true },
    ac.signal,
  );
  return buildCareerDataset(data);
}

export function useCareerData(): {
  data: CareerDataset | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const { data, error, isLoading, retry } = useSWRData<CareerDataset>(
    "observatory-career",
    fetchCareerData,
  );

  return {
    data,
    loading: isLoading,
    error: error?.message ?? null,
    refetch: retry,
  };
}
