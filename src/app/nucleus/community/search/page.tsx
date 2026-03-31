import { createMetadata } from '@/lib/metadata';
import { PostSearch } from '../components/posts/post-search';

export const metadata = createMetadata({
  title: 'Search Posts',
  description: 'Search community posts with advanced filters',
  path: '/nucleus/community/search',
});

export default function SearchPage() {
  return (
    <div className="max-w-7xl">

      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold font-headline mb-2 text-gold">
          Search Community Posts
        </h1>
        <p className="text-slate-dim">
          Find discussions, questions, and insights from the community
        </p>
      </div>

      <PostSearch />
    </div>
  );
}
