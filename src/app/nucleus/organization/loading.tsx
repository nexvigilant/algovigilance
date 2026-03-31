import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { VoiceLoadingMessage } from '@/components/voice';

export default function OrganizationLoading() {
  return (
    <div className="flex flex-1 flex-col">
      <VoiceLoadingMessage context="organization" className="pt-4" />
      <main className="flex-1 space-y-6 p-4 pt-6 md:p-8">
        <div className="space-y-2">
          <div className="h-8 w-52 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-72 animate-pulse rounded-md bg-muted" />
        </div>

        <Card>
          <CardHeader>
            <div className="h-6 w-40 animate-pulse rounded bg-muted" />
          </CardHeader>
          <CardContent className="space-y-0 divide-y">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-4">
                <div className="space-y-1">
                  <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-64 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
