import { createMetadata } from '@/lib/metadata';
import { DiscoveryQuizPreview } from './discovery-quiz-preview';

export const metadata = createMetadata({
  title: 'Discover Your Community',
  description:
    'Find your professional home in the AlgoVigilance community. Take our quick quiz to discover communities tailored to your interests and career goals.',
  path: '/community/discover',
});

export default function DiscoverPage() {
  return <DiscoveryQuizPreview />;
}
