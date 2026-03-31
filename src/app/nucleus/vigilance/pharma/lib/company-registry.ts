export interface PharmaCompany {
  name: string;
  description: string;
  therapeuticAreas: string[];
}

export const PHARMA_COMPANIES: Record<string, PharmaCompany> = {
  pfizer: {
    name: "Pfizer Inc.",
    description:
      "Global pharmaceutical leader in vaccines, oncology, and rare disease",
    therapeuticAreas: ["Vaccines", "Oncology", "Rare Disease", "Immunology"],
  },
  novartis: {
    name: "Novartis AG",
    description:
      "Swiss multinational focused on innovative medicines and generics",
    therapeuticAreas: [
      "Cardiovascular",
      "Immunology",
      "Neuroscience",
      "Oncology",
    ],
  },
  roche: {
    name: "Roche Holding AG",
    description: "Leader in oncology, immunology, and diagnostics",
    therapeuticAreas: ["Oncology", "Immunology", "Neuroscience", "Diagnostics"],
  },
  jnj: {
    name: "Johnson & Johnson",
    description:
      "Diversified healthcare: pharmaceuticals, medical devices, consumer",
    therapeuticAreas: [
      "Oncology",
      "Immunology",
      "Neuroscience",
      "Cardiovascular",
    ],
  },
  merck: {
    name: "Merck & Co.",
    description:
      "Research-driven pharma: oncology, vaccines, infectious disease",
    therapeuticAreas: [
      "Oncology",
      "Vaccines",
      "Infectious Disease",
      "Cardiovascular",
    ],
  },
  astrazeneca: {
    name: "AstraZeneca PLC",
    description:
      "Biopharmaceutical focus: oncology, respiratory, cardiovascular",
    therapeuticAreas: [
      "Oncology",
      "Respiratory",
      "Cardiovascular",
      "Rare Disease",
    ],
  },
  gsk: {
    name: "GSK plc",
    description: "Vaccines, specialty medicines, and general medicines",
    therapeuticAreas: [
      "Vaccines",
      "Oncology",
      "Infectious Disease",
      "Respiratory",
    ],
  },
  sanofi: {
    name: "Sanofi S.A.",
    description:
      "Global healthcare: immunology, oncology, rare diseases, vaccines",
    therapeuticAreas: ["Immunology", "Oncology", "Rare Disease", "Vaccines"],
  },
  abbvie: {
    name: "AbbVie Inc.",
    description: "Immunology, oncology, aesthetics, neuroscience, eye care",
    therapeuticAreas: ["Immunology", "Oncology", "Neuroscience", "Aesthetics"],
  },
  lilly: {
    name: "Eli Lilly and Company",
    description: "Diabetes, oncology, immunology, and neuroscience",
    therapeuticAreas: ["Diabetes", "Oncology", "Immunology", "Neuroscience"],
  },
  bms: {
    name: "Bristol-Myers Squibb",
    description: "Oncology, hematology, immunology, cardiovascular",
    therapeuticAreas: [
      "Oncology",
      "Hematology",
      "Immunology",
      "Cardiovascular",
    ],
  },
  novonordisk: {
    name: "Novo Nordisk A/S",
    description:
      "Diabetes care, obesity, rare blood disorders, hormone therapy",
    therapeuticAreas: [
      "Diabetes",
      "Obesity",
      "Rare Blood Disorders",
      "Endocrinology",
    ],
  },
  amgen: {
    name: "Amgen Inc.",
    description:
      "Biotechnology: oncology, cardiovascular, inflammation, bone health",
    therapeuticAreas: [
      "Oncology",
      "Cardiovascular",
      "Inflammation",
      "Bone Health",
    ],
  },
  gilead: {
    name: "Gilead Sciences Inc.",
    description: "Antiviral therapies, oncology, inflammation",
    therapeuticAreas: [
      "Antiviral",
      "HIV/AIDS",
      "Oncology",
      "Inflammatory Disease",
    ],
  },
  bayer: {
    name: "Bayer AG",
    description: "Pharmaceuticals, consumer health, crop science",
    therapeuticAreas: [
      "Cardiovascular",
      "Oncology",
      "Women's Health",
      "Radiology",
    ],
  },
};

export function resolveCompany(key: string): PharmaCompany | null {
  return PHARMA_COMPANIES[key] ?? null;
}
