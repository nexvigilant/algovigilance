import { createMetadata } from '@/lib/metadata';
import { BarChart3 } from 'lucide-react';
import { BenchmarksDashboard } from './components/benchmarks-dashboard';

export const metadata = createMetadata({
  title: 'Peer Benchmarks',
  description: 'Compare your organization anonymously against platform-wide vigilance performance metrics.',
  path: '/nucleus/community/benchmarks',
  keywords: ['benchmarking', 'peer comparison', 'vigilance metrics', 'performance'],
});

export default function BenchmarksPage() {
  return (
    <div className="flex min-h-[calc(100vh-12rem)] flex-col">
      <header className="mb-golden-4">
        <div className="flex items-center gap-golden-2 mb-golden-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-emerald-400/30 bg-emerald-400/5">
            <BarChart3 className="h-5 w-5 text-emerald-400" aria-hidden="true" />
          </div>
          <div>
            <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-emerald-400/60">
              Anonymized Intelligence
            </p>
            <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Peer Benchmarks
            </h1>
          </div>
        </div>
        <p className="text-golden-sm text-slate-dim/70 max-w-xl leading-golden">
          See how you measure up across key vigilance dimensions,
          benchmarked against anonymized platform-wide baselines
        </p>
      </header>

      <BenchmarksDashboard />
    </div>
  );
}
