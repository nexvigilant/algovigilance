import { createMetadata } from '@/lib/metadata';
import { OnboardingAnalytics } from '@/app/nucleus/community/onboarding/components';

export const metadata = createMetadata({
  title: 'Onboarding Analytics',
  description: 'Monitor onboarding funnel metrics, conversion rates, and drop-off analysis.',
  path: '/nucleus/admin/community/onboarding',
});

export default function OnboardingAnalyticsPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 font-headline text-3xl font-bold text-gold">
          Onboarding Analytics
        </h1>
        <p className="text-slate-dim">
          Monitor the member onboarding journey funnel, conversion rates, and identify drop-off points.
        </p>
      </div>

      {/* Analytics Dashboard */}
      <OnboardingAnalytics />
    </div>
  );
}
