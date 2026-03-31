import { recordSignal } from './dev-signal-store';

/**
 * Signals for missing integration points.
 * Use these to replace mock data or magic numbers.
 */

/**
 * Marks a code location as a missing integration point for real data.
 * Records the gap in the dev-signal-store and returns a placeholder.
 */
export function integrationGap<T>(
  placeholder: T,
  context: {
    page: string;
    detail: string;
  }
): T {
  if (process.env.NODE_ENV === 'development') {
    recordSignal({
      type: 'integration_gap',
      page: context.page,
      detail: `MISSING INTEGRATION: ${context.detail}`,
    });
  }
  return placeholder;
}

/**
 * Common signal constants for missing data.
 */
export const MISSING_INTEGRATION_STRING = "MISSING_INTEGRATION";
export const MISSING_INTEGRATION_NUMBER = -1; // Using -1 to clearly indicate it's not a real value if it's supposed to be positive
export const MISSING_INTEGRATION_ARRAY: unknown[] = [];
