import { createMetadata } from "@/lib/metadata";
import { PvosOperations } from "./components/pvos-operations";

export const metadata = createMetadata({
  title: "PV Operations Center",
  description:
    "Your pharmacovigilance operations dashboard — active cases, signal watch, deadlines, and system health at a glance",
  path: "/nucleus/vigilance/operations",
  keywords: [
    "pharmacovigilance",
    "operations",
    "dashboard",
    "cases",
    "signals",
    "deadlines",
  ],
});

export default function OperationsPage() {
  return <PvosOperations />;
}
