/**
 * FSRS Core Algorithm Implementation
 *
 * TypeScript port of the py-fsrs scheduler algorithm.
 * Implements the FSRS v5 spaced repetition algorithm.
 */

import {
  State,
  Rating,
  type FSRSCard,
  type SchedulerConfig,
  type SchedulingResult,
  type ReviewLog,
  type RetrievabilityInfo,
  DEFAULT_SCHEDULER_CONFIG,
  STABILITY_MIN,
  MIN_DIFFICULTY,
  MAX_DIFFICULTY,
  FUZZ_RANGES,
} from './fsrs-types';

/**
 * FSRS Scheduler Class
 *
 * Implements the Free Spaced Repetition Scheduler algorithm for optimal
 * review timing based on memory stability and retrievability.
 */
export class FSRSScheduler {
  private readonly config: SchedulerConfig;
  private readonly decay: number;
  private readonly factor: number;

  constructor(config: Partial<SchedulerConfig> = {}) {
    this.config = { ...DEFAULT_SCHEDULER_CONFIG, ...config };
    this.decay = -this.config.parameters[20];
    this.factor = Math.pow(0.9, 1 / this.decay) - 1;
  }

  /**
   * Create a new card for a KSB
   */
  createCard(cardId?: string): FSRSCard {
    return {
      cardId: cardId ?? Date.now().toString(),
      state: State.Learning,
      step: 0,
      stability: null,
      difficulty: null,
      due: new Date().toISOString(),
      lastReview: null,
    };
  }

  /**
   * Calculate card retrievability at a given time
   */
  getRetrievability(card: FSRSCard, currentDate: Date = new Date()): number {
    if (!card.lastReview || card.stability === null) {
      return 0;
    }

    const lastReview = new Date(card.lastReview);
    const elapsedDays = Math.max(
      0,
      (currentDate.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24)
    );

    return Math.pow(1 + (this.factor * elapsedDays) / card.stability, this.decay);
  }

  /**
   * Get detailed retrievability info
   */
  getRetrievabilityInfo(card: FSRSCard, currentDate: Date = new Date()): RetrievabilityInfo {
    const retrievability = this.getRetrievability(card, currentDate);

    const lastReview = card.lastReview ? new Date(card.lastReview) : currentDate;
    const daysSinceReview = Math.max(
      0,
      (currentDate.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate when retention will drop below target
    const daysUntilForgetting = card.stability
      ? this.calculateIntervalForRetention(card.stability, this.config.desiredRetention)
      : 0;

    return {
      retrievability,
      daysSinceReview,
      daysUntilForgetting: Math.max(0, daysUntilForgetting - daysSinceReview),
    };
  }

  /**
   * Review a card with a rating
   */
  reviewCard(
    card: FSRSCard,
    rating: Rating,
    reviewDate: Date = new Date(),
    reviewDuration?: number
  ): SchedulingResult {
    // Clone card for immutability
    const updatedCard: FSRSCard = { ...card };

    const daysSinceLastReview = card.lastReview
      ? (reviewDate.getTime() - new Date(card.lastReview).getTime()) / (1000 * 60 * 60 * 24)
      : null;

    let nextIntervalMs: number;

    switch (updatedCard.state) {
      case State.Learning:
        nextIntervalMs = this.processLearningState(
          updatedCard,
          rating,
          daysSinceLastReview,
          reviewDate
        );
        break;

      case State.Review:
        nextIntervalMs = this.processReviewState(
          updatedCard,
          rating,
          daysSinceLastReview,
          reviewDate
        );
        break;

      case State.Relearning:
        nextIntervalMs = this.processRelearningState(
          updatedCard,
          rating,
          daysSinceLastReview,
          reviewDate
        );
        break;

      default:
        throw new Error(`Unknown state: ${updatedCard.state}`);
    }

    // Apply fuzzing if enabled and in Review state
    if (this.config.enableFuzzing && updatedCard.state === State.Review) {
      nextIntervalMs = this.getFuzzedInterval(nextIntervalMs);
    }

    // Set due date and last review
    updatedCard.due = new Date(reviewDate.getTime() + nextIntervalMs).toISOString();
    updatedCard.lastReview = reviewDate.toISOString();

    const reviewLog: ReviewLog = {
      cardId: updatedCard.cardId,
      rating,
      reviewDatetime: reviewDate,
      reviewDuration,
    };

    return {
      card: updatedCard,
      reviewLog,
      intervalDays: nextIntervalMs / (1000 * 60 * 60 * 24),
    };
  }

  /**
   * Get all possible next states for a card (for UI preview)
   */
  previewRatings(card: FSRSCard, reviewDate: Date = new Date()): Record<Rating, SchedulingResult> {
    return {
      [Rating.Again]: this.reviewCard({ ...card }, Rating.Again, reviewDate),
      [Rating.Hard]: this.reviewCard({ ...card }, Rating.Hard, reviewDate),
      [Rating.Good]: this.reviewCard({ ...card }, Rating.Good, reviewDate),
      [Rating.Easy]: this.reviewCard({ ...card }, Rating.Easy, reviewDate),
    };
  }

  // ==================== Private Methods ====================

  private processLearningState(
    card: FSRSCard,
    rating: Rating,
    daysSinceLastReview: number | null,
    reviewDate: Date
  ): number {
    // Update stability and difficulty
    if (card.stability === null || card.difficulty === null) {
      card.stability = this.initialStability(rating);
      card.difficulty = this.initialDifficulty(rating);
    } else if (daysSinceLastReview !== null && daysSinceLastReview < 1) {
      card.stability = this.shortTermStability(card.stability, rating);
      card.difficulty = this.nextDifficulty(card.difficulty, rating);
    } else {
      const retrievability = this.getRetrievability(card, reviewDate);
      card.stability = this.nextStability(
        card.difficulty,
        card.stability,
        retrievability,
        rating
      );
      card.difficulty = this.nextDifficulty(card.difficulty, rating);
    }

    // Calculate next interval
    const learningSteps = this.config.learningSteps;

    if (
      learningSteps.length === 0 ||
      (card.step !== null &&
        card.step >= learningSteps.length &&
        [Rating.Hard, Rating.Good, Rating.Easy].includes(rating))
    ) {
      card.state = State.Review;
      card.step = null;
      return this.nextInterval(card.stability) * 24 * 60 * 60 * 1000; // days to ms
    }

    switch (rating) {
      case Rating.Again:
        card.step = 0;
        return learningSteps[0] * 60 * 1000; // minutes to ms

      case Rating.Hard:
        if (card.step === 0 && learningSteps.length === 1) {
          return learningSteps[0] * 1.5 * 60 * 1000;
        } else if (card.step === 0 && learningSteps.length >= 2) {
          return ((learningSteps[0] + learningSteps[1]) / 2) * 60 * 1000;
        } {
          const stepIndex = card.step ?? 0;
          return (learningSteps[stepIndex] ?? learningSteps[0] ?? 1) * 60 * 1000;
        }

      case Rating.Good: {
        const currentStep = card.step ?? 0;
        if (currentStep + 1 === learningSteps.length) {
          card.state = State.Review;
          card.step = null;
          return this.nextInterval(card.stability) * 24 * 60 * 60 * 1000;
        }
        card.step = currentStep + 1;
        return (learningSteps[card.step] ?? learningSteps[0] ?? 1) * 60 * 1000;
      }

      case Rating.Easy:
        card.state = State.Review;
        card.step = null;
        return this.nextInterval(card.stability) * 24 * 60 * 60 * 1000;
    }
  }

  private processReviewState(
    card: FSRSCard,
    rating: Rating,
    daysSinceLastReview: number | null,
    reviewDate: Date
  ): number {
    if (card.stability === null || card.difficulty === null) {
      throw new Error('processReviewState called with null stability or difficulty');
    }
    // Update stability and difficulty
    if (daysSinceLastReview !== null && daysSinceLastReview < 1) {
      card.stability = this.shortTermStability(card.stability, rating);
    } else {
      const retrievability = this.getRetrievability(card, reviewDate);
      card.stability = this.nextStability(
        card.difficulty,
        card.stability,
        retrievability,
        rating
      );
    }
    card.difficulty = this.nextDifficulty(card.difficulty, rating);

    // Calculate next interval
    if (rating === Rating.Again) {
      const relearningSteps = this.config.relearningSteps;
      if (relearningSteps.length === 0) {
        return this.nextInterval(card.stability) * 24 * 60 * 60 * 1000;
      }
      card.state = State.Relearning;
      card.step = 0;
      return relearningSteps[0] * 60 * 1000;
    }

    return this.nextInterval(card.stability) * 24 * 60 * 60 * 1000;
  }

  private processRelearningState(
    card: FSRSCard,
    rating: Rating,
    daysSinceLastReview: number | null,
    reviewDate: Date
  ): number {
    if (card.stability === null || card.difficulty === null) {
      throw new Error('processRelearningState called with null stability or difficulty');
    }
    // Update stability and difficulty
    if (daysSinceLastReview !== null && daysSinceLastReview < 1) {
      card.stability = this.shortTermStability(card.stability, rating);
      card.difficulty = this.nextDifficulty(card.difficulty, rating);
    } else {
      const retrievability = this.getRetrievability(card, reviewDate);
      card.stability = this.nextStability(
        card.difficulty,
        card.stability,
        retrievability,
        rating
      );
      card.difficulty = this.nextDifficulty(card.difficulty, rating);
    }

    const relearningSteps = this.config.relearningSteps;

    if (
      relearningSteps.length === 0 ||
      (card.step !== null &&
        card.step >= relearningSteps.length &&
        [Rating.Hard, Rating.Good, Rating.Easy].includes(rating))
    ) {
      card.state = State.Review;
      card.step = null;
      return this.nextInterval(card.stability) * 24 * 60 * 60 * 1000;
    }

    switch (rating) {
      case Rating.Again:
        card.step = 0;
        return relearningSteps[0] * 60 * 1000;

      case Rating.Hard:
        if (card.step === 0 && relearningSteps.length === 1) {
          return relearningSteps[0] * 1.5 * 60 * 1000;
        } else if (card.step === 0 && relearningSteps.length >= 2) {
          return ((relearningSteps[0] + relearningSteps[1]) / 2) * 60 * 1000;
        } {
          const stepIndex = card.step ?? 0;
          return (relearningSteps[stepIndex] ?? relearningSteps[0] ?? 1) * 60 * 1000;
        }

      case Rating.Good: {
        const currentStep = card.step ?? 0;
        if (currentStep + 1 === relearningSteps.length) {
          card.state = State.Review;
          card.step = null;
          return this.nextInterval(card.stability) * 24 * 60 * 60 * 1000;
        }
        card.step = currentStep + 1;
        return (relearningSteps[card.step] ?? relearningSteps[0] ?? 1) * 60 * 1000;
      }

      case Rating.Easy:
        card.state = State.Review;
        card.step = null;
        return this.nextInterval(card.stability) * 24 * 60 * 60 * 1000;
    }
  }

  // ==================== Core Algorithm Methods ====================

  private initialStability(rating: Rating): number {
    const stability = this.config.parameters[rating - 1];
    return Math.max(stability, STABILITY_MIN);
  }

  private initialDifficulty(rating: Rating): number {
    const p = this.config.parameters;
    const difficulty = p[4] - Math.exp(p[5] * (rating - 1)) + 1;
    return this.clampDifficulty(difficulty);
  }

  private nextInterval(stability: number): number {
    const _p = this.config.parameters;
    const retention = this.config.desiredRetention;

    let interval =
      (stability / this.factor) * (Math.pow(retention, 1 / this.decay) - 1);

    interval = Math.round(interval);
    interval = Math.max(interval, 1);
    interval = Math.min(interval, this.config.maximumInterval);

    return interval;
  }

  private calculateIntervalForRetention(stability: number, targetRetention: number): number {
    return (stability / this.factor) * (Math.pow(targetRetention, 1 / this.decay) - 1);
  }

  private shortTermStability(stability: number, rating: Rating): number {
    const p = this.config.parameters;
    let increase = Math.exp(p[17] * (rating - 3 + p[18])) * Math.pow(stability, -p[19]);

    if (rating === Rating.Good || rating === Rating.Easy) {
      increase = Math.max(increase, 1.0);
    }

    const newStability = stability * increase;
    return Math.max(newStability, STABILITY_MIN);
  }

  private nextDifficulty(difficulty: number, rating: Rating): number {
    const p = this.config.parameters;

    const linearDamping = (delta: number, d: number): number => {
      return ((10.0 - d) * delta) / 9.0;
    };

    const meanReversion = (arg1: number, arg2: number): number => {
      return p[7] * arg1 + (1 - p[7]) * arg2;
    };

    const arg1 = p[4] - Math.exp(p[5] * (Rating.Easy - 1)) + 1; // initial difficulty for Easy
    const deltaDifficulty = -(p[6] * (rating - 3));
    const arg2 = difficulty + linearDamping(deltaDifficulty, difficulty);

    const nextDiff = meanReversion(arg1, arg2);
    return this.clampDifficulty(nextDiff);
  }

  private nextStability(
    difficulty: number,
    stability: number,
    retrievability: number,
    rating: Rating
  ): number {
    let nextStab: number;

    if (rating === Rating.Again) {
      nextStab = this.nextForgetStability(difficulty, stability, retrievability);
    } else {
      nextStab = this.nextRecallStability(difficulty, stability, retrievability, rating);
    }

    return Math.max(nextStab, STABILITY_MIN);
  }

  private nextForgetStability(
    difficulty: number,
    stability: number,
    retrievability: number
  ): number {
    const p = this.config.parameters;

    const longTermParams =
      p[11] *
      Math.pow(difficulty, -p[12]) *
      (Math.pow(stability + 1, p[13]) - 1) *
      Math.exp((1 - retrievability) * p[14]);

    const shortTermParams = stability / Math.exp(p[17] * p[18]);

    return Math.min(longTermParams, shortTermParams);
  }

  private nextRecallStability(
    difficulty: number,
    stability: number,
    retrievability: number,
    rating: Rating
  ): number {
    const p = this.config.parameters;

    const hardPenalty = rating === Rating.Hard ? p[15] : 1;
    const easyBonus = rating === Rating.Easy ? p[16] : 1;

    return (
      stability *
      (1 +
        Math.exp(p[8]) *
          (11 - difficulty) *
          Math.pow(stability, -p[9]) *
          (Math.exp((1 - retrievability) * p[10]) - 1) *
          hardPenalty *
          easyBonus)
    );
  }

  private clampDifficulty(difficulty: number): number {
    return Math.min(Math.max(difficulty, MIN_DIFFICULTY), MAX_DIFFICULTY);
  }

  private getFuzzedInterval(intervalMs: number): number {
    const intervalDays = intervalMs / (1000 * 60 * 60 * 24);

    if (intervalDays < 2.5) {
      return intervalMs;
    }

    let delta = 1.0;
    for (const range of FUZZ_RANGES) {
      delta += range.factor * Math.max(Math.min(intervalDays, range.end) - range.start, 0.0);
    }

    let minIvl = Math.round(intervalDays - delta);
    let maxIvl = Math.round(intervalDays + delta);

    minIvl = Math.max(2, minIvl);
    maxIvl = Math.min(maxIvl, this.config.maximumInterval);
    minIvl = Math.min(minIvl, maxIvl);

    const fuzzedDays = Math.random() * (maxIvl - minIvl + 1) + minIvl;
    const clampedDays = Math.min(Math.round(fuzzedDays), this.config.maximumInterval);

    return clampedDays * 24 * 60 * 60 * 1000;
  }
}
