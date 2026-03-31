import { createMetadata } from "@/lib/metadata";
import { SemaglutideInvestigation } from "./semaglutide-investigation";
import { SemaglutideStructuredData } from "./structured-data";

export const metadata = createMetadata({
  title: "Semaglutide Safety Signal Investigation — Live PV Analysis",
  description:
    "Is semaglutide causing pancreatitis? Step-by-step pharmacovigilance signal investigation using live FDA FAERS data, PRR/ROR/IC/EBGM disproportionality analysis, DailyMed drug labeling, and PubMed literature. Free tools from AlgoVigilance.",
  path: "/station/semaglutide",
  imageAlt: "AlgoVigilance — Semaglutide Signal Investigation with Live FDA Data",
});

export default function SemaglutidePage() {
  return (
    <>
      <SemaglutideStructuredData />
      <SemaglutideInvestigation />
    </>
  );
}
