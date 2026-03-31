import { TrialStartClient } from './trial-start-client';
import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata({
  title: 'Start Your Free Trial',
  description: 'Begin your 3-day free trial of AlgoVigilance Nucleus.',
  path: '/trial/start',
});

export default function TrialStartPage() {
  return <TrialStartClient />;
}
