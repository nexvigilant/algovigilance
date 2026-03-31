import { GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHero } from "@/components/marketing/page-hero";
import { AmbassadorForm } from "./ambassador-form";
import { createMetadata } from "@/lib/metadata";
import { AmbassadorBenefitCards } from "../components/benefit-cards";

export const metadata = createMetadata({
  title: "Ambassador Program",
  description:
    "Join the AlgoVigilance Ambassador Program. For students and early-career professionals looking to build their network and accelerate their pharmaceutical industry career.",
  path: "/grow/ambassador",
});

export default function AmbassadorPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="container mx-auto px-4 md:px-6 pt-8">
        <PageHero
          title="Ambassador Program"
          description="For students, recent graduates, and early-career professionals (0-2 years) ready to build their network, develop their skills, and accelerate their pharmaceutical industry career."
          icon={
            <GraduationCap
              className="w-10 h-10 md:w-12 md:h-12 text-cyan"
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
              <p className="text-lg font-mono uppercase tracking-widest text-cyan/80 mb-2">
                Program Capabilities
              </p>
              <h2 className="text-2xl font-headline font-bold text-white mb-4 uppercase tracking-wide">
                Ambassador Benefits
              </h2>
              <p className="text-slate-dim mb-6">
                As an Ambassador, you&apos;ll have primary access to
                opportunities that accelerate your career in pharmaceutical
                safety.
              </p>
            </div>

            <AmbassadorBenefitCards />

            {/* Who Should Apply */}
            <Card className="bg-nex-dark/50 border-nex-light/30">
              <CardContent className="p-6">
                <h3 className="font-semibold text-slate-light mb-4">
                  Who Should Apply?
                </h3>
                <ul className="space-y-2 text-sm text-slate-dim">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan" />
                    Pharmacy or healthcare students
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan" />
                    Recent graduates (within 2 years)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan" />
                    Fellowship or residency candidates
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan" />
                    Entry-level professionals (0-2 years FTE)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan" />
                    Anyone interested in pharmaceutical safety
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Application Form - Right Column */}
          <div className="lg:col-span-3">
            <Card className="bg-nex-surface/90 backdrop-blur-sm border-cyan/30">
              <CardContent className="p-6 md:p-8">
                <p className="text-lg font-mono uppercase tracking-widest text-cyan/80 mb-2">
                  Application Protocol
                </p>
                <h2 className="text-2xl font-headline font-bold text-white mb-2 uppercase tracking-wide">
                  Apply Now
                </h2>
                <p className="text-slate-dim mb-6">
                  Complete the form below to apply for the Ambassador Program.
                  We review applications on a rolling basis.
                </p>
                <AmbassadorForm />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
