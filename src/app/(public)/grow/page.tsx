import Link from "next/link";
import { TrendingUp, ArrowRight, CheckCircle } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { createMetadata } from "@/lib/metadata";
import { PageHero } from "@/components/marketing/page-hero";
import { CareerPathway } from "./components/career-pathway";
import { AffiliatePerks } from "./components/affiliate-perks";
import { affiliatePrograms } from "@/data/affiliate-programs";

export const metadata = createMetadata({
  title: "Grow With Us",
  description:
    "Join AlgoVigilance as an Ambassador or Advisor. Build your career pathway from advisory roles to consulting to fractional executive leadership.",
  path: "/grow",
});

export default function GrowPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="container mx-auto px-4 md:px-6 pt-8">
        <PageHero
          title="Grow With Us"
          icon={
            <TrendingUp
              className="w-10 h-10 md:w-12 md:h-12 text-cyan"
              aria-hidden="true"
            />
          }
          size="lg"
        />
      </section>

      {/* Program Comparison Section */}
      <section className="container mx-auto px-4 md:px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-headline font-bold text-white uppercase tracking-wide">
            Choose Your Program
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {affiliatePrograms.map((program) => (
            <Card
              key={program.id}
              className={cn(
                "relative flex flex-col holographic-card bg-nex-surface/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1",
                program.featured
                  ? "border-gold/50 ring-2 ring-gold/20 hover:border-gold hover:ring-gold/30"
                  : "border-nex-light hover:border-cyan/50",
              )}
            >
              {program.featured && (
                <Badge className="absolute -top-3 right-4 bg-nex-surface border-gold/50 text-gold text-xs shadow-md">
                  Most Popular
                </Badge>
              )}

              <CardHeader>
                <div className="flex items-center gap-4 mb-2">
                  <div
                    className={cn(
                      "p-3 rounded-xl border",
                      program.accentColor === "gold"
                        ? "bg-gold/10 border-gold/30"
                        : "bg-cyan/10 border-cyan/30",
                    )}
                  >
                    <program.icon
                      className={cn(
                        "h-8 w-8",
                        program.accentColor === "gold"
                          ? "text-gold"
                          : "text-cyan",
                      )}
                    />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-slate-light">
                      {program.title}
                    </CardTitle>
                    <p
                      className={cn(
                        "text-sm font-medium",
                        program.accentColor === "gold"
                          ? "text-gold/80"
                          : "text-cyan/80",
                      )}
                    >
                      {program.subtitle}
                    </p>
                  </div>
                </div>
                {/* Description intentionally omitted — let features speak */}
              </CardHeader>

              <CardContent className="flex-1 space-y-6">
                {/* Features */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-light mb-3">
                    Program Benefits
                  </h4>
                  <ul className="space-y-2">
                    {program.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm text-slate-dim"
                      >
                        <CheckCircle
                          className={cn(
                            "h-4 w-4 mt-0.5 shrink-0",
                            program.accentColor === "gold"
                              ? "text-gold"
                              : "text-cyan",
                          )}
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  asChild
                  className={cn(
                    "w-full group",
                    program.accentColor === "gold"
                      ? "bg-gold hover:bg-gold-bright text-nex-deep"
                      : "bg-cyan hover:bg-cyan-glow text-nex-deep",
                  )}
                >
                  <Link href={program.href}>
                    {program.cta}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Career Pathway Section */}
      <section className="bg-nex-dark/50 border-y border-nex-light/20">
        <div className="container mx-auto px-4 md:px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-headline font-bold text-white uppercase tracking-wide">
              Your Career Pathway
            </h2>
          </div>
          <CareerPathway />
          <div className="text-center mt-8">
            <Button
              asChild
              variant="outline"
              className="border-cyan/50 text-cyan hover:bg-cyan/10 touch-target"
            >
              <Link href="/grow/pathway">
                Explore Full Pathway Details
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Perks Section */}
      <section className="container mx-auto px-4 md:px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-headline font-bold text-white uppercase tracking-wide">
            Affiliate Benefits
          </h2>
        </div>
        <AffiliatePerks />
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-b from-nex-dark/50 to-nex-deep border-t border-nex-light/20">
        <div className="container mx-auto px-4 md:px-6 py-16 text-center">
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-cyan hover:bg-cyan-glow text-nex-deep touch-target"
            >
              <Link href="/grow/ambassador">Apply as Ambassador</Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="bg-gold hover:bg-gold-bright text-nex-deep touch-target"
            >
              <Link href="/grow/advisor">Apply as Advisor</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
