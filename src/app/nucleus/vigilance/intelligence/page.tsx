import { createMetadata } from "@/lib/metadata";
import { IntelligenceAccumulator } from "./components/intelligence-accumulator";

export const metadata = createMetadata({
  title: "What Have We Learned?",
  description:
    "Accumulated intelligence from PV signal detection — patterns, trends, and emerging insights across detection cycles",
  path: "/nucleus/vigilance/intelligence",
  keywords: [
    "intelligence",
    "signal accumulation",
    "pattern detection",
    "pharmacovigilance",
    "learning",
  ],
});

export default function IntelligencePage() {
  return <IntelligenceAccumulator />;
}
