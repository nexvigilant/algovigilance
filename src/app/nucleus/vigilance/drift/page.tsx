import { createMetadata } from "@/lib/metadata";
import { DriftMonitor } from "./components/drift-monitor";

export const metadata = createMetadata({
  title: "What's Changing?",
  description:
    "Signal drift tracking, underreporting estimates, and data gap analysis for pharmacovigilance monitoring",
  path: "/nucleus/vigilance/drift",
  keywords: [
    "signal drift",
    "underreporting",
    "data gaps",
    "pharmacovigilance",
    "monitoring",
  ],
});

export default function DriftPage() {
  return <DriftMonitor />;
}
