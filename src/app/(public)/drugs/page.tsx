import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { TrackedLink } from "@/components/analytics/tracked-link";

export const metadata: Metadata = {
  title: "Drug Safety Profiles — Live PV Signal Detection",
  description:
    "Browse live pharmacovigilance safety profiles for 50+ drugs. Real-time adverse event data from FDA FAERS with disproportionality analysis. Powered by AlgoVigilance Station.",
  alternates: {
    canonical: "https://algovigilance.com/drugs",
  },
};

const DRUG_CATEGORIES: {
  category: string;
  drugs: { name: string; slug: string; indication: string }[];
}[] = [
  {
    category: "Diabetes & Metabolism",
    drugs: [
      { name: "Metformin", slug: "metformin", indication: "Type 2 diabetes" },
      { name: "Semaglutide", slug: "semaglutide", indication: "T2D / obesity" },
      {
        name: "Empagliflozin",
        slug: "empagliflozin",
        indication: "T2D / heart failure",
      },
      {
        name: "Sitagliptin",
        slug: "sitagliptin",
        indication: "Type 2 diabetes",
      },
      { name: "Insulin", slug: "insulin", indication: "Diabetes mellitus" },
    ],
  },
  {
    category: "Cardiovascular",
    drugs: [
      {
        name: "Atorvastatin",
        slug: "atorvastatin",
        indication: "Hyperlipidemia",
      },
      {
        name: "Lisinopril",
        slug: "lisinopril",
        indication: "Hypertension / HF",
      },
      { name: "Amlodipine", slug: "amlodipine", indication: "Hypertension" },
      { name: "Losartan", slug: "losartan", indication: "Hypertension" },
      { name: "Warfarin", slug: "warfarin", indication: "Anticoagulation" },
      { name: "Apixaban", slug: "apixaban", indication: "Anticoagulation" },
      { name: "Clopidogrel", slug: "clopidogrel", indication: "Antiplatelet" },
    ],
  },
  {
    category: "CNS & Mental Health",
    drugs: [
      {
        name: "Sertraline",
        slug: "sertraline",
        indication: "Depression / anxiety",
      },
      { name: "Escitalopram", slug: "escitalopram", indication: "Depression" },
      {
        name: "Duloxetine",
        slug: "duloxetine",
        indication: "Depression / pain",
      },
      {
        name: "Gabapentin",
        slug: "gabapentin",
        indication: "Neuropathic pain",
      },
      {
        name: "Bupropion",
        slug: "bupropion",
        indication: "Depression / smoking",
      },
      {
        name: "Trazodone",
        slug: "trazodone",
        indication: "Insomnia / depression",
      },
    ],
  },
  {
    category: "Oncology & Immunology",
    drugs: [
      {
        name: "Pembrolizumab",
        slug: "pembrolizumab",
        indication: "Multiple cancers",
      },
      {
        name: "Adalimumab",
        slug: "adalimumab",
        indication: "RA / Crohn's / psoriasis",
      },
      { name: "Rituximab", slug: "rituximab", indication: "Lymphoma / RA" },
      {
        name: "Lenalidomide",
        slug: "lenalidomide",
        indication: "Multiple myeloma",
      },
      { name: "Infliximab", slug: "infliximab", indication: "IBD / RA" },
    ],
  },
  {
    category: "Pain & Inflammation",
    drugs: [
      {
        name: "Ibuprofen",
        slug: "ibuprofen",
        indication: "Pain / inflammation",
      },
      {
        name: "Acetaminophen",
        slug: "acetaminophen",
        indication: "Pain / fever",
      },
      { name: "Aspirin", slug: "aspirin", indication: "Pain / antiplatelet" },
      { name: "Prednisone", slug: "prednisone", indication: "Inflammation" },
      { name: "Tramadol", slug: "tramadol", indication: "Moderate pain" },
    ],
  },
  {
    category: "GI & Endocrine",
    drugs: [
      { name: "Omeprazole", slug: "omeprazole", indication: "GERD / ulcers" },
      { name: "Pantoprazole", slug: "pantoprazole", indication: "GERD" },
      {
        name: "Lansoprazole",
        slug: "lansoprazole",
        indication: "GERD (Prevacid)",
      },
      {
        name: "Levothyroxine",
        slug: "levothyroxine",
        indication: "Hypothyroidism",
      },
    ],
  },
  {
    category: "Takeda Portfolio",
    drugs: [
      {
        name: "Vedolizumab",
        slug: "vedolizumab",
        indication: "Entyvio — IBD",
      },
      {
        name: "Vortioxetine",
        slug: "vortioxetine",
        indication: "Trintellix — Depression",
      },
      {
        name: "Ixazomib",
        slug: "ixazomib",
        indication: "Ninlaro — Myeloma",
      },
      {
        name: "Bortezomib",
        slug: "bortezomib",
        indication: "Velcade — Myeloma",
      },
      {
        name: "Leuprolide",
        slug: "leuprolide",
        indication: "Lupron — Prostate / endo",
      },
    ],
  },
];

export default function DrugsIndexPage() {
  const totalDrugs = DRUG_CATEGORIES.reduce(
    (sum, cat) => sum + cat.drugs.length,
    0,
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-sm text-slate-dim mb-3">
          <Link href="/" className="hover:text-cyan transition-colors">
            AlgoVigilance
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-slate-light">Drug Safety</span>
        </div>

        <h1 className="text-3xl font-bold text-slate-light mb-3">
          Drug Safety Profiles
        </h1>
        <p className="text-slate-dim max-w-2xl">
          Live pharmacovigilance data for {totalDrugs} drugs. Each profile
          queries FDA FAERS in real-time, computes disproportionality signals
          (PRR/ROR), and cross-references DailyMed labeling. Powered by{" "}
          <Link href="/station" className="text-cyan hover:underline">
            AlgoVigilance Station
          </Link>
          .
        </p>
      </div>

      {/* Categories */}
      <div className="space-y-8">
        {DRUG_CATEGORIES.map((cat) => (
          <section key={cat.category}>
            <h2 className="text-sm font-semibold text-slate-light uppercase tracking-wider mb-3">
              {cat.category}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {cat.drugs.map((drug) => (
                <Link
                  key={drug.slug}
                  href={`/drugs/${drug.slug}`}
                  className="group flex items-center justify-between rounded-lg border border-nex-border bg-nex-surface/50 px-4 py-3 transition-all hover:border-cyan/50 hover:bg-cyan/5"
                >
                  <div>
                    <span className="text-sm font-medium text-slate-light group-hover:text-cyan transition-colors">
                      {drug.name}
                    </span>
                    <span className="block text-[10px] text-slate-dim mt-0.5">
                      {drug.indication}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-dim group-hover:text-cyan transition-colors" />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Transparency Report CTA */}
      <div className="mt-12 rounded-xl border border-rose-700/30 bg-rose-950/10 p-6">
        <h3 className="text-base font-semibold text-slate-light mb-1">
          Pharma Transparency Report
        </h3>
        <p className="text-sm text-slate-dim mb-3">
          7.3 million adverse event reports across Pfizer, AbbVie, Novartis,
          J&amp;J, Eli Lilly, BMS, and a Takeda deep dive. Deaths,
          hospitalizations, recalls, off-label use — all public FDA data.
        </p>
        <Link
          href="/transparency"
          className="inline-flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-300 hover:bg-rose-500/20 transition-all"
        >
          Read the Report
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* CTA */}
      <div className="mt-6 rounded-xl border border-cyan/20 bg-cyan/5 p-6 text-center">
        <Search className="h-6 w-6 text-cyan mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-light mb-1">
          Don&apos;t see your drug?
        </h3>
        <p className="text-sm text-slate-dim mb-4">
          Any drug in FDA FAERS can be analyzed. Run a custom investigation.
        </p>
        <TrackedLink
          href="/station/demo"
          event="button_click"
          properties={{ location: "drugs_page_custom", action: "Run Custom Signal Detection" }}
          className="inline-flex items-center gap-2 rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-2 text-sm font-medium text-cyan hover:bg-cyan/20 transition-all"
        >
          Run Custom Signal Detection
          <ChevronRight className="h-4 w-4" />
        </TrackedLink>
      </div>

      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Drug Safety Profiles",
            description: `Pharmacovigilance safety profiles for ${totalDrugs} drugs`,
            url: "https://algovigilance.com/drugs",
            publisher: {
              "@type": "Organization",
              name: "AlgoVigilance",
              url: "https://algovigilance.com",
            },
          }),
        }}
      />
    </div>
  );
}
