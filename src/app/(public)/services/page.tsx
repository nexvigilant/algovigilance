import { Suspense } from 'react';
import { WizardContainer } from '@/components/service-wizard';
import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata({
  title: 'Find Your Solution',
  description:
    'Discover the right consulting services for your organization. Advisory, project delivery, and talent development for life sciences.',
  path: '/services',
});

/**
 * Loading fallback for the wizard while search params are being resolved.
 * Matches the wizard's visual style for seamless transition.
 */
function WizardLoadingFallback() {
  return (
    <div className="min-h-screen bg-nex-background">
      <div className="container mx-auto max-w-4xl px-4 py-8 md:py-16">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="mb-6">
            <div className="w-16 h-16 border-4 border-cyan/30 border-t-cyan rounded-full animate-spin" />
          </div>
          <p className="text-slate-dim">Loading assessment...</p>
        </div>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  // Suspense boundary required because WizardContainer uses useSearchParams()
  // This prevents hydration mismatch between server and client rendering
  return (
    <Suspense fallback={<WizardLoadingFallback />}>
      <WizardContainer />
    </Suspense>
  );
}
