import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { SparseCodingLearningModule } from './sparse-coding-module';
import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata({
  title: 'Sparse Coding Efficiency',
  description:
    'Explore neural coding thermodynamics and understand how the brain maximizes information processing efficiency. Interactive learning module for pharmacovigilance professionals.',
  path: '/nucleus/academy/interactive/sparse-coding',
});

export default function SparseCodingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-nex-deep">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-cyan" />
            <p className="text-sm text-slate-dim">Loading interactive module...</p>
          </div>
        </div>
      }
    >
      <SparseCodingLearningModule />
    </Suspense>
  );
}
