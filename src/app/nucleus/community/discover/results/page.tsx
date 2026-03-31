import { createMetadata } from '@/lib/metadata';
import { DiscoveryResults } from './discovery-results';

export const metadata = createMetadata({
  title: 'Your Community Matches',
  description: 'Discover communities perfectly matched to your professional interests and career goals.',
  path: '/nucleus/community/discover/results',
});

export default function ResultsPage() {
  return <DiscoveryResults />;
}
