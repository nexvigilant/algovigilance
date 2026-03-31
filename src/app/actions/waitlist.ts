"use server";

/**
 * Waitlist Actions
 *
 * Server actions for managing founding member waitlist signups.
 * Stores emails in Firestore with signup metadata and duplicate prevention.
 *
 * @module app/actions/waitlist
 */

import { adminDb, adminFieldValue } from "@/lib/firebase-admin";
import { WaitlistSchema, type WaitlistFormData } from "@/lib/schemas/waitlist";
import { sendWaitlistNotification } from "@/lib/email";

import { logger } from "@/lib/logger";
const log = logger.scope("waitlist");

// =============================================================================
// COLLECTION PATH
// =============================================================================

const WAITLIST_COLLECTION = "waitlist_signups";
const EMAIL_LOG_PREFIX_LENGTH = 3;
const EMAIL_LOG_MASK = "***";

function maskEmailForLogs(email: string): string {
  return `${email.substring(0, EMAIL_LOG_PREFIX_LENGTH)}${EMAIL_LOG_MASK}`;
}

// =============================================================================
// TYPES
// =============================================================================

export interface WaitlistEntry {
  id: string;
  email: string;
  signupSource: "membership_page" | "homepage" | "academy" | "other";
  createdAt: FirebaseFirestore.Timestamp;
  metadata?: {
    userAgent?: string;
    referrer?: string;
  };
}

export interface JoinWaitlistResult {
  success: boolean;
  message: string;
  alreadySignedUp?: boolean;
}

// =============================================================================
// ACTIONS
// =============================================================================

/**
 * Join the founding member waitlist
 *
 * - Validates email format
 * - Prevents duplicate signups (same email)
 * - Stores in Firestore with timestamp
 */
export async function joinWaitlist(
  data: WaitlistFormData,
  source: WaitlistEntry["signupSource"] = "membership_page",
  metadata?: { userAgent?: string; referrer?: string },
): Promise<JoinWaitlistResult> {
  try {
    // Validate input
    const parsed = WaitlistSchema.safeParse(data);
    if (!parsed.success) {
      log.warn("Invalid waitlist signup attempt:", parsed.error.flatten());
      return {
        success: false,
        message: "Please enter a valid email address.",
      };
    }

    const email = parsed.data.email.toLowerCase().trim();

    // Check for existing signup
    // eslint-disable-next-line @nexvigilant/no-sequential-awaits -- Duplicate check must complete before creating a new signup document
    const existingQuery = await adminDb
      .collection(WAITLIST_COLLECTION)
      .where("email", "==", email)
      .limit(1)
      .get();

    if (!existingQuery.empty) {
      log.info("Duplicate waitlist signup attempt:", maskEmailForLogs(email));
      return {
        success: true,
        message: "You're already on the list! We'll notify you when we launch.",
        alreadySignedUp: true,
      };
    }

    // Create new waitlist entry
    const docRef = adminDb.collection(WAITLIST_COLLECTION).doc();
    const entry: Omit<WaitlistEntry, "id"> = {
      email,
      signupSource: source,
      createdAt:
        adminFieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
      ...(metadata && { metadata }),
    };

    await docRef.set(entry);

    log.info("New waitlist signup:", {
      id: docRef.id,
      source,
      emailPrefix: maskEmailForLogs(email),
    });

    // Notify admin (non-blocking — don't fail signup if email fails)
    sendWaitlistNotification(email, source).catch((error) => {
      log.error("Waitlist notification failed (non-critical):", error);
    });

    return {
      success: true,
      message:
        "You're on the list! We'll send your access code when we launch.",
    };
  } catch (error) {
    log.error("Waitlist signup error:", error);
    return {
      success: false,
      message: "Something went wrong. Please try again later.",
    };
  }
}
