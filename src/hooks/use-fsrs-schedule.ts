'use client';

/**
 * FSRS Schedule Hook
 *
 * React hook for spaced repetition scheduling using FSRS algorithm.
 * Provides card management, review submission, and statistics.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Rating, State } from '@/lib/academy/fsrs/fsrs-types';
import {
  getOrCreateCard,
  getUserCards as _getUserCards,
  getDueCards,
  getDueCardsGrouped,
  submitReview,
  previewRatings,
  getFSRSStats,
  type SerializedFSRSCard,
  type ReviewResult,
  type FSRSStats,
} from '@/lib/actions/fsrs';
import { logger } from '@/lib/logger';

const log = logger.scope('hooks/use-fsrs-schedule');

// Re-export types and enums for convenience
export { Rating, State };
export type { SerializedFSRSCard, ReviewResult, FSRSStats };

/**
 * Rating button configuration
 */
export interface RatingOption {
  rating: Rating;
  label: string;
  shortLabel: string;
  color: 'red' | 'orange' | 'green' | 'blue';
  intervalText: string;
}

/**
 * Hook options
 */
interface UseFSRSScheduleOptions {
  /** Auto-fetch due cards on mount */
  autoFetch?: boolean;
  /** Maximum cards to fetch */
  limit?: number;
}

/**
 * Hook return type
 */
interface UseFSRSScheduleReturn {
  // State
  cards: SerializedFSRSCard[];
  dueCards: SerializedFSRSCard[];
  currentCard: SerializedFSRSCard | null;
  stats: FSRSStats | null;
  isLoading: boolean;
  isReviewing: boolean;
  error: string | null;

  // Grouped due cards
  dueByState: {
    learning: SerializedFSRSCard[];
    review: SerializedFSRSCard[];
    relearning: SerializedFSRSCard[];
    total: number;
  } | null;

  // Rating preview (for current card)
  ratingPreviews: Record<Rating, { intervalDays: number; nextState: State }> | null;
  ratingOptions: RatingOption[];

  // Actions
  fetchDueCards: () => Promise<void>;
  fetchStats: () => Promise<void>;
  startReview: (ksbId: string) => Promise<void>;
  submitRating: (rating: Rating, durationMs?: number) => Promise<ReviewResult | null>;
  skipCard: () => void;
  resetSession: () => void;

  // Helpers
  formatInterval: (days: number) => string;
  getStateLabel: (state: State) => string;
  getStateColor: (state: State) => string;
}

/**
 * Format interval in human-readable form
 */
function formatInterval(days: number): string {
  if (days < 1 / 24) {
    const minutes = Math.round(days * 24 * 60);
    return `${minutes}m`;
  }
  if (days < 1) {
    const hours = Math.round(days * 24);
    return `${hours}h`;
  }
  if (days < 30) {
    return `${Math.round(days)}d`;
  }
  if (days < 365) {
    const months = Math.round(days / 30);
    return `${months}mo`;
  }
  const years = Math.round(days / 365 * 10) / 10;
  return `${years}y`;
}

/**
 * Get human-readable state label
 */
function getStateLabel(state: State): string {
  switch (state) {
    case State.Learning:
      return 'Learning';
    case State.Review:
      return 'Review';
    case State.Relearning:
      return 'Relearning';
    default:
      return 'Unknown';
  }
}

/**
 * Get Tailwind color class for state
 */
function getStateColor(state: State): string {
  switch (state) {
    case State.Learning:
      return 'text-blue-500';
    case State.Review:
      return 'text-green-500';
    case State.Relearning:
      return 'text-orange-500';
    default:
      return 'text-gray-500';
  }
}

/**
 * FSRS Schedule Hook
 *
 * Provides spaced repetition functionality for KSB mastery tracking.
 *
 * @example
 * ```tsx
 * function ReviewSession() {
 *   const {
 *     currentCard,
 *     ratingOptions,
 *     submitRating,
 *     fetchDueCards,
 *   } = useFSRSSchedule({ autoFetch: true });
 *
 *   if (!currentCard) return <div>No cards due!</div>;
 *
 *   return (
 *     <div>
 *       <h2>{currentCard.ksbId}</h2>
 *       <div className="flex gap-2">
 *         {ratingOptions.map(opt => (
 *           <button
 *             key={opt.rating}
 *             onClick={() => submitRating(opt.rating)}
 *           >
 *             {opt.label} ({opt.intervalText})
 *           </button>
 *         ))}
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 */
export function useFSRSSchedule(
  options: UseFSRSScheduleOptions = {}
): UseFSRSScheduleReturn {
  const { autoFetch = false, limit = 20 } = options;
  const { user, loading: authLoading } = useAuth();

  // State
  const [cards, setCards] = useState<SerializedFSRSCard[]>([]);
  const [dueCards, setDueCards] = useState<SerializedFSRSCard[]>([]);
  const [dueByState, setDueByState] = useState<UseFSRSScheduleReturn['dueByState']>(null);
  const [currentCard, setCurrentCard] = useState<SerializedFSRSCard | null>(null);
  const [stats, setStats] = useState<FSRSStats | null>(null);
  const [ratingPreviews, setRatingPreviews] = useState<
    Record<Rating, { intervalDays: number; nextState: State }> | null
  >(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref to access currentCard without adding to callback deps
  // This prevents fetchDueCards from being recreated when currentCard changes
  const currentCardRef = useRef<SerializedFSRSCard | null>(null);
  currentCardRef.current = currentCard;

  // Fetch due cards
  const fetchDueCards = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const [dueResult, groupedResult] = await Promise.all([
        getDueCards(user.uid, limit),
        getDueCardsGrouped(user.uid),
      ]);

      setDueCards(dueResult);
      setDueByState(groupedResult);

      // Set first due card as current if not already reviewing
      // Use ref to avoid recreating this callback when currentCard changes
      if (dueResult.length > 0 && !currentCardRef.current) {
        setCurrentCard(dueResult[0]);
        // Fetch previews for this card
        const previews = await previewRatings(user.uid, dueResult[0].ksbId);
        setRatingPreviews(previews);
      }
    } catch (err) {
      log.error('Failed to fetch due cards', err);
      setError(err instanceof Error ? err.message : 'Failed to load cards');
    } finally {
      setIsLoading(false);
    }
  }, [user, limit]);

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    if (!user) return;

    try {
      const statsResult = await getFSRSStats(user.uid);
      setStats(statsResult);
    } catch (err) {
      log.error('Failed to fetch stats', err);
    }
  }, [user]);

  // Start reviewing a specific card
  const startReview = useCallback(
    async (ksbId: string) => {
      if (!user) return;

      try {
        setIsReviewing(true);
        const card = await getOrCreateCard(user.uid, ksbId);
        setCurrentCard(card);

        const previews = await previewRatings(user.uid, ksbId);
        setRatingPreviews(previews);
      } catch (err) {
        log.error('Failed to start review', err);
        setError(err instanceof Error ? err.message : 'Failed to start review');
      }
    },
    [user]
  );

  // Submit a rating
  const submitRating = useCallback(
    async (rating: Rating, durationMs?: number): Promise<ReviewResult | null> => {
      if (!user || !currentCard) return null;

      try {
        setIsReviewing(true);
        const result = await submitReview(user.uid, currentCard.ksbId, rating, durationMs);

        // Update local state
        setCards((prev) =>
          prev.map((c) => (c.ksbId === result.card.ksbId ? result.card : c))
        );

        // Move to next card
        const remainingDue = dueCards.filter((c) => c.ksbId !== currentCard.ksbId);
        setDueCards(remainingDue);

        if (remainingDue.length > 0) {
          setCurrentCard(remainingDue[0]);
          const previews = await previewRatings(user.uid, remainingDue[0].ksbId);
          setRatingPreviews(previews);
        } else {
          setCurrentCard(null);
          setRatingPreviews(null);
        }

        // Refresh stats
        await fetchStats();

        return result;
      } catch (err) {
        log.error('Failed to submit rating', err);
        setError(err instanceof Error ? err.message : 'Failed to submit rating');
        return null;
      } finally {
        setIsReviewing(false);
      }
    },
    [user, currentCard, dueCards, fetchStats]
  );

  // Skip current card (move to end of queue)
  const skipCard = useCallback(() => {
    if (!currentCard || dueCards.length <= 1) return;

    const remaining = dueCards.filter((c) => c.ksbId !== currentCard.ksbId);
    setDueCards([...remaining, currentCard]);
    setCurrentCard(remaining[0] ?? null);

    // Clear previews (will be refetched)
    setRatingPreviews(null);
  }, [currentCard, dueCards]);

  // Reset session
  const resetSession = useCallback(() => {
    setCurrentCard(null);
    setRatingPreviews(null);
    setIsReviewing(false);
    setError(null);
  }, []);

  // Build rating options with intervals
  const ratingOptions = useMemo((): RatingOption[] => {
    if (!ratingPreviews) {
      return [
        { rating: Rating.Again, label: 'Again', shortLabel: '1', color: 'red', intervalText: '?' },
        { rating: Rating.Hard, label: 'Hard', shortLabel: '2', color: 'orange', intervalText: '?' },
        { rating: Rating.Good, label: 'Good', shortLabel: '3', color: 'green', intervalText: '?' },
        { rating: Rating.Easy, label: 'Easy', shortLabel: '4', color: 'blue', intervalText: '?' },
      ];
    }

    return [
      {
        rating: Rating.Again,
        label: 'Again',
        shortLabel: '1',
        color: 'red',
        intervalText: formatInterval(ratingPreviews[Rating.Again].intervalDays),
      },
      {
        rating: Rating.Hard,
        label: 'Hard',
        shortLabel: '2',
        color: 'orange',
        intervalText: formatInterval(ratingPreviews[Rating.Hard].intervalDays),
      },
      {
        rating: Rating.Good,
        label: 'Good',
        shortLabel: '3',
        color: 'green',
        intervalText: formatInterval(ratingPreviews[Rating.Good].intervalDays),
      },
      {
        rating: Rating.Easy,
        label: 'Easy',
        shortLabel: '4',
        color: 'blue',
        intervalText: formatInterval(ratingPreviews[Rating.Easy].intervalDays),
      },
    ];
  }, [ratingPreviews]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch && user && !authLoading) {
      fetchDueCards();
      fetchStats();
    }
  }, [autoFetch, user, authLoading, fetchDueCards, fetchStats]);

  return {
    // State
    cards,
    dueCards,
    currentCard,
    stats,
    isLoading: authLoading || isLoading,
    isReviewing,
    error,
    dueByState,
    ratingPreviews,
    ratingOptions,

    // Actions
    fetchDueCards,
    fetchStats,
    startReview,
    submitRating,
    skipCard,
    resetSession,

    // Helpers
    formatInterval,
    getStateLabel,
    getStateColor,
  };
}
