import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { FAQSchema } from "@/components/shared/seo";
import { createMetadata } from "@/lib/metadata";
import { membershipFAQs } from "@/data/membership";
import {
  MEMBERSHIP_HERO,
  FAQ_SECTION,
  FOUNDING_MEMBER_DISCLAIMER,
  PSPV_TIERS,
} from "@/data/membership-content";

export const metadata = createMetadata({
  title: "PSPV Membership — Professional Society of Pharmacovigilance",
  description:
    "Join the first professional society for PV practitioners. Founding membership with lifetime status. KSB competency tracking, verifiable portfolios, live tool access.",
  path: "/membership",
});

export default function MembershipPage() {
  return (
    <>
      <FAQSchema faqs={membershipFAQs} />
      <div className="min-h-screen bg-nex-background">
        {/* Open Beta Banner */}
        <div className="border-b border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-center">
          <p className="text-sm text-emerald-400">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse mr-2 align-middle" />
            <strong>AlgoVigilance portal access is free.</strong>{" "}
            <Link href="/auth/signup" className="underline hover:text-emerald-300">
              Sign up at no cost
            </Link>{" "}
            — no credit card, no waitlist. PSPV membership below is the professional society (optional).
          </p>
        </div>

        {/* Hero Section */}
        <section className="relative py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-gold/5 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.1),transparent_70%)]" />

          <div className="container mx-auto max-w-4xl relative z-10">
            <div className="text-center mb-4">
              <p className="text-sm font-medium text-cyan uppercase tracking-widest mb-4">
                {MEMBERSHIP_HERO.label}
              </p>
              <h1
                className="text-3xl md:text-4xl lg:text-5xl font-headline font-bold text-white mb-6"
                style={{
                  textShadow:
                    "0 0 40px rgba(212, 175, 55, 0.3), 0 2px 4px rgba(0, 0, 0, 0.8)",
                  lineHeight: 1.15,
                }}
              >
                {MEMBERSHIP_HERO.title}
              </h1>
              <p className="text-lg text-slate-dim max-w-2xl mx-auto">
                {MEMBERSHIP_HERO.description}
              </p>
              <p className="text-sm text-gold mt-3">
                {MEMBERSHIP_HERO.subdescription}
              </p>
            </div>
          </div>
        </section>

        {/* The Void Section */}
        <section className="py-12 px-4 border-t border-white/[0.08]">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-2xl font-headline font-bold text-white text-center mb-8">
              The Void in Professional PV
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                {
                  org: "ISoP",
                  serves: "Academic researchers",
                  gap: "No practitioner tools. No AI. No beginners.",
                },
                {
                  org: "DIA",
                  serves: "Industry executives",
                  gap: "PV is a side topic. Conference-driven.",
                },
                {
                  org: "RAPS",
                  serves: "Regulatory specialists",
                  gap: "PV tangential. Certification-only.",
                },
                {
                  org: "Institute of PV",
                  serves: "Training seekers",
                  gap: "Not a society. No community.",
                },
              ].map((item) => (
                <div
                  key={item.org}
                  className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-4"
                >
                  <h3 className="font-semibold text-white">{item.org}</h3>
                  <p className="text-sm text-slate-dim">
                    Serves: {item.serves}
                  </p>
                  <p className="text-sm text-red-400 mt-1">Gap: {item.gap}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-slate-dim mt-6 text-sm">
              The 50,000+ people who DO pharmacovigilance daily have no
              professional home. Until now.
            </p>
          </div>
        </section>

        {/* Tier Cards */}
        <section className="py-16 px-4 border-t border-white/[0.08]">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-2xl font-headline font-bold text-white text-center mb-4 uppercase tracking-wide">
              Founding Membership Tiers
            </h2>
            <p className="text-center text-slate-dim mb-12 text-sm">
              Free public access to triple fact-checked intelligence at{" "}
              <Link href="/" className="text-cyan hover:text-cyan-glow">
                nexvigilant.com
              </Link>
              . Paid tiers unlock the full PSPV experience.
            </p>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {PSPV_TIERS.map((tier) => (
                <div
                  key={tier.name}
                  className={`relative flex flex-col rounded-xl border p-6 ${
                    tier.highlighted
                      ? "border-gold bg-gold/[0.05] ring-1 ring-gold/30"
                      : "border-white/[0.08] bg-white/[0.03]"
                  }`}
                >
                  {tier.highlighted && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold px-3 py-0.5 text-xs font-semibold text-nex-deep uppercase tracking-wider">
                      Most Popular
                    </span>
                  )}
                  <h3 className="font-headline text-lg font-bold text-white">
                    {tier.name}
                  </h3>
                  <p className="text-2xl font-bold text-gold mt-2">
                    {tier.price}
                  </p>
                  <p className="text-xs text-cyan mt-1">{tier.audience}</p>
                  <p className="text-sm text-slate-dim mt-4 flex-1">
                    {tier.description}
                  </p>
                  <a
                    href={tier.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-6 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                      tier.highlighted
                        ? "bg-gold text-nex-deep hover:bg-gold/90"
                        : "bg-cyan/10 text-cyan hover:bg-cyan/20 border border-cyan/30"
                    }`}
                  >
                    {tier.cta}
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </div>
              ))}
            </div>

            <p className="text-center text-xs text-slate-dim mt-8 max-w-2xl mx-auto">
              {FOUNDING_MEMBER_DISCLAIMER}
            </p>
          </div>
        </section>

        {/* Cause-Effect Section */}
        <section className="py-12 px-4 border-t border-white/[0.08] bg-white/[0.03]">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-headline font-bold text-white mb-6">
              The Cause-Effect Chain
            </h2>
            <div className="space-y-3 text-left max-w-lg mx-auto">
              {[
                "You run a signal detection on live FAERS data",
                "The analysis is reproducible and timestamped",
                "Your portfolio grows with verifiable capability",
                "Your employer sees demonstrated expertise",
                "Your career is safer",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 mt-0.5 h-6 w-6 rounded-full bg-gold/20 text-gold text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <p className="text-slate-dim text-sm">{step}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm text-slate-dim italic">
              Every link is measurable. Every link is falsifiable. That is
              grounded idealism.
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section
          className="py-16 px-4 border-t border-white/[0.08]"
          aria-labelledby="faq-heading"
        >
          <div className="container mx-auto max-w-2xl">
            <h2
              id="faq-heading"
              className="text-2xl font-headline font-bold text-white text-center mb-8 uppercase tracking-wide"
            >
              {FAQ_SECTION.title}
            </h2>

            <div className="space-y-6">
              {membershipFAQs.map((faq) => (
                <div key={faq.question}>
                  <h3 className="font-semibold text-slate-light mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-slate-dim text-sm">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
