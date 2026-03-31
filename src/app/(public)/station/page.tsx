import { createMetadata } from "@/lib/metadata";
import { StationDashboard } from "./station-dashboard";

export const metadata = createMetadata({
  title: "Station — MCP Server for Pharmacovigilance",
  description:
    "Free MCP server with 1,900+ pharmacovigilance tools. Connect any AI agent to FDA FAERS, DailyMed, PubMed, signal detection, and causality assessment. No auth required.",
  path: "/station",
  imageAlt: "AlgoVigilance Station — MCP Server for PV Agents",
});

export default function StationPage() {
  return <StationDashboard />;
}
