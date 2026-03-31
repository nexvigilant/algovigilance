import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { VoiceLoadingMessage } from '@/components/voice';

export default function ForumsLoading() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <VoiceLoadingMessage context="forum" className="mb-4" />
      {/* Breadcrumbs skeleton */}
      <div className="mb-6">
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Header skeleton */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-5 w-96 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Category cards skeleton */}
      <div className="grid gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-6 holographic-card">
            <div className="flex gap-4">
              <Skeleton className="h-12 w-12 rounded flex-shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="flex flex-col gap-2 min-w-[100px] items-end">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
