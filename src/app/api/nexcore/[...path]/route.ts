/**
 * Catch-all NexCore proxy.
 *
 * Any request to /api/nexcore/<path> that doesn't match a specific route
 * is forwarded directly to NEXCORE_API_URL/<path>.
 *
 * Examples:
 *   GET  /api/nexcore/api/v1/guardian/status  →  http://localhost:3030/api/v1/guardian/status
 *   POST /api/nexcore/api/v1/pv/signal/complete  →  http://localhost:3030/api/v1/pv/signal/complete
 *
 * Specific routes (e.g., /api/nexcore/faers/route.ts) take precedence via Next.js routing.
 */

import { type NextRequest } from 'next/server';
import { proxyCatchAll } from '@/lib/nexcore-proxy';

function buildPath(params: Promise<{ path: string[] }> | { path: string[] }): Promise<string> {
  // Next.js 16 passes params as a Promise in dynamic routes
  return Promise.resolve(params).then((p) => `/${p.path.join('/')}`);
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const path = await buildPath(context.params);
  return proxyCatchAll(path, request);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const path = await buildPath(context.params);
  return proxyCatchAll(path, request);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const path = await buildPath(context.params);
  return proxyCatchAll(path, request);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const path = await buildPath(context.params);
  return proxyCatchAll(path, request);
}
