import type { Metadata } from "next";
import { LiveFeedClient } from "./components/live-feed-client";

export const metadata: Metadata = {
  title: "Live Signal Feed",
  description:
    "Watch pharmacovigilance signal detection in real-time. 8 drugs analyzed in parallel through 60 decision pipelines.",
  openGraph: {
    title: "Live Signal Feed — AlgoVigilance",
    description:
      "Real-time parallel signal processing across FDA FAERS, EudraVigilance, and VigiBase.",
  },
};

export default function LiveFeedPage() {
  return <LiveFeedClient />;
}
