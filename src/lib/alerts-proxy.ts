/**
 * Alerts Backend Proxy Utilities — server-side helpers for /api/alerts/ routes.
 *
 * Follows the same pattern as nexcore-proxy.ts but targets the
 * nexvigilant-alert FastAPI backend instead of the NexCore Rust API.
 */

import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import { ALERTS_API_URL } from "@/lib/alerts-config";

const PROXY_TIMEOUT_MS = 30_000;

/**
 * Verify Firebase auth and extract user context.
 * Returns the decoded token for tenant extraction.
 */
async function verifyAlertAuth(request: Request) {
  const authHeader = request.headers.get("authorization");
  let token: string | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.replace("Bearer ", "").trim();
  } else {
    const cookieStore = await cookies();
    token = cookieStore.get("nucleus_id_token")?.value ?? null;
  }

  if (!token) {
    throw new Error("Authentication required");
  }

  return adminAuth.verifyIdToken(token, true);
}

/**
 * Catch-all proxy: forward any method to the alerts backend.
 * Adds X-Tenant-ID header from Firebase token claims.
 */
export async function alertsProxyCatchAll(
  path: string,
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const decodedToken = await verifyAlertAuth(request);
    const tenantId =
      (decodedToken as Record<string, unknown>).tenant_id ?? "default";

    const url = new URL(request.url);
    const qs = url.searchParams.toString();
    const target = `${ALERTS_API_URL}${path}${qs ? `?${qs}` : ""}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Tenant-ID": String(tenantId),
      Authorization: `Bearer ${decodedToken}`,
    };

    const fetchOpts: RequestInit = {
      method: request.method,
      headers,
      signal: controller.signal,
    };

    if (request.method !== "GET" && request.method !== "HEAD") {
      const body = await request.text();
      if (body) fetchOpts.body = body;
    }

    const res = await fetch(target, fetchOpts);
    clearTimeout(timer);

    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": contentType || "text/plain" },
    });
  } catch (err) {
    return alertsProxyError(err);
  }
}

function alertsProxyError(err: unknown): NextResponse {
  if (err instanceof DOMException && err.name === "AbortError") {
    return NextResponse.json(
      { error: "Alerts backend timed out" },
      { status: 504 },
    );
  }

  if (err instanceof Error && err.message === "Authentication required") {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  if (
    err instanceof Error &&
    (err.message.includes("Firebase ID token") ||
      err.message.includes("auth/") ||
      err.message.includes("expired"))
  ) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  if (
    err instanceof Error &&
    (err.message.includes("ECONNREFUSED") ||
      err.message.includes("fetch failed"))
  ) {
    return NextResponse.json(
      { error: "Alerts backend unavailable" },
      { status: 503 },
    );
  }

  const message = err instanceof Error ? err.message : "Alerts proxy error";
  return NextResponse.json({ error: message }, { status: 502 });
}
