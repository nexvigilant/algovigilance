import { createMetadata } from '@/lib/metadata';
import { BookOpen } from 'lucide-react';
import { PvGlossary } from './components/pv-glossary';

export const metadata = createMetadata({
  title: 'PV Glossary',
  description: 'Vigilance acronyms, definitions, and regulatory terminology from ICH, FDA, EMA, WHO, and CIOMS',
  path: '/nucleus/regulatory/glossary',
});

export default function GlossaryPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-golden-4">
      <header className="mb-golden-4">
        <div className="flex items-center gap-golden-2 mb-golden-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-violet-400/30 bg-violet-400/5">
            <BookOpen className="h-5 w-5 text-violet-400" aria-hidden="true" />
          </div>
          <div>
            <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-violet-400/60">
              AlgoVigilance Regulatory
            </p>
            <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              PV Glossary
            </h1>
          </div>
        </div>
        <p className="text-sm text-slate-dim/70 max-w-xl leading-golden">
          78 terms from ICH, FDA, EMA, WHO, and CIOMS — searchable by acronym, name, or category
        </p>
      </header>
      <PvGlossary />
    </div>
  );
}
