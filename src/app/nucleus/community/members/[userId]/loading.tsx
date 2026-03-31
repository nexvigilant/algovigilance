import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { VoiceLoadingMessage } from '@/components/voice';

export default function UserProfileLoading() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <VoiceLoadingMessage context="profile" className="mb-4" />
      {/* Breadcrumbs skeleton */}
      <div className="mb-6">
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Profile header skeleton */}
      <Card className="mb-8 holographic-card">
        <CardHeader>
          <div className="flex items-start gap-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-32 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6">
            <div>
              <Skeleton className="h-4 w-16 mb-1" />
              <Skeleton className="h-6 w-12" />
            </div>
            <div>
              <Skeleton className="h-4 w-16 mb-1" />
              <Skeleton className="h-6 w-12" />
            </div>
            <div>
              <Skeleton className="h-4 w-20 mb-1" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs skeleton */}
      <div className="mb-6 flex gap-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Activity cards skeleton */}
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6 holographic-card">
            <Skeleton className="h-6 w-3/4 mb-3" />
            <div className="flex items-center gap-3 mb-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
