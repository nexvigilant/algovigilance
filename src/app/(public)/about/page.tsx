import Link from "next/link";
import { Building, Github, Linkedin, MessageSquare, Music } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/marketing";
import { SectionNav } from "@/components/navigation/section-nav";
import { leadership } from "@/data/team";
import { aboutSections } from "@/data/about";
import { createMetadata } from "@/lib/metadata";
import { MarketingSectionHeader } from "@/components/marketing/section-header";
import { BRANDED_STRINGS } from "@/lib/branded-strings";
import { SOCIAL_LINKS } from "@/lib/constants/urls";
import {
  OverviewSection,
  PurposeSection,
  StrengthsSection,
} from "./protocol-cards";
import { SoundCloudPlayer } from "@/components/marketing/soundcloud-player";

export const metadata = createMetadata({
  title: "About Us",
  description:
    "Independent safety intelligence. We build tools and training for professionals who keep people safe.",
  path: "/about",
  imageAlt: "AlgoVigilance - Strategic Vigilance Intelligence",
});

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      {/* Hero Section */}
      <PageHero title="Patient Safety Deserves Independence" />

      {/* Section Navigation */}
      <SectionNav sections={aboutSections} />

      {/* Preamble Section */}
      <section id="story" className="pt-8 pb-12 scroll-mt-32">
        <div className="mx-auto max-w-3xl text-center">
          <Building
            className="mx-auto h-12 w-12 text-gold"
            aria-hidden="true"
          />
          <MarketingSectionHeader
            label={BRANDED_STRINGS.about.foundingDoctrine.label}
            title={BRANDED_STRINGS.about.foundingDoctrine.title}
            className="mt-6 mb-0"
          />
          <p className="mt-6 text-2xl font-semibold text-cyan italic">
            &ldquo;{BRANDED_STRINGS.common.motto}&rdquo;
          </p>
          <p className="text-sm text-slate-dim mt-2">
            {BRANDED_STRINGS.common.mottoDefinition}
          </p>
        </div>
      </section>

      {/* Company Overview & Values */}
      <OverviewSection />

      {/* Core Purposes Section */}
      <PurposeSection />

      {/* Team Section */}
      <section id="team" className="py-12 scroll-mt-32">
        <div className="mx-auto max-w-4xl">
          <MarketingSectionHeader
            label={BRANDED_STRINGS.about.commandStructure.label}
            title={BRANDED_STRINGS.about.commandStructure.title}
          />
          {/* Flex-wrap container handles 1-N leaders with proper spacing */}
          <div className="flex flex-wrap justify-center gap-12">
            {leadership.map((member) => (
              <article
                key={member.id}
                className="flex max-w-3xl flex-col items-center gap-8 md:flex-row"
              >
                <div className="flex-shrink-0">
                  {/* Avatar with optimized sizing - 160x160 display */}
                  <Avatar className="h-40 w-40 shadow-xl ring-4 ring-gold/20">
                    <AvatarImage
                      src={member.imageSrc}
                      alt={`Portrait of ${member.name}`}
                      className="object-cover"
                      // Note: For true optimization, replace with next/image
                      // sizes="160px" would reduce bandwidth
                    />
                    <AvatarFallback className="bg-nex-deep text-2xl text-gold">
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="text-center md:text-left">
                  <h3 className="font-headline text-2xl font-bold text-white">
                    {member.name}
                  </h3>
                  <p className="mb-4 font-medium text-gold">{member.role}</p>
                  <p className="leading-relaxed text-slate-dim">{member.bio}</p>
                  {member.linkedIn && (
                    <div className="mt-4">
                      <a
                        href={member.linkedIn}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-cyan hover:text-cyan-glow transition-colors"
                      >
                        <Linkedin className="h-4 w-4" aria-hidden="true" />
                        Connect on LinkedIn
                      </a>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>

          {/* Leadership CTA */}
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Button
              asChild
              className="bg-cyan text-nex-deep hover:bg-cyan-glow touch-target"
            >
              <Link href="/contact">
                <MessageSquare className="mr-2 h-4 w-4" aria-hidden="true" />
                Get in Touch
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-gold/50 text-gold hover:bg-gold/10 touch-target"
            >
              <Link href="/consulting">Explore Our Services</Link>
            </Button>
          </div>

          {/* Company Social Links */}
          <div className="mt-6 flex justify-center gap-6">
            <a
              href={SOCIAL_LINKS.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-slate-dim hover:text-cyan transition-colors"
            >
              <Linkedin className="h-5 w-5" aria-hidden="true" />
              LinkedIn
            </a>
            <a
              href={SOCIAL_LINKS.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-slate-dim hover:text-cyan transition-colors"
            >
              <Github className="h-5 w-5" aria-hidden="true" />
              GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Music Section */}
      <section id="music" className="py-12 scroll-mt-32">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <Music className="mx-auto h-10 w-10 text-cyan" aria-hidden="true" />
            <MarketingSectionHeader
              label="Listen"
              title="Our Sound"
              className="mt-4 mb-0"
            />
            <p className="mt-3 text-slate-dim">Music we make along the way.</p>
          </div>
          <SoundCloudPlayer
            url="https://soundcloud.com/nexvigilant"
            height={450}
          />
        </div>
      </section>

      {/* Servant Strengths Section */}
      <StrengthsSection />
    </div>
  );
}
