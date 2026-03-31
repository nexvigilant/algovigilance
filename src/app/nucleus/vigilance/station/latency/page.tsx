import { createMetadata } from "@/lib/metadata";
import { StationLatencyDashboard } from "./components/station-latency-dashboard";

export const metadata = createMetadata({
  title: "Station Latency Monitor",
  description:
    "Per-domain P99 latency trends and SLO compliance for AlgoVigilance Station at mcp.nexvigilant.com",
  path: "/nucleus/vigilance/station/latency",
  keywords: [
    "station",
    "latency",
    "p99",
    "slo",
    "monitoring",
    "telemetry",
    "nexvigilant",
  ],
});

export default function StationLatencyPage() {
  return <StationLatencyDashboard />;
}
