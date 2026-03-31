import { createMetadata } from '@/lib/metadata';
import { ShieldCheck } from 'lucide-react';
import { GuardianDashboard } from './components/guardian-dashboard';

export const metadata = createMetadata({
  title: 'Guardian',
  description: 'Vigilance signal detection, FAERS search, and Guardian homeostasis monitoring.',
  path: '/nucleus/guardian',
  keywords: ['vigilance', 'signal detection', 'FAERS', 'drug safety', 'Guardian'],
});

export default function NucleusGuardianPage() {
  return (
    <div className="flex min-h-[calc(100vh-12rem)] flex-col">
      <header className="mb-golden-4">
        <div className="flex items-center gap-golden-2 mb-golden-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-emerald-400/30 bg-emerald-400/5">
            <ShieldCheck className="h-5 w-5 text-emerald-400" aria-hidden="true" />
          </div>
          <div>
            <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-emerald-400/60">
              AlgoVigilance Guardian
            </p>
            <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Guardian
            </h1>
          </div>
        </div>
        <p className="text-sm text-slate-dim/70 max-w-xl leading-golden">
          Signal detection, adverse event monitoring, and homeostasis control —
          powered by the NexCore control loop
        </p>
      </header>

      <GuardianDashboard />
    </div>
  );
}
