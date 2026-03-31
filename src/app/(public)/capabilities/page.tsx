import { createMetadata } from "@/lib/metadata";
import { CapabilitiesContent } from "./capabilities-content";

export const metadata = createMetadata({
  title: "Platform Capabilities",
  description:
    "336 pages, 146 live tools, 448 decision programs, 20 data sources. The pharmacovigilance infrastructure platform for AI agents and safety teams.",
  path: "/capabilities",
  imageAlt: "AlgoVigilance Platform Capabilities",
});

export default function CapabilitiesPage() {
  return <CapabilitiesContent />;
}
