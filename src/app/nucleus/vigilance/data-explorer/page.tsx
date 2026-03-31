import { DataExplorer } from "./components/data-explorer";

export const metadata = {
  title: "Data Explorer | AlgoVigilance Vigilance",
  description:
    "Browse and analyze pharmacovigilance datasets — FAERS reports, adverse event counts, and signal trends",
};

export default function DataExplorerPage() {
  return <DataExplorer />;
}
