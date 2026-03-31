import { createMetadata } from '@/lib/metadata';
import { ClipboardList } from 'lucide-react';
import { QuizSessionsClient } from './quiz-sessions-client';

export const metadata = createMetadata({
  title: 'Quiz Sessions',
  description: 'View and manage service wizard quiz completions',
  path: '/nucleus/admin/website-leads/quiz-sessions',
});

export default function QuizSessionsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-nex-light bg-nex-surface/95 backdrop-blur supports-[backdrop-filter]:bg-nex-surface/60 px-4 lg:px-6 py-golden-3">
        <div className="flex items-center gap-golden-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-gold/30 bg-gold/5">
            <ClipboardList className="h-4 w-4 text-gold" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-gold/50">AlgoVigilance Admin</p>
            <h1 className="text-sm font-semibold text-white">Quiz Sessions</h1>
          </div>
        </div>
      </div>
      <main className="flex-1 space-y-golden-2 p-4 pt-golden-3 md:p-8">
        <QuizSessionsClient />
      </main>
    </div>
  );
}
