'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Hill equation easing function.
 *
 * From biochemistry: Y = I^nH / (K0.5^nH + I^nH)
 * Produces a sigmoidal S-curve where nH controls steepness.
 *
 * - nH > 1: cooperative binding (slow start, fast middle, slow end)
 * - nH = 1: Michaelis-Menten hyperbola (diminishing returns)
 * - nH < 1: dampened response
 *
 * STEM grounding: chemistry_hill_response (confidence: 0.85)
 * Transfer: signal_cascade_amplification → animation easing
 *
 * @param t - Progress [0, 1]
 * @param nH - Hill coefficient (steepness). Default 2.8 for pleasing UI curve.
 * @param kHalf - Half-saturation point. Default 0.5 (symmetric).
 */
function hillEase(t: number, nH = 2.8, kHalf = 0.5): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const tN = Math.pow(t, nH);
  const kN = Math.pow(kHalf, nH);
  return tN / (kN + tN);
}

interface UseAnimatedValueOptions {
  /** Animation duration in ms. Default: 824ms (φ × 200ms × φ) */
  duration?: number;
  /** Hill coefficient for easing steepness. Default: 2.8 */
  hillCoefficient?: number;
  /** Delay before animation starts in ms. Default: 0 */
  delay?: number;
  /** Whether to animate. Set false to show value immediately. */
  enabled?: boolean;
  /** Format function for display. Default: toLocaleString */
  format?: (value: number) => string;
}

/**
 * Animate a numeric value from 0 to target using Hill equation easing.
 *
 * The Hill equation produces a biochemistry-inspired S-curve that feels
 * more organic than cubic-bezier: slow start → rapid middle → gentle landing.
 *
 * @example
 * ```tsx
 * const display = useAnimatedValue(1247, { duration: 800 });
 * return <span>{display}</span>; // "1,247" with animated count-up
 * ```
 */
export function useAnimatedValue(
  target: number,
  options: UseAnimatedValueOptions = {}
): string {
  const {
    duration = 824,
    hillCoefficient = 2.8,
    delay = 0,
    enabled = true,
    format = (v: number) => Math.round(v).toLocaleString(),
  } = options;

  const [display, setDisplay] = useState(() =>
    enabled ? format(0) : format(target)
  );
  const frameRef = useRef<number>(0);
  const prevTarget = useRef(target);

  useEffect(() => {
    if (!enabled) {
      setDisplay(format(target));
      return;
    }

    const startValue = prevTarget.current !== target ? 0 : 0;
    prevTarget.current = target;

    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime - delay;

      if (elapsed < 0) {
        frameRef.current = requestAnimationFrame(animate);
        return;
      }

      const progress = Math.min(elapsed / duration, 1);
      const eased = hillEase(progress, hillCoefficient);
      const current = startValue + (target - startValue) * eased;

      setDisplay(format(current));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration, hillCoefficient, delay, enabled, format]);

  return display;
}

/**
 * Langmuir coverage function for progress/capacity visualization.
 *
 * θ = K[A] / (1 + K[A])
 * Models finite capacity with saturation behavior.
 *
 * STEM grounding: chemistry_langmuir_coverage (confidence: 0.88)
 * Transfer: case_slot_occupancy → progress bar fill behavior
 *
 * @param current - Current usage
 * @param capacity - Maximum capacity
 * @param affinity - How quickly it approaches saturation. Default: 3.0
 * @returns Coverage fraction [0, 1]
 */
export function langmuirProgress(
  current: number,
  capacity: number,
  affinity = 3.0
): number {
  if (capacity <= 0) return 0;
  const concentration = current / capacity;
  return (affinity * concentration) / (1 + affinity * concentration);
}
