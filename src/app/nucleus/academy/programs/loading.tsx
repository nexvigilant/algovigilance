import { Skeleton } from "@/components/ui/skeleton";

export default function ProgramsLoading() {
  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      {/* Hero Skeleton */}
      <div className="text-center space-y-4 mb-12">
        <Skeleton className="h-6 w-48 mx-auto bg-nex-surface" />
        <Skeleton className="h-10 w-72 mx-auto bg-nex-surface" />
        <Skeleton className="h-5 w-96 mx-auto bg-nex-surface" />
      </div>

      {/* Grid Skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-72 rounded-xl bg-nex-surface" />
        ))}
      </div>
    </div>
  );
}
