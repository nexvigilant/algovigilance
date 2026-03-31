import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { VoiceLoadingMessage } from '@/components/voice';

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <VoiceLoadingMessage context="default" className="pt-4" />
      {/* Header skeleton */}
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-8">
        <div className="h-8 w-32 animate-pulse rounded-md bg-muted" />
        <div className="flex-1" />
        <div className="flex gap-2">
          <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
          <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
        </div>
      </header>

      {/* Main content skeleton */}
      <main className="flex-1 p-4 md:p-8">
        <div className="container mx-auto space-y-8">
          {/* Hero section skeleton */}
          <div className="space-y-4 text-center">
            <div className="mx-auto h-12 w-3/4 animate-pulse rounded-lg bg-muted" />
            <div className="mx-auto h-6 w-1/2 animate-pulse rounded-lg bg-muted" />
          </div>

          {/* Cards skeleton */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader>
                  <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-muted" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                    <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
