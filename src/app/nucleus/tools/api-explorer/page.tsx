import { createMetadata } from '@/lib/metadata';
import { Terminal } from 'lucide-react';
import { ApiExplorer } from './api-explorer';

export const metadata = createMetadata({
  title: 'API Explorer',
  description: 'Interactive NexCore API explorer with live request builder and response viewer.',
  path: '/nucleus/tools/api-explorer',
});

export default function ApiExplorerPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:px-6 min-h-[calc(100vh-4rem)]">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-gold/10">
            <Terminal className="h-8 w-8 text-gold" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-gold">
            API Explorer
          </h1>
        </div>
        <p className="text-base md:text-lg text-slate-dim font-medium">
          Interactive endpoint browser — 84+ routes powered by NexCore
        </p>
      </header>

      <ApiExplorer />
    </div>
  );
}
