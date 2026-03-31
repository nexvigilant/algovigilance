import { createMetadata } from '@/lib/metadata';
import { Search } from 'lucide-react';
import { PreparationClient } from './preparation-client';

export const metadata = createMetadata({
  title: 'Interview Preparation & Due Diligence',
  description: 'Prepare for vigilance interviews and advisory conversations with structured company research. Research the ecosystem, company, and sector to demonstrate preparation and enable better conversations.',
  path: '/nucleus/careers/assessments/interview-preparation',
});

export default function InterviewPreparationPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-golden-4">
      <header className="mb-golden-4">
        <div className="flex items-center gap-golden-2 mb-golden-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-copper/30 bg-copper/5">
            <Search className="h-5 w-5 text-copper" aria-hidden="true" />
          </div>
          <div>
            <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-copper/60">
              AlgoVigilance Careers
            </p>
            <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Interview Preparation & Due Diligence
            </h1>
          </div>
        </div>
        <p className="text-sm text-slate-dim/70 max-w-xl leading-golden">
          Prepare for interviews and advisory conversations with structured company research
          across ecosystem, company, and sector
        </p>
      </header>

      <div className="mb-golden-3 p-golden-3 bg-copper/5 border border-copper/20">
        <div className="flex items-start gap-golden-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-copper/10">
            <Search className="h-4 w-4 text-copper" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">Three-Area Due Diligence Framework</h3>
            <p className="text-sm text-slate-dim/70 mt-1 leading-golden">
              <strong className="text-white">Ecosystem</strong> (market context) + <strong className="text-white">Company</strong> (organization details) +
              <strong className="text-white"> Sector</strong> (competitive landscape) = Comprehensive preparation that
              demonstrates professionalism and enables better conversations.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-golden-3 p-golden-3 bg-gold/5 border border-gold/20">
        <p className="text-sm leading-golden">
          <span className="font-semibold text-gold">Key Principle: </span>
          <span className="text-slate-dim/70">
            &ldquo;Active listening &gt; jumping to solutions.&rdquo; Your research enables
            better questions, not better answers. The goal is to understand their context
            before offering your expertise.
          </span>
        </p>
      </div>

      <PreparationClient />

      <div className="mt-golden-4 pt-golden-3 border-t border-nex-light">
        <div className="flex flex-wrap gap-golden-3 text-sm text-slate-dim/70">
          <div>
            <span className="font-semibold text-white">Framework:</span>{' '}
            Three-Area Due Diligence (Ecosystem, Company, Sector)
          </div>
          <div>
            <span className="font-semibold text-white">Target Audience:</span>{' '}
            AlgoVigilances preparing for interviews or advisory conversations
          </div>
          <div>
            <span className="font-semibold text-white">Estimated Time:</span>{' '}
            30-60 minutes (depending on research depth)
          </div>
        </div>
      </div>
    </div>
  );
}
