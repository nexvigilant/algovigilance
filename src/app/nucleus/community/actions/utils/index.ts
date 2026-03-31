/**
 * Community Actions Utilities
 *
 * Centralized exports for shared utilities used across community server actions.
 *
 * @module actions/utils
 */

// Timestamp conversion utilities
export {
  convertTimestamps,
  timestampToISO,
  parseTimestamp,
} from './timestamp';

// Performance instrumentation
export {
  withTiming,
  createTimer,
  getRecentMetrics,
  getMetricsSummary,
  clearMetrics,
  logOptimizationImpact,
  type PerformanceMetric,
} from './performance';

// Authentication and user utilities
export {
  getAuthenticatedUser,
  getCurrentUserInfo,
} from './auth';

export {
  sanitizeHtml,
  sanitizeUrl,
  markdownToHtml,
} from './content';

export {
  extractMentions,
  resolveUsernamesToIds,
  createMentionNotifications,
} from './notifications';

export {
  handleActionError,
  createSuccessResult,
  type ActionResult,
} from './errors';

export {
  orchestrateActivity,
  orchestrateBatchActivities,
  type ActivityType,
  type ActivityEvent,
  type ActivityMetadata,
} from './orchestrator';

// NOTE: Governance exports removed from utils barrel to avoid circular imports.
// Import directly from '@/app/nucleus/community/actions/admin/governance' instead.

// Sidebar configuration utilities
export {
  getSidebarConfig,
  isDynamicSidebarEnabled,
  type PathwayMapping,
  type CircleNavInfo,
  type DynamicNavItem,
  type SidebarConfig,
} from './sidebar-config';
