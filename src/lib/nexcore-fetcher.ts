/**
 * NexCore API Fetcher with request deduplication.
 *
 * Deduplicates in-flight requests to the same endpoint+params.
 * If two components request `/api/nexcore/career?include_salary=true`
 * simultaneously, only one HTTP request fires — both get the same promise.
 *
 * Architecture audit ref: NV-NRL-INT-003, Item 8 (VDAG N009).
 */

import { logger } from "@/lib/logger";

const log = logger.scope("nexcore-fetcher");

/** In-flight request cache: URL → Promise */
const inflight = new Map<string, Promise<Response>>();

/**
 * Deduplicated fetch for NexCore API endpoints.
 *
 * @param url - API endpoint (e.g., '/api/nexcore/career?include_salary=true')
 * @param init - Standard fetch RequestInit (optional)
 * @returns Response (cloned — safe to consume body multiple times across callers)
 *
 * @example
 * ```tsx
 * const res = await nexcoreFetch('/api/nexcore/career?include_salary=true');
 * const data = await res.json();
 * ```
 */
export async function nexcoreFetch(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  // Only dedup GET requests (mutations must always execute)
  const method = init?.method?.toUpperCase() ?? "GET";
  if (method !== "GET") {
    return fetch(url, init);
  }

  // Build cache key from URL + relevant headers
  const key = url;

  const existing = inflight.get(key);
  if (existing) {
    log.debug("Dedup hit", { url });
    // Clone so each consumer can read the body independently
    const res = await existing;
    return res.clone();
  }

  // Create the request and cache the promise
  const promise = fetch(url, init).finally(() => {
    // Remove from cache once settled (resolved or rejected)
    inflight.delete(key);
  });

  inflight.set(key, promise);

  const res = await promise;
  return res.clone();
}

/**
 * Typed JSON fetch with deduplication.
 *
 * @param url - API endpoint
 * @param init - Standard fetch RequestInit
 * @returns Parsed JSON response
 *
 * @example
 * ```tsx
 * const data = await nexcoreJson<CareerResponse>('/api/nexcore/career');
 * ```
 */
export async function nexcoreJson<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const res = await nexcoreFetch(url, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`NexCore API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}
