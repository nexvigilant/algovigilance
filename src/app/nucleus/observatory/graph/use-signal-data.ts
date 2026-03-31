/**
 * useSignalData — React hook for fetching live FAERS signal data.
 *
 * Wraps the live-signal-adapter with loading/error state management.
 * Uses useSWRData with dedupingInterval for debounce effect and
 * null key to skip fetch when drug name is too short.
 */

"use client";

import { useSWRData } from "@/hooks/use-swr-data";
import type { Dataset } from "./graph-datasets";
import { buildSignalDataset } from "./live-signal-adapter";

export function useSignalData(drug: string): {
  data: Dataset | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const key = drug.length >= 2 ? `observatory-signal-${drug}` : null;

  const { data, error, isLoading, retry } = useSWRData<Dataset>(
    key,
    () => buildSignalDataset(drug),
    { dedupingInterval: 500 },
  );

  return {
    data,
    loading: isLoading,
    error: error?.message ?? null,
    refetch: retry,
  };
}
