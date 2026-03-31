import { createMetadata } from '@/lib/metadata';
import { ForumDirectory } from './forum-directory';

export const metadata = createMetadata({
  title: 'Community Circles',
  description: 'Discover and join professional circles of healthcare professionals. Connect, learn, and grow together.',
  path: '/nucleus/community/circles',
});

export default function ForumsPage() {
  return <ForumDirectory />;
}
