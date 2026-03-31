"use server";

import { adminDb } from "@/lib/firebase-admin";

export interface InvestigationScenario {
  id: string;
  drug: string;
  event: string;
  description: string;
  table: { a: number; b: number; c: number; d: number };
  naranjoAnswers: number[];
  expectedSignal: boolean;
  /** Optional: source reference for the contingency table data */
  source?: string;
  /** Display order (lower = first) */
  order?: number;
}

const COLLECTION = "pv_scenarios";

/**
 * Fetch all published investigation scenarios from Firestore.
 * Falls back to seed data if the collection is empty.
 */
export async function getScenarios(): Promise<InvestigationScenario[]> {
  try {
    const snapshot = await adminDb
      .collection(COLLECTION)
      .orderBy("order", "asc")
      .get();

    if (snapshot.empty) {
      return getDefaultScenarios();
    }

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<InvestigationScenario, "id">),
    }));
  } catch {
    // Firestore unavailable or index missing — use defaults
    return getDefaultScenarios();
  }
}

/**
 * Default scenarios used when Firestore is empty or unavailable.
 * These serve as seed data and as a fallback.
 */
export function getDefaultScenarios(): InvestigationScenario[] {
  return [
    {
      id: "semaglutide-pancreatitis",
      drug: "Semaglutide",
      event: "Pancreatitis",
      description:
        "GLP-1 receptor agonist used for diabetes and obesity. Pancreatitis has been a class-wide concern since exenatide.",
      table: { a: 2068, b: 108932, c: 65421, d: 19823579 },
      naranjoAnswers: [1, 1, 1, 0, -1, 0, 0, 0, 1, 1],
      expectedSignal: true,
      source: "FAERS Q4 2024",
      order: 1,
    },
    {
      id: "metformin-lactic-acidosis",
      drug: "Metformin",
      event: "Lactic Acidosis",
      description:
        "First-line diabetes treatment. Lactic acidosis is a rare but serious labeled adverse reaction, especially with renal impairment.",
      table: { a: 1534, b: 254321, c: 12876, d: 19731269 },
      naranjoAnswers: [1, 1, 1, 0, -1, 0, 0, 1, 1, 1],
      expectedSignal: true,
      source: "FAERS Q4 2024",
      order: 2,
    },
    {
      id: "atorvastatin-rhabdomyolysis",
      drug: "Atorvastatin",
      event: "Rhabdomyolysis",
      description:
        "Widely prescribed statin. Rhabdomyolysis is a known class effect, rare but can be fatal. Risk increases with drug interactions.",
      table: { a: 876, b: 312450, c: 8934, d: 19677740 },
      naranjoAnswers: [1, 1, 1, 0, -1, 0, 0, 0, 1, 1],
      expectedSignal: true,
      source: "FAERS Q4 2024",
      order: 3,
    },
    {
      id: "amoxicillin-headache",
      drug: "Amoxicillin",
      event: "Headache",
      description:
        "Common antibiotic. Headache is reported frequently but is also extremely common in the general population — a classic noise signal.",
      table: { a: 3200, b: 198000, c: 890000, d: 18908800 },
      naranjoAnswers: [0, 1, 0, 0, -1, 0, 0, 0, 0, 0],
      expectedSignal: false,
      source: "FAERS Q4 2024",
      order: 4,
    },
  ];
}
