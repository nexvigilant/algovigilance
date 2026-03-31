import { createMetadata } from "@/lib/metadata";
import { FlywheelDashboard } from "./components/flywheel-dashboard";

export const metadata = createMetadata({
  title: "Development Flywheel",
  description:
    "Real-time velocity, node topology, and session momentum tracking for the AlgoVigilance development flywheel",
  path: "/nucleus/vigilance/flywheel",
  keywords: [
    "flywheel",
    "velocity",
    "momentum",
    "development health",
    "node topology",
  ],
});

export default function FlywheelPage() {
  return <FlywheelDashboard />;
}
