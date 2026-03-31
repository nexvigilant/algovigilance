/**
 * Academy Configuration
 *
 * Central export for all Academy-related configuration.
 */

// EPA Level Configuration
export {
  EPA_LEVEL_ORDER,
  EPA_LEVEL_LABELS,
  EPA_LEVEL_DESCRIPTIONS,
  EPA_LEVEL_COLORS,
  DEFAULT_ENTRUSTMENT_LEVELS,
} from './epa-levels.config';

// Section Configuration
export { ACADEMY_SECTIONS, type AcademySection } from './sections.config';

// Navigation Configuration
export {
  ACADEMY_NAV_ITEMS,
  ACADEMY_BASE_PATH,
  ACADEMY_DASHBOARD_PATH,
  type AcademyNavItem,
} from './navigation.config';

// Limits Configuration
export {
  // Display limits
  RECENT_COURSES_LIMIT,
  KSBS_PREVIEW_LIMIT,
  ALO_COMPLETIONS_LIMIT,
  FSRS_CARDS_LIMIT,
  // Skeleton counts
  SKELETON_COURSE_COUNT,
  SKELETON_CERTIFICATE_COUNT,
  SKELETON_STATS_COUNT,
  SKELETON_PATHWAY_COUNT,
  // Timing & thresholds
  QUIZ_PASSING_SCORE,
  ALO_ESTIMATED_MINUTES,
  MILESTONE_THRESHOLDS,
  STREAK_LEVELS,
  // Layout constants
  SIDEBAR_HEADER_HEIGHT,
  DEFAULT_DOMAIN_ID,
} from './limits.config';
