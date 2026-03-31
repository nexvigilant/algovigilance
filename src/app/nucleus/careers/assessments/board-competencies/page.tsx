import { createMetadata } from '@/lib/metadata';
import { Award } from 'lucide-react';
import { AssessmentClient } from './assessment-client';

export const metadata = createMetadata({
  title: '9 Board Advisor Competencies',
  description: 'Assess your readiness for board advisory roles across 9 core competencies: Strategic Thinking, Industry Expertise, Network Value, Communication, Governance, Financial Acumen, Risk Assessment, Mentoring, and Cultural Intelligence.',
  path: '/nucleus/careers/assessments/board-competencies',
});

export default function BoardCompetenciesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-golden-4">
      <header className="mb-golden-4">
        <div className="flex items-center gap-golden-2 mb-golden-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-copper/30 bg-copper/5">
            <Award className="h-5 w-5 text-copper" aria-hidden="true" />
          </div>
          <div>
            <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-copper/60">
              AlgoVigilance Careers
            </p>
            <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              9 Board Advisor Competencies
            </h1>
          </div>
        </div>
        <p className="text-sm text-slate-dim/70 max-w-xl leading-golden">
          Evaluate your capabilities across the nine core competencies that distinguish
          effective board advisors
        </p>
      </header>

      <div className="mb-golden-3 p-golden-3 bg-copper/5 border border-copper/20">
        <div className="flex items-start gap-golden-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-copper/10">
            <Award className="h-4 w-4 text-copper" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">9 Competency Framework</h3>
            <p className="text-sm text-slate-dim/70 mt-1 leading-golden">
              <strong className="text-white">Strategic</strong> (thinking, expertise, governance) +
              <strong className="text-white"> Relational</strong> (network, communication, mentoring) +
              <strong className="text-white"> Operational</strong> (financial, risk, cultural) =
              Your complete advisor profile.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-golden-3 p-golden-3 bg-gold/5 border border-gold/20">
        <p className="text-sm leading-golden">
          <span className="font-semibold text-gold">Advisory Truth: </span>
          <span className="text-slate-dim/70">
            The best board advisors excel in 3-4 competencies and are adequate in the rest.
            This assessment helps you identify your &quot;signature strengths&quot; and critical gaps.
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
            <span className="font-semibold text-white">Competencies:</span>{' '}
            9 Core Areas
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
