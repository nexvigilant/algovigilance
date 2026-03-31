import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getEPAById } from '@/app/nucleus/academy/epa/actions';
import { EPALearnClient } from './components/epa-learn-client';

import { logger } from '@/lib/logger';

const log = logger.scope('learn/epa/[epaId]');

interface EPALearnPageProps {
  params: Promise<{ epaId: string }>;
}

export async function generateMetadata({ params }: EPALearnPageProps) {
  const { epaId } = await params;
  const epa = await getEPAById(epaId);

  if (!epa) {
    return {
      title: 'EPA Not Found | AlgoVigilance Academy',
    };
  }

  return {
    title: `Build ${epa.shortName} | AlgoVigilance Academy`,
    description: `Build capability in ${epa.name} through structured practice.`,
  };
}

async function EPALearnContent({ epaId }: { epaId: string }) {
  try {
    const epa = await getEPAById(epaId);

    if (!epa) {
      notFound();
    }

    return <EPALearnClient epa={epa} />;
  } catch (error) {
    log.error('Error loading EPA for learning:', error);
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertDescription>
          Failed to load pathway. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }
}

export default async function EPALearnPage({ params }: EPALearnPageProps) {
  const { epaId } = await params;

  return (
    <div className="min-h-screen bg-nex-deep">
      <Suspense fallback={<EPALearnSkeleton />}>
        <EPALearnContent epaId={epaId} />
      </Suspense>
    </div>
  );
}

function EPALearnSkeleton() {
  return (
    <div className="flex">
      {/* Sidebar Skeleton */}
      <div className="w-80 border-r border-nex-border p-4 space-y-4">
        <Skeleton className="h-8 w-full bg-nex-surface" />
        <Skeleton className="h-4 w-3/4 bg-nex-surface" />
        <div className="space-y-2 mt-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-12 w-full bg-nex-surface" />
          ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 p-8 space-y-6">
        <Skeleton className="h-10 w-3/4 bg-nex-surface" />
        <Skeleton className="h-6 w-1/2 bg-nex-surface" />
        <div className="grid gap-4 mt-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 w-full bg-nex-surface rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
