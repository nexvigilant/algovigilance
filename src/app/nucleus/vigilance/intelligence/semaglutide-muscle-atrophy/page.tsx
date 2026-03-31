import { createMetadata } from "@/lib/metadata";
import { SusarBrief } from "./components/susar-brief";

export const metadata = createMetadata({
  title: "SUSAR Discovery: Semaglutide & Muscle Atrophy",
  description:
    "Intelligence brief NIB-2026-001 — Suspected Unexpected Serious Adverse Reaction for semaglutide and muscle atrophy. PRR 3.95, 182 FAERS cases, Naranjo Probable.",
  path: "/nucleus/vigilance/intelligence/semaglutide-muscle-atrophy",
  keywords: [
    "semaglutide",
    "muscle atrophy",
    "SUSAR",
    "GLP-1",
    "pharmacovigilance",
    "signal detection",
    "intelligence brief",
  ],
});

export default function SemaglutideMuscleAtrophyPage() {
  return <SusarBrief />;
}
