import { type MetadataRoute } from "next";

// ─── Drug Safety Pages (programmatic SEO) ───────────────────────────────────

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

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.nexvigilant.com";
  const currentDate = new Date();

  const corePages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/community`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/academy`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/careers`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/doctrine`,
      lastModified: currentDate,
      changeFrequency: "yearly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/guardian`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/ventures`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/station`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/live-feed`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: currentDate,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: currentDate,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.9,
    },
  ];

  // Drug safety profile pages — high-value SEO surface
  const drugPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/drugs`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...SEED_DRUGS.map((drug) => ({
      url: `${baseUrl}/drugs/${drug}`,
      lastModified: currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];

  // Signal report pages — live PV analysis, highest-value SEO surface
  const SIGNAL_PAIRS: Array<[string, string]> = [
    ["lisinopril", "angioedema"],
    ["atorvastatin", "rhabdomyolysis"],
    ["metformin", "lactic-acidosis"],
    ["amlodipine", "edema"],
    ["metoprolol", "bradycardia"],
    ["omeprazole", "hypomagnesemia"],
    ["losartan", "hyperkalemia"],
    ["gabapentin", "somnolence"],
    ["sertraline", "serotonin-syndrome"],
    ["hydrochlorothiazide", "hyponatremia"],
    ["levothyroxine", "tachycardia"],
    ["warfarin", "hemorrhage"],
    ["fluoxetine", "suicidal-ideation"],
    ["ciprofloxacin", "tendon-rupture"],
    ["duloxetine", "withdrawal-syndrome"],
    ["prednisone", "adrenal-suppression"],
    ["furosemide", "hypokalemia"],
    ["tramadol", "seizure"],
    ["tirzepatide", "pancreatitis"],
    ["semaglutide", "pancreatitis"],
    ["acetaminophen", "hepatotoxicity"],
    ["ibuprofen", "gastrointestinal-hemorrhage"],
    ["celecoxib", "myocardial-infarction"],
    ["alprazolam", "dependence"],
    ["quetiapine", "metabolic-syndrome"],
    ["oxycodone", "respiratory-depression"],
    ["azithromycin", "qt-prolongation"],
    ["clopidogrel", "thrombotic-thrombocytopenic-purpura"],
    ["montelukast", "neuropsychiatric-events"],
    ["pregabalin", "weight-gain"],
  ];

  const signalReportPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/signal-reports`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.95,
    },
    ...SIGNAL_PAIRS.map(([drug, event]) => ({
      url: `${baseUrl}/signal-reports/${drug}/${event}`,
      lastModified: currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
  ];

  return [...corePages, ...drugPages, ...signalReportPages];
}
