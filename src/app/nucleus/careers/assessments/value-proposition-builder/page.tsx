import { createMetadata } from '@/lib/metadata';
import { Zap } from 'lucide-react';
import { BuilderClient } from './builder-client';

export const metadata = createMetadata({
  title: 'NECS Value Proposition Builder',
  description: 'Build your professional value proposition using the NECS framework: Networks, Expertise, Credibility, and Support. Generate outcome-based descriptions for LinkedIn, advisory applications, and professional introductions.',
  path: '/nucleus/careers/assessments/value-proposition-builder',
});

export default function ValuePropositionBuilderPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-golden-4">
      <header className="mb-golden-4">
        <div className="flex items-center gap-golden-2 mb-golden-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-copper/30 bg-copper/5">
            <Zap className="h-5 w-5 text-copper" aria-hidden="true" />
          </div>
          <div>
            <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-copper/60">
              AlgoVigilance Careers
            </p>
            <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              NECS Value Proposition Builder
            </h1>
          </div>
        </div>
        <p className="text-sm text-slate-dim/70 max-w-xl leading-golden">
          Transform task-based descriptions into outcome-based statements that demonstrate
          your unique value as a AlgoVigilance
        </p>
      </header>

      <div className="mb-golden-3 p-golden-3 bg-copper/5 border border-copper/20">
        <div className="flex items-start gap-golden-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-copper/10">
            <Zap className="h-4 w-4 text-copper" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">The NECS Framework</h3>
            <p className="text-sm text-slate-dim/70 mt-1 leading-golden">
              <strong className="text-white">N</strong>etworks (who you know) + <strong className="text-white">E</strong>xpertise (what you know) +
              <strong className="text-white">C</strong>redibility (why trust you) + <strong className="text-white">S</strong>upport (how you help) =
              Your complete value proposition. Based on board advisor best practices.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-golden-3 p-golden-3 bg-gold/5 border border-gold/20">
        <p className="text-sm leading-golden">
          <span className="font-semibold text-gold">Key Principle: </span>
          <span className="text-slate-dim/70">
            &ldquo;Value must be demonstrated, not just claimed.&rdquo; This tool helps you
            transform generic responsibilities into specific, measurable outcomes that
            build trust and differentiate you in the market.
          </span>
        </p>
      </div>

      <BuilderClient />

      <div className="mt-golden-4 pt-golden-3 border-t border-nex-light">
        <div className="flex flex-wrap gap-golden-3 text-sm text-slate-dim/70">
          <div>
            <span className="font-semibold text-white">Framework:</span>{' '}
            NECS (Networks, Expertise, Credibility, Support)
          </div>
          <div>
            <span className="font-semibold text-white">Target Audience:</span>{' '}
            AlgoVigilances at all levels
          </div>
          <div>
            <span className="font-semibold text-white">Estimated Time:</span>{' '}
            20-30 minutes
          </div>
        </div>
      </div>
    </div>
  );
}
