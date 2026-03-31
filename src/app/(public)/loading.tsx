'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { VoiceLoadingMessage } from '@/components/voice';

/**
 * MarketingLoading - Universal loading skeleton for public pages.
 *
 * Uses a minimal, adaptive structure that works across page types:
 * - Hero section: Title + subtitle (universal)
 * - Content section: Single paragraph block (non-assumptive)
 *
 * This avoids jarring "pop-in" when pages don't match a card-grid layout.
 * Page-specific loading states can be added in individual route folders.
 *
 * @accessibility Uses aria-busy and aria-label for screen reader context
 */
export default function MarketingLoading() {
  return (
    <div
      className="container mx-auto px-4 py-12 md:px-6"
      role="status"
      aria-busy="true"
      aria-label="Loading page content"
    >
      <VoiceLoadingMessage context="default" className="mb-8" />

      {/* Hero section skeleton - universal structure */}
      <div className="mb-12 text-center space-y-4">
        <Skeleton className="h-12 w-3/4 mx-auto" aria-hidden="true" />
        <Skeleton className="h-6 w-1/2 mx-auto" aria-hidden="true" />
      </div>

      {/* Content skeleton - minimal, non-assumptive structure */}
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-4 w-full" aria-hidden="true" />
        <Skeleton className="h-4 w-11/12" aria-hidden="true" />
        <Skeleton className="h-4 w-5/6" aria-hidden="true" />
        <div className="pt-4 space-y-4">
          <Skeleton className="h-4 w-full" aria-hidden="true" />
          <Skeleton className="h-4 w-10/12" aria-hidden="true" />
        </div>
      </div>

      {/* Visually hidden loading text for screen readers */}
      <span className="sr-only">Loading page content, please wait...</span>
    </div>
  );
}
