import { Suspense } from 'react';
import { Target, Layers } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getEPAPathways } from '../epa/actions';
import { PathwaysClient } from './components/pathways-client';
import { BrandedHeroHeader } from '@/components/ui/branded/branded-hero-header';

import { logger } from '@/lib/logger';

const log = logger.scope('pathways/page');

export const metadata = {
  title: 'EPA Pathways | AlgoVigilance Academy',
  description:
    'Explore 21 Entrustable Professional Activity pathways to build pharmacovigilance capabilities from foundational to expert levels.',
};

async function PathwaysContent() {
  try {
    // Fetch EPAs server-side (user progress handled client-side)
    const epas = await getEPAPathways();

    return <PathwaysClient initialEPAs={epas} />;
  } catch (error) {
    log.error('Error loading EPA pathways:', error);
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertDescription>
          Failed to load pathways. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }
}

export default function PathwaysPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <BrandedHeroHeader
        label="Entrustable Professional Activities"
        title="EPA Pathways"
        description="Master pharmacovigilance through structured capability pathways. Progress from observation to independent practice across 21 professional activities."
        icon={Target}
      >
        {/* Quick Stats */}
        <div className="flex flex-wrap justify-center gap-6 text-sm">
          <div className="flex items-center gap-2 text-slate-light">
            <Layers className="h-4 w-4 text-cyan/70" />
            <span>
              <span className="font-mono text-cyan">21</span> Pathways
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-light">
            <span className="h-2 w-2 rounded-full bg-cyan" />
            <span>
              <span className="font-mono text-cyan">10</span> Core
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-light">
            <span className="h-2 w-2 rounded-full bg-gold" />
            <span>
              <span className="font-mono text-gold">10</span> Executive
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-light">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>
              <span className="font-mono text-emerald-400">1</span> Network
            </span>
          </div>
        </div>
      </BrandedHeroHeader>

      {/* Pathways Grid */}
      <Suspense fallback={<PathwaysGridSkeleton />}>
        <PathwaysContent />
      </Suspense>
    </div>
  );
}

function PathwaysGridSkeleton() {
  return (
    <div>
      {/* Tabs Skeleton */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-32 bg-nex-surface" />
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="flex gap-4 mb-8">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-40 bg-nex-surface" />
        ))}
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-nex-border bg-nex-surface p-6"
          >
            <Skeleton className="h-4 w-24 mb-4" />
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-4" />
            <div className="flex gap-4 mb-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-20 w-full mb-4" />
            <Skeleton className="h-2 w-full mb-4" />
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
