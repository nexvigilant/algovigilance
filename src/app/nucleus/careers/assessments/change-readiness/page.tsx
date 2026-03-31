import { createMetadata } from '@/lib/metadata';
import { RefreshCw } from 'lucide-react';
import { AssessmentClient } from './assessment-client';

export const metadata = createMetadata({
  title: 'Change Readiness Assessment',
  description: 'Assess your readiness for portfolio career transition. Evaluate financial stability, network strength, emotional readiness, and practical factors across 15 key indicators.',
  path: '/nucleus/careers/assessments/change-readiness',
});

export default function ChangeReadinessPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-golden-4">
      <header className="mb-golden-4">
        <div className="flex items-center gap-golden-2 mb-golden-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-copper/30 bg-copper/5">
            <RefreshCw className="h-5 w-5 text-copper" aria-hidden="true" />
          </div>
          <div>
            <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-copper/60">
              AlgoVigilance Careers
            </p>
            <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Change Readiness Assessment
            </h1>
          </div>
        </div>
        <p className="text-sm text-slate-dim/70 max-w-xl leading-golden">
          Evaluate your readiness to transition from traditional employment to a portfolio career
          across 15 key indicators
        </p>
      </header>

      <div className="mb-golden-3 p-golden-3 bg-copper/5 border border-copper/20">
        <div className="flex items-start gap-golden-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-copper/10">
            <RefreshCw className="h-4 w-4 text-copper" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">Four-Dimension Framework</h3>
            <p className="text-sm text-slate-dim/70 mt-1 leading-golden">
              <strong className="text-white">Financial</strong> (runway & stability) +
              <strong className="text-white"> Network</strong> (connections & reputation) +
              <strong className="text-white"> Emotional</strong> (identity & resilience) +
              <strong className="text-white"> Practical</strong> (time & support) =
              Your transition readiness profile.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-golden-3 p-golden-3 bg-gold/5 border border-gold/20">
        <p className="text-sm leading-golden">
          <span className="font-semibold text-gold">Transition Truth: </span>
          <span className="text-slate-dim/70">
            Successful career transitions rarely happen overnight. This assessment helps you
            identify what&apos;s ready now and what needs preparation before making the leap.
          </span>
        </p>
      </div>

      <AssessmentClient />

      <div className="mt-golden-4 pt-golden-3 border-t border-nex-light">
        <div className="flex flex-wrap gap-golden-3 text-sm text-slate-dim/70">
          <div>
            <span className="font-semibold text-white">Framework:</span>{' '}
            Connected Board Advisor Academy
          </div>
          <div>
            <span className="font-semibold text-white">Indicators:</span>{' '}
            15 Key Factors
          </div>
          <div>
            <span className="font-semibold text-white">Estimated Time:</span>{' '}
            15-20 minutes
          </div>
        </div>
      </div>
    </div>
  );
}
