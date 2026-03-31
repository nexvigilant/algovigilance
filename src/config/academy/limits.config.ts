/**
 * Academy Limits Configuration
 *
 * Defines pagination limits, display counts, and other numeric constants.
 */

// =============================================================================
// DISPLAY LIMITS
// =============================================================================

/** Number of recent courses to show on dashboard */
export const RECENT_COURSES_LIMIT = 6;

/** Number of KSBs to show in preview/collapsed view */
export const KSBS_PREVIEW_LIMIT = 10;

/** Maximum number of ALO completions to fetch in a single query */
export const ALO_COMPLETIONS_LIMIT = 100;

/** Maximum number of FSRS cards to fetch for review session */
export const FSRS_CARDS_LIMIT = 50;

// =============================================================================
// SKELETON COUNTS
// =============================================================================

/** Number of skeleton cards for course grids */
export const SKELETON_COURSE_COUNT = 6;

/** Number of skeleton cards for certificates */
export const SKELETON_CERTIFICATE_COUNT = 3;

/** Number of skeleton items for stat cards */
export const SKELETON_STATS_COUNT = 4;

/** Number of skeleton items for pathway grids */
export const SKELETON_PATHWAY_COUNT = 4;

// =============================================================================
// TIMING & THRESHOLDS
// =============================================================================

/** Minimum quiz passing score (percentage) */
export const QUIZ_PASSING_SCORE = 70;

/** Default estimated minutes for an ALO */
export const ALO_ESTIMATED_MINUTES = 8;

/** Milestone thresholds for celebrations (lesson count) */
export const MILESTONE_THRESHOLDS = [10, 25, 50, 100, 250, 500] as const;

/** Streak days for different achievement levels */
export const STREAK_LEVELS = {
  bronze: 3,
  silver: 7,
  gold: 14,
  platinum: 30,
} as const;

// =============================================================================
// LAYOUT CONSTANTS
// =============================================================================

/** Sidebar header height for scroll calculations */
export const SIDEBAR_HEADER_HEIGHT = 180;

/** Default domain ID fallback for KSBs */
export const DEFAULT_DOMAIN_ID = 'D01';
