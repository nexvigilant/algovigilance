import { createMetadata } from "@/lib/metadata";
import { StatusDashboard } from "./status-dashboard";

export const metadata = createMetadata({
  title: "System Status",
  description:
    "Real-time status of AlgoVigilance services. MCP Station, AI agent, diagnostic tools, and platform health — updated every 30 seconds.",
  path: "/status",
});

export default function StatusPage() {
  return <StatusDashboard />;
}
