/**
 * Utility functions for signal intelligence
 */

import type { SignalStrength } from '../../types/federated-signal';

/**
 * Classify signal strength based on value and significance
 * @param value - Signal detection metric value
 * @param isSignal - Whether the signal is statistically significant
 * @returns Qualitative signal strength
 */
export function classifySignalStrength(value: number, isSignal: boolean): SignalStrength {
  if (!isSignal) return 'no_signal';
  if (value >= 10) return 'very_strong';
  if (value >= 5) return 'strong';
  if (value >= 3) return 'moderate';
  if (value >= 2) return 'weak';
  if (value >= 1.5) return 'very_weak';
  return 'no_signal';
}
