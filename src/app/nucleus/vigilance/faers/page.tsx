import { createMetadata } from "@/lib/metadata";
import { FaersExplorer } from "./components/faers-explorer";

export const metadata = createMetadata({
  title: "Look Up a Drug's Safety Record",
  description:
    "Search the FDA's adverse event database and see which side effects are reported more than expected",
  path: "/nucleus/vigilance/faers",
  keywords: [
    "FAERS",
    "signal detection",
    "pharmacovigilance",
    "drug safety",
    "adverse events",
  ],
});

export default function FaersPage() {
  return <FaersExplorer />;
}
