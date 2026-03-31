/**
 * FSRS (Free Spaced Repetition Scheduler) Types
 *
 * TypeScript port of the py-fsrs algorithm.
 * @see https://github.com/open-spaced-repetition/py-fsrs
 */

/**
 * Card learning state
 */
export enum State {
  Learning = 1,
  Review = 2,
  Relearning = 3,
}

/**
 * Review rating options
 */
export enum Rating {
  Again = 1,
  Hard = 2,
  Good = 3,
  Easy = 4,
}

/**
 * FSRS Card representation
 */
export interface FSRSCard {
  /** Unique card identifier (epoch ms) */
  cardId: string;
  /** Current learning state */
  state: State;
  /** Current learning/relearning step (null for Review state) */
  step: number | null;
  /** Memory stability (days until 90% retention) */
  stability: number | null;
  /** Item difficulty (1-10 scale) */
  difficulty: number | null;
  /** Next due date (ISO string) */
  due: string;
  /** Last review date (ISO string) */
  lastReview: string | null;
}

/**
 * Firestore-compatible FSRS Card document
 * For storing in /users/{userId}/fsrs_cards/{ksbId}
 */
export interface FSRSCardDocument extends Omit<FSRSCard, 'due' | 'lastReview'> {
  /** The KSB ID this card tracks */
  ksbId: string;
  /** User ID */
  userId: string;
  /** Total repetitions */
  reps: number;
  /** Times forgotten (lapsed) */
  lapses: number;
  /** Due date as Firestore Timestamp */
  due: Date;
  /** Last review as Firestore Timestamp */
  lastReview: Date | null;
  /** Created timestamp */
  createdAt: Date;
  /** Updated timestamp */
  updatedAt: Date;
}

/**
 * Review log entry
 */
export interface ReviewLog {
  cardId: string;
  rating: Rating;
  reviewDatetime: Date;
  reviewDuration?: number; // milliseconds
}

/**
 * Scheduler configuration
 */
export interface SchedulerConfig {
  /** 21 FSRS parameters */
  parameters: number[];
  /** Target retention rate (0-1, default 0.9) */
  desiredRetention: number;
  /** Learning steps in minutes */
  learningSteps: number[];
  /** Relearning steps in minutes */
  relearningSteps: number[];
  /** Maximum interval in days */
  maximumInterval: number;
  /** Enable interval fuzzing */
  enableFuzzing: boolean;
}

/**
 * Scheduling result from a review
 */
export interface SchedulingResult {
  card: FSRSCard;
  reviewLog: ReviewLog;
  /** Calculated next interval in days (for Review state) */
  intervalDays?: number;
}

/**
 * Retrievability prediction
 */
export interface RetrievabilityInfo {
  /** Current retrievability (0-1) */
  retrievability: number;
  /** Days since last review */
  daysSinceReview: number;
  /** Predicted days until retention drops below target */
  daysUntilForgetting: number;
}

/**
 * Default FSRS v5 parameters
 */
export const DEFAULT_PARAMETERS: number[] = [
  0.212,   // p[0]: initial stability for Again
  1.2931,  // p[1]: initial stability for Hard
  2.3065,  // p[2]: initial stability for Good
  8.2956,  // p[3]: initial stability for Easy
  6.4133,  // p[4]: initial difficulty
  0.8334,  // p[5]: difficulty sensitivity to rating
  3.0194,  // p[6]: difficulty update factor
  0.001,   // p[7]: mean reversion weight
  1.8722,  // p[8]: recall stability base multiplier
  0.1666,  // p[9]: recall stability power
  0.796,   // p[10]: recall retrievability factor
  1.4835,  // p[11]: forget stability multiplier
  0.0614,  // p[12]: forget difficulty power
  0.2629,  // p[13]: forget stability power
  1.6483,  // p[14]: forget retrievability factor
  0.6014,  // p[15]: hard penalty
  1.8729,  // p[16]: easy bonus
  0.5425,  // p[17]: short-term stability factor
  0.0912,  // p[18]: short-term rating offset
  0.0658,  // p[19]: short-term stability power
  0.1542,  // p[20]: decay factor
];

/**
 * Default scheduler configuration
 */
export const DEFAULT_SCHEDULER_CONFIG: SchedulerConfig = {
  parameters: DEFAULT_PARAMETERS,
  desiredRetention: 0.9,
  learningSteps: [1, 10], // minutes
  relearningSteps: [10], // minutes
  maximumInterval: 36500, // ~100 years
  enableFuzzing: true,
};

// Constants
export const STABILITY_MIN = 0.001;
export const MIN_DIFFICULTY = 1.0;
export const MAX_DIFFICULTY = 10.0;

/**
 * Fuzz ranges for interval randomization
 */
export const FUZZ_RANGES = [
  { start: 2.5, end: 7.0, factor: 0.15 },
  { start: 7.0, end: 20.0, factor: 0.1 },
  { start: 20.0, end: Infinity, factor: 0.05 },
];
