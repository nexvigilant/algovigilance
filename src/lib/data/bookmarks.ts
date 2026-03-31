/**
 * Data access for bookmarks — Layer 3 extraction.
 *
 * Extracted from bookmarks-client.tsx to separate
 * Firebase Timestamp handling (Layer 3) from UI components (Layer 6).
 */

import { Timestamp } from "firebase/firestore";
import { toDateFromSerialized } from "@/types/academy";
import { logger } from "@/lib/logger";

const log = logger.scope("lib/data/bookmarks");

/**
 * Format a bookmark's createdAt field into a locale date string.
 *
 * Handles Firestore Timestamp, plain Date, and serialized
 * `{ seconds: number }` objects from server actions.
 */
export function formatBookmarkDate(
  createdAt: Date | { seconds: number } | null | undefined,
): string {
  try {
    if (createdAt instanceof Timestamp) {
      return toDateFromSerialized(createdAt).toLocaleDateString();
    } else if (createdAt instanceof Date) {
      return createdAt.toLocaleDateString();
    } else if (createdAt?.seconds) {
      return new Date(createdAt.seconds * 1000).toLocaleDateString();
    }
  } catch (error) {
    log.error("Failed to format bookmark date", { error });
  }
  return "Recently";
}
