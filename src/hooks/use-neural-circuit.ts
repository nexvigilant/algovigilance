'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import type { NeuralCircuitHandle, NeuralCircuitConfig } from '@/components/effects/deprecated/neural-circuit';

/**
 * Custom hook for controlling the Neural Circuit Background
 *
 * Provides imperative control over the animation, including:
 * - Triggering signals manually
 * - Pausing/resuming animation
 * - Responding to external events
 * - Performance monitoring
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const { ref, triggerBurst, pause, resume, stats } = useNeuralCircuit();
 *
 *   useEffect(() => {
 *     // Trigger burst when alert received
 *     onAlert(() => triggerBurst(15));
 *   }, [triggerBurst]);
 *
 *   return (
 *     <>
 *       <NeuralCircuitBackground ref={ref} />
 *       <button onClick={() => triggerBurst()}>Trigger</button>
 *     </>
 *   );
 * }
 * ```
 */

interface NeuralCircuitStats {
  fps: number;
  activeSignals: number;
  totalNodes: number;
  totalPaths: number;
  isPaused: boolean;
}

interface UseNeuralCircuitReturn {
  /** Ref to attach to NeuralCircuitBackground component */
  ref: React.RefObject<NeuralCircuitHandle | null>;

  /** Trigger a single random signal */
  triggerSignal: () => void;

  /** Trigger multiple signals in rapid succession */
  triggerBurst: (count?: number) => void;

  /** Pause the animation */
  pause: () => void;

  /** Resume the animation */
  resume: () => void;

  /** Toggle pause state */
  toggle: () => void;

  /** Current pause state */
  isPaused: boolean;

  /** Performance and state statistics */
  stats: NeuralCircuitStats;

  /** Connect to external event source */
  connectEventSource: (eventEmitter: EventTarget, eventName: string) => () => void;
}

export function useNeuralCircuit(): UseNeuralCircuitReturn {
  const ref = useRef<NeuralCircuitHandle | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [stats, setStats] = useState<NeuralCircuitStats>({
    fps: 60,
    activeSignals: 0,
    totalNodes: 0,
    totalPaths: 0,
    isPaused: false,
  });

  // ========================================================================
  // Core Controls
  // ========================================================================

  const triggerSignal = useCallback(() => {
    ref.current?.triggerSignal();
  }, []);

  const triggerBurst = useCallback((count: number = 12) => {
    ref.current?.triggerBurst(count);
  }, []);

  const pause = useCallback(() => {
    ref.current?.pause();
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    ref.current?.resume();
    setIsPaused(false);
  }, []);

  const toggle = useCallback(() => {
    if (ref.current?.isPaused()) {
      resume();
    } else {
      pause();
    }
  }, [pause, resume]);

  // ========================================================================
  // Event Source Connection
  // ========================================================================

  /**
   * Connect to an external event source to trigger signals
   *
   * @param eventEmitter - Any EventTarget (window, custom emitter, etc.)
   * @param eventName - Name of the event to listen for
   * @returns Cleanup function to disconnect
   *
   * @example
   * ```tsx
   * // Connect to custom alert system
   * const disconnect = connectEventSource(alertEmitter, 'new-alert');
   *
   * // Connect to WebSocket events
   * const disconnect = connectEventSource(socket, 'message');
   * ```
   */
  const connectEventSource = useCallback((
    eventEmitter: EventTarget,
    eventName: string
  ): () => void => {
    const handler = () => {
      triggerBurst(8);
    };

    eventEmitter.addEventListener(eventName, handler);

    return () => {
      eventEmitter.removeEventListener(eventName, handler);
    };
  }, [triggerBurst]);

  // ========================================================================
  // Visibility-based Pause
  // ========================================================================

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        ref.current?.pause();
      } else if (!isPaused) {
        ref.current?.resume();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isPaused]);

  // ========================================================================
  // Sync State
  // ========================================================================

  useEffect(() => {
    setStats(prev => ({ ...prev, isPaused }));
  }, [isPaused]);

  return {
    ref,
    triggerSignal,
    triggerBurst,
    pause,
    resume,
    toggle,
    isPaused,
    stats,
    connectEventSource,
  };
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook to check if user prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook to get adaptive configuration based on device performance
 */
export function useAdaptiveConfig(): Partial<NeuralCircuitConfig> {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [config, setConfig] = useState<Partial<NeuralCircuitConfig>>({});

  useEffect(() => {
    if (prefersReducedMotion) {
      setConfig({
        spontaneousRate: 0,
        maxActiveSignals: 0,
      });
      return;
    }

    // Check for low-end device indicators
    const isLowEnd = navigator.hardwareConcurrency <= 4 ||
                     (navigator as Navigator & { deviceMemory?: number }).deviceMemory !== undefined &&
                     ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) < 4;

    if (isLowEnd) {
      setConfig({
        gridSize: 150,
        maxActiveSignals: 15,
        enableGrid: false,
        myelinWidth: 0,
        spontaneousRate: 0.01,
      });
    } else {
      setConfig({});
    }
  }, [prefersReducedMotion]);

  return config;
}

export default useNeuralCircuit;
