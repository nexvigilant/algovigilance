import { createMetadata } from "@/lib/metadata";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Pill, Heart, Brain, Flame, Shield, Stethoscope, Search } from "lucide-react";
import { DrugSearchBar } from "./components/drug-search-bar";

export const metadata = createMetadata({
  title: "Drug Safety Signal Reports — AlgoVigilance",
  description:
    "Live pharmacovigilance signal detection reports for any drug. Search by drug name to see PRR, ROR, IC disproportionality analysis with regulatory verdicts.",
  path: "/signal-reports",
});

interface DrugEntry {
  drug: string;
  event: string;
  label: string;
}

interface DrugCategory {
  name: string;
  icon: string;
  color: string;
  border: string;
  bg: string;
  drugs: DrugEntry[];
}

const CATEGORIES: DrugCategory[] = [
  {
    name: "Heart & Blood Pressure",
    icon: "heart",
    color: "text-red-400",
    border: "border-red-500/20",
    bg: "bg-red-500/5",
    drugs: [
      { drug: "lisinopril", event: "angioedema", label: "Lisinopril" },
      { drug: "amlodipine", event: "edema", label: "Amlodipine" },
      { drug: "metoprolol", event: "bradycardia", label: "Metoprolol" },
      { drug: "losartan", event: "hyperkalemia", label: "Losartan" },
      { drug: "hydrochlorothiazide", event: "hyponatremia", label: "Hydrochlorothiazide" },
      { drug: "warfarin", event: "hemorrhage", label: "Warfarin" },
      { drug: "clopidogrel", event: "thrombotic-thrombocytopenic-purpura", label: "Clopidogrel" },
      { drug: "furosemide", event: "hypokalemia", label: "Furosemide" },
      { drug: "atenolol", event: "bradycardia", label: "Atenolol" },
      { drug: "diltiazem", event: "heart-block", label: "Diltiazem" },
      { drug: "valsartan", event: "hyperkalemia", label: "Valsartan" },
      { drug: "spironolactone", event: "hyperkalemia", label: "Spironolactone" },
    ],
  },
  {
    name: "Cholesterol & Metabolism",
    icon: "flame",
    color: "text-amber-400",
    border: "border-amber-500/20",
    bg: "bg-amber-500/5",
    drugs: [
      { drug: "atorvastatin", event: "rhabdomyolysis", label: "Atorvastatin" },
      { drug: "metformin", event: "lactic-acidosis", label: "Metformin" },
      { drug: "rosuvastatin", event: "rhabdomyolysis", label: "Rosuvastatin" },
      { drug: "simvastatin", event: "rhabdomyolysis", label: "Simvastatin" },
      { drug: "levothyroxine", event: "tachycardia", label: "Levothyroxine" },
      { drug: "tirzepatide", event: "pancreatitis", label: "Tirzepatide (Mounjaro)" },
      { drug: "semaglutide", event: "pancreatitis", label: "Semaglutide (Ozempic)" },
      { drug: "insulin", event: "hypoglycemia", label: "Insulin" },
      { drug: "pioglitazone", event: "heart-failure", label: "Pioglitazone" },
      { drug: "glipizide", event: "hypoglycemia", label: "Glipizide" },
    ],
  },
  {
    name: "Mental Health",
    icon: "brain",
    color: "text-violet-400",
    border: "border-violet-500/20",
    bg: "bg-violet-500/5",
    drugs: [
      { drug: "sertraline", event: "serotonin-syndrome", label: "Sertraline (Zoloft)" },
      { drug: "fluoxetine", event: "suicidal-ideation", label: "Fluoxetine (Prozac)" },
      { drug: "duloxetine", event: "withdrawal-syndrome", label: "Duloxetine (Cymbalta)" },
      { drug: "escitalopram", event: "qt-prolongation", label: "Escitalopram (Lexapro)" },
      { drug: "bupropion", event: "seizure", label: "Bupropion (Wellbutrin)" },
      { drug: "alprazolam", event: "dependence", label: "Alprazolam (Xanax)" },
      { drug: "quetiapine", event: "metabolic-syndrome", label: "Quetiapine (Seroquel)" },
      { drug: "aripiprazole", event: "akathisia", label: "Aripiprazole (Abilify)" },
      { drug: "trazodone", event: "priapism", label: "Trazodone" },
      { drug: "lithium", event: "nephrotoxicity", label: "Lithium" },
    ],
  },
  {
    name: "Pain & Inflammation",
    icon: "pill",
    color: "text-emerald-400",
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/5",
    drugs: [
      { drug: "gabapentin", event: "somnolence", label: "Gabapentin" },
      { drug: "tramadol", event: "seizure", label: "Tramadol" },
      { drug: "acetaminophen", event: "hepatotoxicity", label: "Acetaminophen (Tylenol)" },
      { drug: "ibuprofen", event: "gastrointestinal-hemorrhage", label: "Ibuprofen" },
      { drug: "naproxen", event: "gastrointestinal-hemorrhage", label: "Naproxen" },
      { drug: "celecoxib", event: "myocardial-infarction", label: "Celecoxib (Celebrex)" },
      { drug: "prednisone", event: "adrenal-suppression", label: "Prednisone" },
      { drug: "pregabalin", event: "weight-gain", label: "Pregabalin (Lyrica)" },
      { drug: "oxycodone", event: "respiratory-depression", label: "Oxycodone" },
      { drug: "meloxicam", event: "renal-failure", label: "Meloxicam" },
    ],
  },
  {
    name: "Stomach & GI",
    icon: "stethoscope",
    color: "text-cyan-400",
    border: "border-cyan-500/20",
    bg: "bg-cyan-500/5",
    drugs: [
      { drug: "omeprazole", event: "hypomagnesemia", label: "Omeprazole (Prilosec)" },
      { drug: "pantoprazole", event: "hypomagnesemia", label: "Pantoprazole (Protonix)" },
      { drug: "esomeprazole", event: "clostridium-difficile", label: "Esomeprazole (Nexium)" },
      { drug: "ondansetron", event: "qt-prolongation", label: "Ondansetron (Zofran)" },
      { drug: "ranitidine", event: "ndma-contamination", label: "Ranitidine (recalled)" },
      { drug: "loperamide", event: "cardiac-arrest", label: "Loperamide (Imodium)" },
    ],
  },
  {
    name: "Antibiotics & Infections",
    icon: "shield",
    color: "text-teal-400",
    border: "border-teal-500/20",
    bg: "bg-teal-500/5",
    drugs: [
      { drug: "ciprofloxacin", event: "tendon-rupture", label: "Ciprofloxacin (Cipro)" },
      { drug: "azithromycin", event: "qt-prolongation", label: "Azithromycin (Z-Pack)" },
      { drug: "amoxicillin", event: "anaphylaxis", label: "Amoxicillin" },
      { drug: "doxycycline", event: "esophageal-ulcer", label: "Doxycycline" },
      { drug: "levofloxacin", event: "tendon-rupture", label: "Levofloxacin (Levaquin)" },
      { drug: "nitrofurantoin", event: "pulmonary-fibrosis", label: "Nitrofurantoin" },
      { drug: "metronidazole", event: "peripheral-neuropathy", label: "Metronidazole" },
    ],
  },
  {
    name: "Respiratory",
    icon: "stethoscope",
    color: "text-sky-400",
    border: "border-sky-500/20",
    bg: "bg-sky-500/5",
    drugs: [
      { drug: "albuterol", event: "tachycardia", label: "Albuterol (ProAir)" },
      { drug: "montelukast", event: "neuropsychiatric-events", label: "Montelukast (Singulair)" },
      { drug: "fluticasone", event: "oral-candidiasis", label: "Fluticasone (Flovent)" },
      { drug: "tiotropium", event: "urinary-retention", label: "Tiotropium (Spiriva)" },
    ],
  },
];

const ICON_MAP: Record<string, typeof Heart> = {
  heart: Heart,
  flame: Flame,
  brain: Brain,
  pill: Pill,
  stethoscope: Stethoscope,
  shield: Shield,
};

export default function SignalReportsIndex() {
  const totalDrugs = CATEGORIES.reduce((sum, c) => sum + c.drugs.length, 0);

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-red-500/10 p-2.5">
            <AlertTriangle className="h-7 w-7 text-red-400" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold font-headline text-foreground">
              Drug Safety Reports
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalDrugs} drugs across {CATEGORIES.length} categories
            </p>
          </div>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          Search for any drug to see a live safety signal report. Each report queries
          20 million+ FDA adverse event reports, computes disproportionality scores,
          checks the drug label, and delivers a regulatory verdict — in seconds.
        </p>
      </div>

      {/* Search */}
      <DrugSearchBar />

      {/* Categories */}
      <div className="mt-10 space-y-8">
        {CATEGORIES.map((category) => {
          const Icon = ICON_MAP[category.icon] ?? Pill;
          return (
            <section key={category.name}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`h-4 w-4 ${category.color}`} />
                <h2 className="text-base font-semibold text-foreground">
                  {category.name}
                </h2>
                <span className="text-xs text-muted-foreground/50 ml-1">
                  {category.drugs.length} drugs
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {category.drugs.map(({ drug, event, label }) => (
                  <Link
                    key={`${drug}-${event}`}
                    href={`/signal-reports/${drug}/${event}`}
                    className={`group flex items-center justify-between rounded-lg border ${category.border} ${category.bg} px-3 py-2.5 hover:bg-white/[0.06] hover:border-white/[0.15] transition-all`}
                  >
                    <span className="text-xs text-foreground/70 group-hover:text-foreground transition-colors truncate">
                      {label}
                    </span>
                    <ArrowRight className="h-3 w-3 shrink-0 ml-1 text-muted-foreground/20 group-hover:text-foreground/50 transition-colors" />
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* How it works */}
      <div className="mt-12 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
        <h2 className="text-base font-semibold text-foreground mb-4">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { step: "1", title: "Pick a Drug", desc: "Search or browse by category. Every drug on the market is supported." },
            { step: "2", title: "See Live Data", desc: "Report queries FDA FAERS, OpenVigil, DailyMed, and PubMed in real time." },
            { step: "3", title: "Get the Verdict", desc: "PRR/ROR disproportionality, label status, literature, and regulatory action — all in one page." },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-3">
              <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.05] text-sm font-bold text-foreground/60">
                {step}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 rounded-lg border border-violet-500/20 bg-violet-500/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-violet-400 mb-1">
            Powered by AlgoVigilance Station
          </p>
          <p className="text-[10px] text-white/40">
            1,961 tools | mcp.nexvigilant.com | ICH E2B(R3) | GVP Module IX | 21 CFR 314.80 | Evans (2001)
          </p>
        </div>
        <a
          href="https://mcp.nexvigilant.com/health"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-medium text-violet-300 hover:bg-violet-500/20 transition-colors"
        >
          Station Health
        </a>
      </div>
    </div>
  );
}
