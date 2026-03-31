import type { Metadata } from "next";
import { OpenSourceCatalog } from "./open-source-catalog";

export const metadata: Metadata = {
  title: "Open Source",
  description:
    "NexCore — Your Open-Source Pharmacovigilant. 280 Rust crates for signal detection, causality assessment, benefit-risk analysis, and intelligent safety automation. MIT/Apache-2.0 licensed.",
  openGraph: {
    title: "NexCore — Your Open-Source Pharmacovigilant | AlgoVigilance",
    description:
      "280 Rust crates for pharmacovigilance intelligence. Signal detection (PRR/ROR/IC/EBGM), causality assessment, benefit-risk analysis. Built for patient safety. Open for everyone.",
  },
};

export default function OpenSourcePage() {
  return <OpenSourceCatalog />;
}
