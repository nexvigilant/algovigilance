import { BookmarksClient } from './bookmarks-client';
import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata({
  title: 'My Bookmarks',
  description: 'Access your bookmarked lessons in AlgoVigilance Academy.',
  path: '/nucleus/academy/bookmarks',
});

export default function BookmarksPage() {
  return <BookmarksClient />;
}
