import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getEPAById } from '../../epa/actions';
import { EPADetailClient } from './components/epa-detail-client';

import { logger } from '@/lib/logger';

const log = logger.scope('pathways/[epaId]');

interface EPADetailPageProps {
  params: Promise<{ epaId: string }>;
}

export async function generateMetadata({ params }: EPADetailPageProps) {
  const { epaId } = await params;
  const epa = await getEPAById(epaId);

  if (!epa) {
    return {
      title: 'EPA Not Found | AlgoVigilance Academy',
    };
  }

  return {
    title: `${epa.shortName} | EPA Pathway | AlgoVigilance Academy`,
    description: epa.description,
  };
}

async function EPADetailContent({ epaId }: { epaId: string }) {
  try {
    const epa = await getEPAById(epaId);

    if (!epa) {
      notFound();
    }

    return <EPADetailClient epa={epa} />;
  } catch (error) {
    log.error('Error loading EPA:', error);
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertDescription>
          Failed to load pathway details. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }
}

export default async function EPADetailPage({ params }: EPADetailPageProps) {
  const { epaId } = await params;

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <Suspense fallback={<EPADetailSkeleton />}>
        <EPADetailContent epaId={epaId} />
      </Suspense>
    </div>
  );
}

function EPADetailSkeleton() {
  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Skeleton className="h-10 w-40 bg-nex-surface" />

      {/* Header */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <Skeleton className="h-6 w-24 bg-nex-surface" />
          <Skeleton className="h-6 w-24 bg-nex-surface" />
        </div>
        <Skeleton className="h-12 w-3/4 bg-nex-surface" />
        <Skeleton className="h-6 w-full max-w-3xl bg-nex-surface" />
        <div className="flex gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-5 w-24 bg-nex-surface" />
          ))}
        </div>
      </div>

      {/* Action Button */}
      <Skeleton className="h-12 w-48 bg-nex-surface" />

      {/* Tabs */}
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-32 bg-nex-surface" />
        ))}
      </div>

      {/* Content */}
      <div className="grid md:grid-cols-2 gap-6">
        <Skeleton className="h-64 bg-nex-surface rounded-xl" />
        <Skeleton className="h-64 bg-nex-surface rounded-xl" />
      </div>
    </div>
  );
}
