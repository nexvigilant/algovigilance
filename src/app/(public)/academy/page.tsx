import Link from "next/link";
import {
  GraduationCap,
  Award,
  CheckCircle,
  TrendingUp,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHero } from "@/components/marketing";
import { capabilityPathways } from "@/data/academy-pathways";
import { RELEASE_STATUS, formatLaunchStatus } from "@/data/launch-timeline";
import { createMetadata, getBaseUrl } from "@/lib/metadata";
import {
  ACADEMY_HERO,
  VALUE_PROP_SECTION,
  ACCESS_PROTOCOL_SECTION,
  PATHWAYS_SECTION,
  PLATFORM_SECTION,
  PHARMA_ADVANTAGE,
  CAPABILITY_VERIFICATION,
  CTA_SECTION,
  INDEPENDENCE_STATEMENT,
} from "@/data/academy-content";

export const metadata = createMetadata({
  title: "Academy",
  description:
    "Competency-based education and validated certifications bridging clinical practice and industry requirements.",
  path: "/academy",
});

export default function AcademyPage() {
  const BASE_URL = getBaseUrl();

  return (
    <div
      className="container mx-auto px-4 py-12 md:px-6"
      data-testid="academy-page"
    >
      {/* Hero Section */}
      <PageHero
        title={ACADEMY_HERO.title}
        icon={
          <GraduationCap
            className="w-10 h-10 md:w-12 md:h-12 text-cyan"
            aria-hidden="true"
          />
        }
        className="mb-golden-3"
      >
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            size="lg"
            className="bg-cyan text-nex-dark hover:bg-cyan/90 font-semibold touch-target"
          >
            <Link href={ACADEMY_HERO.ctaPrimaryHref}>
              {ACADEMY_HERO.ctaPrimary}
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-nex-light text-slate-dim hover:text-slate-light hover:border-gold/50 touch-target"
          >
            <Link href={ACADEMY_HERO.ctaSecondaryHref}>
              {ACADEMY_HERO.ctaSecondary}
            </Link>
          </Button>
        </div>
      </PageHero>

      {/* Value Proposition */}
      <section className="py-12">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-gold uppercase tracking-wide">
            {VALUE_PROP_SECTION.title}
          </h2>
        </div>
      </section>

      {/* Included with Membership */}
      <section className="py-12">
        <div className="container mx-auto max-w-4xl">
          <Card className="holographic-card border-white/[0.12] bg-white/[0.06] p-8 text-center">
            <h2 className="text-3xl md:text-4xl font-headline font-bold mb-6 text-gold uppercase tracking-wide">
              {ACCESS_PROTOCOL_SECTION.title}
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {ACCESS_PROTOCOL_SECTION.features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-2 text-slate-dim"
                >
                  <CheckCircle
                    className="h-5 w-5 text-cyan"
                    aria-hidden="true"
                  />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* Course Categories */}
      <section className="py-12">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-headline font-bold text-gold uppercase tracking-wide">
              {PATHWAYS_SECTION.title}
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilityPathways.map((pathway) => {
              const isAvailable =
                pathway.status === RELEASE_STATUS.AT_LAUNCH ||
                pathway.status === RELEASE_STATUS.AVAILABLE;

              return (
                <Card
                  key={pathway.id}
                  className="holographic-card border-white/[0.12] bg-white/[0.06] flex flex-col h-full text-center group"
                >
                  <CardHeader className="flex-1 flex flex-col">
                    <h3 className="text-xl font-semibold leading-none tracking-tight text-slate-light min-h-[56px] flex items-center justify-center">
                      {pathway.title}
                    </h3>
                    <CardDescription className="text-slate-dim text-center flex-1">
                      {pathway.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    {/* Status badge - consistent height */}
                    <p
                      className={`text-sm font-semibold h-5 ${isAvailable ? "text-cyan" : "text-gold"}`}
                    >
                      {formatLaunchStatus(pathway.status)}
                    </p>
                    {/* Action link - accessible touch target */}
                    <div className="touch-target flex items-center justify-center">
                      {isAvailable ? (
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="text-cyan hover:text-cyan/80 touch-target"
                        >
                          <Link
                            href={`/nucleus/academy/pathways/${pathway.slug}`}
                          >
                            Start Building →
                          </Link>
                        </Button>
                      ) : pathway.hasWaitlist ? (
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="text-gold hover:text-gold/80 touch-target"
                        >
                          <Link href={`/membership?notify=${pathway.id}`}>
                            <Bell className="h-4 w-4 mr-1" aria-hidden="true" />
                            Notify Me
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Platform Comparison */}
      <section className="py-12">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4 text-gold uppercase tracking-wide">
              {PLATFORM_SECTION.title}
            </h2>
          </div>

          {/* Unique Value Proposition */}
          <Card className="bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-gold-500/10 border-2 border-cyan-500/30">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-gold-500 flex items-center justify-center">
                <GraduationCap
                  className="h-10 w-10 text-white"
                  aria-hidden="true"
                />
              </div>
              <CardTitle className="text-2xl mb-2 text-slate-light">
                {PHARMA_ADVANTAGE.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {PHARMA_ADVANTAGE.columns.map((column) => {
                  const IconComponent =
                    column.variant === "cyan" ? Award : TrendingUp;
                  const colorClass =
                    column.variant === "cyan"
                      ? "text-cyan-500"
                      : "text-gold-500";
                  return (
                    <div key={column.title}>
                      <h3 className="font-semibold mb-3 flex items-center gap-2 text-slate-light">
                        <IconComponent
                          className={`h-5 w-5 ${colorClass}`}
                          aria-hidden="true"
                        />
                        {column.title}
                      </h3>
                      <ul className="space-y-2 text-sm text-slate-dim">
                        {column.items.map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <CheckCircle
                              className={`h-4 w-4 ${colorClass} mt-0.5 flex-shrink-0`}
                              aria-hidden="true"
                            />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-6 border-t border-white/[0.08] text-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-cyan text-nex-dark hover:bg-cyan/90 font-semibold touch-target"
                >
                  <Link href={PHARMA_ADVANTAGE.ctaHref}>
                    {PHARMA_ADVANTAGE.ctaText}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Capability Verification */}
      <section className="py-12">
        <div className="container mx-auto max-w-4xl">
          <Card className="holographic-card p-8 border-white/[0.12] bg-white/[0.06]">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <Award
                className="h-24 w-24 text-cyan flex-shrink-0"
                aria-hidden="true"
              />
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold mb-4 text-slate-light">
                  {CAPABILITY_VERIFICATION.title}
                </h3>
                <p className="text-slate-dim mb-4">
                  {CAPABILITY_VERIFICATION.description}{" "}
                  <span className="text-cyan">
                    {BASE_URL}
                    {CAPABILITY_VERIFICATION.verifyPathSuffix}
                  </span>
                  . This is the new standard for proving competency to employers
                  and auditors.
                </p>
                <p className="text-sm text-slate-dim">
                  Example:{" "}
                  <Link
                    href={CAPABILITY_VERIFICATION.examplePath}
                    className="text-cyan hover:underline"
                  >
                    {BASE_URL}
                    {CAPABILITY_VERIFICATION.examplePath}
                  </Link>
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12">
        <div className="container mx-auto max-w-4xl">
          <Card className="holographic-card border-white/[0.12] bg-white/[0.06] p-8 text-center">
            <h2 className="text-3xl md:text-4xl font-headline font-bold mb-6 text-gold uppercase tracking-wide">
              {CTA_SECTION.title}
            </h2>
            <div className="flex justify-center">
              <Button
                asChild
                size="lg"
                className="bg-cyan text-nex-dark hover:bg-cyan/90 font-semibold touch-target"
              >
                <Link href={CTA_SECTION.ctaHref}>{CTA_SECTION.ctaText}</Link>
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Independence Statement */}
      <section className="py-12">
        <div className="container mx-auto max-w-3xl text-center">
          <p className="font-semibold mb-2 text-slate-light">
            {INDEPENDENCE_STATEMENT.title}
          </p>
          <p className="text-sm text-slate-dim">
            {INDEPENDENCE_STATEMENT.description}
          </p>
        </div>
      </section>
    </div>
  );
}
