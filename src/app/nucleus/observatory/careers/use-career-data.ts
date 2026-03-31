/**
 * useCareerData — React hook for fetching career transition graph data.
 *
 * Calls the Rust career_transitions endpoint via the Studio proxy,
 * then transforms to Observatory Dataset format.
 * Backed by useSWRData for cross-page caching and request deduplication.
 */

"use client";

import { useSWRData } from "@/hooks/use-swr-data";
import { nexcoreJson } from "@/lib/nexcore-fetcher";
import {
  buildCareerDataset,
  type CareerDataset,
  type CareerTransitionsResponse,
} from "./career-adapter";

async function fetchCareerData(): Promise<CareerDataset> {
  const data = await nexcoreJson<CareerTransitionsResponse>(
    "/api/nexcore/career?include_salary=true",
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
