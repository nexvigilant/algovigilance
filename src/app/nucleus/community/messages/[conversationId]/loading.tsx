import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b p-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`flex gap-2 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
            <Skeleton className={`h-12 rounded-2xl ${i % 2 === 0 ? 'w-48' : 'w-56'}`} />
          </div>
        ))}
      </div>
      <div className="border-t p-4">
        <Skeleton className="h-10 w-full rounded-full" />
      </div>
    </div>
  );
}
