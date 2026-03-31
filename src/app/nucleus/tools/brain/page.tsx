import { createMetadata } from '@/lib/metadata';
import { Brain } from 'lucide-react';
import { BrainViewer } from './brain-viewer';

export const metadata = createMetadata({
  title: 'Brain Viewer',
  description: 'View NexCore Brain sessions, artifacts, and working memory state.',
  path: '/nucleus/tools/brain',
});

export default function BrainPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:px-6 min-h-[calc(100vh-4rem)]">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-cyan/10">
            <Brain className="h-8 w-8 text-cyan" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-gold">
            Brain
          </h1>
        </div>
        <p className="text-base md:text-lg text-slate-dim font-medium">
          Working memory — sessions, artifacts, and code tracking
        </p>
      </header>

      <BrainViewer />
    </div>
  );
}
