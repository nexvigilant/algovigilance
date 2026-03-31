'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackPageView, trackEvent } from '@/lib/analytics';

/**
 * Automatic page view tracker.
 *
 * Tracks every route change as a page_view event with:
 * - Path and referrer
 * - Time spent on previous page
 * - Search params (sanitized)
 *
 * Add to root layout for automatic tracking.
 */
export function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPathRef = useRef<string | null>(null);
  const pageEntryRef = useRef<number>(Date.now());

  useEffect(() => {
    const previousPath = lastPathRef.current;
    const timeOnPreviousPage = previousPath
      ? Math.round((Date.now() - pageEntryRef.current) / 1000)
      : undefined;

    trackPageView(pathname, {
      referrer_path: previousPath ?? 'direct',
      time_on_previous_page_seconds: timeOnPreviousPage,
      search: searchParams.toString() || undefined,
    });

    lastPathRef.current = pathname;
    pageEntryRef.current = Date.now();
  }, [pathname, searchParams]);

  // Track tab visibility changes (measures actual engagement)
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden) {
        trackEvent('feature_used', {
          feature: 'tab_hidden',
          path: pathname,
          time_visible_seconds: Math.round((Date.now() - pageEntryRef.current) / 1000),
        });
      } else {
        pageEntryRef.current = Date.now();
        trackEvent('feature_used', {
          feature: 'tab_visible',
          path: pathname,
        });
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [pathname]);

  return null;
}
