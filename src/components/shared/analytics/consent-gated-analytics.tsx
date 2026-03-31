'use client';

import { useCookieConsent } from '@/hooks/use-cookie-consent';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { WebVitalsReporter } from '@/lib/web-vitals';
import { PageViewTracker } from './page-view-tracker';

/**
 * Analytics components gated on cookie consent.
 * Renders nothing until user has consented to analytics.
 * Essential-only consent skips all analytics.
 */
export function ConsentGatedAnalytics() {
  const { consent, hasConsented, isLoaded } = useCookieConsent();

  if (!isLoaded || !hasConsented) return null;

  const analyticsConsented = consent?.analytics === true;

  return (
    <>
      {analyticsConsented && (
        <>
          <Analytics />
          <SpeedInsights />
          <WebVitalsReporter />
          <PageViewTracker />
        </>
      )}
    </>
  );
}
