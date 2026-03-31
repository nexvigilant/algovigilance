"use client";

import { ShieldCheck, Eye, Radar, ArrowUpCircle } from "lucide-react";
import { HolographicProtocolCard } from "@/components/ui/branded/holographic-protocol-card";
import { MarketingSectionHeader } from "@/components/marketing/section-header";
import { BRANDED_STRINGS } from "@/lib/branded-strings";
import { servantStrengths } from "@/data/about";

export function OverviewSection() {
  return (
    <section id="overview" className="py-12 scroll-mt-32">
      <div className="container mx-auto">
        <MarketingSectionHeader
          label={BRANDED_STRINGS.about.strategicImperatives.label}
          title={BRANDED_STRINGS.about.strategicImperatives.title}
        />
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <HolographicProtocolCard
            icon={ShieldCheck}
            variant="cyan"
            title="Mission"
            description="Build an independent safety oversight platform. Run by professionals who put patients first."
          />
          <HolographicProtocolCard
            icon={Eye}
            variant="gold"
            title="Vision"
            description="Be the place professionals trust for safety intelligence. Free from corporate influence."
          />
        </div>
      </div>
    </section>
  );
}

export function StrengthsSection() {
  return (
    <section
      id="strengths"
      className="py-12 border-t border-white/[0.08] scroll-mt-32"
    >
      <div className="mx-auto max-w-5xl">
        <MarketingSectionHeader
          label={BRANDED_STRINGS.about.leading.label}
          title={BRANDED_STRINGS.about.leading.title}
        />
        <div className="flex flex-wrap justify-center gap-4">
          {servantStrengths.map(
            ({
              id,
              label,
              description,
              Icon,
              cardClasses,
              iconWrapClasses,
              iconClasses,
              labelClasses,
            }) => (
              <div
                key={id}
                className={`flex w-[calc(50%-0.5rem)] md:w-[calc(20%-0.8rem)] flex-col items-center text-center p-4 rounded-xl border transition-all duration-300 hover:scale-[1.05] hover:shadow-lg ${cardClasses}`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-lg mb-3 border bg-white/[0.04] ${iconWrapClasses}`}
                >
                  <Icon
                    className={`h-6 w-6 ${iconClasses}`}
                    aria-hidden="true"
                  />
                </div>
                <h3
                  className={`text-sm font-semibold uppercase tracking-wide mb-1 ${labelClasses}`}
                >
                  {label}
                </h3>
                <p className="text-xs text-slate-dim leading-snug">
                  {description}
                </p>
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

export function PurposeSection() {
  return (
    <section id="purpose" className="py-12 scroll-mt-32">
      <div className="mx-auto max-w-4xl text-center">
        <MarketingSectionHeader
          label={BRANDED_STRINGS.about.intelligenceDoctrine.label}
          title={BRANDED_STRINGS.about.intelligenceDoctrine.title}
        />
        <div className="mt-12 grid gap-8 text-left md:grid-cols-2">
          <HolographicProtocolCard
            icon={Radar}
            variant="cyan"
            layout="horizontal"
            title="Vigilance"
            description="Safety monitoring that no industry player can influence, dilute, or silence."
          />
          <HolographicProtocolCard
            icon={ArrowUpCircle}
            variant="gold"
            layout="horizontal"
            title="Professional Growth"
            description="Help safety professionals grow their careers without compromising on patients."
          />
        </div>
      </div>
    </section>
  );
}
