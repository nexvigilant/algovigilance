import { createMetadata } from '@/lib/metadata';
import { PublicationsFeed } from './publications-feed';

export const metadata = createMetadata({
  title: 'Published Research',
  description: 'Browse published research from circles across the community.',
  path: '/nucleus/community/publications',
});

export default function PublicationsPage() {
  return (
    <div className="max-w-5xl">
      <PublicationsFeed />
    </div>
  );
}
