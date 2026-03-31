import { createMetadata } from '@/lib/metadata';
import { ForYouFeed } from './for-you-feed';

export const metadata = createMetadata({
  title: 'For You',
  description: 'Discover personalized forum and post recommendations based on your interests, career stage, and goals.',
  path: '/nucleus/community/for-you',
});

export default function ForYouPage() {
  return <ForYouFeed />;
}
