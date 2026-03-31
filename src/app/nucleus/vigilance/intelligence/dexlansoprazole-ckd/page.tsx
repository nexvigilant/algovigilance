import { createMetadata } from "@/lib/metadata";
import { SusarBrief } from "./components/susar-brief";

export const metadata = createMetadata({
  title: "SUSAR Discovery: Dexlansoprazole & Chronic Kidney Disease",
  description:
    "Intelligence brief NIB-2026-004 — Suspected Unexpected Serious Adverse Reaction for dexlansoprazole (Dexilant) and chronic kidney disease. PRR 134.38, 16,103 FAERS cases, WHO-UMC Probable.",
  path: "/nucleus/vigilance/intelligence/dexlansoprazole-ckd",
  keywords: [
    "dexlansoprazole",
    "Dexilant",
    "Takeda",
    "chronic kidney disease",
    "CKD",
    "ESRD",
    "SUSAR",
    "PPI",
    "proton pump inhibitor",
    "pharmacovigilance",
    "signal detection",
    "intelligence brief",
    "nephrotoxicity",
  ],
});

export default function DexlansoprazoleCkdPage() {
  return <SusarBrief />;
}
