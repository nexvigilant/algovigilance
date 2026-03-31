'use client';

import dynamic from 'next/dynamic';
import { SiteHeader } from '@/components/layout/headers';
import { SiteFooter } from '@/components/layout/footers';
import { FloatingAgentTrigger } from '@/components/agent/floating-agent-trigger';
import { ErrorBoundary } from '@/components/layout/boundaries';
import { SkipToContent } from '@/components/shared/accessibility';
import { cn } from '@/lib/utils';

// Extracted outside component to prevent recreation on each render
const GRADIENT_OVERLAY_STYLE = {
  background:
    'radial-gradient(ellipse at 50% 40%, rgba(1, 8, 18, 0.2) 0%, rgba(1, 8, 18, 0.4) 60%, rgba(1, 8, 18, 0.6) 100%)',
} as const;

// Lazy load decorative effects - not critical for LCP
const NeuralNetworkSVG = dynamic(
  () => import('@/components/effects/neural-network-svg').then((mod) => mod.NeuralNetworkSVG),
  { ssr: false, loading: () => <div className="absolute inset-0 bg-[#010812]" /> }
);

const AmbientParticles = dynamic(
  () => import('@/components/effects/ambient-particles').then((mod) => mod.AmbientParticles),
  { ssr: false }
);

/**
 * PublicPageWrapper
 *
 * Provides consistent layout structure for all public-facing pages:
 * - NeuralNetworkSVG background (biological neural network aesthetic)
 * - Radial gradient overlay for text readability
 * - Ambient particles for depth
 * - Site header and footer
 *
 * Algorithm:
 * 1. Fixed neural network at z-index 0
 * 2. Gradient overlay for contrast
 * 3. Content layer at z-index 10
 * 4. Header/footer with backdrop-blur for readability
 *
 * @complexity O(1) - Single render, no data dependencies
 */
interface PublicPageWrapperProps {
  children: React.ReactNode;
  /** Neural network opacity (0-1). Default: 0.85 */
  networkOpacity?: number;
  /** Show ambient particles. Default: true */
  showParticles?: boolean;
  /**
   * Neural network theme variant:
   * - default: Balanced gold/cyan (general public pages)
   * - guardian: Intense cyan (security/Guardian pages)
   * - academy: Warm gold (learning/Academy pages)
   */
  theme?: 'default' | 'warm' | 'cool' | 'guardian' | 'academy';
  /** Custom className for the main content area */
  mainClassName?: string;
}

export function PublicPageWrapper({
  children,
  networkOpacity = 0.85,
  showParticles = true,
  theme = 'default',
  mainClassName = '',
}: PublicPageWrapperProps) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      {/* Skip to main content link for keyboard/screen reader users */}
      <SkipToContent />

      {/* SVG-based biological neural network - fixed background */}
      <div className="fixed inset-0 z-0">
        <NeuralNetworkSVG opacity={networkOpacity} animated={true} theme={theme} />
        {/* Radial gradient overlay for text readability */}
        <div className="absolute inset-0" style={GRADIENT_OVERLAY_STYLE} />
      </div>

      {/* Ambient particles for additional depth */}
      {showParticles && <AmbientParticles count={15} opacity="low" />}

      <SiteHeader />

      <main id="main-content" className={cn('relative z-10 flex-1', mainClassName)}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>

      <SiteFooter />

      {/* Floating conversational entry point for non-homepage public pages */}
      <FloatingAgentTrigger />
    </div>
  );
}
