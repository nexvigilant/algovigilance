import { createMetadata } from "@/lib/metadata";
import { SusarBrief } from "./components/susar-brief";

export const metadata = createMetadata({
  title: "SUSAR Discovery: Dupilumab & Alopecia Areata",
  description:
    "Intelligence brief NIB-2026-003 — Suspected Unexpected Serious Adverse Reaction for dupilumab and alopecia areata. PRR 2.75, 92 FAERS cases, Naranjo Possible. Th2→Th1 immune rebalancing mechanism.",
  path: "/nucleus/vigilance/intelligence/dupilumab-alopecia-areata",
  keywords: [
    "dupilumab",
    "Dupixent",
    "alopecia areata",
    "SUSAR",
    "IL-4",
    "IL-13",
    "Th2",
    "Th1",
    "pharmacovigilance",
    "signal detection",
    "intelligence brief",
    "immune rebalancing",
  ],
});

export default function DupilumabAlopeciaAreataPage() {
  return <SusarBrief />;
}
