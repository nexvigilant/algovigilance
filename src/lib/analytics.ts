import { logger } from '@/lib/logger';
const log = logger.scope('lib/analytics');

const TELEMETRY_ENDPOINT = '/api/telemetry/events';

// Session ID for correlating events within a single page session
const SESSION_ID = typeof crypto !== 'undefined'
  ? crypto.randomUUID()
  : Math.random().toString(36).slice(2);

/**
 * Analytics Library
 *
 * Centralized analytics tracking for AlgoVigilance platform.
 * Integrates with Vercel Analytics for privacy-first tracking.
 */

// Analytics event types
export type AnalyticsEvent =
  | 'page_view'
  | 'button_click'
  | 'form_submit'
  | 'signup_started'
  | 'signup_completed'
  | 'signin_completed'
  | 'sign_in_clicked'
  | 'join_now_clicked'
  | 'start_free_clicked'
  | 'connect_ai_clicked'
  | 'signup_clicked'
  | 'pricing_viewed'
  | 'user_signed_up'
  | 'user_signed_in'
  | 'user_signed_out'
  | 'course_started'
  | 'course_completed'
  | 'lesson_completed'
  | 'quiz_completed'
  | 'certificate_generated'
  | 'post_created'
  | 'post_liked'
  | 'message_sent'
  | 'profile_updated'
  | 'search_performed'
  | 'error_occurred'
  | 'feature_used'
  | 'conversion'
  // Onboarding journey events
  | 'onboarding_started'
  | 'onboarding_step_started'
  | 'onboarding_step_completed'
  | 'onboarding_step_skipped'
  | 'onboarding_completed'
  | 'onboarding_abandoned'
  | 'circle_joined'
  | 'connection_made';

// Analytics properties type
export type AnalyticsProperties = Record<string, string | number | boolean | undefined>;

/**
 * Track an analytics event
 *
 * Events are:
 * 1. Logged to console in development
 * 2. Sent to /api/telemetry/events for server-side aggregation
 * 3. Tracked via Vercel Analytics (automatic, anonymous)
 */
export function trackEvent(event: AnalyticsEvent, properties?: AnalyticsProperties): void {
  if (typeof window === 'undefined') return;

  if (process.env.NODE_ENV === 'development') {
    log.debug(`[Analytics] ${event}`, properties);
  }

  // Send to telemetry endpoint
  const payload = {
    event,
    properties,
    timestamp: Date.now(),
    url: window.location.pathname,
    sessionId: SESSION_ID,
  };

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(TELEMETRY_ENDPOINT, JSON.stringify(payload));
    } else {
      fetch(TELEMETRY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => { /* fire and forget */ });
    }
  } catch {
    // Telemetry should never break the app
  }
}

/**
 * Track a conversion event with optional value
 */
export function trackConversion(
  event: AnalyticsEvent,
  value?: number,
  properties?: AnalyticsProperties
): void {
  trackEvent(event, {
    ...properties,
    conversion_value: value,
    is_conversion: true,
  });
}

/**
 * Track page view
 */
export function trackPageView(path: string, properties?: AnalyticsProperties): void {
  trackEvent('page_view', {
    ...properties,
    path,
  });
}

/**
 * Identify user for analytics
 * Note: Vercel Analytics is anonymous by design; this is kept for future integrations.
 */
export function identifyUser(userId: string, traits?: AnalyticsProperties): void {
  if (typeof window === 'undefined') return;

  if (process.env.NODE_ENV === 'development') {
    log.debug(`[Analytics] Identify: ${userId}`, traits);
  }
}

/**
 * Reset analytics session (on logout)
 * Note: Vercel Analytics is sessionless; this is kept for future integrations.
 */
export function resetAnalytics(): void {
  if (typeof window === 'undefined') return;

  if (process.env.NODE_ENV === 'development') {
    log.debug('[Analytics] Session reset');
  }
}
