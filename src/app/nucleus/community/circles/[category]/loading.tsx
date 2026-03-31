import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { VoiceLoadingMessage } from '@/components/voice';

export default function CategoryLoading() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <VoiceLoadingMessage context="forum" className="mb-4" />
      {/* Breadcrumbs skeleton */}
      <div className="mb-6">
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Header skeleton */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div className="flex items-start gap-4">
          <Skeleton className="h-16 w-16 rounded" />
          <div>
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-5 w-96 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Post cards skeleton */}
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-6 holographic-card">
            <div className="flex gap-4">
              <div className="flex-1 min-w-0">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <div className="flex items-center gap-3 mb-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
              <div className="flex flex-col gap-3 min-w-[120px] items-end">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Back button skeleton */}
      <div className="mt-8 flex justify-center">
        <Skeleton className="h-10 w-48" />
      </div>
    </div>
  );
}
