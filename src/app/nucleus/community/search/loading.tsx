import { Skeleton } from '@/components/ui/skeleton';

export default function SearchLoading() {
  return (
    <div className="max-w-4xl" aria-busy="true" aria-label="Loading search">
      {/* Search bar skeleton */}
      <div className="mb-8">
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>

      {/* Filter chips skeleton */}
      <div className="flex gap-2 mb-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>

      {/* Results skeleton */}
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-xl border border-nex-light bg-nex-surface/50 p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
