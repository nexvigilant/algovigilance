import "server-only";

import { cookies, headers } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import type { UserRole } from "@/types";
import { DEMO_MODE, DEMO_UID, DEMO_EMAIL, DEMO_PROFILE } from "@/lib/demo-user";

import { logger } from "@/lib/logger";
const log = logger.scope("lib/admin-auth");

// Admin emails — only these can access /nucleus/admin and admin API routes.
// Member-level access is open to any authenticated user.
const ADMIN_EMAILS = [
  "matthew@nexvigilant.com",
  // Cypress test admin - only used in E2E tests
  "cypress-test@nexvigilant.com",
];

interface AdminContext {
  uid: string;
  role: UserRole;
  email?: string;
}

async function getTokenFromRequest(): Promise<string | null> {
  // Prefer Authorization: Bearer <token> when provided
  const headerStore = await headers();
  const authHeader = headerStore.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "").trim();
  }

  // Fallback to cookie set by the client on sign-in
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get("nucleus_id_token")?.value;
  return tokenCookie || null;
}

async function getUserRole(uid: string): Promise<UserRole> {
  const userDoc = await adminDb.collection("users").doc(uid).get();
  if (!userDoc.exists) {
    return "user";
  }

  const data = userDoc.data() as { role?: UserRole };
  return data?.role ?? "user";
}

/**
 * Verify the Firebase token and return user context.
 * Open to any authenticated user — no email whitelist.
 */
async function getAuthContext(): Promise<AdminContext> {
  // Demo mode: return demo context without token verification
  if (DEMO_MODE) {
    log.debug("[DEMO MODE] Returning demo context");
    return {
      uid: DEMO_UID,
      email: DEMO_EMAIL,
      role: DEMO_PROFILE.role,
    };
  }

  const token = await getTokenFromRequest();

  if (!token) {
    throw new Error("Unauthorized: Missing authentication token");
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token, true);
    const role = await getUserRole(decoded.uid);

    return {
      uid: decoded.uid,
      email: decoded.email ?? undefined,
      role,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      throw error;
    }
    log.error("[admin-auth] Failed to verify token:", error);
    throw new Error("Unauthorized: Invalid or expired authentication token");
  }
}

/**
 * Verify the Firebase token AND check the admin email list.
 * Used only by requireAdmin() and requireModerator().
 */
async function getAdminContext(): Promise<AdminContext> {
  const ctx = await getAuthContext();

  const userEmail = ctx.email?.toLowerCase() ?? "";
  if (!ADMIN_EMAILS.includes(userEmail)) {
    log.warn("[admin-auth] Non-admin email attempted admin access:", {
      email: userEmail,
      uid: ctx.uid,
      role: ctx.role,
    });
    throw new Error("Unauthorized: Admin access required");
  }

  return ctx;
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const ctx = await getAuthContext();
    return ctx.role === "admin";
  } catch (error) {
    log.debug(
      "[admin-auth] isCurrentUserAdmin check failed:",
      error instanceof Error ? error.message : "Unknown",
    );
    return false;
  }
}

export async function isCurrentUserModerator(): Promise<boolean> {
  try {
    const ctx = await getAuthContext();
    return ctx.role === "admin" || ctx.role === "moderator";
  } catch (error) {
    log.debug(
      "[admin-auth] isCurrentUserModerator check failed:",
      error instanceof Error ? error.message : "Unknown",
    );
    return false;
  }
}

export async function getCurrentUserRole(): Promise<UserRole | null> {
  try {
    const ctx = await getAuthContext();
    return ctx.role;
  } catch (error) {
    log.debug(
      "[admin-auth] getCurrentUserRole check failed:",
      error instanceof Error ? error.message : "Unknown",
    );
    return null;
  }
}

export async function requireAdmin(): Promise<AdminContext> {
  const ctx = await getAdminContext();

  if (ctx.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }

  return ctx;
}

export async function requireModerator(): Promise<AdminContext> {
  const ctx = await getAdminContext();

  if (ctx.role !== "admin" && ctx.role !== "moderator") {
    throw new Error("Unauthorized: Moderator access required");
  }

  return ctx;
}

export async function requireAuth(): Promise<AdminContext> {
  return getAuthContext();
}

export async function requireAuthUserId(): Promise<string> {
  const ctx = await getAuthContext();
  return ctx.uid;
}
