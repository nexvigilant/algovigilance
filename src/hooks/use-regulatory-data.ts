'use client';

import { useState, useEffect, useCallback } from 'react';
import type { RegulatoryDocument } from '@/types/regulatory';
import { fetchDrugRecalls, fetchDeviceRecalls, getOpenFDAStats } from '@/app/nucleus/regulatory/actions/openfda';

/**
 * Escape special characters for OpenFDA Lucene query syntax.
 * OpenFDA uses Lucene query parser which has reserved characters.
 * @see https://open.fda.gov/apis/query-syntax/
 */
function escapeOpenFDAQuery(input: string): string {
  // Lucene special characters: + - && || ! ( ) { } [ ] ^ " ~ * ? : \ /
  // We escape them with backslash
  return input.replace(/([+\-&|!(){}[\]^"~*?:\\/])/g, '\\$1');
}

interface UseRegulatoryDataOptions {
  autoFetch?: boolean;
  limit?: number;
}

interface RegulatoryDataState {
  documents: RegulatoryDocument[];
  isLoading: boolean;
  error: string | null;
  stats: {
    drugRecalls: number;
    deviceRecalls: number;
    lastUpdated: string;
  } | null;
}

export function useRegulatoryData(options: UseRegulatoryDataOptions = {}) {
  const { autoFetch = true, limit = 25 } = options;

  const [state, setState] = useState<RegulatoryDataState>({
    documents: [],
    isLoading: false,
    error: null,
    stats: null,
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Fetch from multiple sources in parallel
      const [drugRecallsResult, deviceRecallsResult, statsResult] = await Promise.all([
        fetchDrugRecalls({ limit: Math.floor(limit / 2) }),
        fetchDeviceRecalls({ limit: Math.floor(limit / 2) }),
        getOpenFDAStats(),
      ]);

      const allDocuments: RegulatoryDocument[] = [];
      const errors: string[] = [];

      if (drugRecallsResult.success && drugRecallsResult.data) {
        allDocuments.push(...drugRecallsResult.data);
      } else if (drugRecallsResult.error) {
        errors.push(`Drug recalls: ${drugRecallsResult.error}`);
      }

      if (deviceRecallsResult.success && deviceRecallsResult.data) {
        allDocuments.push(...deviceRecallsResult.data);
      } else if (deviceRecallsResult.error) {
        errors.push(`Device recalls: ${deviceRecallsResult.error}`);
      }

      // Sort by date (newest first)
      allDocuments.sort((a, b) => b.publishedDate.seconds - a.publishedDate.seconds);

      setState({
        documents: allDocuments,
        isLoading: false,
        error: errors.length > 0 ? errors.join('; ') : null,
        stats: statsResult.success ? (statsResult.data ?? null) : null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch regulatory data',
      }));
    }
  }, [limit]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  return {
    ...state,
    refresh,
    fetchData,
  };
}

export function useRegulatorySearch() {
  const [results, setResults] = useState<RegulatoryDocument[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      // Search drug recalls with the query
      // Escape special characters to prevent query injection
      const escapedQuery = escapeOpenFDAQuery(query);
      const result = await fetchDrugRecalls({
        search: `reason_for_recall:"${escapedQuery}" OR product_description:"${escapedQuery}"`,
        limit: 20
      });

      if (result.success && result.data) {
        setResults(result.data);
      } else {
        setSearchError(result.error || 'Search failed');
        setResults([]);
      }
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Search failed');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setSearchError(null);
  }, []);

  return {
    results,
    isSearching,
    searchError,
    search,
    clearResults,
  };
}
