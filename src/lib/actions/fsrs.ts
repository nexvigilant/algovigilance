'use server';

/**
 * FSRS Server Actions
 *
 * Server-side operations for the Free Spaced Repetition Scheduler.
 * Manages card state in Firestore and schedules reviews.
 */

import { adminDb } from '@/lib/firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import {
  State,
  Rating,
  type FSRSCard,
  type FSRSCardDocument,
  type ReviewLog,
  type SchedulingResult,
} from '@/lib/academy/fsrs/fsrs-types';
import { FSRSScheduler } from '@/lib/academy/fsrs/fsrs-algorithm';
import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
import { requireAuthUserId } from '@/lib/admin-auth';

const log = logger.scope('fsrs/actions');

// Singleton scheduler instance with default config
const scheduler = new FSRSScheduler();

/**
 * Verify the authenticated user matches the requested userId.
 * Throws if not authenticated or if userId does not match the caller's UID.
 */
async function verifyUserAccess(userId: string): Promise<void> {
  const authenticatedUid = await requireAuthUserId();
  if (authenticatedUid !== userId) {
    log.warn('IDOR attempt: authenticated user does not match requested userId', {
      authenticatedUid,
      requestedUserId: userId,
    });
    throw new Error('Unauthorized: You can only access your own data');
  }
}

/**
 * Firestore collection paths
 */
const COLLECTIONS = {
  fsrsCards: (userId: string) => `users/${userId}/fsrs_cards`,
  reviewLogs: (userId: string) => `users/${userId}/fsrs_review_logs`,
} as const;

// ==================== Type Serialization ====================

/**
 * Serialize FSRSCardDocument for client transfer
 */
export interface SerializedFSRSCard {
  cardId: string;
  ksbId: string;
  userId: string;
  state: State;
  step: number | null;
  stability: number | null;
  difficulty: number | null;
  reps: number;
  lapses: number;
  due: string; // ISO string
  lastReview: string | null;
  createdAt: string;
  updatedAt: string;
  /** Current retrievability (0-1) */
  retrievability: number;
  /** Days until next review is due */
  daysUntilDue: number;
}

/**
 * Convert Firestore document to serialized client format
 */
function serializeCard(doc: FSRSCardDocument): SerializedFSRSCard {
  const now = new Date();
  const due = doc.due instanceof Date ? doc.due : new Date(doc.due);
  const lastReview = doc.lastReview instanceof Date ? doc.lastReview : null;

  // Convert to FSRSCard format for retrievability calculation
  const fsrsCard: FSRSCard = {
    cardId: doc.cardId,
    state: doc.state,
    step: doc.step,
    stability: doc.stability,
    difficulty: doc.difficulty,
    due: due.toISOString(),
    lastReview: lastReview?.toISOString() ?? null,
  };

  const retrievability = scheduler.getRetrievability(fsrsCard, now);
  const daysUntilDue = Math.max(0, (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return {
    cardId: doc.cardId,
    ksbId: doc.ksbId,
    userId: doc.userId,
    state: doc.state,
    step: doc.step,
    stability: doc.stability,
    difficulty: doc.difficulty,
    reps: doc.reps,
    lapses: doc.lapses,
    due: due.toISOString(),
    lastReview: lastReview?.toISOString() ?? null,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : new Date().toISOString(),
    retrievability,
    daysUntilDue,
  };
}

// ==================== Card Operations ====================

/**
 * Get or create an FSRS card for a KSB
 */
export async function getOrCreateCard(
  userId: string,
  ksbId: string
): Promise<SerializedFSRSCard> {
  await verifyUserAccess(userId);
  try {
    const cardRef = adminDb.doc(`${COLLECTIONS.fsrsCards(userId)}/${ksbId}`);
    const cardDoc = await cardRef.get();

    if (cardDoc.exists) {
      const data = cardDoc.data() as FSRSCardDocument;
      return serializeCard(data);
    }

    // Create new card
    const newCard = scheduler.createCard(ksbId);
    const now = new Date();

    const cardDocument: FSRSCardDocument = {
      ...newCard,
      ksbId,
      userId,
      reps: 0,
      lapses: 0,
      due: now,
      lastReview: null,
      createdAt: now,
      updatedAt: now,
    };

    await cardRef.set({
      ...cardDocument,
      due: Timestamp.fromDate(now),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    log.info(`Created FSRS card for KSB ${ksbId}`, { userId });
    return serializeCard(cardDocument);
  } catch (error) {
    log.error('Failed to get/create FSRS card', { userId, ksbId, error });
    throw new Error('Failed to get or create FSRS card');
  }
}

/**
 * Get all FSRS cards for a user
 */
export async function getUserCards(userId: string): Promise<SerializedFSRSCard[]> {
  await verifyUserAccess(userId);
  try {
    const snapshot = await adminDb.collection(COLLECTIONS.fsrsCards(userId)).get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() as FSRSCardDocument;
      return serializeCard(data);
    });
  } catch (error) {
    log.error('Failed to get user cards', { userId, error });
    return [];
  }
}

/**
 * Get cards that are due for review
 */
export async function getDueCards(
  userId: string,
  limit: number = 20
): Promise<SerializedFSRSCard[]> {
  await verifyUserAccess(userId);
  try {
    const now = Timestamp.fromDate(new Date());

    const snapshot = await adminDb
      .collection(COLLECTIONS.fsrsCards(userId))
      .where('due', '<=', now)
      .orderBy('due', 'asc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() as FSRSCardDocument;
      return serializeCard(data);
    });
  } catch (error) {
    log.error('Failed to get due cards', { userId, error });
    return [];
  }
}

/**
 * Get cards due for review, grouped by state
 */
export async function getDueCardsGrouped(
  userId: string
): Promise<{
  learning: SerializedFSRSCard[];
  review: SerializedFSRSCard[];
  relearning: SerializedFSRSCard[];
  total: number;
}> {
  await verifyUserAccess(userId);
  try {
    const dueCards = await getDueCards(userId, 100);

    const grouped = {
      learning: dueCards.filter((c) => c.state === State.Learning),
      review: dueCards.filter((c) => c.state === State.Review),
      relearning: dueCards.filter((c) => c.state === State.Relearning),
      total: dueCards.length,
    };

    return grouped;
  } catch (error) {
    log.error('Failed to get grouped due cards', { userId, error });
    return { learning: [], review: [], relearning: [], total: 0 };
  }
}

// ==================== Review Operations ====================

/**
 * Review result returned to client
 */
export interface ReviewResult {
  card: SerializedFSRSCard;
  intervalDays: number;
  nextState: State;
}

/**
 * Submit a review for a KSB card
 */
export async function submitReview(
  userId: string,
  ksbId: string,
  rating: Rating,
  reviewDurationMs?: number
): Promise<ReviewResult> {
  await verifyUserAccess(userId);
  try {
    const cardRef = adminDb.doc(`${COLLECTIONS.fsrsCards(userId)}/${ksbId}`);
    const cardDoc = await cardRef.get();

    if (!cardDoc.exists) {
      throw new Error(`Card not found for KSB ${ksbId}`);
    }

    const cardData = cardDoc.data() as FSRSCardDocument;
    const now = new Date();

    // Convert to FSRSCard format
    const fsrsCard: FSRSCard = {
      cardId: cardData.cardId,
      state: cardData.state,
      step: cardData.step,
      stability: cardData.stability,
      difficulty: cardData.difficulty,
      due: cardData.due instanceof Date ? cardData.due.toISOString() : new Date().toISOString(),
      lastReview: cardData.lastReview instanceof Date ? cardData.lastReview.toISOString() : null,
    };

    // Run through scheduler
    const result: SchedulingResult = scheduler.reviewCard(fsrsCard, rating, now, reviewDurationMs);

    // Determine if this was a lapse
    const isLapse = rating === Rating.Again && cardData.state === State.Review;

    // Update Firestore
    const updatedDoc: Partial<FSRSCardDocument> = {
      state: result.card.state,
      step: result.card.step,
      stability: result.card.stability,
      difficulty: result.card.difficulty,
      reps: cardData.reps + 1,
      lapses: cardData.lapses + (isLapse ? 1 : 0),
    };

    await cardRef.update({
      ...updatedDoc,
      due: Timestamp.fromDate(new Date(result.card.due)),
      lastReview: Timestamp.fromDate(now),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Log the review
    const reviewLog: ReviewLog = {
      cardId: ksbId,
      rating,
      reviewDatetime: now,
      reviewDuration: reviewDurationMs,
    };

    await adminDb.collection(COLLECTIONS.reviewLogs(userId)).add({
      ...reviewLog,
      reviewDatetime: Timestamp.fromDate(now),
      createdAt: FieldValue.serverTimestamp(),
    });

    log.info(`Review submitted for KSB ${ksbId}`, {
      userId,
      rating: Rating[rating],
      nextInterval: result.intervalDays,
    });

    // Return updated card
    const updatedCard: FSRSCardDocument = {
      ...cardData,
      ...updatedDoc,
      due: new Date(result.card.due),
      lastReview: now,
      updatedAt: now,
    } as FSRSCardDocument;

    return {
      card: serializeCard(updatedCard),
      intervalDays: result.intervalDays ?? 0,
      nextState: result.card.state,
    };
  } catch (error) {
    log.error('Failed to submit review', { userId, ksbId, rating, error });
    throw new Error('Failed to submit review');
  }
}

/**
 * Preview what would happen with each rating
 */
export async function previewRatings(
  userId: string,
  ksbId: string
): Promise<Record<Rating, { intervalDays: number; nextState: State }>> {
  await verifyUserAccess(userId);
  try {
    const card = await getOrCreateCard(userId, ksbId);

    const fsrsCard: FSRSCard = {
      cardId: card.cardId,
      state: card.state,
      step: card.step,
      stability: card.stability,
      difficulty: card.difficulty,
      due: card.due,
      lastReview: card.lastReview,
    };

    const previews = scheduler.previewRatings(fsrsCard);

    return {
      [Rating.Again]: {
        intervalDays: previews[Rating.Again].intervalDays ?? 0,
        nextState: previews[Rating.Again].card.state,
      },
      [Rating.Hard]: {
        intervalDays: previews[Rating.Hard].intervalDays ?? 0,
        nextState: previews[Rating.Hard].card.state,
      },
      [Rating.Good]: {
        intervalDays: previews[Rating.Good].intervalDays ?? 0,
        nextState: previews[Rating.Good].card.state,
      },
      [Rating.Easy]: {
        intervalDays: previews[Rating.Easy].intervalDays ?? 0,
        nextState: previews[Rating.Easy].card.state,
      },
    };
  } catch (error) {
    log.error('Failed to preview ratings', { userId, ksbId, error });
    throw new Error('Failed to preview ratings');
  }
}

// ==================== Statistics ====================

/**
 * FSRS statistics for a user
 */
export interface FSRSStats {
  totalCards: number;
  dueToday: number;
  learningCount: number;
  reviewCount: number;
  relearningCount: number;
  averageRetention: number;
  totalReviews: number;
  streakDays: number;
}

/**
 * Get FSRS statistics for a user
 */
export async function getFSRSStats(userId: string): Promise<FSRSStats> {
  await verifyUserAccess(userId);
  try {
    const cards = await getUserCards(userId);
    const now = new Date();

    const dueCards = cards.filter((c) => new Date(c.due) <= now);

    // Calculate average retention from retrievability
    const reviewCards = cards.filter((c) => c.state === State.Review && c.lastReview);
    const avgRetention =
      reviewCards.length > 0
        ? reviewCards.reduce((sum, c) => sum + c.retrievability, 0) / reviewCards.length
        : 0;

    // Get total review count
    const reviewLogsSnapshot = await adminDb
      .collection(COLLECTIONS.reviewLogs(userId))
      .count()
      .get();

    const streakData = await getStreakData(userId);

    return {
      totalCards: cards.length,
      dueToday: dueCards.length,
      learningCount: cards.filter((c) => c.state === State.Learning).length,
      reviewCount: cards.filter((c) => c.state === State.Review).length,
      relearningCount: cards.filter((c) => c.state === State.Relearning).length,
      averageRetention: Math.round(avgRetention * 100) / 100,
      totalReviews: reviewLogsSnapshot.data().count,
      streakDays: streakData.currentStreak,
    };
  } catch (error) {
    log.error('Failed to get FSRS stats', { userId, error });
    return {
      totalCards: 0,
      dueToday: 0,
      learningCount: 0,
      reviewCount: 0,
      relearningCount: 0,
      averageRetention: 0,
      totalReviews: 0,
      streakDays: 0,
    };
  }
}

// ==================== Analytics Operations ====================

/**
 * Review activity for a specific day
 */
export interface DailyReviewActivity {
  date: string; // YYYY-MM-DD
  reviewCount: number;
  averageRating: number;
  cardsReviewed: string[]; // KSB IDs
}

/**
 * Get review history for the past N days
 */
export async function getReviewHistory(
  userId: string,
  days: number = 30
): Promise<DailyReviewActivity[]> {
  await verifyUserAccess(userId);
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const snapshot = await adminDb
      .collection(COLLECTIONS.reviewLogs(userId))
      .where('reviewDatetime', '>=', Timestamp.fromDate(startDate))
      .orderBy('reviewDatetime', 'desc')
      .get();

    // Group by date
    const byDate = new Map<string, { reviews: number; ratings: number[]; cards: Set<string> }>();

    for (const doc of snapshot.docs) {
      const data = doc.data() as ReviewLog & { reviewDatetime: { toDate: () => Date } };
      const date = toDateFromSerialized(data.reviewDatetime as unknown as Record<string, unknown>);
      const dateKey = date.toISOString().split('T')[0];

      if (!byDate.has(dateKey)) {
        byDate.set(dateKey, { reviews: 0, ratings: [], cards: new Set() });
      }

      const entry = byDate.get(dateKey);
      if (!entry) continue;
      entry.reviews++;
      entry.ratings.push(data.rating);
      entry.cards.add(data.cardId);
    }

    // Convert to array
    const result: DailyReviewActivity[] = [];
    for (const [date, data] of byDate.entries()) {
      result.push({
        date,
        reviewCount: data.reviews,
        averageRating:
          data.ratings.length > 0
            ? data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length
            : 0,
        cardsReviewed: Array.from(data.cards),
      });
    }

    return result.sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    log.error('Failed to get review history', { userId, error });
    return [];
  }
}

/**
 * Domain mastery statistics
 */
export interface DomainMastery {
  domainId: string;
  domainName: string;
  totalKSBs: number;
  masteredKSBs: number; // In Review state with high stability
  learningKSBs: number;
  averageRetention: number;
  averageStability: number;
}

/**
 * Get mastery statistics by domain
 */
export async function getDomainMastery(userId: string): Promise<DomainMastery[]> {
  await verifyUserAccess(userId);
  try {
    const cards = await getUserCards(userId);

    // Group cards by domain (extract from KSB ID pattern: D##-K###)
    const byDomain = new Map<string, SerializedFSRSCard[]>();

    for (const card of cards) {
      // Extract domain ID from KSB ID (e.g., D01-K001 -> D01)
      const match = card.ksbId.match(/^(D\d+)/);
      const domainId = match ? match[1] : 'Unknown';

      if (!byDomain.has(domainId)) {
        byDomain.set(domainId, []);
      }
      byDomain.get(domainId)?.push(card);
    }

    // Calculate mastery for each domain
    const result: DomainMastery[] = [];

    for (const [domainId, domainCards] of byDomain.entries()) {
      const masteredCards = domainCards.filter(
        (c) => c.state === State.Review && (c.stability ?? 0) >= 21 // 21+ days stability = mastered
      );
      const learningCards = domainCards.filter(
        (c) => c.state === State.Learning || c.state === State.Relearning
      );

      const retentionSum = domainCards.reduce((sum, c) => sum + c.retrievability, 0);
      const stabilitySum = domainCards.reduce((sum, c) => sum + (c.stability ?? 0), 0);

      result.push({
        domainId,
        domainName: `Domain ${domainId.replace('D', '')}`, // Placeholder, could fetch actual name
        totalKSBs: domainCards.length,
        masteredKSBs: masteredCards.length,
        learningKSBs: learningCards.length,
        averageRetention: domainCards.length > 0 ? retentionSum / domainCards.length : 0,
        averageStability: domainCards.length > 0 ? stabilitySum / domainCards.length : 0,
      });
    }

    return result.sort((a, b) => a.domainId.localeCompare(b.domainId));
  } catch (error) {
    log.error('Failed to get domain mastery', { userId, error });
    return [];
  }
}

/**
 * Retention trend data point
 */
export interface RetentionTrendPoint {
  date: string;
  retention: number;
  cardCount: number;
}

/**
 * Get retention trend over the past N weeks
 */
export async function getRetentionTrend(
  userId: string,
  weeks: number = 12
): Promise<RetentionTrendPoint[]> {
  await verifyUserAccess(userId);
  try {
    const cards = await getUserCards(userId);
    const now = new Date();
    const result: RetentionTrendPoint[] = [];

    // Generate data points for each week
    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - i * 7);
      const weekKey = weekStart.toISOString().split('T')[0];

      // Calculate what retention would have been at that point
      // For simplicity, use current cards but simulate time offset
      const cardsAtTime = cards.filter((c) => {
        const createdAt = new Date(c.createdAt);
        return createdAt <= weekStart;
      });

      const avgRetention =
        cardsAtTime.length > 0
          ? cardsAtTime.reduce((sum, c) => sum + c.retrievability, 0) / cardsAtTime.length
          : 0;

      result.push({
        date: weekKey,
        retention: Math.round(avgRetention * 100),
        cardCount: cardsAtTime.length,
      });
    }

    return result;
  } catch (error) {
    log.error('Failed to get retention trend', { userId, error });
    return [];
  }
}

/**
 * Streak information
 */
export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalReviewDays: number;
  lastReviewDate: string | null;
}

/**
 * Calculate streak data from review history
 */
export async function getStreakData(userId: string): Promise<StreakData> {
  await verifyUserAccess(userId);
  try {
    const history = await getReviewHistory(userId, 365); // Get up to 1 year

    if (history.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalReviewDays: 0,
        lastReviewDate: null,
      };
    }

    // Sort by date descending
    const sortedDates = history
      .map((h) => h.date)
      .sort((a, b) => b.localeCompare(a));

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDate: Date | null = null;

    // Check if streak is still active (reviewed today or yesterday)
    const isStreakActive = sortedDates[0] === today || sortedDates[0] === yesterday;

    for (const dateStr of sortedDates) {
      const date = new Date(dateStr);

      if (prevDate === null) {
        tempStreak = 1;
      } else {
        const daysDiff = Math.floor(
          (prevDate.getTime() - date.getTime()) / 86400000
        );

        if (daysDiff === 1) {
          tempStreak++;
        } else {
          if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
          }
          tempStreak = 1;
        }
      }

      prevDate = date;
    }

    // Final check for longest streak
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }

    // Current streak is only counted if active
    if (isStreakActive) {
      // Recalculate current streak from most recent
      currentStreak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const curr = new Date(sortedDates[i - 1]);
        const prev = new Date(sortedDates[i]);
        const daysDiff = Math.floor((curr.getTime() - prev.getTime()) / 86400000);

        if (daysDiff === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    return {
      currentStreak,
      longestStreak,
      totalReviewDays: history.length,
      lastReviewDate: sortedDates[0],
    };
  } catch (error) {
    log.error('Failed to get streak data', { userId, error });
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalReviewDays: 0,
      lastReviewDate: null,
    };
  }
}

/**
 * EPA-level mastery summary
 */
export interface EPAMasterySummary {
  epaId: string;
  totalKSBs: number;
  masteredKSBs: number;
  learningKSBs: number;
  dueKSBs: number;
  averageRetention: number;
  masteryPercent: number;
}

/**
 * Get mastery summary by EPA
 */
export async function getEPAMastery(userId: string): Promise<EPAMasterySummary[]> {
  await verifyUserAccess(userId);
  try {
    const cards = await getUserCards(userId);
    const now = new Date();

    // Group cards by EPA (extract from KSB ID pattern: D##-EPA##-K### or similar)
    // For now, we'll use the domain as a proxy for EPA grouping
    const byEPA = new Map<string, SerializedFSRSCard[]>();

    for (const card of cards) {
      // Try to extract EPA ID from KSB ID patterns
      const epaMatch = card.ksbId.match(/EPA(\d+)/i);
      const epaId = epaMatch ? `EPA-${epaMatch[1].padStart(2, '0')}` :
        card.ksbId.split('-').slice(0, 2).join('-'); // Fallback to first 2 segments

      if (!byEPA.has(epaId)) {
        byEPA.set(epaId, []);
      }
      byEPA.get(epaId)?.push(card);
    }

    const result: EPAMasterySummary[] = [];

    for (const [epaId, epaCards] of byEPA.entries()) {
      const masteredCards = epaCards.filter(
        (c) => c.state === State.Review && (c.stability ?? 0) >= 21
      );
      const learningCards = epaCards.filter(
        (c) => c.state === State.Learning || c.state === State.Relearning
      );
      const dueCards = epaCards.filter((c) => new Date(c.due) <= now);

      const retentionSum = epaCards.reduce((sum, c) => sum + c.retrievability, 0);
      const avgRetention = epaCards.length > 0 ? retentionSum / epaCards.length : 0;

      result.push({
        epaId,
        totalKSBs: epaCards.length,
        masteredKSBs: masteredCards.length,
        learningKSBs: learningCards.length,
        dueKSBs: dueCards.length,
        averageRetention: Math.round(avgRetention * 100) / 100,
        masteryPercent: epaCards.length > 0
          ? Math.round((masteredCards.length / epaCards.length) * 100)
          : 0,
      });
    }

    return result.sort((a, b) => a.epaId.localeCompare(b.epaId));
  } catch (error) {
    log.error('Failed to get EPA mastery', { userId, error });
    return [];
  }
}
