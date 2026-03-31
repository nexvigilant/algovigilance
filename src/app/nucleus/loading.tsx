import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { VoiceLoadingMessage } from '@/components/voice';

export default function DashboardLoading() {
  return (
    <div className="flex flex-1 flex-col">
      <VoiceLoadingMessage context="analytics" className="pt-4" />
      {/* Dashboard Header Skeleton */}
      <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-8">
        <div className="h-8 w-8 animate-pulse rounded-md bg-muted md:hidden" />
        <div className="flex-1">
          <div className="h-6 w-48 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="flex flex-1 items-center justify-end">
          <div className="h-9 w-64 animate-pulse rounded-md bg-muted" />
        </div>
      </header>

      {/* Dashboard Content Skeleton */}
      <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        {/* KPI Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="h-4 w-4 animate-pulse rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-24 animate-pulse rounded bg-muted" />
                <div className="mt-2 h-3 w-40 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Section Skeleton */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
          <Card className="col-span-1 lg:col-span-4">
            <CardHeader>
              <div className="h-6 w-48 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px] animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
          <Card className="col-span-1 lg:col-span-3">
            <CardHeader>
              <div className="h-6 w-40 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-[300px] animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        </div>

        {/* Tables Section Skeleton */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 w-48 animate-pulse rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="flex items-center gap-4">
                      <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
