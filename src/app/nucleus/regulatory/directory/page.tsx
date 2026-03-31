import { createMetadata } from '@/lib/metadata';
import { FileText } from 'lucide-react';
import { RegulatoryDirectory } from './components/regulatory-directory';

export const metadata = createMetadata({
  title: 'Document Directory',
  description: 'Comprehensive catalog of 60 global PV regulatory documents from FDA, EMA, ICH, WHO, CIOMS, MHRA, PMDA, TGA, and Health Canada',
  path: '/nucleus/regulatory/directory',
});

export default function DirectoryPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-golden-4">
      <header className="mb-golden-4">
        <div className="flex items-center gap-golden-2 mb-golden-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-violet-400/30 bg-violet-400/5">
            <FileText className="h-5 w-5 text-violet-400" aria-hidden="true" />
          </div>
          <div>
            <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-violet-400/60">
              AlgoVigilance Regulatory
            </p>
            <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Document Directory
            </h1>
          </div>
        </div>
        <p className="text-sm text-slate-dim/70 max-w-xl leading-golden">
          48 regulatory documents across 9 jurisdictions — searchable by authority, risk level, and topic
        </p>
      </header>
      <RegulatoryDirectory />
    </div>
  );
}
