/**
 * NexCore API Client — Server-Safe
 *
 * Typed fetch wrapper for the nexcore-api Rust backend (port 3030).
 * This module is safe for both server actions and client components.
 * For client-side circuit breaker protection, use nexcore-api-client.ts.
 */

import { NEXCORE_API_URL } from '@/lib/nexcore-config';
import { getSchemaForPath } from '@/lib/nexcore-schemas';
import { logger } from '@/lib/logger';

const log = logger.scope('nexcore-api');

export class NexcoreApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'NexcoreApiError';
  }
}

async function nexcoreFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${NEXCORE_API_URL}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({
      code: 'UNKNOWN',
      message: res.statusText,
    }));
    throw new NexcoreApiError(
      res.status,
      body.code || 'API_ERROR',
      body.message || `Request failed: ${res.status}`
    );
  }

  const data = await res.json();

  // Impedance matching: validate response against Zod schema if registered.
  const schema = getSchemaForPath(path);
  if (schema) {
    const result = schema.safeParse(data);
    if (!result.success) {
      log.warn(`Schema mismatch on ${path}:`, result.error.issues);
    }
  }

  return data as T;
}

/** GET request to nexcore-api */
export async function nexcoreGet<T>(path: string): Promise<T> {
  return nexcoreFetch<T>(path, { method: 'GET' });
}

/** POST request to nexcore-api */
export async function nexcorePost<T>(
  path: string,
  body: unknown
): Promise<T> {
  return nexcoreFetch<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ── Convenience wrappers ──────────────────────

/** Signal detection — complete analysis (PRR, ROR, IC, EBGM, Chi²) */
export async function signalComplete(a: number, b: number, c: number, d: number) {
  return nexcorePost<SignalCompleteResponse>('/api/v1/pv/signal/complete', {
    a, b, c, d,
  });
}

/** Guardian homeostasis status */
export async function guardianStatus() {
  return nexcoreGet<GuardianStatusResponse>('/api/v1/guardian/status');
}

/** Guardian tick — run one homeostasis iteration */
export async function guardianTick() {
  return nexcorePost<GuardianTickResponse>('/api/v1/guardian/tick', {});
}

/** FAERS drug search */
export async function faersSearch(query: string, limit?: number) {
  const params = new URLSearchParams({ query });
  if (limit) params.set('limit', String(limit));
  return nexcoreGet<FaersSearchResponse>(`/api/v1/faers/search?${params}`);
}

/** FAERS drug events */
export async function faersDrugEvents(drug: string, limit?: number) {
  const params = new URLSearchParams({ drug });
  if (limit) params.set('limit', String(limit));
  return nexcoreGet<FaersDrugEventsResponse>(`/api/v1/faers/drug-events?${params}`);
}

/** FAERS signal check */
export async function faersSignalCheck(drug: string, event: string) {
  return nexcorePost<FaersSignalCheckResponse>('/api/v1/faers/signal-check', {
    drug, event,
  });
}

/** Brain sessions list */
export async function brainSessionsList() {
  return nexcoreGet<BrainSessionsResponse>('/api/v1/brain/sessions');
}

/** Brain session load */
export async function brainSessionLoad(id: string) {
  return nexcoreGet<BrainSessionResponse>(`/api/v1/brain/sessions/${id}`);
}

/** OpenAPI spec */
export async function openApiSpec() {
  return nexcoreGet<Record<string, unknown>>('/openapi.json');
}

/** Health check */
export async function healthCheck() {
  return nexcoreGet<{ status: string }>('/health');
}

// ── Community (Hybrid) ──────────────────────

/** Analyze community content — primitives, PV relevance, topics */
export async function communityAnalyze(content: string, postId?: string, title?: string) {
  return nexcorePost<CommunityAnalysisResponse>('/api/v1/community/analyze', {
    content, post_id: postId, title,
  }).catch(() => null);
}

/** Search community via NexCore Rust full-text search */
export async function communitySearch(query: string, filter?: string) {
  const params = new URLSearchParams({ q: query });
  if (filter) params.set('filter', filter);
  return nexcoreGet<CommunitySearchResponse>(`/api/v1/community/search?${params}`);
}

/** Get personalized community suggestions */
export async function communitySuggestions() {
  return nexcoreGet<CommunitySuggestionsResponse>('/api/v1/community/suggestions');
}

/** Get personalized for-you feed from NexCore */
export async function communityForYou() {
  return nexcoreGet<CommunitySuggestionsResponse>('/api/v1/community/for-you');
}

// ── Expert Marketplace (PRPaaS) ──────────────────────

/** Search experts via NexCore matching engine */
export async function marketplaceSearchExperts(query: string, categories?: string[]) {
  const params = new URLSearchParams({ q: query });
  if (categories?.length) params.set('categories', categories.join(','));
  return nexcoreGet<MarketplaceSearchResponse>(`/api/v1/marketplace/experts?${params}`).catch(() => null);
}

/** Get expert recommendations based on tenant needs */
export async function marketplaceRecommendExperts(tenantId: string) {
  return nexcoreGet<MarketplaceSearchResponse>(`/api/v1/marketplace/experts/recommend?tenant=${tenantId}`).catch(() => null);
}

// ── Benchmarking (PRPaaS) ──────────────────────

/** Get anonymized benchmark data for a tenant */
export async function benchmarkGet(tenantId: string, period?: string) {
  const params = new URLSearchParams({ tenant: tenantId });
  if (period) params.set('period', period);
  return nexcoreGet<BenchmarkResponse>(`/api/v1/benchmarks?${params}`).catch(() => null);
}

/** Get platform-wide benchmark aggregates */
export async function benchmarkPlatformAggregates(period?: string) {
  const params = period ? new URLSearchParams({ period }) : new URLSearchParams();
  return nexcoreGet<BenchmarkAggregatesResponse>(`/api/v1/benchmarks/platform?${params}`).catch(() => null);
}

// ── Re-export types ──────────────────────

import type {
  SignalCompleteResponse,
  GuardianStatusResponse,
  GuardianTickResponse,
  FaersSearchResponse,
  FaersDrugEventsResponse,
  FaersSignalCheckResponse,
  BrainSessionsResponse,
  BrainSessionResponse,
  CommunityAnalysisResponse,
  CommunitySearchResponse,
  CommunitySuggestionsResponse,
  MarketplaceSearchResponse,
  BenchmarkResponse,
  BenchmarkAggregatesResponse,
} from '@/types/nexcore';
