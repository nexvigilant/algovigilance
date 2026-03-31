import { Card, CardContent } from '@/components/ui/card';
import { VoiceLoadingMessage } from '@/components/voice';

export default function RegulatoryLoading() {
  return (
    <div className="flex flex-1 flex-col">
      <VoiceLoadingMessage context="regulatory" className="pt-4" />
      <main className="flex-1 space-y-6 p-4 pt-6 md:p-8">
        <div className="space-y-2">
          <div className="h-8 w-56 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-80 animate-pulse rounded-md bg-muted" />
        </div>

        <div className="h-11 w-full max-w-md animate-pulse rounded-lg bg-muted" />

        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="h-10 w-10 animate-pulse rounded-lg bg-muted flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
