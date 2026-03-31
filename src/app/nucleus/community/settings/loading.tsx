import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsLoading() {
  return (
    <div className="max-w-2xl" aria-busy="true" aria-label="Loading settings">
      {/* Header skeleton */}
      <div className="mb-8">
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Form sections skeleton */}
      <div className="space-y-6">
        {/* Avatar section */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>

        {/* Form fields */}
        {[...Array(4)].map((_, i) => (
          <div key={i}>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}

        {/* Bio field */}
        <div>
          <Skeleton className="h-4 w-16 mb-2" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>

        {/* Submit button */}
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}
