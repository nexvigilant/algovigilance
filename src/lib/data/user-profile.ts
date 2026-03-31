/**
 * Data access for user profiles — Layer 3 extraction.
 *
 * Extracted from for-you-feed.tsx to separate
 * Firestore queries (Layer 3) from UI components (Layer 6).
 */

import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { logger } from "@/lib/logger";

const log = logger.scope("lib/data/user-profile");

export interface UserProfileData {
  interests: string[];
  careerStage:
    | "practitioner"
    | "early-career"
    | "mid-career"
    | "senior"
    | "executive";
  goals: string[];
}

const EXPERIENCE_MAP: Record<string, UserProfileData["careerStage"]> = {
  practitioner: "practitioner",
  transitioning: "early-career",
  "early-career": "early-career",
  "mid-career": "mid-career",
  senior: "senior",
};

const DEFAULT_INTERESTS = [
  "regulatory-affairs",
  "clinical-trials",
  "drug-safety",
  "career-transition",
];

const DEFAULT_GOALS = ["career-transition", "skill-building", "networking"];

/** Fetch user profile data (interests, career stage, goals) for a given user ID */
export async function fetchUserProfile(
  userId: string,
): Promise<UserProfileData> {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));

    let interests: string[] = [];
    let careerStage: UserProfileData["careerStage"] = "early-career";
    let goals: string[] = [];

    if (userDoc.exists()) {
      const userData = userDoc.data();
      interests = userData.interests || userData.preferredTopics || [];
      careerStage = EXPERIENCE_MAP[userData.experience] || "early-career";
      goals = userData.goals || DEFAULT_GOALS;
    }

    // Fallback to defaults if no profile data
    if (interests.length === 0) {
      interests = DEFAULT_INTERESTS;
    }
    if (goals.length === 0) {
      goals = DEFAULT_GOALS;
    }

    return { interests, careerStage, goals };
  } catch (error) {
    log.error("Failed to fetch user profile", { userId, error });
    return {
      interests: DEFAULT_INTERESTS,
      careerStage: "early-career",
      goals: DEFAULT_GOALS,
    };
  }
}
