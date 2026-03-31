import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { VoiceLoadingMessage } from '@/components/voice';

export default function VigilanceLoading() {
  return (
    <div className="flex flex-1 flex-col">
      <VoiceLoadingMessage context="vigilance" className="pt-4" />
      <main className="flex-1 space-y-6 p-4 pt-6 md:p-8">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-64 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-96 animate-pulse rounded-md bg-muted" />
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="h-4 w-4 animate-pulse rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-7 w-16 animate-pulse rounded bg-muted" />
                <div className="mt-2 h-3 w-32 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Data table skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 w-48 animate-pulse rounded bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-4 border-b pb-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 flex-1 animate-pulse rounded bg-muted" />
                ))}
              </div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4 py-3">
                  {[...Array(5)].map((_, j) => (
                    <div key={j} className="h-4 flex-1 animate-pulse rounded bg-muted" />
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
