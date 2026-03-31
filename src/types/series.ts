/**
 * Series Progress Types
 *
 * Tracks user reading progress through content series.
 * Stored in Firestore: /users/{userId}/series_progress/{seriesSlug}
 */

/**
 * Structural Firestore timestamp type compatible with both
 * firebase-admin and firebase/firestore SDK Timestamp objects.
 */
export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

/**
 * Tracks a user's progress through a content series.
 */
export interface SeriesProgress {
  /** The series slug (e.g., 'anatomy-of-regulatory-capture') */
  seriesSlug: string;

  /** User ID for ownership */
  userId: string;

  /** Slugs of articles the user has read in this series */
  readSlugs: string[];

  /** Total number of articles in the series (for progress calculation) */
  totalArticles: number;

  /** Calculated progress percentage (0-100) */
  progress: number;

  /** Whether the user has completed the entire series */
  isCompleted: boolean;

  /** When the user first started this series */
  startedAt: FirestoreTimestamp;

  /** When the series was last accessed */
  lastReadAt: FirestoreTimestamp;

  /** When the series was completed (if applicable) */
  completedAt?: FirestoreTimestamp;

  /** The last article slug the user read */
  lastReadSlug?: string;
}

/**
 * Serialized version for server action returns.
 */
export interface SeriesProgressSerialized
  extends Omit<SeriesProgress, 'startedAt' | 'lastReadAt' | 'completedAt'> {
  startedAt: { seconds: number; nanoseconds: number };
  lastReadAt: { seconds: number; nanoseconds: number };
  completedAt?: { seconds: number; nanoseconds: number };
}

/**
 * Input for marking an article as read.
 */
export interface MarkArticleReadInput {
  seriesSlug: string;
  articleSlug: string;
  totalArticles: number;
}

/**
 * Reading history entry for analytics.
 */
export interface ReadingHistoryEntry {
  articleSlug: string;
  seriesSlug: string;
  readAt: FirestoreTimestamp;
  timeSpentSeconds?: number;
}
