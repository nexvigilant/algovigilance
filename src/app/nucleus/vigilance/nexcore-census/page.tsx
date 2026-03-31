import { createMetadata } from "@/lib/metadata";
import { CensusExplorer } from "./components/census-explorer";

export const metadata = createMetadata({
  title: "Thread the Boundary",
  description:
    "NexCore Population-Bounded Signal Verification — thread boundaries through data strings to produce counted knowledge instead of estimated signals",
  path: "/nucleus/vigilance/nexcore-census",
  keywords: [
    "NexCore",
    "prescription census",
    "denominator",
    "incidence rate",
    "pharmacovigilance",
    "boundary",
  ],
});

export default function NexCoreCensusPage() {
  return <CensusExplorer />;
}
