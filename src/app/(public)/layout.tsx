import type { Metadata } from 'next';
import { PublicPageWrapper } from '@/components/layout';

/**
 * Metadata configuration for public-facing pages.
 *
 * The metadataBase ensures OpenGraph/Twitter image URLs resolve to absolute paths.
 * Individual pages can override title/description while inheriting social card defaults.
 */
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://algovigilance.net'),
  title: {
    default: 'AlgoVigilance',
    template: '%s | AlgoVigilance',
  },
  description: 'Strategic vigilance intelligence — predicting and preventing harm across medicines, AI systems, and critical infrastructure.',
  openGraph: {
    type: 'website',
    siteName: 'AlgoVigilance',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@nexvigilant',
    creator: '@nexvigilant',
  },
};

/**
 * MarketingLayout - Default layout for all public-facing marketing pages.
 *
 * Uses PublicPageWrapper which provides:
 * - SiteHeader with main navigation
 * - SiteFooter with links and legal
 * - NeuralNetworkSVG background effects
 * - Ambient particles for visual depth
 * - Floating agent trigger for conversational entry
 *
 * **Layout Flexibility Patterns:**
 * - For pages needing different header/footer (e.g., minimal checkout):
 *   Move them to a separate route group like `(checkout)/` with custom layout
 * - For pages needing no effects: use `showParticles={false}` prop
 * - Theme variants available: 'default' | 'warm' | 'cool' | 'guardian' | 'academy'
 *
 * @see PublicPageWrapper in src/components/layout/public-page-wrapper.tsx
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PublicPageWrapper networkOpacity={0.65} theme="guardian">
      {children}
    </PublicPageWrapper>
  );
}
