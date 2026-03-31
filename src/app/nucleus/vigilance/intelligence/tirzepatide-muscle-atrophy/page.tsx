import { createMetadata } from "@/lib/metadata";
import { SusarBrief } from "./components/susar-brief";

export const metadata = createMetadata({
  title: "SUSAR Discovery: Tirzepatide & Muscle Atrophy",
  description:
    "Intelligence brief NIB-2026-002 — Suspected Unexpected Serious Adverse Reaction for tirzepatide and muscle atrophy. PRR 2.28, 163 FAERS cases, Naranjo Possible. Class companion to NIB-2026-001 (semaglutide).",
  path: "/nucleus/vigilance/intelligence/tirzepatide-muscle-atrophy",
  keywords: [
    "tirzepatide",
    "Mounjaro",
    "Zepbound",
    "muscle atrophy",
    "SUSAR",
    "GLP-1",
    "GIP",
    "pharmacovigilance",
    "signal detection",
    "intelligence brief",
    "class effect",
  ],
});

export default function TirzepatideMuscleAtrophyPage() {
  return <SusarBrief />;
}
