import { createMetadata } from '@/lib/metadata';
import { OnboardingProvider } from './onboarding-context';
import { JourneyWizard } from './journey-wizard';

export const metadata = createMetadata({
  title: 'Welcome to the Community',
  description: 'Complete your onboarding journey to get the most from the AlgoVigilance community',
  path: '/nucleus/community/onboarding',
});

/**
 * Member Onboarding Journey Page
 *
 * Guides new members through a 5-step activation journey:
 * 1. Complete Profile - Add professional details
 * 2. Discovery - Share interests and goals
 * 3. Join Circle - Find and join first community Circle
 * 4. Introduce - Create first post (optional)
 * 5. Connect - Follow a member (optional)
 */
export default function OnboardingPage() {
  return (
    <OnboardingProvider>
      <JourneyWizard />
    </OnboardingProvider>
  );
}
