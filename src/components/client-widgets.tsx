'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

// Lazy load non-critical UI components to reduce initial bundle and improve LCP
// These must be in a Client Component because they use ssr: false

const WhatsNewModal = dynamic(
  () => import('@/components/shared/banners/whats-new-modal').then((mod) => mod.WhatsNewModal),
  { ssr: false }
);

const ReleaseNotification = dynamic(
  () => import('@/components/shared/banners/release-notification').then((mod) => mod.ReleaseNotification),
  { ssr: false }
);

/**
 * Client-side widgets that are lazy loaded for better LCP performance.
 * These components are non-critical and can load after the main content.
 *
 * The release notification banner shows at the bottom of the page.
 * Clicking "View Changes" opens the What's New modal with feature highlights.
 */
export function ClientWidgets() {
  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false);

  return (
    <>
      <ReleaseNotification
        position="bottom"
        onViewChanges={() => setIsWhatsNewOpen(true)}
      />
      <WhatsNewModal
        open={isWhatsNewOpen}
        onOpenChange={setIsWhatsNewOpen}
      />
    </>
  );
}
