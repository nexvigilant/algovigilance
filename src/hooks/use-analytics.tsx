'use client';

/**
 * Analytics Hooks
 *
 * Custom React hooks for tracking analytics events in components.
 */

import { useCallback } from 'react';
import {
  trackEvent,
  trackConversion,
  type AnalyticsEvent,
  type AnalyticsProperties,
} from '@/lib/analytics';

/**
 * Hook for tracking events in components
 */
export function useAnalytics() {
  const track = useCallback(
    (event: AnalyticsEvent, properties?: AnalyticsProperties) => {
      trackEvent(event, properties);
    },
    []
  );

  const trackConversionEvent = useCallback(
    (event: AnalyticsEvent, value?: number, properties?: AnalyticsProperties) => {
      trackConversion(event, value, properties);
    },
    []
  );

  return {
    track,
    trackConversion: trackConversionEvent,
  };
}
