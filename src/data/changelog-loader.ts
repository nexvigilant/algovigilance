/**
 * Changelog Data Loader
 *
 * Provides type-safe access to changelog data with runtime validation.
 * Prevents silent failures if JSON structure changes.
 */

import type { Changelog, ChangelogEntry } from '@/types/changelog';
import rawData from './changelog.json';

/**
 * Validates that an object matches the ChangelogEntry shape
 */
function isValidEntry(entry: unknown): entry is ChangelogEntry {
  if (typeof entry !== 'object' || entry === null) return false;
  const e = entry as Record<string, unknown>;
  return (
    typeof e.version === 'string' &&
    typeof e.date === 'string' &&
    typeof e.title === 'string' &&
    typeof e.description === 'string' &&
    typeof e.changes === 'object' &&
    e.changes !== null
  );
}

/**
 * Validates that an object matches the Changelog shape
 */
function isValidChangelog(data: unknown): data is Changelog {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    Array.isArray(d.entries) &&
    d.entries.every(isValidEntry) &&
    typeof d.lastUpdated === 'string' &&
    typeof d.currentVersion === 'string'
  );
}

/**
 * Get validated changelog data
 * @throws Error if JSON structure is invalid
 */
export function getChangelog(): Changelog {
  if (!isValidChangelog(rawData)) {
    throw new Error(
      'changelog.json structure does not match Changelog type. ' +
      'Check for missing or misnamed fields.'
    );
  }
  return rawData;
}

/**
 * Get changelog entries with optional limit for pagination
 */
export function getChangelogEntries(limit?: number): ChangelogEntry[] {
  const changelog = getChangelog();
  if (limit && limit > 0) {
    return [...changelog.entries.slice(0, limit)];
  }
  return [...changelog.entries];
}

/**
 * Get total number of entries
 */
export function getTotalEntries(): number {
  return getChangelog().entries.length;
}

/**
 * Get current version string
 */
export function getCurrentVersion(): string {
  return getChangelog().currentVersion;
}
