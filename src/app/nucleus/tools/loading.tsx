import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { VoiceLoadingMessage } from '@/components/voice';

export default function ToolsLoading() {
  return (
    <div className="flex flex-1 flex-col">
      <VoiceLoadingMessage context="tools" className="pt-4" />
      <main className="flex-1 space-y-6 p-4 pt-6 md:p-8">
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-80 animate-pulse rounded-md bg-muted" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
                  <div className="space-y-2 flex-1">
                    <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-48 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 w-full animate-pulse rounded bg-muted" />
                  <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
