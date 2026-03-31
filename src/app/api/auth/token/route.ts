import { NextResponse, type NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

import { logger } from "@/lib/logger";
const log = logger.scope("token/route");

function buildResponse(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status });
}

export async function POST(request: NextRequest) {
  let token: string | undefined;

  try {
    const payload = await request.json();
    token =
      typeof payload?.token === "string" ? payload.token.trim() : undefined;
  } catch {
    return buildResponse(400, { error: "Invalid request body" });
  }

  if (!token) {
    return buildResponse(400, { error: "Missing token" });
  }

  try {
    // Validate the token before setting the cookie
    const decoded = await adminAuth.verifyIdToken(token, true);
    log.info("[auth/token] Token verified for:", decoded.email || decoded.uid);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    log.error("[auth/token] Failed to verify token:", errMsg);
    return buildResponse(401, {
      error: "Invalid or expired token",
      detail: process.env.NODE_ENV !== "production" ? errMsg : undefined,
    });
  }

  const response = buildResponse(200, { success: true });
  response.cookies.set({
    name: "nucleus_id_token",
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || process.env.VERCEL === "1",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60, // 1 hour
  });

  return response;
}

// Diagnostic: check if admin SDK can initialize
export async function GET() {
  try {
    // Just list one user to verify admin SDK works
    const listResult = await adminAuth.listUsers(1);
    return buildResponse(200, {
      status: "admin_sdk_ok",
      userCount: listResult.users.length,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "unknown",
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    log.error("[auth/token] Admin SDK health check failed:", errMsg);
    return buildResponse(500, {
      status: "admin_sdk_error",
      error: errMsg,
    });
  }
}

export async function DELETE() {
  const response = buildResponse(200, { success: true });
  response.cookies.set({
    name: "nucleus_id_token",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || process.env.VERCEL === "1",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
