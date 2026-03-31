import { createMetadata } from '@/lib/metadata';
import { PenLine } from 'lucide-react';
import { PostEditor } from '../../components/posts/post-editor';

export const metadata = createMetadata({
  title: 'Create New Post',
  description: 'Share your thoughts with the AlgoVigilance community',
  path: '/nucleus/community/circles/create-post',
});

export default function NewPostPage() {
  return (
    <div className="max-w-4xl">
      <header className="mb-golden-4">
        <div className="flex items-center gap-golden-2 mb-golden-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-cyan/30 bg-cyan/5">
            <PenLine className="h-5 w-5 text-cyan" aria-hidden="true" />
          </div>
          <div>
            <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-cyan/60">
              AlgoVigilance Community
            </p>
            <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Create New Post
            </h1>
          </div>
        </div>
        <p className="text-sm text-slate-dim/70 max-w-xl leading-golden">
          Share your knowledge, ask questions, or start a discussion with the community
        </p>
      </header>

      <PostEditor />
    </div>
  );
}
