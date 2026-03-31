import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { VoiceLoadingMessage } from '@/components/voice';

export default function PostLoading() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <VoiceLoadingMessage context="forum" className="mb-4" />
      {/* Back button skeleton */}
      <div className="mb-6">
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Breadcrumbs skeleton */}
      <div className="mb-6">
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Post header skeleton */}
      <Card className="p-8 mb-8 holographic-card">
        <Skeleton className="h-10 w-3/4 mb-4" />

        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 min-w-[200px]">
            <Skeleton className="h-4 w-32 mb-1" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>

        {/* Tags skeleton */}
        <div className="flex gap-2 mb-6">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-18" />
        </div>

        {/* Post content skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Post stats skeleton */}
        <div className="flex items-center gap-6 mt-6 pt-6 border-t border-border">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
      </Card>

      {/* Replies section skeleton */}
      <div className="mb-6">
        <Skeleton className="h-8 w-32 mb-6" />

        {/* Reply cards skeleton */}
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6 holographic-card">
              <div className="flex items-start gap-4 mb-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Reply form skeleton */}
      <Card className="p-6 holographic-card">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-32 w-full mb-4" />
        <Skeleton className="h-10 w-24" />
      </Card>
    </div>
  );
}
