'use client';

/**
 * FSRS Review Session Component
 *
 * Dedicated UI for spaced repetition reviews of previously learned KSBs.
 * Shows due cards and allows users to self-rate their recall.
 *
 * @example
 * ```tsx
 * <FSRSReviewSession
 *   onComplete={() => router.push('/nucleus/academy')}
 *   onSkip={() => setShowReview(false)}
 * />
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Sparkles,
  RotateCcw,
  Eye,
  Zap,
} from 'lucide-react';
import { useFSRSSchedule, Rating } from '@/hooks/use-fsrs-schedule';
import { useCelebration } from '@/components/academy/celebration-effects';
import { cn } from '@/lib/utils';

interface FSRSReviewSessionProps {
  /** Called when session is complete (no more cards) */
  onComplete?: () => void;
  /** Called when user skips/exits the session */
  onSkip?: () => void;
  /** Maximum cards per session (default: 20) */
  maxCards?: number;
}

const ratingColors: Record<Rating, string> = {
  [Rating.Again]: 'bg-red-500 hover:bg-red-600 text-white',
  [Rating.Hard]: 'bg-orange-500 hover:bg-orange-600 text-white',
  [Rating.Good]: 'bg-emerald-500 hover:bg-emerald-600 text-white',
  [Rating.Easy]: 'bg-cyan hover:bg-cyan-glow text-nex-deep',
};

const ratingKeyboardShortcuts: Record<string, Rating> = {
  '1': Rating.Again,
  '2': Rating.Hard,
  '3': Rating.Good,
  '4': Rating.Easy,
};

export function FSRSReviewSession({
  onComplete,
  onSkip,
  maxCards = 20,
}: FSRSReviewSessionProps) {
  const {
    dueCards,
    currentCard,
    stats,
    isLoading,
    isReviewing,
    error,
    ratingOptions,
    fetchDueCards,
    submitRating,
    skipCard,
    getStateLabel,
    getStateColor,
  } = useFSRSSchedule({ autoFetch: true, limit: maxCards });

  const { celebrateKSB } = useCelebration();
  const [showAnswer, setShowAnswer] = useState(false);
  const [cardsReviewed, setCardsReviewed] = useState(0);
  const [sessionStartTime] = useState(Date.now());
  const cardStartTimeRef = useRef<number>(Date.now());
  // Track remaining cards for accurate completion check (avoids stale closure)
  const remainingCardsRef = useRef(0);
  // Track reviewing state for keyboard handler
  const isReviewingRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => {
    remainingCardsRef.current = dueCards.length;
  }, [dueCards.length]);

  useEffect(() => {
    isReviewingRef.current = isReviewing;
  }, [isReviewing]);

  // Reset showAnswer when card changes
  useEffect(() => {
    setShowAnswer(false);
    cardStartTimeRef.current = Date.now();
  }, [currentCard?.ksbId]);

  const handleRating = useCallback(
    async (rating: Rating) => {
      if (!currentCard || isReviewing) return;

      const durationMs = Date.now() - cardStartTimeRef.current;
      const result = await submitRating(rating, durationMs);

      if (result) {
        setCardsReviewed((prev) => prev + 1);

        // Celebrate on Good or Easy ratings
        if (rating === Rating.Good || rating === Rating.Easy) {
          celebrateKSB();
        }

        // Check if session is complete (use ref to avoid stale closure)
        // After this card, remaining will be (current - 1)
        if (remainingCardsRef.current <= 1) {
          onComplete?.();
        }
      }
    },
    [currentCard, isReviewing, submitRating, onComplete, celebrateKSB]
  );

  // Keyboard shortcuts for ratings (must be after handleRating declaration)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is in an input/textarea/contenteditable
      const activeEl = document.activeElement;
      const isInputFocused = activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl?.getAttribute('contenteditable') === 'true';
      if (isInputFocused) return;

      // Only process if answer is shown
      if (!showAnswer) {
        if (e.code === 'Space' || e.key === 'Enter') {
          e.preventDefault();
          setShowAnswer(true);
        }
        return;
      }

      // Prevent double-submit via rapid keypresses
      if (isReviewingRef.current) return;

      const rating = ratingKeyboardShortcuts[e.key];
      if (rating !== undefined && currentCard) {
        e.preventDefault();
        handleRating(rating);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAnswer, currentCard, handleRating]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-cyan border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-dim">Loading review cards...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="py-8 text-center">
          <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-light mb-2">Error</h3>
          <p className="text-slate-dim mb-4">{error}</p>
          <Button onClick={() => fetchDueCards()} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // No cards due
  if (!currentCard && dueCards.length === 0) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-emerald-400 mb-2">
            All Caught Up!
          </h3>
          <p className="text-slate-dim mb-6">
            No cards are due for review right now. Come back later!
          </p>
          {stats && (
            <div className="grid grid-cols-3 gap-4 mb-6 text-center">
              <div>
                <p className="text-2xl font-mono text-cyan">{stats.totalCards}</p>
                <p className="text-xs text-slate-dim">Total Cards</p>
              </div>
              <div>
                <p className="text-2xl font-mono text-gold">{stats.totalReviews}</p>
                <p className="text-xs text-slate-dim">Reviews</p>
              </div>
              <div>
                <p className="text-2xl font-mono text-emerald-400">
                  {Math.round(stats.averageRetention * 100)}%
                </p>
                <p className="text-xs text-slate-dim">Retention</p>
              </div>
            </div>
          )}
          <Button onClick={onSkip} variant="outline">
            Back to Academy
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Session complete
  if (!currentCard && cardsReviewed > 0) {
    const sessionDurationMin = Math.round((Date.now() - sessionStartTime) / 60000);

    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="py-12 text-center">
          <Sparkles className="h-16 w-16 text-gold mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gold mb-2">
            Session Complete!
          </h3>
          <p className="text-slate-dim mb-6">
            You reviewed {cardsReviewed} card{cardsReviewed !== 1 ? 's' : ''} in{' '}
            {sessionDurationMin > 0 ? `${sessionDurationMin} minute${sessionDurationMin !== 1 ? 's' : ''}` : 'less than a minute'}.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => fetchDueCards()} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              More Reviews
            </Button>
            <Button onClick={onComplete}>
              Done
              <CheckCircle2 className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Active review
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Session Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-5 w-5 text-cyan" />
          <span className="text-sm text-slate-dim">
            {cardsReviewed} reviewed / {dueCards.length + cardsReviewed} total
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={onSkip}>
          Exit Session
        </Button>
      </div>

      {/* Progress Bar */}
      <Progress
        value={(cardsReviewed / (dueCards.length + cardsReviewed)) * 100}
        className="h-2 bg-nex-deep"
      />

      {/* Card */}
      {currentCard && (
        <Card className="relative overflow-hidden">
          {/* State Badge */}
          <div className="absolute top-4 right-4">
            <Badge
              variant="outline"
              className={cn('text-xs', getStateColor(currentCard.state))}
            >
              {getStateLabel(currentCard.state)}
            </Badge>
          </div>

          <CardHeader className="pb-4">
            <CardDescription className="font-mono text-cyan/60">
              {currentCard.ksbId}
            </CardDescription>
            <CardTitle className="text-lg text-slate-light">
              Can you recall this KSB?
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Front of card (question) */}
            <div className="p-6 rounded-xl bg-nex-deep border border-nex-border">
              <p className="text-center text-slate-light">
                What do you remember about <span className="text-cyan font-semibold">{currentCard.ksbId}</span>?
              </p>
            </div>

            {/* Reveal Button / Answer */}
            {!showAnswer ? (
              <Button
                onClick={() => setShowAnswer(true)}
                className="w-full h-14 text-lg"
                variant="outline"
              >
                <Eye className="h-5 w-5 mr-2" />
                Show Answer
                <span className="ml-2 text-xs text-slate-dim">(Space)</span>
              </Button>
            ) : (
              <div className="space-y-4">
                {/* Answer revealed */}
                <div className="p-6 rounded-xl bg-cyan/10 border border-cyan/30">
                  <p className="text-center text-slate-light">
                    Think about the key concepts and practical applications of this KSB.
                  </p>
                  <p className="text-center text-xs text-slate-dim mt-2">
                    How well did you remember it?
                  </p>
                </div>

                {/* Rating Buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {ratingOptions.map((option) => (
                    <Button
                      key={option.rating}
                      onClick={() => handleRating(option.rating)}
                      disabled={isReviewing}
                      className={cn(
                        'flex flex-col h-auto py-3',
                        ratingColors[option.rating]
                      )}
                    >
                      <span className="text-sm font-semibold">{option.label}</span>
                      <span className="text-xs opacity-80">{option.intervalText}</span>
                      <span className="text-[10px] opacity-60">({option.shortLabel})</span>
                    </Button>
                  ))}
                </div>

                {/* Skip Option */}
                <div className="flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={skipCard}
                    className="text-slate-dim"
                  >
                    <ChevronRight className="h-4 w-4 mr-1" />
                    Skip this card
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Footer */}
      {stats && (
        <div className="flex items-center justify-center gap-6 text-xs text-slate-dim">
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-blue-400" />
            <span>{stats.learningCount} learning</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            <span>{stats.reviewCount} review</span>
          </div>
          <div className="flex items-center gap-1">
            <RotateCcw className="h-3 w-3 text-orange-400" />
            <span>{stats.relearningCount} relearning</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default FSRSReviewSession;
