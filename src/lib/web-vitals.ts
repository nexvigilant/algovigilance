/**
 * Web Vitals Performance Monitoring
 *
 * Captures Core Web Vitals (LCP, FID, CLS, TTFB, INP) and sends them
 * to analytics endpoints for monitoring.
 *
 * Integrates with:
 * - Vercel Analytics (automatic)
 * - Custom analytics endpoint
 * - Error tracking service
 *
 * Usage in app/layout.tsx:
 *   import { WebVitalsReporter } from '@/lib/web-vitals';
 *   <WebVitalsReporter />
 */

"use client";

import { useEffect } from "react";
import type { Metric } from "web-vitals";

import { logger } from "@/lib/logger";

const log = logger.scope("web-vitals");

/**
 * Web Vitals metric thresholds based on Google guidelines
 */
const THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint
  FID: { good: 100, needsImprovement: 300 }, // First Input Delay
  CLS: { good: 0.1, needsImprovement: 0.25 }, // Cumulative Layout Shift
  TTFB: { good: 800, needsImprovement: 1800 }, // Time to First Byte
  INP: { good: 200, needsImprovement: 500 }, // Interaction to Next Paint
  FCP: { good: 1800, needsImprovement: 3000 }, // First Contentful Paint
} as const;

type MetricName = keyof typeof THRESHOLDS;

/**
 * Determine metric rating based on thresholds
 */
function getRating(
  name: MetricName,
  value: number,
): "good" | "needs-improvement" | "poor" {
  const threshold = THRESHOLDS[name];
  if (!threshold) return "good";

  if (value <= threshold.good) return "good";
  if (value <= threshold.needsImprovement) return "needs-improvement";
  return "poor";
}

/**
 * Format metric value for display
 */
function formatValue(name: MetricName, value: number): string {
  if (name === "CLS") return value.toFixed(3);
  return `${Math.round(value)}ms`;
}

/**
 * Analytics endpoint for custom metrics collection
 * Falls back to local telemetry endpoint when env var not set
 */
const ANALYTICS_ENDPOINT =
  process.env.NEXT_PUBLIC_VITALS_ENDPOINT || "/api/telemetry/vitals";

/**
 * Send metric to analytics endpoint
 */
async function sendToAnalytics(metric: Metric): Promise<void> {
  const name = metric.name as MetricName;
  const rating = getRating(name, metric.value);

  const payload = {
    name: metric.name,
    value: metric.value,
    rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
    url: typeof window !== "undefined" ? window.location.pathname : "",
    timestamp: Date.now(),
  };

  // Log locally
  const emoji =
    rating === "good" ? "✅" : rating === "needs-improvement" ? "⚠️" : "❌";
  log.debug(
    `${emoji} ${metric.name}: ${formatValue(name, metric.value)} (${rating})`,
  );

  // Send to custom endpoint if configured
  if (ANALYTICS_ENDPOINT) {
    try {
      // Use sendBeacon for reliability during page unload
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon(ANALYTICS_ENDPOINT, JSON.stringify(payload));
      } else {
        await fetch(ANALYTICS_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true,
        });
      }
    } catch (error) {
      log.error("Failed to send vitals to analytics:", error);
    }
  }

  // Log poor metrics as warnings for monitoring
  if (rating === "poor") {
    log.warn(`Poor ${metric.name} detected:`, {
      value: formatValue(name, metric.value),
      threshold: THRESHOLDS[name]?.needsImprovement,
      url: payload.url,
    });
  }
}

/**
 * Initialize Web Vitals reporting
 * Call this in your root layout or _app
 */
export async function initWebVitals(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const { onCLS, onLCP, onTTFB, onINP, onFCP } = await import("web-vitals");

    // Register all vitals handlers (FID removed in web-vitals v4, replaced by INP)
    onCLS(sendToAnalytics);
    onLCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
    onINP(sendToAnalytics);
    onFCP(sendToAnalytics);

    log.debug("Web Vitals monitoring initialized");
  } catch (error) {
    log.error("Failed to initialize Web Vitals:", error);
  }
}

/**
 * React component for Web Vitals reporting
 * Add to your root layout for automatic initialization
 */
export function WebVitalsReporter(): null {
  useEffect(() => {
    initWebVitals();
  }, []);

  return null;
}

/**
 * Get current performance metrics
 * Useful for debugging and manual reporting
 */
export function getCurrentMetrics(): Record<string, number> | null {
  if (typeof window === "undefined" || !window.performance) return null;

  const navigation = performance.getEntriesByType(
    "navigation",
  )[0] as PerformanceNavigationTiming;

  if (!navigation) return null;

  return {
    dns: navigation.domainLookupEnd - navigation.domainLookupStart,
    tcp: navigation.connectEnd - navigation.connectStart,
    ttfb: navigation.responseStart - navigation.requestStart,
    download: navigation.responseEnd - navigation.responseStart,
    domInteractive: navigation.domInteractive - navigation.fetchStart,
    domComplete: navigation.domComplete - navigation.fetchStart,
    loadComplete: navigation.loadEventEnd - navigation.fetchStart,
  };
}

/**
 * Performance mark helper for custom timing
 */
export function markPerformance(name: string): void {
  if (typeof performance !== "undefined") {
    performance.mark(name);
  }
}

/**
 * Measure between two performance marks
 */
export function measurePerformance(
  name: string,
  startMark: string,
  endMark: string,
): number | null {
  if (typeof performance === "undefined") return null;

  try {
    const measure = performance.measure(name, startMark, endMark);
    return measure.duration;
  } catch {
    return null;
  }
}
