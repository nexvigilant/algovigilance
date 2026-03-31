import { createMetadata } from '@/lib/metadata';
import { HeartPulse } from 'lucide-react';
import { AssessmentClient } from './assessment-client';

export const metadata = createMetadata({
  title: 'Startup Health Checklist',
  description: 'Evaluate startup advisory opportunities with a comprehensive due diligence checklist. Assess team, product, market, financials, and fit across 10 critical areas.',
  path: '/nucleus/careers/assessments/startup-health',
});

export default function StartupHealthPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-golden-4">
      <header className="mb-golden-4">
        <div className="flex items-center gap-golden-2 mb-golden-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-copper/30 bg-copper/5">
            <HeartPulse className="h-5 w-5 text-copper" aria-hidden="true" />
          </div>
          <div>
            <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-copper/60">
              AlgoVigilance Careers
            </p>
            <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Startup Health Checklist
            </h1>
          </div>
        </div>
        <p className="text-sm text-slate-dim/70 max-w-xl leading-golden">
          Conduct thorough due diligence before joining any advisory opportunity across
          10 critical areas
        </p>
      </header>

      <div className="mb-golden-3 p-golden-3 bg-copper/5 border border-copper/20">
        <div className="flex items-start gap-golden-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-copper/10">
            <HeartPulse className="h-4 w-4 text-copper" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">10-Area Due Diligence Framework</h3>
            <p className="text-sm text-slate-dim/70 mt-1 leading-golden">
              <strong className="text-white">Team & Culture</strong> + <strong className="text-white">Product & Market</strong> +
              <strong className="text-white"> Financials & Traction</strong> + <strong className="text-white">Governance & Legal</strong> +
              <strong className="text-white"> Your Fit</strong> = Comprehensive opportunity assessment.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-golden-3 p-golden-3 bg-nex-surface border border-nex-light">
        <h3 className="font-semibold text-white mb-golden-2 text-sm">Scoring System</h3>
        <div className="grid grid-cols-3 gap-golden-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500"></div>
            <span className="text-slate-dim/70"><strong className="text-green-500">Green</strong> - Strong/No concerns</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500"></div>
            <span className="text-slate-dim/70"><strong className="text-yellow-500">Yellow</strong> - Moderate/Some concerns</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500"></div>
            <span className="text-slate-dim/70"><strong className="text-red-500">Red</strong> - Weak/Significant concerns</span>
          </div>
        </div>
      </div>

      <div className="mb-golden-3 p-golden-3 bg-gold/5 border border-gold/20">
        <p className="text-sm leading-golden">
          <span className="font-semibold text-gold">Advisory Truth: </span>
          <span className="text-slate-dim/70">
            Not every opportunity is right for you. A thorough assessment protects your
            reputation and ensures you can deliver real value where you commit.
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
            <span className="font-semibold text-white">Areas:</span>{' '}
            10 Due Diligence Categories
          </div>
          <div>
            <span className="font-semibold text-white">Estimated Time:</span>{' '}
            30-45 minutes per company
          </div>
        </div>
      </div>
    </div>
  );
}
