"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Check,
  Minus,
  ArrowRight,
  Zap,
  Shield,
  Building2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHero } from "@/components/marketing";
import { MarketingSectionHeader } from "@/components/marketing/section-header";
import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/hooks/use-analytics";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface Tier {
  id: string;
  name: string;
  price: string;
  priceNote: string;
  description: string;
  icon: LucideIcon;
  iconClass: string;
  borderClass: string;
  badgeClass: string;
  featured: boolean;
  cta: { label: string; href: string; variant: "primary" | "outline" };
  features: string[];
}

const TIERS: Tier[] = [
  {
    id: "free",
    name: "Station",
    price: "Free",
    priceNote: "Always free. No credit card.",
    description:
      "146 live pharmacovigilance tools across 20 regulatory databases. No account required.",
    icon: Zap,
    iconClass: "text-cyan bg-cyan/10",
    borderClass: "border-white/[0.08]",
    badgeClass: "bg-cyan/10 text-cyan",
    featured: false,
    cta: { label: "Start Now", href: "/station", variant: "outline" },
    features: [
      "146 public MCP tools",
      "20 live data sources (FDA, EMA, WHO, PubMed…)",
      "Statistical signal detection (PRR, ROR, IC, EBGM)",
      "Naranjo + WHO-UMC causality assessment",
      "ICH E2A seriousness classification",
      "6 guided research courses",
      "Streamable HTTP + SSE + REST access",
      "No authentication required",
    ],
  },
  {
    id: "pro",
    name: "Professional",
    price: "Free",
    priceNote: "Beta — founding rate locks at launch.",
    description:
      "Full portal access — signal intelligence, Academy, career tools, and community — for working PV professionals.",
    icon: Shield,
    iconClass: "text-gold bg-gold/10",
    borderClass: "border-gold/30",
    badgeClass: "bg-gold/10 text-gold",
    featured: true,
    cta: { label: "Sign Up Free", href: "/auth/signup", variant: "primary" },
    features: [
      "Everything in Station",
      "Full Nucleus portal (336 pages)",
      "PV Academy — 1,286 competencies, 21 EPAs",
      "GVP curriculum + compliance training",
      "Career assessments (14 tools)",
      "Professional community + Circles",
      "Signal intelligence dashboard",
      "Case triage, causality, and ICSR workflows",
      "Regulatory directory + deadline calculator",
      "3D Observatory data visualization",
      "Priority support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    priceNote: "Contact for volume pricing.",
    description:
      "For pharma, biotech, and CROs that need private deployment, SLA guarantees, and organizational reporting.",
    icon: Building2,
    iconClass: "text-copper bg-copper/10",
    borderClass: "border-copper/20",
    badgeClass: "bg-copper/10 text-copper",
    featured: false,
    cta: { label: "Contact Sales", href: "/contact", variant: "outline" },
    features: [
      "Everything in Professional",
      "Private MCP deployment",
      "Organizational learner management",
      "Custom competency frameworks",
      "SSO / SAML integration",
      "99.9% SLA",
      "Dedicated onboarding",
      "Audit trail for 21 CFR Part 11",
      "Custom data source integrations",
      "Volume seat licensing",
      "Executive reporting dashboard",
    ],
  },
];

interface CompareRow {
  feature: string;
  free: boolean | string;
  pro: boolean | string;
  enterprise: boolean | string;
}

const COMPARE: CompareRow[] = [
  {
    feature: "Public MCP tools",
    free: "146",
    pro: "146",
    enterprise: "146 + custom",
  },
  {
    feature: "Live data sources",
    free: "20",
    pro: "20",
    enterprise: "20 + private",
  },
  {
    feature: "Signal detection algorithms",
    free: true,
    pro: true,
    enterprise: true,
  },
  { feature: "Causality assessment", free: true, pro: true, enterprise: true },
  {
    feature: "Nucleus portal access",
    free: false,
    pro: true,
    enterprise: true,
  },
  { feature: "PV Academy", free: false, pro: true, enterprise: true },
  { feature: "Career tools", free: false, pro: true, enterprise: true },
  { feature: "Community + Circles", free: false, pro: true, enterprise: true },
  { feature: "Org admin dashboard", free: false, pro: false, enterprise: true },
  { feature: "SSO / SAML", free: false, pro: false, enterprise: true },
  {
    feature: "21 CFR Part 11 audit trail",
    free: false,
    pro: false,
    enterprise: true,
  },
  { feature: "Private deployment", free: false, pro: false, enterprise: true },
  { feature: "SLA guarantee", free: false, pro: false, enterprise: true },
];

const BUSINESS_MODEL = [
  {
    label: "Free Layer",
    title: "Station tools drive adoption",
    description:
      "146 public tools with no friction. Any AI agent connects to live PV data in one API call. The rails that agents run on — free, forever.",
    metric: "146 tools",
    metricLabel: "public, no auth",
  },
  {
    label: "Pro Layer",
    title: "Portal + Academy capture professionals",
    description:
      "PV professionals need a home. The Nucleus portal gives them a full workflow platform — signal to case to compliance. Academy creates the training moat.",
    metric: "1,286",
    metricLabel: "competencies mapped",
  },
  {
    label: "Enterprise Layer",
    title: "Org deployments drive revenue",
    description:
      "Pharma and CROs pay for private deployment, compliance audit trails, and custom competency frameworks. One enterprise deal > many Pro subscriptions.",
    metric: "21 CFR",
    metricLabel: "Part 11 ready",
  },
];

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function FeatureCheck({ value }: { value: boolean | string }) {
  if (value === false) {
    return (
      <Minus
        className="h-4 w-4 text-white/20 mx-auto"
        aria-label="Not included"
      />
    );
  }
  if (value === true) {
    return (
      <Check className="h-4 w-4 text-cyan mx-auto" aria-label="Included" />
    );
  }
  return (
    <span className="text-xs text-slate-300 text-center block">{value}</span>
  );
}

function TierCard({ tier, index }: { tier: Tier; index: number }) {
  const { track } = useAnalytics();
  const Icon = tier.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={cn(
        "relative flex flex-col rounded-xl border p-8 transition-colors",
        tier.borderClass,
        tier.featured ? "bg-white/[0.06]" : "bg-white/[0.03]",
      )}
    >
      {tier.featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-gold px-4 py-1 text-xs font-bold uppercase tracking-wider text-black">
            Most Popular
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            tier.iconClass,
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-lg font-headline font-bold">{tier.name}</h3>
          <span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              tier.badgeClass,
            )}
          >
            {tier.priceNote}
          </span>
        </div>
      </div>

      {/* Price */}
      <div className="mb-4">
        <span
          className={cn(
            "text-4xl font-bold font-mono",
            tier.id === "free"
              ? "text-cyan"
              : tier.id === "pro"
                ? "text-gold"
                : "text-copper",
          )}
        >
          {tier.price}
        </span>
      </div>

      <p className="text-sm text-slate-dim mb-8">{tier.description}</p>

      {/* CTA */}
      <Link
        href={tier.cta.href}
        className="mb-8"
        onClick={() => {
          if (tier.id === "pro") {
            track("signup_started", { location: "pricing_card", tier: tier.id });
          } else {
            track("button_click", {
              location: "pricing_card",
              tier: tier.id,
              action: tier.cta.label,
            });
          }
        }}
      >
        {tier.cta.variant === "primary" ? (
          <Button className="w-full bg-gold hover:bg-gold/90 text-black font-semibold">
            {tier.cta.label} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button variant="outline" className="w-full">
            {tier.cta.label}
          </Button>
        )}
      </Link>

      {/* Features */}
      <ul className="space-y-3 flex-1">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm">
            <Check
              className="mt-0.5 h-4 w-4 shrink-0 text-cyan"
              aria-hidden="true"
            />
            <span className="text-slate-300">{feature}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function PricingContent() {
  const { track } = useAnalytics();

  useEffect(() => {
    track("pricing_viewed", { source: "direct" });
  }, [track]);

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      {/* Beta Banner */}
      <div className="mb-8 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-6 py-4 text-center">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-400">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Open Beta — Everything is free. No credit card. No commitment.
        </span>
      </div>

      <PageHero
        title="Free During Beta"
        description="2,000+ pharmacovigilance tools, full portal access, and Academy — all free while we're in open beta. No payment required."
      />

      {/* Tiers */}
      <section className="py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {TIERS.map((tier, i) => (
            <TierCard key={tier.id} tier={tier} index={i} />
          ))}
        </div>
      </section>

      {/* Business Model */}
      <section className="py-12">
        <MarketingSectionHeader
          label="Business Model"
          title="How It Works"
          description="Three layers. Each one feeds the next."
        />
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {BUSINESS_MODEL.map((layer, i) => (
            <motion.div
              key={layer.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-6"
            >
              <div className="mb-2 text-xs font-mono uppercase tracking-widest text-cyan/70">
                {layer.label}
              </div>
              <h4 className="text-lg font-headline font-semibold mb-3">
                {layer.title}
              </h4>
              <p className="text-sm text-slate-dim leading-relaxed mb-6">
                {layer.description}
              </p>
              <div className="border-t border-white/[0.06] pt-4">
                <div className="text-2xl font-bold font-mono text-gold">
                  {layer.metric}
                </div>
                <div className="text-xs text-slate-dim mt-1">
                  {layer.metricLabel}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Compare Table */}
      <section className="py-12">
        <MarketingSectionHeader label="Compare" title="Feature Breakdown" />
        <div className="mt-12 overflow-x-auto rounded-xl border border-white/[0.08]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.03]">
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-dim">
                  Feature
                </th>
                <th className="px-6 py-4 text-center text-sm font-medium text-cyan">
                  Station
                </th>
                <th className="px-6 py-4 text-center text-sm font-medium text-gold">
                  Professional
                </th>
                <th className="px-6 py-4 text-center text-sm font-medium text-copper">
                  Enterprise
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {COMPARE.map((row) => (
                <tr
                  key={row.feature}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-6 py-3 text-sm text-slate-300">
                    {row.feature}
                  </td>
                  <td className="px-6 py-3">
                    <FeatureCheck value={row.free} />
                  </td>
                  <td className="px-6 py-3">
                    <FeatureCheck value={row.pro} />
                  </td>
                  <td className="px-6 py-3">
                    <FeatureCheck value={row.enterprise} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-headline font-bold text-emerald-400 md:text-4xl">
            Everything is Free. Start Now.
          </h2>
          <p className="mt-4 text-lg text-slate-dim max-w-xl mx-auto">
            No payment. No waitlist. No friction. Sign up to unlock the full
            portal, or connect your AI agent directly — no account needed.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/station/connect"
              onClick={() => track("connect_ai_clicked", { location: "pricing_bottom" })}
            >
              <Button
                size="lg"
                className="border border-emerald-500/50 bg-emerald-500/10 text-emerald-400 hover:border-emerald-500 hover:bg-emerald-500/20 px-8"
              >
                Connect Your AI <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link
              href="/auth/signup"
              onClick={() => track("signup_started", { location: "pricing_bottom" })}
            >
              <Button size="lg" variant="outline" className="px-8">
                Sign Up Free
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
