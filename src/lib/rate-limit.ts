"use server";

import { createHash } from "crypto";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { logger } from "@/lib/logger";
import { toDateFromSerialized } from "@/types/academy";
const log = logger.scope("lib/rate-limit");

/**
 * Rate limit configuration for different action types
 */
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests allowed in window
}

/**
 * Default rate limits (fallback if settings not found)
 */
const DEFAULT_LIMITS: Record<string, RateLimitConfig> = {
  posts: { windowMs: 60 * 60 * 1000, maxRequests: 10 }, // 10 per hour
  replies: { windowMs: 60 * 60 * 1000, maxRequests: 30 }, // 30 per hour
  messages: { windowMs: 60 * 60 * 1000, maxRequests: 50 }, // 50 per hour
  reactions: { windowMs: 60 * 1000, maxRequests: 20 }, // 20 per minute
  ai_generation: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 per minute (AI API throttle)
  // Social actions
  follow: { windowMs: 60 * 60 * 1000, maxRequests: 30 }, // 30 follows per hour
  unfollow: { windowMs: 60 * 60 * 1000, maxRequests: 30 }, // 30 unfollows per hour
  // Profile updates
  profile_update: { windowMs: 60 * 60 * 1000, maxRequests: 10 }, // 10 updates per hour
  // Forum operations
  forum_create: { windowMs: 24 * 60 * 60 * 1000, maxRequests: 3 }, // 3 forums per day
  forum_join: { windowMs: 60 * 60 * 1000, maxRequests: 20 }, // 20 joins per hour
  // AI Operations
  embeddings_gen: { windowMs: 60 * 1000, maxRequests: 5 }, // 5 per minute (High AI cost protection)
};

/**
 * Rate limit action types
 */
export type RateLimitAction =
  | "posts"
  | "replies"
  | "messages"
  | "reactions"
  | "ai_generation"
  | "follow"
  | "unfollow"
  | "profile_update"
  | "forum_create"
  | "forum_join"
  | "embeddings_gen";

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  error?: string;
}

/**
 * Get current rate limit settings from Firestore
 */
async function getRateLimitSettings(): Promise<{
  enabled: boolean;
  limits: Record<string, RateLimitConfig>;
}> {
  try {
    const settingsDoc = await adminDb
      .collection("settings")
      .doc("community")
      .get();

    if (!settingsDoc.exists) {
      return { enabled: true, limits: DEFAULT_LIMITS };
    }

    const data = settingsDoc.data();
    const rateLimits = data?.rateLimits;

    if (!rateLimits?.enabled) {
      return { enabled: false, limits: DEFAULT_LIMITS };
    }

    return {
      enabled: true,
      limits: {
        posts: {
          windowMs: 60 * 60 * 1000,
          maxRequests: rateLimits.postsPerHour || 10,
        },
        replies: {
          windowMs: 60 * 60 * 1000,
          maxRequests: rateLimits.repliesPerHour || 30,
        },
        messages: {
          windowMs: 60 * 60 * 1000,
          maxRequests: rateLimits.messagesPerHour || 50,
        },
        reactions: {
          windowMs: 60 * 1000,
          maxRequests: rateLimits.reactionsPerMinute || 20,
        },
      },
    };
  } catch (error) {
    log.error("Error fetching rate limit settings:", error);
    return { enabled: true, limits: DEFAULT_LIMITS };
  }
}

/**
 * Check if a user action is rate limited
 * Uses Firestore to track action counts per user
 *
 * @param userId - The user's UID
 * @param action - The type of action being performed
 * @returns RateLimitResult with allowed status and remaining quota
 */
export async function checkRateLimit(
  userId: string,
  action: RateLimitAction,
): Promise<RateLimitResult> {
  try {
    const settings = await getRateLimitSettings();

    // If rate limiting is disabled, allow all actions
    if (!settings.enabled) {
      return {
        allowed: true,
        remaining: Infinity,
        resetAt: new Date(Date.now() + 3600000),
      };
    }

    const config = settings.limits[action];
    if (!config) {
      return {
        allowed: true,
        remaining: Infinity,
        resetAt: new Date(Date.now() + 3600000),
      };
    }

    const now = Date.now();
    const windowStart = now - config.windowMs;
    const resetAt = new Date(now + config.windowMs);

    // Get user's rate limit document
    const rateLimitRef = adminDb
      .collection("rate_limits")
      .doc(`${userId}_${action}`);

    const rateLimitDoc = await rateLimitRef.get();

    if (!rateLimitDoc.exists) {
      // First action - create tracking document
      await rateLimitRef.set({
        userId,
        action,
        count: 1,
        windowStart: Timestamp.fromMillis(now),
        lastAction: FieldValue.serverTimestamp(),
      });

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt,
      };
    }

    const data = rateLimitDoc.data() ?? {};
    const docWindowStart = data.windowStart?.toMillis() || 0;

    // Check if we're in a new window
    if (docWindowStart < windowStart) {
      // Window expired - reset count
      await rateLimitRef.set({
        userId,
        action,
        count: 1,
        windowStart: Timestamp.fromMillis(now),
        lastAction: FieldValue.serverTimestamp(),
      });

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt,
      };
    }

    // Same window - check count
    const currentCount = data.count || 0;

    if (currentCount >= config.maxRequests) {
      // Rate limit exceeded
      const windowResetAt = new Date(docWindowStart + config.windowMs);
      return {
        allowed: false,
        remaining: 0,
        resetAt: windowResetAt,
        error: `Rate limit exceeded. Try again after ${windowResetAt.toLocaleTimeString()}.`,
      };
    }

    // Increment count
    await rateLimitRef.update({
      count: FieldValue.increment(1),
      lastAction: FieldValue.serverTimestamp(),
    });

    return {
      allowed: true,
      remaining: config.maxRequests - currentCount - 1,
      resetAt: new Date(docWindowStart + config.windowMs),
    };
  } catch (error) {
    log.error(
      "[rate-limit] CRITICAL: Rate limit check failed - denying request for safety:",
      error,
    );
    // SECURITY: Fail-closed - deny on error to prevent abuse during outages
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(Date.now() + 60000), // Retry in 1 minute
      error: "Rate limit service temporarily unavailable. Please try again.",
    };
  }
}

/**
 * Rate limit middleware wrapper for server actions
 * Use this to wrap server actions that need rate limiting
 *
 * @example
 * export async function createPost(data: PostData) {
 *   const rateLimitResult = await withRateLimit(userId, 'posts');
 *   if (!rateLimitResult.allowed) {
 *     return { success: false, error: rateLimitResult.error };
 *   }
 *   // ... rest of the action
 * }
 */
export async function withRateLimit(
  userId: string,
  action: RateLimitAction,
): Promise<RateLimitResult> {
  return checkRateLimit(userId, action);
}

/**
 * Get user's current rate limit status without incrementing
 * Useful for showing remaining quota to users
 */
export async function getRateLimitStatus(
  userId: string,
  action: RateLimitAction,
): Promise<RateLimitResult> {
  try {
    const settings = await getRateLimitSettings();

    if (!settings.enabled) {
      return {
        allowed: true,
        remaining: Infinity,
        resetAt: new Date(Date.now() + 3600000),
      };
    }

    const config = settings.limits[action];
    if (!config) {
      return {
        allowed: true,
        remaining: Infinity,
        resetAt: new Date(Date.now() + 3600000),
      };
    }

    const now = Date.now();
    const windowStart = now - config.windowMs;

    const rateLimitRef = adminDb
      .collection("rate_limits")
      .doc(`${userId}_${action}`);

    const rateLimitDoc = await rateLimitRef.get();

    if (!rateLimitDoc.exists) {
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetAt: new Date(now + config.windowMs),
      };
    }

    const data = rateLimitDoc.data() ?? {};
    const docWindowStart = data.windowStart?.toMillis() || 0;

    if (docWindowStart < windowStart) {
      // Window expired
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetAt: new Date(now + config.windowMs),
      };
    }

    const currentCount = data.count || 0;
    const remaining = Math.max(0, config.maxRequests - currentCount);

    return {
      allowed: remaining > 0,
      remaining,
      resetAt: new Date(docWindowStart + config.windowMs),
    };
  } catch (error) {
    log.error("Get rate limit status error:", error);
    return {
      allowed: true,
      remaining: 0,
      resetAt: new Date(Date.now() + 3600000),
    };
  }
}

/**
 * Reset rate limit for a user (admin function)
 */
export async function resetRateLimit(
  userId: string,
  action?: RateLimitAction,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (action) {
      // Reset specific action
      await adminDb
        .collection("rate_limits")
        .doc(`${userId}_${action}`)
        .delete();
    } else {
      // Reset all actions for user
      const actions: RateLimitAction[] = [
        "posts",
        "replies",
        "messages",
        "reactions",
      ];
      const batch = adminDb.batch();

      for (const act of actions) {
        const ref = adminDb.collection("rate_limits").doc(`${userId}_${act}`);
        batch.delete(ref);
      }

      await batch.commit();
    }

    return { success: true };
  } catch (error) {
    log.error("Reset rate limit error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to reset rate limit",
    };
  }
}

// ============================================================================
// IP-Based Rate Limiting for Public Endpoints
// ============================================================================

/**
 * Public action types for IP-based rate limiting
 */
export type PublicRateLimitAction =
  | "affiliate_application"
  | "agent_chat"
  | "consulting_inquiry"
  | "contact_form"
  | "crystalbook_diagnostic"
  | "newsletter_signup"
  | "telemetry_event"
  | "telemetry_vital"
  | "waitlist"
  | "wizard_brochure"
  | "wizard_report";

/**
 * Default IP-based rate limits for public actions
 */
const PUBLIC_RATE_LIMITS: Record<PublicRateLimitAction, RateLimitConfig> = {
  affiliate_application: { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 per hour per IP
  agent_chat: { windowMs: 60 * 1000, maxRequests: 30 }, // 30 per minute per IP (AI cost protection)
  consulting_inquiry: { windowMs: 60 * 60 * 1000, maxRequests: 5 }, // 5 per hour per IP
  contact_form: { windowMs: 60 * 60 * 1000, maxRequests: 5 }, // 5 per hour per IP
  crystalbook_diagnostic: { windowMs: 60 * 60 * 1000, maxRequests: 10 }, // 10 per hour per IP (AI-powered)
  newsletter_signup: { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 per hour per IP
  telemetry_event: { windowMs: 60 * 1000, maxRequests: 60 }, // 60 per minute per IP
  telemetry_vital: { windowMs: 60 * 1000, maxRequests: 60 }, // 60 per minute per IP
  waitlist: { windowMs: 60 * 60 * 1000, maxRequests: 5 }, // 5 per hour per IP
  wizard_brochure: { windowMs: 60 * 60 * 1000, maxRequests: 10 }, // 10 per hour per IP
  wizard_report: { windowMs: 60 * 60 * 1000, maxRequests: 5 }, // 5 per hour per IP
};

/**
 * Get client IP address from headers
 * Works with Vercel/Next.js server actions
 */
export async function getClientIP(): Promise<string> {
  try {
    const { headers } = await import("next/headers");
    const headersList = await headers();

    // Check various headers in order of preference
    const forwardedFor = headersList.get("x-forwarded-for");
    if (forwardedFor) {
      // x-forwarded-for can contain multiple IPs, get the first one (client)
      return forwardedFor.split(",")[0].trim();
    }

    const realIP = headersList.get("x-real-ip");
    if (realIP) {
      return realIP.trim();
    }

    const vercelIP = headersList.get("x-vercel-forwarded-for");
    if (vercelIP) {
      return vercelIP.split(",")[0].trim();
    }

    // Fallback for local development
    return "localhost";
  } catch (error) {
    log.warn("[rate-limit] Failed to extract client IP:", error);
    return "unknown";
  }
}

/**
 * Hash IP address for privacy (we don't want to store raw IPs)
 */
function hashIP(ip: string): string {
  const salt = process.env.RATE_LIMIT_SALT || "nexvigilant-studio";
  return createHash("sha256")
    .update(ip + salt)
    .digest("hex")
    .substring(0, 16);
}

/**
 * Check if IP is whitelisted for rate limit bypass (admin override)
 * Whitelist stored in Firestore settings
 */
async function isIPWhitelisted(clientIP: string): Promise<boolean> {
  try {
    const settingsDoc = await adminDb
      .collection("settings")
      .doc("rate_limits")
      .get();

    if (!settingsDoc.exists) {
      return false;
    }

    const data = settingsDoc.data();
    const whitelist = data?.ipWhitelist || [];

    // Check both raw IP and hashed IP against whitelist
    const hashedIP = hashIP(clientIP);
    return whitelist.includes(clientIP) || whitelist.includes(hashedIP);
  } catch (error) {
    log.error("Error checking IP whitelist:", error);
    return false;
  }
}

/**
 * Check if rate limiting is globally disabled (admin override)
 */
async function isRateLimitingDisabled(
  action: PublicRateLimitAction,
): Promise<boolean> {
  try {
    const settingsDoc = await adminDb
      .collection("settings")
      .doc("rate_limits")
      .get();

    if (!settingsDoc.exists) {
      return false;
    }

    const data = settingsDoc.data();

    // Check global disable
    if (data?.globalDisabled === true) {
      return true;
    }

    // Check action-specific disable
    const disabledActions = data?.disabledActions || [];
    return disabledActions.includes(action);
  } catch (error) {
    log.error("Error checking rate limit settings:", error);
    return false;
  }
}

/**
 * Check IP-based rate limit for public endpoints
 * Uses hashed IPs for privacy
 * Supports admin override via IP whitelist or global disable
 *
 * @param action - The type of public action being performed
 * @returns RateLimitResult with allowed status
 */
export async function checkPublicRateLimit(
  action: PublicRateLimitAction,
): Promise<RateLimitResult> {
  try {
    const clientIP = await getClientIP();

    // Check admin overrides first
    const [isWhitelisted, isDisabled] = await Promise.all([
      isIPWhitelisted(clientIP),
      isRateLimitingDisabled(action),
    ]);

    if (isWhitelisted || isDisabled) {
      return {
        allowed: true,
        remaining: Infinity,
        resetAt: new Date(Date.now() + 3600000),
      };
    }

    const hashedIP = hashIP(clientIP);
    const config = PUBLIC_RATE_LIMITS[action];

    if (!config) {
      return {
        allowed: true,
        remaining: Infinity,
        resetAt: new Date(Date.now() + 3600000),
      };
    }

    const now = Date.now();
    const windowStart = now - config.windowMs;
    const resetAt = new Date(now + config.windowMs);

    // Get IP's rate limit document
    const rateLimitRef = adminDb
      .collection("rate_limits_public")
      .doc(`${hashedIP}_${action}`);

    const rateLimitDoc = await rateLimitRef.get();

    if (!rateLimitDoc.exists) {
      // First action from this IP - create tracking document
      await rateLimitRef.set({
        hashedIP,
        action,
        count: 1,
        windowStart: Timestamp.fromMillis(now),
        lastAction: FieldValue.serverTimestamp(),
      });

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt,
      };
    }

    const data = rateLimitDoc.data() ?? {};
    const docWindowStart = data.windowStart?.toMillis() || 0;

    // Check if we're in a new window
    if (docWindowStart < windowStart) {
      // Window expired - reset count
      await rateLimitRef.set({
        hashedIP,
        action,
        count: 1,
        windowStart: Timestamp.fromMillis(now),
        lastAction: FieldValue.serverTimestamp(),
      });

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt,
      };
    }

    // Same window - check count
    const currentCount = data.count || 0;

    if (currentCount >= config.maxRequests) {
      // Rate limit exceeded
      const windowResetAt = new Date(docWindowStart + config.windowMs);
      return {
        allowed: false,
        remaining: 0,
        resetAt: windowResetAt,
        error: `Too many submissions. Please try again later.`,
      };
    }

    // Increment count
    await rateLimitRef.update({
      count: FieldValue.increment(1),
      lastAction: FieldValue.serverTimestamp(),
    });

    return {
      allowed: true,
      remaining: config.maxRequests - currentCount - 1,
      resetAt: new Date(docWindowStart + config.windowMs),
    };
  } catch (error) {
    log.error(
      "[rate-limit] CRITICAL: Public rate limit check failed - denying request for safety:",
      error,
    );
    // SECURITY: Fail-closed - deny on error to prevent abuse during outages
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(Date.now() + 60000), // Retry in 1 minute
      error: "Rate limit service temporarily unavailable. Please try again.",
    };
  }
}

// ============================================================================
// Admin Management Functions for Public Rate Limits
// ============================================================================

/**
 * Public rate limit settings structure
 */
export interface PublicRateLimitSettings {
  globalDisabled: boolean;
  disabledActions: PublicRateLimitAction[];
  ipWhitelist: string[];
  updatedAt: Date;
  updatedBy: string;
}

/**
 * Get current public rate limit settings
 */
export async function getPublicRateLimitSettings(): Promise<PublicRateLimitSettings> {
  try {
    const settingsDoc = await adminDb
      .collection("settings")
      .doc("rate_limits")
      .get();

    if (!settingsDoc.exists) {
      return {
        globalDisabled: false,
        disabledActions: [],
        ipWhitelist: [],
        updatedAt: new Date(),
        updatedBy: "system",
      };
    }

    const data = settingsDoc.data() ?? {};
    return {
      globalDisabled: data.globalDisabled || false,
      disabledActions: data.disabledActions || [],
      ipWhitelist: data.ipWhitelist || [],
      updatedAt: toDateFromSerialized(data.updatedAt) || new Date(),
      updatedBy: data.updatedBy || "system",
    };
  } catch (error) {
    log.error("Error getting public rate limit settings:", error);
    return {
      globalDisabled: false,
      disabledActions: [],
      ipWhitelist: [],
      updatedAt: new Date(),
      updatedBy: "system",
    };
  }
}

/**
 * Update public rate limit settings (admin only)
 */
export async function updatePublicRateLimitSettings(
  settings: Partial<Omit<PublicRateLimitSettings, "updatedAt">>,
  adminUserId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await adminDb
      .collection("settings")
      .doc("rate_limits")
      .set(
        {
          ...settings,
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: adminUserId,
        },
        { merge: true },
      );

    log.debug(`[RateLimit] Settings updated by ${adminUserId}:`, settings);
    return { success: true };
  } catch (error) {
    log.error("Error updating public rate limit settings:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update settings",
    };
  }
}

/**
 * Add IP to whitelist (admin only)
 */
export async function addIPToWhitelist(
  ip: string,
  adminUserId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await adminDb
      .collection("settings")
      .doc("rate_limits")
      .set(
        {
          ipWhitelist: FieldValue.arrayUnion(ip),
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: adminUserId,
        },
        { merge: true },
      );

    log.debug(`[RateLimit] IP ${ip} added to whitelist by ${adminUserId}`);
    return { success: true };
  } catch (error) {
    log.error("Error adding IP to whitelist:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add IP",
    };
  }
}

/**
 * Remove IP from whitelist (admin only)
 */
export async function removeIPFromWhitelist(
  ip: string,
  adminUserId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await adminDb
      .collection("settings")
      .doc("rate_limits")
      .set(
        {
          ipWhitelist: FieldValue.arrayRemove(ip),
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: adminUserId,
        },
        { merge: true },
      );

    log.debug(`[RateLimit] IP ${ip} removed from whitelist by ${adminUserId}`);
    return { success: true };
  } catch (error) {
    log.error("Error removing IP from whitelist:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove IP",
    };
  }
}

/**
 * Toggle global rate limiting (admin only)
 */
export async function toggleGlobalRateLimiting(
  enabled: boolean,
  adminUserId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await adminDb.collection("settings").doc("rate_limits").set(
      {
        globalDisabled: !enabled,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: adminUserId,
      },
      { merge: true },
    );

    log.debug(
      `[RateLimit] Global rate limiting ${enabled ? "enabled" : "disabled"} by ${adminUserId}`,
    );
    return { success: true };
  } catch (error) {
    log.error("Error toggling global rate limiting:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to toggle rate limiting",
    };
  }
}
