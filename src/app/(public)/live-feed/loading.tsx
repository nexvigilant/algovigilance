import { Skeleton } from "@/components/ui/skeleton";

export default function LiveFeedLoading() {
  return (
    <div className="min-h-screen bg-nex-deep">
      <div className="border-b border-nex-border/50 bg-nex-dark/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <Skeleton className="h-4 w-32 mb-3" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-6 rounded-full" />
              <div>
                <Skeleton className="h-7 w-48 mb-1" />
                <Skeleton className="h-4 w-72" />
              </div>
            </div>
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    </div>
  );
}
