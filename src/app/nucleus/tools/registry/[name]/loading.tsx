export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="h-4 w-48 bg-white/[0.06] mb-6" />

      {/* Header skeleton */}
      <div className="flex items-center gap-4 mb-8">
        <div className="h-8 w-64 bg-white/[0.06]" />
        <div className="h-6 w-16 bg-white/[0.06]" />
        <div className="h-6 w-20 bg-white/[0.06]" />
      </div>
      <div className="h-4 w-96 bg-white/[0.06] mb-8" />

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border border-white/[0.06] bg-white/[0.03] p-5">
            <div className="h-8 w-16 bg-white/[0.06] mb-2" />
            <div className="h-3 w-12 bg-white/[0.06]" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="h-[400px] border border-white/[0.06] bg-white/[0.03]" />
    </div>
  );
}
