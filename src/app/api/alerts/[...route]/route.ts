/**
 * Catch-all alerts backend proxy.
 *
 * Any request to /api/alerts/<path> is forwarded to the nexvigilant-alert
 * FastAPI backend with Firebase auth verification and tenant ID extraction.
 *
 * Examples:
 *   GET  /api/alerts/api/compliance/score     → http://localhost:8000/api/compliance/score
 *   POST /api/alerts/api/adverse-events       → http://localhost:8000/api/adverse-events
 *   GET  /api/alerts/api/vendor-risk/vendors   → http://localhost:8000/api/vendor-risk/vendors
 */

import { type NextRequest } from "next/server";
import { alertsProxyCatchAll } from "@/lib/alerts-proxy";

function buildPath(
  params: Promise<{ route: string[] }> | { route: string[] },
): Promise<string> {
  return Promise.resolve(params).then((p) => `/${p.route.join("/")}`);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ route: string[] }> },
) {
  const path = await buildPath(context.params);
  return alertsProxyCatchAll(path, request);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ route: string[] }> },
) {
  const path = await buildPath(context.params);
  return alertsProxyCatchAll(path, request);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ route: string[] }> },
) {
  const path = await buildPath(context.params);
  return alertsProxyCatchAll(path, request);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ route: string[] }> },
) {
  const path = await buildPath(context.params);
  return alertsProxyCatchAll(path, request);
}
