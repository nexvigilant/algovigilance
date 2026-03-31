import { Skeleton } from '@/components/ui/skeleton';

export default function MatchesLoading() {
  return (
    <div className="max-w-4xl" aria-busy="true" aria-label="Loading circle matches">
      {/* Header skeleton */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-4 w-80 mx-auto" />
      </div>

      {/* Match cards skeleton */}
      <div className="space-y-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-nex-light bg-nex-surface/50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-3" />
                <div className="flex gap-2 mb-3">
                  <Skeleton className="h-6 w-24 rounded" />
                  <Skeleton className="h-6 w-24 rounded" />
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
              <Skeleton className="h-9 w-28 flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons skeleton */}
      <div className="flex justify-center gap-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-44" />
      </div>
    </div>
  );
}
