"use client";

import dynamic from "next/dynamic";

const LiveFeedPanel = dynamic(
  () =>
    import("@/components/god/live-feed-panel").then(
      (mod) => mod.LiveFeedPanel,
    ),
  { ssr: false },
);

export function LiveFeedSection() {
  return (
    <div className="relative z-10 mb-4">
      <div className="mx-auto max-w-2xl px-6 flex justify-center">
        <LiveFeedPanel />
      </div>
    </div>
  );
}
