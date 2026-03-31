import { Briefcase } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHero } from "@/components/marketing/page-hero";
import { AdvisorForm } from "./advisor-form";
import { createMetadata } from "@/lib/metadata";
import { advisorVsConsultantSimple } from "@/data/affiliate-programs";
import { AdvisorBenefitCards } from "../components/benefit-cards";

export const metadata = createMetadata({
  title: "Advisor Program",
  description:
    "Join the AlgoVigilance Advisor Program. For experienced professionals (2+ years) looking to share expertise, mentor others, and build their advisory and consulting practice.",
  path: "/grow/advisor",
});

export default function AdvisorPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="container mx-auto px-4 md:px-6 pt-8">
        <PageHero
          title="Advisor Program"
          description="For experienced professionals (2+ years FTE) with subject matter expertise who want to share knowledge, mentor others, and build their advisory and consulting practice."
          icon={
            <Briefcase
              className="w-10 h-10 md:w-12 md:h-12 text-gold"
              aria-hidden="true"
            />
          }
          size="default"
        />
      </section>

      <div className="container mx-auto px-4 md:px-6 pb-16">
        <div className="grid lg:grid-cols-5 gap-12 max-w-7xl mx-auto">
          {/* Benefits Section - Left Column */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <p className="text-lg font-mono uppercase tracking-widest text-gold/80 mb-2">
                Strategic Capabilities
              </p>
              <h2 className="text-2xl font-headline font-bold text-white mb-4 uppercase tracking-wide">
                Advisor Benefits
              </h2>
              <p className="text-slate-dim mb-6">
                As an Advisor, you&apos;ll have primary access to advising,
                consulting, and leadership opportunities while contributing to
                the next generation of pharmaceutical safety professionals.
              </p>
            </div>

            <AdvisorBenefitCards />

            {/* Advisor vs Consultant */}
            <Card className="bg-nex-dark/50 border-nex-light/30">
              <CardContent className="p-6">
                <h3 className="font-semibold text-slate-light mb-4">
                  Advisor vs. Consultant
                </h3>
                <p className="text-sm text-slate-dim mb-4">
                  Advisors start with strategic guidance roles and can progress
                  to consulting as they deepen their engagement.
                </p>
                <div className="space-y-3">
                  {advisorVsConsultantSimple.map((row) => (
                    <div
                      key={row.dimension}
                      className="grid grid-cols-3 gap-2 text-xs"
                    >
                      <span className="text-slate-dim font-medium">
                        {row.dimension}
                      </span>
                      <span className="text-gold/80">{row.advisor}</span>
                      <span className="text-cyan/80">{row.consultant}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Who Should Apply */}
            <Card className="bg-nex-dark/50 border-nex-light/30">
              <CardContent className="p-6">
                <h3 className="font-semibold text-slate-light mb-4">
                  Who Should Apply?
                </h3>
                <ul className="space-y-2 text-sm text-slate-dim">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                    Professionals with 2+ years FTE experience
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                    Subject matter experts in PV/Drug Safety
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                    Aspiring consultants and advisors
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                    Those seeking mentorship opportunities
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                    Leaders looking to give back
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Application Form - Right Column */}
          <div className="lg:col-span-3">
            <Card className="bg-nex-surface/90 backdrop-blur-sm border-gold/30">
              <CardContent className="p-6 md:p-8">
                <p className="text-lg font-mono uppercase tracking-widest text-gold/80 mb-2">
                  Application Protocol
                </p>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-headline font-bold text-white uppercase tracking-wide">
                    Apply Now
                  </h2>
                  <Badge className="bg-gold/20 text-gold border-gold/30">
                    2+ Years Required
                  </Badge>
                </div>
                <p className="text-slate-dim mb-6">
                  Complete the form below to apply for the Advisor Program.
                  Applications are reviewed on a rolling basis with priority
                  given to experienced professionals.
                </p>
                <AdvisorForm />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
