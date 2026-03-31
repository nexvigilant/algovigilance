/**
 * Data access for user subscription — Layer 3 extraction.
 *
 * Extracted from subscription-client.tsx to separate
 * Firestore queries (Layer 3) from UI components (Layer 6).
 *
 * Architecture audit ref: NV-NRL-INT-003, violation #3.
 */

import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toDateFromSerialized } from "@/types/academy";
import { logger } from "@/lib/logger";

const log = logger.scope("lib/data/subscription");

export interface UserSubscriptionData {
  tier: "student" | "professional" | null;
  status: "trial" | "active" | "past_due" | "canceled" | "paused";
  isFoundingMember: boolean;
  currentPeriodEnd: Date | null;
  isStudent: boolean;
  universityName: string | null;
  expectedGraduation: Date | null;
  rateLocked: boolean;
  postGradStatus: "current" | "early_professional" | "full_professional" | null;
}

/** Fetch subscription data for a given user ID */
export async function fetchUserSubscription(
  userId: string,
): Promise<UserSubscriptionData | null> {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));

    if (!userDoc.exists()) return null;

    const userData = userDoc.data();
    const sub = userData.subscription;
    if (!sub) return null;

    return {
      tier: sub.tier || null,
      status: sub.status || "inactive",
      isFoundingMember: sub.isFoundingMember || false,
      currentPeriodEnd: toDateFromSerialized(sub.currentPeriodEnd) || null,
      isStudent: sub.isStudent || false,
      universityName: sub.universityName || null,
      expectedGraduation: toDateFromSerialized(sub.expectedGraduation) || null,
      rateLocked: sub.rateLocked || false,
      postGradStatus: sub.postGradStatus || null,
    };
  } catch (error) {
    log.error("Failed to fetch subscription", { userId, error });
    return null;
  }
}
