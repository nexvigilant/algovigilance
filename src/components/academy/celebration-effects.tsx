'use client';

/**
 * Celebration Effects Component
 *
 * Provides confetti and celebration animations for Academy achievements.
 * Uses canvas-confetti for performant, GPU-accelerated animations.
 *
 * @example
 * ```tsx
 * import { useCelebration } from '@/components/academy/celebration-effects';
 *
 * function KSBComplete() {
 *   const { celebrate, celebrateEPA, celebrateCertificate } = useCelebration();
 *
 *   const handleComplete = () => {
 *     celebrate('ksb'); // KSB completion
 *   };
 * }
 * ```
 */

import { useCallback, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

// AlgoVigilance brand colors for confetti
const BRAND_COLORS = {
  cyan: '#22d3ee',     // Primary action
  gold: '#fbbf24',     // Premium/achievement
  cyanSoft: '#67e8f9', // Secondary
  white: '#ffffff',
};

type CelebrationLevel = 'ksb' | 'epa-level' | 'epa-complete' | 'certificate';

interface CelebrationConfig {
  particleCount: number;
  spread: number;
  origin: { x: number; y: number };
  colors: string[];
  duration?: number;
  scalar?: number;
}

const CELEBRATION_CONFIGS: Record<CelebrationLevel, CelebrationConfig> = {
  'ksb': {
    particleCount: 50,
    spread: 60,
    origin: { x: 0.5, y: 0.6 },
    colors: [BRAND_COLORS.cyan, BRAND_COLORS.cyanSoft, BRAND_COLORS.white],
    duration: 2000,
  },
  'epa-level': {
    particleCount: 80,
    spread: 80,
    origin: { x: 0.5, y: 0.5 },
    colors: [BRAND_COLORS.cyan, BRAND_COLORS.gold, BRAND_COLORS.white],
    duration: 3000,
    scalar: 1.2,
  },
  'epa-complete': {
    particleCount: 150,
    spread: 100,
    origin: { x: 0.5, y: 0.4 },
    colors: [BRAND_COLORS.gold, BRAND_COLORS.cyan, BRAND_COLORS.cyanSoft, BRAND_COLORS.white],
    duration: 4000,
    scalar: 1.5,
  },
  'certificate': {
    particleCount: 200,
    spread: 120,
    origin: { x: 0.5, y: 0.3 },
    colors: [BRAND_COLORS.gold, BRAND_COLORS.cyan, '#fef3c7', BRAND_COLORS.white],
    duration: 5000,
    scalar: 1.8,
  },
};

/**
 * Fire a single burst of confetti
 */
function fireBurst(config: CelebrationConfig): void {
  confetti({
    particleCount: config.particleCount,
    spread: config.spread,
    origin: config.origin,
    colors: config.colors,
    scalar: config.scalar ?? 1,
    ticks: 200,
    gravity: 1.2,
    decay: 0.94,
  });
}

/**
 * Fire confetti from both sides (for bigger celebrations)
 */
function fireSideBursts(config: CelebrationConfig): void {
  const leftConfig = { ...config, origin: { x: 0.2, y: 0.5 } };
  const rightConfig = { ...config, origin: { x: 0.8, y: 0.5 } };

  confetti({
    ...leftConfig,
    angle: 60,
  });

  confetti({
    ...rightConfig,
    angle: 120,
  });
}

/**
 * Fire a continuous shower (for epic celebrations)
 */
function fireShower(config: CelebrationConfig, duration: number): () => void {
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors: config.colors,
    });

    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors: config.colors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();

  // Return cleanup function
  return () => {
    confetti.reset();
  };
}

/**
 * React hook for celebration effects
 */
export function useCelebration() {
  const cleanupRef = useRef<(() => void) | null>(null);
  const timeoutIdsRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const prefersReducedMotionRef = useRef(false);

  // Check reduced motion preference on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      prefersReducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  }, []);

  // Cleanup all timeouts and effects on unmount
  useEffect(() => {
    const timeoutIds = timeoutIdsRef.current;
    return () => {
      timeoutIds.forEach(id => clearTimeout(id));
      timeoutIds.clear();
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  /**
   * Helper to track timeouts for cleanup
   */
  const safeSetTimeout = useCallback((fn: () => void, delay: number) => {
    const id = setTimeout(() => {
      timeoutIdsRef.current.delete(id);
      fn();
    }, delay);
    timeoutIdsRef.current.add(id);
    return id;
  }, []);

  /**
   * Trigger celebration for a given level
   */
  const celebrate = useCallback((level: CelebrationLevel) => {
    // Respect reduced motion preference - skip animations entirely
    if (prefersReducedMotionRef.current) {
      return;
    }

    const config = CELEBRATION_CONFIGS[level];

    // Cancel any ongoing celebration
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    switch (level) {
      case 'ksb':
        // Simple burst for KSB completion
        fireBurst(config);
        break;

      case 'epa-level':
        // Burst + side bursts for EPA level advancement
        fireBurst(config);
        safeSetTimeout(() => fireSideBursts(config), 300);
        break;

      case 'epa-complete':
        // Multiple bursts for EPA completion
        fireBurst(config);
        safeSetTimeout(() => fireSideBursts(config), 200);
        safeSetTimeout(() => fireBurst({ ...config, origin: { x: 0.5, y: 0.5 } }), 500);
        break;

      case 'certificate':
        // Epic shower for certificate
        fireBurst(config);
        safeSetTimeout(() => {
          cleanupRef.current = fireShower(config, config.duration ?? 5000);
        }, 300);
        break;
    }
  }, [safeSetTimeout]);

  /**
   * Convenience methods
   */
  const celebrateKSB = useCallback(() => celebrate('ksb'), [celebrate]);
  const celebrateEPALevel = useCallback(() => celebrate('epa-level'), [celebrate]);
  const celebrateEPA = useCallback(() => celebrate('epa-complete'), [celebrate]);
  const celebrateCertificate = useCallback(() => celebrate('certificate'), [celebrate]);

  /**
   * Stop all celebrations
   */
  const stopCelebration = useCallback(() => {
    // Clear all tracked timeouts
    timeoutIdsRef.current.forEach(id => clearTimeout(id));
    timeoutIdsRef.current.clear();
    // Clear confetti cleanup
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    confetti.reset();
  }, []);

  return {
    celebrate,
    celebrateKSB,
    celebrateEPALevel,
    celebrateEPA,
    celebrateCertificate,
    stopCelebration,
  };
}

/**
 * Celebration trigger component (for declarative usage)
 */
export function CelebrationTrigger({
  level,
  trigger,
  delay = 0,
}: {
  level: CelebrationLevel;
  trigger: boolean;
  delay?: number;
}) {
  const { celebrate } = useCelebration();
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (trigger && !hasTriggered.current) {
      hasTriggered.current = true;
      const timer = setTimeout(() => celebrate(level), delay);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [trigger, level, delay, celebrate]);

  return null;
}
