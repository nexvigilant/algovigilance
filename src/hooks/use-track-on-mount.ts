"use client";

import { useEffect, useRef } from "react";
import {
  trackEvent,
  type AnalyticsEvent,
  type AnalyticsProperties,
} from "@/lib/analytics";

/**
 * Track an analytics event on component mount (fires once).
 *
 * Eliminates the repeated useEffect + trackEvent boilerplate
 * across error boundaries and page components.
 *
 * @param event - Analytics event type
 * @param properties - Event properties (stable reference or primitive values)
 *
 * @example
 * ```tsx
 * // In an error boundary
 * useTrackOnMount('error_occurred', { component: 'GuardianError', route: '/nucleus/guardian' });
 *
 * // In a page component
 * useTrackOnMount('feature_used', { feature: 'signal-detection', route: '/nucleus/vigilance/signals' });
 * ```
 */
export function useTrackOnMount(
  event: AnalyticsEvent,
  properties?: AnalyticsProperties,
): void {
  const fired = useRef(false);

  useEffect(() => {
    if (!fired.current) {
      fired.current = true;
      trackEvent(event, properties);
    }
  }, [event, properties]);
}
