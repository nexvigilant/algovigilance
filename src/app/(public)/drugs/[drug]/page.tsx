import type { Metadata } from "next";
import { DrugSafetyProfile } from "./drug-safety-profile";

// ─── Top drugs for static generation ────────────────────────────────────────

const SEED_DRUGS = [
  "metformin",
  "semaglutide",
  "lisinopril",
  "atorvastatin",
  "levothyroxine",
  "amlodipine",
  "omeprazole",
  "metoprolol",
  "losartan",
  "gabapentin",
  "sertraline",
  "acetaminophen",
  "ibuprofen",
  "aspirin",
  "amoxicillin",
  "azithromycin",
  "prednisone",
  "albuterol",
  "montelukast",
  "fluoxetine",
  "escitalopram",
  "duloxetine",
  "bupropion",
  "trazodone",
  "alprazolam",
  "pantoprazole",
  "rosuvastatin",
  "simvastatin",
  "warfarin",
  "clopidogrel",
  "apixaban",
  "rivaroxaban",
  "insulin",
  "empagliflozin",
  "sitagliptin",
  "ozempic",
  "wegovy",
  "humira",
  "adalimumab",
  "pembrolizumab",
  "nivolumab",
  "rituximab",
  "trastuzumab",
  "infliximab",
  "etanercept",
  "lenalidomide",
  "ibrutinib",
  "oxycodone",
  "tramadol",
  "hydrocodone",
];

export async function generateStaticParams() {
  return SEED_DRUGS.map((drug) => ({ drug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ drug: string }>;
}): Promise<Metadata> {
  const { drug } = await params;
  const name = drug.charAt(0).toUpperCase() + drug.slice(1);

  return {
    title: `${name} Safety Profile — Adverse Events & Signal Detection`,
    description: `Live pharmacovigilance data for ${name}. FDA FAERS adverse events, disproportionality analysis (PRR/ROR), drug interactions, and safety signals. Powered by AlgoVigilance Station.`,
    openGraph: {
      title: `${name} Safety Profile | AlgoVigilance`,
      description: `Real-time adverse event analysis for ${name} from FDA FAERS, DailyMed, and PubMed.`,
      type: "article",
      url: `https://algovigilance.com/drugs/${drug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} Safety Profile | AlgoVigilance`,
      description: `Live signal detection for ${name} — PRR, ROR, IC, EBGM across FDA FAERS data.`,
    },
    alternates: {
      canonical: `https://algovigilance.com/drugs/${drug}`,
    },
  };
}

export default async function DrugPage({
  params,
}: {
  params: Promise<{ drug: string }>;
}) {
  const { drug } = await params;

  return <DrugSafetyProfile drug={drug} />;
}
