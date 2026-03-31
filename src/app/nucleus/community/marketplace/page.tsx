import { createMetadata } from '@/lib/metadata';
import { Briefcase } from 'lucide-react';
import { MarketplaceDashboard } from './components/marketplace-dashboard';

export const metadata = createMetadata({
  title: 'Expert Marketplace',
  description: 'Connect with verified AlgoVigilance experts for consulting, advisory, and project-based engagements.',
  path: '/nucleus/community/marketplace',
  keywords: ['expert marketplace', 'consulting', 'vigilance experts'],
});

export default function MarketplacePage() {
  return (
    <div className="flex min-h-[calc(100vh-12rem)] flex-col">
      <header className="mb-golden-4">
        <div className="flex items-center gap-golden-2 mb-golden-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-copper/30 bg-copper/5">
            <Briefcase className="h-5 w-5 text-copper" aria-hidden="true" />
          </div>
          <div>
            <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-copper/60">
              Expert Network
            </p>
            <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Expert Marketplace
            </h1>
          </div>
        </div>
        <p className="text-golden-sm text-slate-dim/70 max-w-xl leading-golden">
          Find verified AlgoVigilance experts for consulting, signal detection,
          regulatory advisory, and project-based engagements
        </p>
      </header>

      <MarketplaceDashboard />
    </div>
  );
}
