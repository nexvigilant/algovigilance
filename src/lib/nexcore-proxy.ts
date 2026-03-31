/**
 * NexCore Proxy Utilities — server-side helpers for API route handlers.
 *
 * Eliminates boilerplate across 19+ proxy routes by providing three patterns:
 * 1. proxyPost — simple POST pass-through to a fixed endpoint
 * 2. proxyMethodDispatch — extract `method` from body, map to endpoint
 * 3. proxyGet — GET pass-through with query string forwarding
 */

import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase-admin';
import { NEXCORE_API_URL } from '@/lib/nexcore-config';

const PROXY_TIMEOUT_MS = 30_000;

/**
 * Verify Firebase auth for nexcore proxy routes.
 * Checks Authorization: Bearer header first, then nucleus_id_token cookie.
 * Throws if token is missing or invalid.
 */
async function verifyProxyAuth(request: Request): Promise<void> {
  // Prefer Authorization: Bearer <token> when provided
  const authHeader = request.headers.get('authorization');
  let token: string | null = null;

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.replace('Bearer ', '').trim();
  } else {
    // Fallback to cookie
    const cookieStore = await cookies();
    token = cookieStore.get('nucleus_id_token')?.value ?? null;
  }

  if (!token) {
    throw new Error('Authentication required');
  }

  await adminAuth.verifyIdToken(token, true);
}

interface ProxyOptions {
  /** Override the default timeout (30s) */
  timeout?: number;
}

/**
 * Forward a POST request body to a fixed NexCore endpoint.
 */
export async function proxyPost(
  endpoint: string,
  request: NextRequest,
  options?: ProxyOptions,
): Promise<NextResponse> {
  try {
    await verifyProxyAuth(request);
    const body = await request.json();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options?.timeout ?? PROXY_TIMEOUT_MS);

    const res = await fetch(`${NEXCORE_API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timer);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return proxyError(err);
  }
}

/**
 * Extract `method` from POST body, look up in endpoint map, proxy to NexCore.
 *
 * Usage:
 * ```ts
 * const ENDPOINTS = { auc: '/api/v1/pk/auc', clearance: '/api/v1/pk/clearance' };
 * export async function POST(req: NextRequest) {
 *   return proxyMethodDispatch(ENDPOINTS, req);
 * }
 * ```
 */
export async function proxyMethodDispatch(
  endpointMap: Record<string, string>,
  request: NextRequest,
  options?: ProxyOptions,
): Promise<NextResponse> {
  try {
    await verifyProxyAuth(request);
    const body = await request.json();
    const { method, ...params } = body;
    const endpoint = endpointMap[method];

    if (!endpoint) {
      return NextResponse.json(
        { error: `Invalid method "${method}". Use: ${Object.keys(endpointMap).join(', ')}` },
        { status: 400 },
      );
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options?.timeout ?? PROXY_TIMEOUT_MS);

    const res = await fetch(`${NEXCORE_API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: controller.signal,
    });

    clearTimeout(timer);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return proxyError(err);
  }
}

/**
 * Forward a GET request to NexCore, passing through all query parameters.
 */
export async function proxyGet(
  endpoint: string,
  request: NextRequest,
  options?: ProxyOptions,
): Promise<NextResponse> {
  try {
    await verifyProxyAuth(request);
    const { searchParams } = new URL(request.url);
    const qs = searchParams.toString();
    const url = `${NEXCORE_API_URL}${endpoint}${qs ? `?${qs}` : ''}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options?.timeout ?? PROXY_TIMEOUT_MS);

    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timer);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return proxyError(err);
  }
}

/**
 * Generic catch-all: forward any method to a NexCore path.
 * Used by the [...path] catch-all route.
 */
export async function proxyCatchAll(
  path: string,
  request: NextRequest,
  options?: ProxyOptions,
): Promise<NextResponse> {
  try {
    await verifyProxyAuth(request);
    const url = new URL(request.url);
    const qs = url.searchParams.toString();
    const target = `${NEXCORE_API_URL}${path}${qs ? `?${qs}` : ''}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options?.timeout ?? PROXY_TIMEOUT_MS);

    const fetchOpts: RequestInit = {
      method: request.method,
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    };

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const body = await request.text();
      if (body) fetchOpts.body = body;
    }

    const res = await fetch(target, fetchOpts);
    clearTimeout(timer);

    const contentType = res.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { 'Content-Type': contentType || 'text/plain' },
    });
  } catch (err) {
    return proxyError(err);
  }
}

function proxyError(err: unknown): NextResponse {
  if (err instanceof DOMException && err.name === 'AbortError') {
    return NextResponse.json(
      { error: 'NexCore request timed out' },
      { status: 504 },
    );
  }

  if (err instanceof Error && err.message === 'Authentication required') {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // Firebase token verification failures surface as generic errors
  if (err instanceof Error && (
    err.message.includes('Firebase ID token') ||
    err.message.includes('auth/') ||
    err.message.includes('invalid-argument') ||
    err.message.includes('expired')
  )) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const message = err instanceof Error ? err.message : 'NexCore proxy error';
  return NextResponse.json(
    { error: message },
    { status: 502 },
  );
}
