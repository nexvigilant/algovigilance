import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import { resolveCompany, PHARMA_COMPANIES } from "../lib/company-registry";
import { PortfolioSection } from "./components/portfolio-section";
import { PipelineSection } from "./components/pipeline-section";
import { SafetySection } from "./components/safety-section";
import { ActivitySection } from "./components/activity-section";

interface PageParams {
  company: string;
}

export function generateStaticParams() {
  return Object.keys(PHARMA_COMPANIES).map((key) => ({ company: key }));
}

export function generateMetadata({ params }: { params: PageParams }) {
  const company = resolveCompany(params.company);
  if (!company) {
    return { title: "Company Not Found | AlgoVigilance" };
  }
  return {
    title: `${company.name} — Portfolio, Pipeline & Safety | AlgoVigilance`,
    description: `${company.description}. Explore approved products, clinical pipeline, FAERS safety profile, and recent regulatory activity.`,
  };
}

export default function CompanyPage({ params }: { params: PageParams }) {
  const company = resolveCompany(params.company);

  if (!company) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[10px] font-mono text-slate-dim/40">
        <Link
          href="/nucleus/vigilance/pharma"
          className="flex items-center gap-1 hover:text-slate-dim/70 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Pharma Intelligence
        </Link>
        <span>/</span>
        <span className="text-slate-dim/60">{company.name}</span>
      </nav>

      {/* Company header */}
      <header className="border border-white/[0.10] bg-white/[0.03] p-4">
        <div className="flex items-start gap-4">
          {/* Letter avatar */}
          <div className="flex-shrink-0 w-12 h-12 border border-cyan/30 bg-cyan/10 flex items-center justify-center text-lg font-bold font-mono text-cyan">
            {company.name.charAt(0)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="intel-status-active" />
              <span className="intel-label">
                Pharma Intelligence / {params.company.toUpperCase()}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold font-headline text-white tracking-tight leading-tight">
              {company.name}
            </h1>
            <p className="text-sm text-slate-dim/60 mt-1">
              {company.description}
            </p>

            {/* Therapeutic area tags */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {company.therapeuticAreas.map((area) => (
                <span
                  key={area}
                  className="text-[9px] font-mono px-2 py-0.5 border border-white/[0.10] bg-white/[0.04] text-slate-dim/60"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Section 1: Product Portfolio */}
      <PortfolioSection
        companyKey={params.company}
        companyName={company.name}
      />

      {/* Section 2: Clinical Pipeline */}
      <PipelineSection companyKey={params.company} companyName={company.name} />

      {/* Section 3: Safety Dashboard */}
      <SafetySection companyKey={params.company} companyName={company.name} />

      {/* Section 4: Recent Activity */}
      <ActivitySection companyKey={params.company} companyName={company.name} />

      {/* Footer */}
      <div className="border border-white/[0.06] bg-white/[0.01] px-4 py-3 flex flex-wrap gap-4 justify-between items-center">
        <div className="flex items-center gap-2">
          <Building2 className="h-3 w-3 text-slate-dim/30" />
          <span className="intel-label">
            AlgoVigilance Pharma Intelligence / {company.name}
          </span>
        </div>
        <div className="flex flex-wrap gap-4 text-[9px] font-mono text-slate-dim/30">
          <span>Portfolio: DailyMed / SEC filings</span>
          <span>|</span>
          <span>Pipeline: ClinicalTrials.gov</span>
          <span>|</span>
          <span>Safety: FDA FAERS</span>
          <span>|</span>
          <span>Activity: OpenFDA Recalls + DailyMed Changes</span>
        </div>
      </div>
    </div>
  );
}
