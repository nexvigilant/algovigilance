import { Skeleton } from '@/components/ui/skeleton';

export default function ProfileSettingsLoading() {
  return (
    <div className="max-w-2xl" aria-busy="true" aria-label="Loading profile settings">
      {/* Header skeleton */}
      <div className="mb-8">
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Avatar section */}
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div>
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      {/* Form fields */}
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
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
