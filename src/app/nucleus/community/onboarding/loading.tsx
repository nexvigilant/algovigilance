import { Skeleton } from '@/components/ui/skeleton';

export default function OnboardingLoading() {
  return (
    <div className="max-w-2xl mx-auto" aria-busy="true" aria-label="Loading onboarding">
      {/* Progress indicator skeleton */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <Skeleton className="h-10 w-10 rounded-full mb-2" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      {/* Step content skeleton */}
      <div className="rounded-2xl border border-nex-light bg-nex-surface/50 p-8">
        <Skeleton className="h-6 w-48 mx-auto mb-2" />
        <Skeleton className="h-4 w-64 mx-auto mb-8" />

        <div className="space-y-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>

        <div className="flex justify-between mt-8">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
  );
}
