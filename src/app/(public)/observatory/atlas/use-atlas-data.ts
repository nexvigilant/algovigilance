/**
 * useAtlasData — React hook for cross-domain translation data.
 *
 * Provides the standard { data, loading, error, refetch } interface wrapping
 * domain lenses and system components from domain-translations.ts. Translation
 * data is static (T1 primitive mappings are structural, not fetched).
 *
 * Future enrichment: cep_domain_translate MCP tool for live cross-domain
 * translation generation and confidence scoring.
 *
 * Primitive formula: hook = μ(lens, component) → translation — mapping of
 * domain lens + system component to translated vocabulary.
 */

"use client";

import { useMemo, useCallback } from "react";
import { useSWRData } from "@/hooks/use-swr-data";
import {
  DOMAIN_LENSES,
  SYSTEM_COMPONENTS,
  type DomainLens,
  type SystemComponent,
} from "@/lib/observatory/domain-translations";

// ─── State ──────────────────────────────────────────────────────────────────

interface AtlasPayload {
  lenses: DomainLens[];
  availableLenses: DomainLens[];
  components: Record<SystemComponent, { name: string; crate: string }>;
  lensCount: number;
  componentCount: number;
  translationCount: number;
}

interface AtlasDataState {
  lenses: DomainLens[];
  availableLenses: DomainLens[];
  components: Record<SystemComponent, { name: string; crate: string }>;
  lensCount: number;
  componentCount: number;
  translationCount: number;
  loading: boolean;
  error: string | null;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

/**
 * Data hook for the atlas explorer.
 *
 * Returns domain lenses, system components, and computed statistics.
 * All data is static (T1 primitive decompositions are structural).
 *
 * @param onlyAvailable - If true, only return lenses with available=true
 */
export function useAtlasData(
  onlyAvailable = false,
): AtlasDataState & {
  getLens: (id: string) => DomainLens | undefined;
  refetch: () => void;
} {
  const { data, error, isLoading, retry } = useSWRData<AtlasPayload>(
    `atlas-data:${onlyAvailable}`,
    async () => {
      const available = DOMAIN_LENSES.filter((l) => l.available);
      return {
        lenses: onlyAvailable ? available : DOMAIN_LENSES,
        availableLenses: available,
        components: SYSTEM_COMPONENTS,
        lensCount: DOMAIN_LENSES.length,
        componentCount: Object.keys(SYSTEM_COMPONENTS).length,
        translationCount:
          available.length * Object.keys(SYSTEM_COMPONENTS).length,
      };
    },
    { dedupingInterval: 500 },
  );

  const getLens = useCallback(
    (id: string) => DOMAIN_LENSES.find((l) => l.id === id),
    [],
  );

  const fallback = useMemo<AtlasPayload>(() => {
    const available = DOMAIN_LENSES.filter((l) => l.available);
    return {
      lenses: onlyAvailable ? available : DOMAIN_LENSES,
      availableLenses: available,
      components: SYSTEM_COMPONENTS,
      lensCount: DOMAIN_LENSES.length,
      componentCount: Object.keys(SYSTEM_COMPONENTS).length,
      translationCount:
        available.length * Object.keys(SYSTEM_COMPONENTS).length,
    };
  }, [onlyAvailable]);

  const resolved = data ?? fallback;

  return {
    lenses: resolved.lenses,
    availableLenses: resolved.availableLenses,
    components: resolved.components,
    lensCount: resolved.lensCount,
    componentCount: resolved.componentCount,
    translationCount: resolved.translationCount,
    loading: isLoading,
    error: error?.message ?? null,
    getLens,
    refetch: retry,
  };
}
