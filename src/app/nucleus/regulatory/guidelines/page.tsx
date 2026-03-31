import { createMetadata } from '@/lib/metadata';
import { Search } from 'lucide-react';
import { GuidelinesReference } from './components/guidelines-reference';

export const metadata = createMetadata({
  title: 'Guidelines Reference',
  description: 'Searchable ICH, EMA GVP, CIOMS, and FDA regulatory guidelines for vigilance professionals',
  path: '/nucleus/regulatory/guidelines',
});

export default function GuidelinesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-golden-4">
      <header className="mb-golden-4">
        <div className="flex items-center gap-golden-2 mb-golden-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-violet-400/30 bg-violet-400/5">
            <Search className="h-5 w-5 text-violet-400" aria-hidden="true" />
          </div>
          <div>
            <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-violet-400/60">
              AlgoVigilance Regulatory
            </p>
            <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Guidelines Reference
            </h1>
          </div>
        </div>
        <p className="text-sm text-slate-dim/70 max-w-xl leading-golden">
          ICH, GVP, CIOMS, and FDA searchable guidelines library
        </p>
      </header>
      <GuidelinesReference />
    </div>
  );
}
