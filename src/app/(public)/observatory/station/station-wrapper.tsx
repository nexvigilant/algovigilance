"use client";

import dynamic from "next/dynamic";

const StationExplorer = dynamic(
  () =>
    import("./station-explorer").then((mod) => ({
      default: mod.StationExplorer,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[700px] bg-[#0a0a0f] rounded-xl">
        <p className="text-zinc-500 text-sm">Loading Station Explorer...</p>
      </div>
    ),
  },
);

export function StationWrapper() {
  return <StationExplorer />;
}
