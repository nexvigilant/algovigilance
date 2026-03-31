import { Skeleton } from '@/components/ui/skeleton';

export default function DiscoverLoading() {
  return (
    <div className="max-w-4xl" aria-busy="true" aria-label="Loading discovery content">
      {/* Header skeleton */}
      <div className="mb-8 text-center">
        <Skeleton className="h-4 w-32 mx-auto mb-3" />
        <Skeleton className="h-10 w-48 mx-auto mb-4" />
        <Skeleton className="h-5 w-80 mx-auto" />
      </div>

      {/* Quiz card skeleton */}
      <div className="rounded-2xl border border-nex-light bg-nex-surface/50 p-8">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-6" />

        {/* Options skeleton */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>

        <Skeleton className="h-10 w-32 mx-auto" />
      </div>
    </div>
  );
}
