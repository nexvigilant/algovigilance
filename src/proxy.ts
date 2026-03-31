import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { logger } from "@/lib/logger";
const log = logger.scope("proxy");

/**
 * AlgoVigilance Security Proxy
 *
 * Provides server-level protection for all routes:
 * - Ghost Protocol (site-wide password protection)
 * - Suspicious pattern detection
 * - Rate limiting (per-instance)
 * - Route protection
 * - Security headers
 *
 * Note: Migrated from middleware.ts for Next.js 16 compatibility.
 * Runtime changed from Edge to Node.js.
 */

// ============================================================================
// MAINTENANCE MODE - Redirect all traffic to maintenance page
// ============================================================================
// Set MAINTENANCE_MODE=true env var to enable
const MAINTENANCE_BYPASS = [
  "/maintenance",
  "/api/cron",
  "/api/health",
  "/_next",
  "/favicon.ico",
];

/**
 * Check if Maintenance Mode is active
 * Returns redirect to /maintenance if enabled, null otherwise
 */
function checkMaintenanceMode(request: NextRequest): NextResponse | null {
  const maintenanceMode = process.env.MAINTENANCE_MODE === "true";

  if (!maintenanceMode) {
    return null;
  }

  const { pathname } = request.nextUrl;

  // Allow access to maintenance page and essential paths
  if (MAINTENANCE_BYPASS.some((path) => pathname.startsWith(path))) {
    return null;
  }

  // Redirect everything else to maintenance page
  log.info(`[MAINTENANCE] Redirecting ${pathname} to maintenance page`);
  return NextResponse.redirect(new URL("/maintenance", request.url));
}

// ============================================================================
// GHOST PROTOCOL - Site-wide password protection
// ============================================================================
// Set GHOST_PROTOCOL_PASSWORD env var to enable. Username is always "ghost".
// Paths that bypass Ghost Protocol (cron jobs, health checks, etc.)
const GHOST_PROTOCOL_BYPASS = [
  "/api/cron",
  "/api/health",
  "/maintenance",
  "/_next",
  "/favicon.ico",
];

/**
 * Check if Ghost Protocol is active and validate Basic Auth
 * Returns null if auth is valid or not required, otherwise returns 401 response
 */
function checkGhostProtocol(request: NextRequest): NextResponse | null {
  if (isCypressRequest(request) && process.env.NODE_ENV !== "production") {
    return null;
  }

  const ghostPassword = process.env.GHOST_PROTOCOL_PASSWORD;

  // Ghost Protocol disabled if no password set
  if (!ghostPassword) {
    return null;
  }

  const { pathname } = request.nextUrl;

  // Bypass Ghost Protocol for essential paths
  if (GHOST_PROTOCOL_BYPASS.some((path) => pathname.startsWith(path))) {
    return null;
  }

  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Basic ")) {
    try {
      const base64Credentials = authHeader.slice(6);
      const credentials = Buffer.from(base64Credentials, "base64").toString(
        "utf-8",
      );
      const [username, password] = credentials.split(":");

      if (username === "ghost" && password === ghostPassword) {
        return null; // Auth valid
      }
    } catch {
      // Invalid base64 - fall through to 401
    }
  }

  // Return 401 with WWW-Authenticate header to trigger browser auth dialog
  log.info(`[GHOST] Authentication required for ${pathname}`);
  return new NextResponse("Ghost Protocol Active", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="AlgoVigilance Ghost Protocol"',
      "Content-Type": "text/plain",
    },
  });
}

// Routes that require authentication
const PROTECTED_PATHS = [
  "/nucleus",
  "/api/admin",
  "/api/community",
  "/api/academy",
];

// Public API routes that don't require auth
const PUBLIC_API_ROUTES = [
  "/api/auth/token",
  "/api/agent/chat",
  "/api/cron",
  "/api/crystalbook",
  "/api/intelligence/extract",
  "/api/sheets/format",
  "/api/series-progress",
  "/api/wizard-report",
  "/api/wizard-brochure",
];

// Completely blocked paths - redirect to home
const BLOCKED_PATHS: string[] = [
  // '/auth/signup' - Signup is now enabled (Dec 2024)
];

// Suspicious patterns to block (security threats)
const SUSPICIOUS_PATTERNS = [
  /\.\.\//, // Path traversal
  /<script/i, // XSS attempts
  /javascript:/i, // JavaScript protocol
  /data:text\/html/i, // Data URLs
  /%00/, // Null byte injection
  /\0/, // Null byte (eslint-disable-line no-control-regex)
  /eval\s*\(/i, // Eval attempts
  /union\s+select/i, // SQL injection
  /;\s*drop\s+/i, // SQL injection
  /--\s*$/, // SQL comment injection
];

// Rate limit tracking (in-memory for Node.js runtime)
// Note: This is per-instance and resets on cold starts. Supplements Vercel's built-in protection.
const requestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 200; // requests per minute per IP (production)
const RATE_LIMIT_DEV = 5000; // very high limit for localhost development (effectively unlimited)
const RATE_WINDOW = 60 * 1000; // 1 minute
const VERIFY_RATE_LIMIT = 30; // stricter limit for certificate verification
const verifyRequestCounts = new Map<
  string,
  { count: number; resetAt: number }
>();

// Localhost IPs to bypass stricter rate limiting
const LOCALHOST_IPS = ["127.0.0.1", "::1", "localhost", "unknown"];

function isCypressRequest(request: NextRequest): boolean {
  const explicitHeader = request.headers.get("x-cypress-test") === "1";
  const explicitQuery = request.nextUrl.searchParams.get("__e2e") === "1";
  const userAgent = (request.headers.get("user-agent") || "").toLowerCase();
  const cypressUA = userAgent.includes("cypress");

  return explicitHeader || explicitQuery || cypressUA;
}

/**
 * Per-instance rate limiting
 * Supplements Vercel's built-in DDoS protection
 */
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);

  // Use higher limit for localhost/development
  const limit = LOCALHOST_IPS.includes(ip) ? RATE_LIMIT_DEV : RATE_LIMIT;

  if (!record || record.resetAt < now) {
    requestCounts.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }

  record.count++;

  // Clean up old entries periodically (every 100 requests)
  if (record.count % 100 === 0) {
    const cutoff = now - RATE_WINDOW;
    for (const [key, value] of requestCounts.entries()) {
      if (value.resetAt < cutoff) {
        requestCounts.delete(key);
      }
    }
  }

  return record.count > limit;
}

/**
 * Per-path rate limit (verify endpoints)
 */
function isVerifyRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = verifyRequestCounts.get(ip);

  if (!record || record.resetAt < now) {
    verifyRequestCounts.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }

  record.count++;
  return record.count > VERIFY_RATE_LIMIT;
}

/**
 * Check for malicious patterns in URL
 */
function hasSuspiciousPatterns(path: string, query: string): boolean {
  const fullUrl = decodeURIComponent(path + query);
  return SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(fullUrl));
}

/**
 * Get client IP from request headers
 */
function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") || // Cloudflare
    "unknown"
  );
}

/**
 * Next.js 16 Proxy function
 * Replaces the deprecated middleware convention
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const ip = getClientIP(request);
  const isE2E = isCypressRequest(request);

  // 0a. Maintenance Mode - Redirect all traffic to /maintenance
  const maintenanceResponse = checkMaintenanceMode(request);
  if (maintenanceResponse) {
    return maintenanceResponse;
  }

  // 0b. Ghost Protocol - Site-wide password protection
  const ghostResponse = checkGhostProtocol(request);
  if (ghostResponse) {
    return ghostResponse;
  }

  // 1. Block suspicious patterns (XSS, SQL injection, path traversal)
  if (hasSuspiciousPatterns(pathname, search)) {
    log.warn(
      `[SECURITY] Blocked suspicious request: ${pathname}${search} from ${ip}`,
    );
    return new NextResponse("Forbidden", { status: 403 });
  }

  // 2. Rate limiting — bypass only for E2E tests outside production
  const isProduction = process.env.NODE_ENV === "production";
  if (!(isE2E && !isProduction) && isRateLimited(ip)) {
    log.warn(`[SECURITY] Rate limited IP: ${ip}`);
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: {
        "Retry-After": "60",
        "X-RateLimit-Limit": RATE_LIMIT.toString(),
        "X-RateLimit-Remaining": "0",
      },
    });
  }

  // 2b. Stricter rate limiting for verification endpoints
  if (
    !(isE2E && !isProduction) &&
    pathname.startsWith("/verify") &&
    isVerifyRateLimited(ip)
  ) {
    log.warn(`[SECURITY] Verify rate limited IP: ${ip}`);
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: {
        "Retry-After": "60",
        "X-RateLimit-Limit": VERIFY_RATE_LIMIT.toString(),
        "X-RateLimit-Remaining": "0",
      },
    });
  }

  // 3. Block explicitly blocked paths - redirect to home
  for (const blocked of BLOCKED_PATHS) {
    if (pathname === blocked || pathname.startsWith(`${blocked}/`)) {
      log.debug(`[SECURITY] Redirecting blocked path: ${pathname} from ${ip}`);
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // 4. Auth check for protected paths
  const normalizedPath = pathname.toLowerCase();
  const isProtectedRoute = PROTECTED_PATHS.some((p) =>
    normalizedPath.startsWith(p),
  );
  const isPublicApiRoute = PUBLIC_API_ROUTES.some((route) =>
    normalizedPath.startsWith(route),
  );

  // Demo mode: bypass auth check entirely for protected routes
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  if (isProtectedRoute && !isPublicApiRoute && !isDemoMode) {
    const authToken = request.cookies.get("nucleus_id_token")?.value;

    // No token = redirect to signin for pages, 401 for API
    if (!authToken) {
      log.debug(`[SECURITY] Unauthenticated access to ${pathname} from ${ip}`);

      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 },
        );
      }

      // Redirect to signin with return URL
      const signinUrl = new URL("/auth/signin", request.url);
      signinUrl.searchParams.set("returnUrl", pathname);
      return NextResponse.redirect(signinUrl);
    }

    // Basic token format validation (Firebase tokens are >100 chars)
    if (authToken.length < 100) {
      log.warn(`[SECURITY] Invalid token format from ${ip}`);
      const response = pathname.startsWith("/api/")
        ? NextResponse.json({ error: "Invalid token" }, { status: 401 })
        : NextResponse.redirect(new URL("/auth/signin", request.url));

      // Clear the invalid cookie
      response.cookies.delete("nucleus_id_token");
      return response;
    }

    log.debug(`[SECURITY] Protected path accessed: ${pathname} from ${ip}`);
  }

  // 5. Continue to the route
  const response = NextResponse.next();

  // 6. Add security headers (supplements Vercel headers)
  response.headers.set("X-Request-Id", crypto.randomUUID());
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Static assets (svg, png, jpg, jpeg, gif, webp, ico)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
