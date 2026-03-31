import { createMetadata } from '@/lib/metadata';
import { GitBranch } from 'lucide-react';
import { FrameworkClient } from './framework-client';

export const metadata = createMetadata({
  title: "5 C's Signal Decision Framework",
  description: "Master signal evaluation using the 5 C's framework: Challenge, Choices, Consequences, Creative, and Conclusions. Practice with real-world scenarios.",
  path: '/nucleus/careers/assessments/signal-decision-framework',
});

export default function SignalDecisionFrameworkPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-golden-4">
      <header className="mb-golden-4">
        <div className="flex items-center gap-golden-2 mb-golden-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-copper/30 bg-copper/5">
            <GitBranch className="h-5 w-5 text-copper" aria-hidden="true" />
          </div>
          <div>
            <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-copper/60">
              AlgoVigilance Careers
            </p>
            <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              5 C&apos;s Signal Decision Framework
            </h1>
          </div>
        </div>
        <p className="text-sm text-slate-dim/70 max-w-xl leading-golden">
          Apply structured decision-making to signal evaluation using Challenge, Choices,
          Consequences, Creative, and Conclusions methodology
        </p>
      </header>

      <div className="mb-golden-3 p-golden-3 bg-copper/5 border border-copper/20">
        <div className="flex items-start gap-golden-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-copper/10">
            <GitBranch className="h-4 w-4 text-copper" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">Domain 8: Signal Detection and Management</h3>
            <p className="text-sm text-slate-dim/70 mt-1 leading-golden">
              Maps to EPA6 (Conduct signal detection) and EPA7 (Evaluate and prioritize signals).
              Practice disproportionality analysis, clinical contextualization, and regulatory decision-making.
            </p>
          </div>
        </div>
      </div>

      <FrameworkClient />

      <div className="mt-golden-4 pt-golden-3 border-t border-nex-light">
        <div className="flex flex-wrap gap-golden-3 text-sm text-slate-dim/70">
          <div>
            <span className="font-semibold text-white">Methodology:</span>{' '}
            5 C&apos;s Decision Framework
          </div>
          <div>
            <span className="font-semibold text-white">Competency Level:</span>{' '}
            L3-L4 (Intermediate to Advanced)
          </div>
          <div>
            <span className="font-semibold text-white">Estimated Time:</span>{' '}
            15-25 minutes per scenario
          </div>
        </div>
      </div>
    </div>
  );
}
