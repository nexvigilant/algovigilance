'use client';

/**
 * Runtime Graceful Degradation Hook
 *
 * Engineering source: Williams 1909, Ch 10 — Dual-circuit braking
 * T1 Primitives: ∂(Boundary) + ς(State) + Σ(Sum/variant)
 *
 * Principle: When one brake circuit fails, the other still works at
 * reduced capacity. Never cliff-edge to nothing — degrade through
 * predictable, prioritized stages.
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const { level, triggerDegradation, restore } = useDegradedMode();
 *
 *   useEffect(() => {
 *     fetchData().catch(() => triggerDegradation());
 *   }, [triggerDegradation]);
 *
 *   switch (level) {
 *     case 'full':      return <RichDashboard />;
 *     case 'degraded':  return <SimpleDashboard />;
 *     case 'readonly':  return <StaticSnapshot />;
 *     case 'emergency': return <MaintenanceBanner />;
 *   }
 * }
 * ```
 */

import { useState, useCallback } from 'react';
import { type ServiceLevel, degrade } from '@/lib/feature-flags';

export interface UseDegradedModeResult {
  /** Current service level */
  level: ServiceLevel;
  /** Step down one degradation level */
  triggerDegradation: () => void;
  /** Restore to full capability */
  restore: () => void;
  /** Whether operating at full capability */
  isFullCapability: boolean;
  /** Whether degraded at any level */
  isDegraded: boolean;
}

export function useDegradedMode(
  initial: ServiceLevel = 'full'
): UseDegradedModeResult {
  const [level, setLevel] = useState<ServiceLevel>(initial);

  const triggerDegradation = useCallback(() => {
    setLevel((prev) => degrade(prev));
  }, []);

  const restore = useCallback(() => {
    setLevel('full');
  }, []);

  return {
    level,
    triggerDegradation,
    restore,
    isFullCapability: level === 'full',
    isDegraded: level !== 'full',
  };
}
