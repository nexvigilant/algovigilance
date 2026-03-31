/**
 * Changelog Types for AlgoVigilance
 *
 * Tracks platform releases, features, fixes, and improvements
 * with categorization by product area and change type.
 *
 * @remarks
 * Used by the /changelog page and What's New modal to display
 * platform updates to users. Entries are stored in JSON and
 * rendered with React components.
 */

// ============================================================================
// BRANDED ID TYPES
// ============================================================================

/**
 * Branded string type for semantic version strings.
 * Format: "MAJOR.MINOR.PATCH" (e.g., "2.0.0")
 */
export type VersionString = string & { readonly __brand: 'VersionString' };

/**
 * Branded string type for ISO date strings.
 * Format: "YYYY-MM-DD" (e.g., "2025-11-27")
 */
export type ISODateString = string & { readonly __brand: 'ISODateString' };

// ============================================================================
// CATEGORY & TYPE ENUMS
// ============================================================================

/**
 * Platform areas that can have changelog entries.
 */
export type ChangeCategory =
  | 'academy'       // LMS, courses, assessments
  | 'community'     // Forums, messaging, profiles
  | 'intelligence'  // Content hub, articles
  | 'platform'      // General platform improvements
  | 'security'      // Security updates
  | 'accessibility'; // A11y improvements

/**
 * All valid change categories.
 */
export const CHANGE_CATEGORIES: readonly ChangeCategory[] = [
  'academy', 'community', 'intelligence', 'platform', 'security', 'accessibility'
] as const;

/**
 * Type guard for ChangeCategory.
 */
export function isChangeCategory(value: string): value is ChangeCategory {
  return CHANGE_CATEGORIES.includes(value as ChangeCategory);
}

/**
 * Types of changes that can be logged.
 */
export type ChangeType =
  | 'feature'       // New capability
  | 'improvement'   // Enhancement to existing
  | 'fix'           // Bug fix
  | 'security'      // Security patch
  | 'accessibility' // A11y fix
  | 'breaking';     // Breaking change (rare)

/**
 * All valid change types.
 */
export const CHANGE_TYPES: readonly ChangeType[] = [
  'feature', 'improvement', 'fix', 'security', 'accessibility', 'breaking'
] as const;

/**
 * Type guard for ChangeType.
 */
export function isChangeType(value: string): value is ChangeType {
  return CHANGE_TYPES.includes(value as ChangeType);
}

// ============================================================================
// CORE INTERFACES
// ============================================================================

/**
 * Individual change item within a changelog entry.
 *
 * @remarks
 * Represents a single feature, fix, or improvement
 * with metadata for display and linking.
 */
export interface ChangeItem {
  /** Short description of the change */
  readonly description: string;
  /** Category of the platform affected */
  readonly category: ChangeCategory;
  /** Type of change */
  readonly type: ChangeType;
  /** Optional link to documentation or PR */
  readonly link?: string;
  /** Optional issue/PR number */
  readonly issueNumber?: string;
  /** Optional image URL for What's New modal */
  readonly image?: string;
  /** Optional short title for highlights */
  readonly title?: string;
}

/**
 * Highlighted feature for What's New modal.
 *
 * @remarks
 * Curated selection of 3-5 notable changes for
 * prominent display in the What's New modal.
 */
export interface HighlightedFeature {
  /** Short, catchy title */
  readonly title: string;
  /** Brief description */
  readonly description: string;
  /** Icon name from lucide-react */
  readonly icon?: string;
  /** Optional image/gif URL */
  readonly image?: string;
  /** Category badge */
  readonly category: ChangeCategory;
}

/**
 * Grouped changes by type for a changelog entry.
 */
export interface ChangesByType {
  readonly features: readonly ChangeItem[];
  readonly improvements: readonly ChangeItem[];
  readonly fixes: readonly ChangeItem[];
  readonly security: readonly ChangeItem[];
  readonly accessibility: readonly ChangeItem[];
  readonly breaking: readonly ChangeItem[];
}

/**
 * Single changelog entry representing a release.
 *
 * @remarks
 * Each entry represents a deployed version of the platform
 * with all associated changes grouped by type.
 */
export interface ChangelogEntry {
  /** Semantic version (e.g., "2.0.0") */
  readonly version: VersionString;
  /** Release date in ISO format (e.g., "2025-11-27") */
  readonly date: ISODateString;
  /** Release title/codename */
  readonly title: string;
  /** High-level description of this release */
  readonly description: string;
  /** Whether this is a major release (highlighted differently) */
  readonly isMajor?: boolean;
  /** List of changes grouped by type */
  readonly changes: ChangesByType;
  /** Curated highlights for What's New modal (3-5 items) */
  readonly highlights?: readonly HighlightedFeature[];
}

/**
 * Complete changelog with all entries.
 *
 * @remarks
 * Root container for all changelog data.
 * Entries are ordered newest-first.
 */
export interface Changelog {
  /** All changelog entries, newest first */
  readonly entries: readonly ChangelogEntry[];
  /** Last updated timestamp in ISO format */
  readonly lastUpdated: ISODateString;
  /** Current deployed version */
  readonly currentVersion: VersionString;
}

// ============================================================================
// DISPLAY CONFIGURATION
// ============================================================================

/**
 * Display configuration for a category.
 */
export interface CategoryDisplayConfig {
  readonly label: string;
  readonly color: string;
}

/**
 * Display configuration for a change type.
 */
export interface ChangeTypeDisplayConfig {
  readonly label: string;
  readonly icon: string;
}

/**
 * Category display labels and Tailwind color classes.
 */
export const CATEGORY_CONFIG: Readonly<Record<ChangeCategory, CategoryDisplayConfig>> = {
  academy: { label: 'Academy', color: 'bg-blue-100 text-blue-800' },
  community: { label: 'Community', color: 'bg-purple-100 text-purple-800' },
  intelligence: { label: 'Intelligence', color: 'bg-amber-100 text-amber-800' },
  platform: { label: 'Platform', color: 'bg-slate-100 text-slate-800' },
  security: { label: 'Security', color: 'bg-red-100 text-red-800' },
  accessibility: { label: 'Accessibility', color: 'bg-green-100 text-green-800' },
} as const;

/**
 * Change type display labels and lucide-react icon names.
 */
export const CHANGE_TYPE_CONFIG: Readonly<Record<ChangeType, ChangeTypeDisplayConfig>> = {
  feature: { label: 'New Features', icon: 'sparkles' },
  improvement: { label: 'Improvements', icon: 'trending-up' },
  fix: { label: 'Bug Fixes', icon: 'bug' },
  security: { label: 'Security', icon: 'shield' },
  accessibility: { label: 'Accessibility', icon: 'accessibility' },
  breaking: { label: 'Breaking Changes', icon: 'alert-triangle' },
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the current version from a changelog.
 *
 * @param changelog - The changelog to read
 * @returns The current version string, or '0.0.0' if not available
 */
export function getCurrentVersion(changelog: Changelog): VersionString {
  return changelog.currentVersion || changelog.entries[0]?.version || '0.0.0' as VersionString;
}

/**
 * Check if a version is pre-release (major version < 1).
 *
 * @param version - Semantic version string to check
 * @returns True if version is < 1.0.0
 */
export function isPreRelease(version: string): boolean {
  const [major] = version.split('.').map(Number);
  return major < 1;
}

/**
 * Count of changes by type.
 */
export type ChangeCountByType = Readonly<Record<ChangeType, number>>;

/**
 * Count changes in an entry by type.
 *
 * @param entry - The changelog entry to count
 * @returns Object with counts for each change type
 */
export function countChangesByType(entry: ChangelogEntry): ChangeCountByType {
  return {
    feature: entry.changes.features.length,
    improvement: entry.changes.improvements.length,
    fix: entry.changes.fixes.length,
    security: entry.changes.security.length,
    accessibility: entry.changes.accessibility.length,
    breaking: entry.changes.breaking.length,
  };
}

/**
 * Get total number of changes in an entry.
 *
 * @param entry - The changelog entry to count
 * @returns Total number of changes across all types
 */
export function getTotalChanges(entry: ChangelogEntry): number {
  const counts = countChangesByType(entry);
  return Object.values(counts).reduce((sum, count) => sum + count, 0);
}

/**
 * Parse a version string into components.
 *
 * @param version - Semantic version string (e.g., "2.1.0")
 * @returns Object with major, minor, patch numbers
 */
export function parseVersion(version: string): { major: number; minor: number; patch: number } {
  const [major = 0, minor = 0, patch = 0] = version.split('.').map(Number);
  return { major, minor, patch };
}

/**
 * Compare two version strings.
 *
 * @param a - First version
 * @param b - Second version
 * @returns Negative if a < b, positive if a > b, zero if equal
 */
export function compareVersions(a: string, b: string): number {
  const va = parseVersion(a);
  const vb = parseVersion(b);

  if (va.major !== vb.major) return va.major - vb.major;
  if (va.minor !== vb.minor) return va.minor - vb.minor;
  return va.patch - vb.patch;
}
