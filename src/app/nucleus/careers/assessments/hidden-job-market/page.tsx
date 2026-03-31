import { createMetadata } from '@/lib/metadata';
import { Eye } from 'lucide-react';
import { NavigatorClient } from './navigator-client';

export const metadata = createMetadata({
  title: 'Hidden Job Market Navigator',
  description: 'Access the hidden job market for AlgoVigilance roles. Map your network, build strategic visibility, and develop advocate relationships to discover opportunities before they are posted.',
  path: '/nucleus/careers/assessments/hidden-job-market',
});

export default function HiddenJobMarketPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-golden-4">
      <header className="mb-golden-4">
        <div className="flex items-center gap-golden-2 mb-golden-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-copper/30 bg-copper/5">
            <Eye className="h-5 w-5 text-copper" aria-hidden="true" />
          </div>
          <div>
            <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-copper/60">
              AlgoVigilance Careers
            </p>
            <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Hidden Job Market Navigator
            </h1>
          </div>
        </div>
        <p className="text-sm text-slate-dim/70 max-w-xl leading-golden">
          Most advisory and senior roles are never publicly posted. Develop a strategic approach
          to accessing opportunities through network development and relationship cultivation.
        </p>
      </header>

      <div className="mb-golden-3 p-golden-3 bg-copper/5 border border-copper/20">
        <div className="flex items-start gap-golden-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-copper/10">
            <Eye className="h-4 w-4 text-copper" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">Three-Pillar Approach</h3>
            <p className="text-sm text-slate-dim/70 mt-1 leading-golden">
              <strong className="text-white">Network Mapping</strong> (who you know) + <strong className="text-white">Visibility Building</strong> (being known) +
              <strong className="text-white"> Relationship Development</strong> (from contact to advocate) = Access to the hidden job market.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-golden-3 p-golden-3 bg-gold/5 border border-gold/20">
        <p className="text-sm leading-golden">
          <span className="font-semibold text-gold">Mindset Shift: </span>
          <span className="text-slate-dim/70">
            From &ldquo;job seeker looking for openings&rdquo; to &ldquo;professional building relationships
            who happens to be open to opportunities.&rdquo; Build relationships before you need them.
          </span>
        </p>
      </div>

      <NavigatorClient />

      <div className="mt-golden-4 pt-golden-3 border-t border-nex-light">
        <div className="flex flex-wrap gap-golden-3 text-sm text-slate-dim/70">
          <div>
            <span className="font-semibold text-white">Framework:</span>{' '}
            Network, Visibility, Relationships
          </div>
          <div>
            <span className="font-semibold text-white">Target Audience:</span>{' '}
            AlgoVigilances seeking advisory or senior roles
          </div>
          <div>
            <span className="font-semibold text-white">Estimated Time:</span>{' '}
            30-45 minutes
          </div>
        </div>
      </div>
    </div>
  );
}
