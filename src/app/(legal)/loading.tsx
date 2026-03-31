import { Skeleton } from '@/components/ui/skeleton';
import { VoiceLoadingMessage } from '@/components/voice';

export default function LegalLoading() {
  return (
    <div className="container mx-auto px-4 py-8 md:px-8">
      <VoiceLoadingMessage context="default" className="mb-4" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar skeleton */}
        <div className="lg:col-span-3">
          <div className="lg:sticky lg:top-24 space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
        </div>

        {/* Main content skeleton */}
        <main className="lg:col-span-9 space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <Skeleton className="h-12 w-12 mx-auto rounded-full" />
            <Skeleton className="h-10 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-1/3 mx-auto" />
          </div>

          {/* Content sections */}
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-8 w-1/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}
