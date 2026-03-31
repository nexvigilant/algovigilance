import { createMetadata } from "@/lib/metadata";
import { RiskScorer } from "./components/risk-scorer";

export const metadata = createMetadata({
  title: "Drug Risk Score | AlgoVigilance Vigilance",
  description:
    "How risky is this drug? Compute a composite risk score from signal detection metrics — PRR, ROR, IC, EBGM, and case count.",
  path: "/nucleus/vigilance/risk-score",
});

export default function RiskScorePage() {
  return <RiskScorer />;
}
