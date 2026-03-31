/**
 * Launch Timeline Constants
 *
 * Single source of truth for all launch dates and milestones.
 * Update these values once to propagate changes across the entire application.
 *
 * @example
 * ```tsx
 * import { LAUNCH_DATE, LAUNCH_PHASES, formatLaunchStatus } from '@/data/launch-timeline';
 * ```
 */

/**
 * Primary platform launch date
 * December 13, 2025 at 10:00 AM EST (UTC-5)
 */
export const LAUNCH_DATE = new Date('2025-12-13T10:00:00-05:00');

/**
 * Launch date as Unix timestamp (for countdown calculations)
 */
export const LAUNCH_TIMESTAMP = LAUNCH_DATE.getTime();

/**
 * Launch phases for feature rollouts
 */
export const LAUNCH_PHASES = {
  /** Initial platform launch - core features */
  PLATFORM_LAUNCH: LAUNCH_DATE,
  /** Phase 2 features - Q1 2026 */
  PHASE_2: new Date('2026-03-01T00:00:00-05:00'),
  /** Phase 3 features - Q2 2026 */
  PHASE_3: new Date('2026-06-01T00:00:00-05:00'),
} as const;

/**
 * Human-readable status labels for different release states
 */
export const RELEASE_STATUS = {
  /** Available at platform launch */
  AT_LAUNCH: 'Releasing at Launch',
  /** Coming in early 2026 (Q1) */
  EARLY_2026: 'Coming Q1 2026',
  /** Coming mid 2026 (Q2) */
  MID_2026: 'Coming Q2 2026',
  /** In active development */
  IN_DEVELOPMENT: 'In Development',
  /** Now available */
  AVAILABLE: 'Available Now',
} as const;

export type ReleaseStatus = typeof RELEASE_STATUS[keyof typeof RELEASE_STATUS];

/**
 * Current platform phase - controls copy across the platform
 */
export const CURRENT_PHASE = {
  /** Phase identifier (1, 2, 3) */
  number: 1,
  /** Display name for the current phase */
  name: 'Foundation Protocol',
  /** Full phase label */
  label: 'Phase 1: Foundation Protocol',
  /** Whether we're in founding member period */
  isFounding: true,
  /** Copy for founding member CTA */
  ctaText: 'Become a Founding Member',
  /** Short description of the phase */
  description: 'We are constructing the foundation—and Founding Members have the opportunity to co-architect.',
} as const;

/**
 * Check if the platform has launched
 */
export function hasLaunched(): boolean {
  return Date.now() >= LAUNCH_TIMESTAMP;
}

/**
 * Format a release status with optional date context
 */
export function formatLaunchStatus(status: ReleaseStatus): string {
  if (hasLaunched() && status === RELEASE_STATUS.AT_LAUNCH) {
    return RELEASE_STATUS.AVAILABLE;
  }
  return status;
}

/**
 * Get days until launch (returns 0 if already launched)
 */
export function getDaysUntilLaunch(): number {
  const now = Date.now();
  if (now >= LAUNCH_TIMESTAMP) return 0;
  return Math.ceil((LAUNCH_TIMESTAMP - now) / (1000 * 60 * 60 * 24));
}
