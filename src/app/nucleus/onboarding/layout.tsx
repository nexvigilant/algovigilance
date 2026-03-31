import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata({
  title: 'Complete Your Profile',
  description: 'Set up your professional profile to access the AlgoVigilance Nucleus member portal.',
  path: '/nucleus/onboarding',
});

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
