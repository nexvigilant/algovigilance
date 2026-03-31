'use client';

import { useEffect, useRef } from 'react';

export interface RenderPerformanceConfig {
  /** Threshold in milliseconds for performance warnings */
  warnThreshold?: number;

  /** Log performance data to console */
  logToConsole?: boolean;

  /** Send performance data to analytics */
  sendToAnalytics?: boolean;

  /** Custom analytics function */
  onPerformanceData?: (data: PerformanceData) => void;

  /** Only track in development */
  devOnly?: boolean;
}

export interface PerformanceData {
  /** Component name */
  componentName: string;

  /** Render duration in milliseconds */
  duration: number;

  /** Number of renders */
  renderCount: number;

  /** Timestamp of measurement */
  timestamp: number;

  /** Whether this render exceeded the threshold */
  isSlowRender: boolean;
}

/**
 * Hook for monitoring component render performance
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   useRenderPerformance('MyComponent', {
 *     warnThreshold: 16, // 60fps = 16ms per frame
 *     logToConsole: true,
 *   });
 *
 *   // Component logic
 * }
 * ```
 */
export function useRenderPerformance(
  componentName: string,
  {
    warnThreshold = 16,
    logToConsole = false,
    sendToAnalytics = false,
    onPerformanceData,
    devOnly = true,
  }: RenderPerformanceConfig = {}
) {
  const renderCount = useRef(0);
  const startTime = useRef<number | null>(null);

  // Only track in development if devOnly is true
  const shouldTrack = !devOnly || process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (!shouldTrack) return;

    // Increment render count
    renderCount.current += 1;

    // Mark render start
    if (startTime.current === null) {
      startTime.current = performance.now();
    }

    // Measure render duration after paint
    const measurePerformance = () => {
      if (startTime.current === null) return;

      const endTime = performance.now();
      const duration = endTime - startTime.current;
      const isSlowRender = duration > warnThreshold;

      const perfData: PerformanceData = {
        componentName,
        duration,
        renderCount: renderCount.current,
        timestamp: Date.now(),
        isSlowRender,
      };

      // Log to console if enabled
      if (logToConsole) {
        const logFn = isSlowRender ? console.warn : console.log;
        logFn(
          `[Performance] ${componentName} rendered in ${duration.toFixed(2)}ms` +
            ` (render #${renderCount.current})` +
            (isSlowRender ? ' ⚠️ SLOW RENDER' : '')
        );
      }

      // Send to analytics if enabled
      if (sendToAnalytics && typeof window !== 'undefined') {
        // Check for PostHog
        if ('posthog' in window && typeof (window as any).posthog?.capture === 'function') {
          (window as any).posthog.capture('render_performance', perfData);
        }
      }

      // Call custom handler
      if (onPerformanceData) {
        onPerformanceData(perfData);
      }

      // Reset start time for next render
      startTime.current = null;
    };

    // Use setTimeout to measure after paint
    const timeoutId = setTimeout(measurePerformance, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  });

  // Also use performance.mark and performance.measure if available
  useEffect(() => {
    if (!shouldTrack || typeof performance === 'undefined') return;

    const markName = `${componentName}-render-${renderCount.current}`;

    performance.mark(`${markName}-start`);

    return () => {
      performance.mark(`${markName}-end`);

      try {
        performance.measure(markName, `${markName}-start`, `${markName}-end`);
      } catch {
        // Marks might not exist if component unmounted too quickly
      }
    };
  });
}

/**
 * Get performance entries for a component
 */
export function getComponentPerformanceEntries(componentName: string): PerformanceEntry[] {
  if (typeof performance === 'undefined' || !performance.getEntriesByName) {
    return [];
  }

  const entries: PerformanceEntry[] = [];

  // Get all measures that match the component name pattern
  const allMeasures = performance.getEntriesByType('measure');

  for (const measure of allMeasures) {
    if (measure.name.startsWith(`${componentName}-render-`)) {
      entries.push(measure);
    }
  }

  return entries;
}

/**
 * Clear performance entries for a component
 */
export function clearComponentPerformanceEntries(componentName: string): void {
  if (typeof performance === 'undefined') return;

  const entries = getComponentPerformanceEntries(componentName);

  for (const entry of entries) {
    try {
      performance.clearMeasures(entry.name);
      performance.clearMarks(`${entry.name}-start`);
      performance.clearMarks(`${entry.name}-end`);
    } catch {
      // Ignore errors
    }
  }
}

/**
 * Get average render time for a component
 */
export function getAverageRenderTime(componentName: string): number | null {
  const entries = getComponentPerformanceEntries(componentName);

  if (entries.length === 0) return null;

  const totalDuration = entries.reduce((sum, entry) => sum + entry.duration, 0);

  return totalDuration / entries.length;
}
