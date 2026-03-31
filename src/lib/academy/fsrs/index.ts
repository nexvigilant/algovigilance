/**
 * FSRS (Free Spaced Repetition Scheduler) Module
 *
 * TypeScript implementation of the FSRS v5 algorithm for optimal
 * spaced repetition scheduling of KSBs in the Academy.
 *
 * @example
 * ```typescript
 * import { FSRSScheduler, Rating } from '@/lib/academy/fsrs';
 *
 * const scheduler = new FSRSScheduler();
 * const card = scheduler.createCard('ksb-123');
 *
 * // Review the card
 * const { card: updated, intervalDays } = scheduler.reviewCard(card, Rating.Good);
 * log.info(`Next review in ${intervalDays} days`);
 *
 * // Check retrievability
 * const { retrievability } = scheduler.getRetrievabilityInfo(updated);
 * log.info(`Current retention: ${(retrievability * 100).toFixed(1)}%`);
 * ```
 */

export { FSRSScheduler } from './fsrs-algorithm';

export {
  // Enums
  State,
  Rating,

  // Interfaces
  type FSRSCard,
  type FSRSCardDocument,
  type ReviewLog,
  type SchedulerConfig,
  type SchedulingResult,
  type RetrievabilityInfo,

  // Constants
  DEFAULT_PARAMETERS,
  DEFAULT_SCHEDULER_CONFIG,
  STABILITY_MIN,
  MIN_DIFFICULTY,
  MAX_DIFFICULTY,
  FUZZ_RANGES,
} from './fsrs-types';
