import { createMetadata } from "@/lib/metadata";
import { StationDashboard } from "./station-dashboard";

export const metadata = createMetadata({
  title: "Station — MCP Server for Pharmacovigilance",
  description:
    "Free MCP server with 1,900+ financial analytics tools. Connect any AI agent to market data, SEC filings, algorithmic monitoring, and risk analytics. No auth required.",
  path: "/station",
  imageAlt: "AlgoVigilance Station — MCP Server for PV Agents",
});

export default function StationPage() {
  return <StationDashboard />;
}
