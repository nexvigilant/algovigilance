import { createMetadata } from '@/lib/metadata';
import { FileText } from 'lucide-react';
import { CaseStudiesDashboard } from './components/case-studies-dashboard';

export const metadata = createMetadata({
  title: 'Case Studies',
  description: 'Browse and share anonymized vigilance case studies for cross-organization learning and collective intelligence.',
  path: '/nucleus/community/case-studies',
  keywords: ['case studies', 'vigilance', 'anonymized', 'knowledge sharing'],
});

export default function CaseStudiesPage() {
  return (
    <div className="flex min-h-[calc(100vh-12rem)] flex-col">
      <header className="mb-golden-4">
        <div className="flex items-center gap-golden-2 mb-golden-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-gold/30 bg-gold/5">
            <FileText className="h-5 w-5 text-gold" aria-hidden="true" />
          </div>
          <div>
            <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-gold/60">
              Knowledge Registry
            </p>
            <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Case Studies
            </h1>
          </div>
        </div>
        <p className="text-golden-sm text-slate-dim/70 max-w-xl leading-golden">
          Anonymized case studies shared across the AlgoVigilance network —
          collective intelligence for operational excellence
        </p>
      </header>

      <CaseStudiesDashboard />
    </div>
  );
}
