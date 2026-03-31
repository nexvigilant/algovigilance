import { createMetadata } from "@/lib/metadata";
import { StationWrapper } from "./station-wrapper";

export const metadata = createMetadata({
  title: "Station Explorer — Observatory",
  description:
    "Navigate AlgoVigilance Station as an interactive space station. 242 domains, 2,023 tools across 11 PV regulatory agencies, visualized as a live network with cross-jurisdictional mesh linkages.",
  path: "/observatory/station",
});

export default function StationPage() {
  return <StationWrapper />;
}
