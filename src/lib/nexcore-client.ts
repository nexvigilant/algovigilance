/**
 * NexCore Client — client-side utility for calling NexCore via the proxy layer.
 *
 * Components use this instead of raw fetch to get:
 * - Consistent error handling
 * - Typed responses
 * - Automatic timeout
 * - Both method-dispatch and direct-path patterns
 */

const CLIENT_TIMEOUT_MS = 30_000;

export class NexCoreError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'NexCoreError';
  }
}

interface NexCoreRequestOptions {
  /** Timeout in ms (default 30s) */
  timeout?: number;
  /** AbortSignal for cancellation */
  signal?: AbortSignal;
}

/**
 * POST to a method-dispatch proxy route.
 *
 * Usage:
 * ```ts
 * const result = await nexcore.dispatch('/api/nexcore/pk', 'auc', { times, concentrations });
 * ```
 */
async function dispatch<T = Record<string, unknown>>(
  proxyRoute: string,
  method: string,
  params: Record<string, unknown>,
  options?: NexCoreRequestOptions,
): Promise<T> {
  return post<T>(proxyRoute, { method, ...params }, options);
}

/**
 * POST to a proxy route with a raw body.
 *
 * Usage:
 * ```ts
 * const result = await nexcore.post('/api/nexcore/signal', { a: 10, b: 5, c: 3, d: 100 });
 * ```
 */
async function post<T = Record<string, unknown>>(
  proxyRoute: string,
  body: Record<string, unknown>,
  options?: NexCoreRequestOptions,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options?.timeout ?? CLIENT_TIMEOUT_MS);

  // Chain external signal if provided
  if (options?.signal) {
    options.signal.addEventListener('abort', () => controller.abort());
  }

  try {
    const res = await fetch(proxyRoute, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const data = await res.json();

    if (!res.ok) {
      const message = typeof data.error === 'string' ? data.error : JSON.stringify(data.error ?? 'Request failed');
      throw new NexCoreError(message, res.status);
    }

    return data as T;
  } catch (err) {
    if (err instanceof NexCoreError) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new NexCoreError('Request timed out', 504);
    }
    throw new NexCoreError(err instanceof Error ? err.message : 'Network error', 0);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * GET from a proxy route (or catch-all).
 *
 * Usage:
 * ```ts
 * const status = await nexcore.get('/api/nexcore/api/v1/guardian/status');
 * ```
 */
async function get<T = Record<string, unknown>>(
  proxyRoute: string,
  params?: Record<string, string>,
  options?: NexCoreRequestOptions,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options?.timeout ?? CLIENT_TIMEOUT_MS);

  if (options?.signal) {
    options.signal.addEventListener('abort', () => controller.abort());
  }

  try {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
    const res = await fetch(`${proxyRoute}${qs}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });

    const data = await res.json();

    if (!res.ok) {
      const message = typeof data.error === 'string' ? data.error : JSON.stringify(data.error ?? 'Request failed');
      throw new NexCoreError(message, res.status);
    }

    return data as T;
  } catch (err) {
    if (err instanceof NexCoreError) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new NexCoreError('Request timed out', 504);
    }
    throw new NexCoreError(err instanceof Error ? err.message : 'Network error', 0);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * POST directly to a NexCore API path via the catch-all proxy.
 * No need for a specific route file.
 *
 * Usage:
 * ```ts
 * const result = await nexcore.api('/api/v1/foundation/fuzzy-search', { query: 'headach', candidates: [...] });
 * ```
 */
async function api<T = Record<string, unknown>>(
  nexcorePath: string,
  body: Record<string, unknown>,
  options?: NexCoreRequestOptions,
): Promise<T> {
  return post<T>(`/api/nexcore${nexcorePath}`, body, options);
}

export const nexcore = { dispatch, post, get, api } as const;
