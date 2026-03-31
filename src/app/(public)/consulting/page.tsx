import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Radar,
  User,
  Building2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AnimatedStaggerContainer,
  AnimatedStaggerItem,
} from "@/components/ui/animated-stagger";
import { Differentiators } from "./differentiators";
import { ConsultingInquiryForm } from "@/app/(public)/contact/consulting-inquiry-form";
import { createMetadata } from "@/lib/metadata";
import {
  SERVICE_AREAS,
  DIFFERENTIATORS,
  ENGAGEMENT_PROTOCOL,
  CONSULTING_ROUTES,
  INQUIRY_SOURCES,
} from "@/data/consulting";
import {
  CONSULTING_HERO,
  SERVICE_DISCOVERY_CTA,
  ENGAGEMENT_SECTION,
  CONTACT_CTA,
  QUICK_CHAT,
} from "@/data/consulting-content";

export const metadata = createMetadata({
  title: "Vigilance Consulting",
  description:
    "Independent vigilance consulting. We help you build stronger safety operations — with clinical expertise, no conflicts, and a focus on outcomes.",
  path: "/consulting",
});

export default function ConsultingPage() {
  return (
    <div className="min-h-screen bg-nex-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan/5 via-transparent to-transparent" />
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-12">
            <Badge className="mb-6 bg-cyan/10 text-cyan border-cyan/30">
              <Sparkles className="h-3 w-3 mr-1.5" aria-hidden="true" />
              {CONSULTING_HERO.badge}
            </Badge>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-headline font-bold text-white mb-6"
              style={{ lineHeight: 1.15 }}
            >
              {CONSULTING_HERO.title}
            </h1>
          </div>

          {/* Service Areas Visual */}
          <AnimatedStaggerContainer
            className="flex flex-wrap justify-center items-center gap-3 md:gap-4 mt-12 mb-8"
            role="list"
            aria-label="Our service areas"
            delay={0.2}
          >
            {SERVICE_AREAS.map((area, index) => (
              <AnimatedStaggerItem
                key={area.label}
                className="flex items-center gap-3 md:gap-4"
                role="listitem"
              >
                <div className="flex flex-col items-center">
                  <div className="h-12 w-12 rounded-full bg-white/[0.06] flex items-center justify-center mb-2 border border-white/[0.12]">
                    <area.icon
                      className={`h-6 w-6 ${area.color}`}
                      aria-hidden="true"
                    />
                  </div>
                  <span className="text-xs uppercase tracking-wider text-slate-dim">
                    {area.label}
                  </span>
                </div>
                {index < SERVICE_AREAS.length - 1 && (
                  <ArrowRight
                    className="h-4 w-4 text-slate-dim/50 hidden md:block"
                    aria-hidden="true"
                  />
                )}
              </AnimatedStaggerItem>
            ))}
          </AnimatedStaggerContainer>

          {/* Primary CTA */}
          <div className="flex justify-center">
            <Button
              asChild
              size="lg"
              className="bg-cyan text-nex-deep hover:bg-cyan-glow font-semibold px-8"
            >
              <Link
                href={CONSULTING_ROUTES.services}
                aria-label="Begin Discovery - explore our services"
              >
                <Sparkles className="mr-2 h-5 w-5" aria-hidden="true" />
                {CONSULTING_HERO.ctaText}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Differentiators */}
      <section className="py-12 px-4 border-y border-white/[0.08] bg-white/[0.03]">
        <div className="container mx-auto max-w-6xl">
          <Differentiators />
        </div>
      </section>

      {/* Service Discovery CTA */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="p-8 md:p-12 rounded-2xl bg-gradient-to-br from-cyan/10 via-white/[0.04] to-white/[0.04] border border-cyan/30 text-center">
            <Radar
              className="h-10 w-10 text-cyan mx-auto mb-6"
              aria-hidden="true"
            />
            <h2 className="text-2xl md:text-3xl font-headline font-bold text-white mb-6">
              {SERVICE_DISCOVERY_CTA.title}
            </h2>
            <Button
              asChild
              size="lg"
              className="bg-cyan text-nex-deep hover:bg-cyan-glow font-semibold px-8"
            >
              <Link
                href={CONSULTING_ROUTES.services}
                aria-label="Get a recommendation - answer a few questions about your needs"
              >
                {SERVICE_DISCOVERY_CTA.ctaText}
                <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Engagement Protocol */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-headline font-bold text-white uppercase tracking-wide">
              {ENGAGEMENT_SECTION.title}
            </h2>
          </div>

          <AnimatedStaggerContainer
            className="space-y-6"
            // We use 'as="ol"' logic if needed, but since we can't easily pass it here, we'll keep the outer div and inner ol
          >
            <ol
              className="space-y-6"
              role="list"
              aria-label="Engagement protocol steps"
            >
              {ENGAGEMENT_PROTOCOL.map((item, index) => (
                <AnimatedStaggerItem
                  key={item.step}
                  className="flex gap-6 p-6 rounded-xl bg-white/[0.06] border border-white/[0.12]"
                >
                  <li className="flex gap-6 w-full">
                    <div className="flex-shrink-0">
                      <span
                        className="text-3xl font-mono font-bold text-cyan/50"
                        aria-hidden="true"
                      >
                        {item.step}
                      </span>
                      <span className="sr-only">Step {index + 1}:</span>
                    </div>
                    <h3 className="text-xl font-semibold text-white">
                      {item.title}
                    </h3>
                  </li>
                </AnimatedStaggerItem>
              ))}
            </ol>
          </AnimatedStaggerContainer>
        </div>
      </section>

      {/* CTA Section with Form */}
      <section className="py-20 px-4" id="inquiry">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-headline font-bold text-white uppercase tracking-wide">
              {CONTACT_CTA.title}
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Quick Contact Option */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-cyan/10 via-white/[0.04] to-white/[0.04] border border-cyan/30 h-full flex flex-col justify-center">
              <h3 className="text-2xl font-headline font-bold text-white mb-4">
                {QUICK_CHAT.title}
              </h3>
              <ul className="space-y-3 mb-8">
                {QUICK_CHAT.promises.map((promise) => (
                  <li
                    key={promise}
                    className="flex items-center gap-3 text-slate-light"
                  >
                    <CheckCircle2
                      className="h-5 w-5 text-cyan flex-shrink-0"
                      aria-hidden="true"
                    />
                    <span>{promise}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-cyan text-nex-deep hover:bg-cyan/90"
                >
                  <Link href={CONSULTING_ROUTES.schedule}>
                    Book a Call
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-cyan text-cyan hover:bg-cyan/10"
                >
                  <Link
                    href={`${CONSULTING_ROUTES.contact}?source=${encodeURIComponent(INQUIRY_SOURCES.CONSULTING_PAGE)}`}
                  >
                    General Inquiry
                  </Link>
                </Button>
              </div>
            </div>

            {/* Detailed Inquiry Form with Improved Skeleton */}
            <Suspense fallback={<FormSkeleton />}>
              <ConsultingInquiryForm source={INQUIRY_SOURCES.CONSULTING_PAGE} />
            </Suspense>
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * Form skeleton that matches the actual form layout.
 * Prevents layout shift when the form loads.
 */
function FormSkeleton() {
  return (
    <div
      className="rounded-xl bg-white/[0.06] border border-white/[0.12] animate-pulse"
      role="status"
      aria-busy="true"
      aria-label="Loading consultation inquiry form"
    >
      {/* Header */}
      <div className="p-6 border-b border-nex-border">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-cyan/10">
            <Building2 className="h-5 w-5 text-cyan/30" aria-hidden="true" />
          </div>
          <div className="h-6 bg-nex-light rounded w-48" />
        </div>
        <div className="h-4 bg-nex-light rounded w-full mt-3" />
      </div>

      {/* Progress Indicator */}
      <div className="px-6 pt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="h-3 bg-nex-light rounded w-24" />
          <div className="h-3 bg-nex-light rounded w-16" />
        </div>
        <div className="flex items-center gap-2 mb-6">
          {[User, Building2, FileText].map((Icon, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-nex-dark">
                <Icon
                  className="h-3.5 w-3.5 text-slate-dim/50"
                  aria-hidden="true"
                />
                <div className="h-3 bg-nex-light rounded w-12" />
              </div>
              {idx < 2 && (
                <ArrowRight
                  className="h-3 w-3 text-slate-dim/30"
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Fields */}
      <div className="p-6 pt-0 space-y-6">
        {/* Section Header */}
        <div className="h-4 bg-nex-light rounded w-32" />

        {/* Two Column Fields - Responsive to match form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-4 bg-nex-light rounded w-20" />
            <div className="h-10 bg-nex-dark rounded border border-nex-border" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-nex-light rounded w-20" />
            <div className="h-10 bg-nex-dark rounded border border-nex-border" />
          </div>
        </div>

        {/* Single Column Fields */}
        <div className="space-y-2">
          <div className="h-4 bg-nex-light rounded w-24" />
          <div className="h-10 bg-nex-dark rounded border border-nex-border" />
        </div>

        {/* Textarea */}
        <div className="space-y-2">
          <div className="h-4 bg-nex-light rounded w-28" />
          <div className="h-24 bg-nex-dark rounded border border-nex-border" />
        </div>

        {/* Submit Button */}
        <div className="h-10 bg-cyan/20 rounded w-full" />
      </div>

      {/* Screen reader loading text */}
      <span className="sr-only">Loading form, please wait...</span>
    </div>
  );
}
