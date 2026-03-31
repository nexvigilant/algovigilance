import { createMetadata } from '@/lib/metadata';
import { EnhancedDiscoveryQuiz } from './enhanced-discovery-quiz';

export const metadata = createMetadata({
  title: 'Discover Your Circles',
  description: 'Find your professional home in the AlgoVigilance community. Take our enhanced quiz to discover circles tailored to your career stage, skills, goals, and interests.',
  path: '/nucleus/community/discover',
});

export default function DiscoverPage() {
  return <EnhancedDiscoveryQuiz />;
}
