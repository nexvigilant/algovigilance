"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mail, Handshake, Code2, type LucideIcon } from "lucide-react";
import changelog from "@/data/changelog.json";
import { SOCIAL_LINKS } from "@/data/social";
import { BRANDED_STRINGS } from "@/lib/branded-strings";
import { BrandName } from "@/components/shared/branding";
import {
  marketingSections,
  legalRoutes,
  type NavPage,
} from "@/config/site-navigation";

// ============================================================================
// Footer column configuration — derived from registry sections
// ============================================================================

type FooterColumn = {
  title: string;
  ariaLabel: string;
  links: { href: string; label: string }[];
};

function buildFooterColumns(): FooterColumn[] {
  const getSection = (id: string) => marketingSections.find((s) => s.id === id);

  const companySection = getSection("company");
  const workSection = getSection("work");
  const learnSection = getSection("learn");

  return [
    {
      title: "Company",
      ariaLabel: "Company links",
      links: (companySection?.pages ?? []).map((p) => ({
        href: p.path,
        label: p.title,
      })),
    },
    {
      title: "Solutions",
      ariaLabel: "Solutions links",
      links: (workSection?.pages ?? []).map((p) => ({
        href: p.path,
        label: p.title,
      })),
    },
    {
      title: "Resources",
      ariaLabel: "Resource links",
      links: [
        ...(learnSection?.pages ?? []).slice(0, 3).map((p) => ({
          href: p.path,
          label: p.title,
        })),
        ...legalRoutes.map((p: NavPage) => ({
          href: p.path,
          label: p.title,
        })),
      ],
    },
  ];
}

const FOOTER_COLUMNS = buildFooterColumns();

// ============================================================================
// Sub-components
// ============================================================================

interface SocialLinkProps {
  href: string;
  icon: LucideIcon;
  label: string;
}

const FooterLink = ({ href, label }: { href: string; label: string }) => (
  <Link
    href={href}
    className="footer-link relative text-sm text-slate-dim transition-colors hover:text-slate-light touch-target py-3 inline-flex items-center"
  >
    {label}
  </Link>
);

const FooterLinkColumn = ({ title, links, ariaLabel }: FooterColumn) => (
  <div className="space-y-3">
    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-light/80">
      {title}
    </h3>
    <nav className="flex flex-col gap-2" aria-label={ariaLabel}>
      {links.map((link) => (
        <FooterLink key={link.href} {...link} />
      ))}
    </nav>
  </div>
);

const SocialIcon = ({ href, icon: Icon, label }: SocialLinkProps) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="social-icon relative min-w-[44px] touch-target p-2.5 text-slate-dim transition-all duration-200 hover:text-cyan rounded-lg hover:bg-cyan/10 inline-flex items-center justify-center"
    aria-label={label}
  >
    <Icon
      className="h-5 w-5 transition-transform duration-200 hover:scale-110"
      aria-hidden="true"
    />
  </a>
);

export function SiteFooter() {
  return (
    <footer
      id="contact"
      className="relative z-10 bg-nex-dark/95 backdrop-blur-sm border-t border-nex-light"
      aria-label="Site footer"
      data-neural-exclude
    >
      {/* Enterprise Advisory Banner - Top */}
      <div className="border-b border-nex-light/50 bg-gradient-to-r from-gold/5 via-transparent to-gold/5">
        <div className="container mx-auto px-4 md:px-8 py-3">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Handshake className="h-4 w-4 text-gold" aria-hidden="true" />
              <span className="text-sm font-semibold text-gold">
                {BRANDED_STRINGS.footer.enterpriseBanner.label}
              </span>
              <span className="text-sm text-slate-dim hidden sm:inline">|</span>
              <span className="text-sm text-slate-dim hidden sm:inline">
                {BRANDED_STRINGS.footer.enterpriseBanner.description}
              </span>
            </div>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="b2b-pill border-gold/50 text-gold hover:bg-gold/10 hover:border-gold text-xs touch-target px-4 rounded-full"
            >
              <Link
                href={BRANDED_STRINGS.footer.enterpriseBanner.ctaHref}
                className="inline-flex items-center"
              >
                {BRANDED_STRINGS.footer.enterpriseBanner.ctaText}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Footer Content - Compressed Layout */}
      <div className="container mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-10">
          {/* Brand Column - spans 2 cols */}
          <div className="col-span-2 space-y-4">
            <Link
              href="/"
              className="inline-flex items-center"
              aria-label={`${BRANDED_STRINGS.company.shortName} home`}
            >
              <BrandName size="lg" />
            </Link>
            <p className="text-sm text-slate-dim leading-relaxed max-w-xs">
              {BRANDED_STRINGS.company.tagline}
            </p>
            {/* Social Links */}
            <div className="flex gap-1 pt-2">
              {SOCIAL_LINKS.map((social) => (
                <SocialIcon key={social.label} {...social} />
              ))}
              <a
                href={`mailto:${BRANDED_STRINGS.company.email}`}
                className="social-icon relative min-w-[44px] touch-target p-2.5 text-slate-dim transition-all duration-200 hover:text-cyan rounded-lg hover:bg-cyan/10 inline-flex items-center justify-center"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Navigation Columns — registry-driven */}
          {FOOTER_COLUMNS.map((column) => (
            <FooterLinkColumn key={column.title} {...column} />
          ))}
        </div>
      </div>

      {/* Bottom Bar - Balanced Layout */}
      <div className="border-t border-nex-light">
        <div className="container mx-auto px-4 md:px-8 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-slate-light/70">
            <div className="flex items-center gap-3">
              <p>
                &copy; {new Date().getFullYear()}{" "}
                {BRANDED_STRINGS.company.legalName}.{" "}
                {BRANDED_STRINGS.footer.legal.copyrightSuffix}
              </p>
              <Link
                href="/changelog"
                className="inline-flex items-center gap-1.5 px-3 py-2 touch-target rounded-full bg-cyan/10 border border-cyan/20 text-cyan hover:bg-cyan/20 hover:border-cyan/40 transition-colors"
                title="View changelog"
              >
                <Code2 className="h-3 w-3" aria-hidden="true" />
                <span>v{changelog.currentVersion}</span>
                <span className="text-cyan/60">
                  {BRANDED_STRINGS.footer.legal.betaLabel}
                </span>
              </Link>
            </div>
            <div className="flex items-center gap-2 text-center">
              <span>{BRANDED_STRINGS.company.state}-based</span>
              <span className="text-slate-light/50">•</span>
              <span>Est. {BRANDED_STRINGS.company.foundedYear}</span>
            </div>
            <p className="text-gold italic">
              &ldquo;{BRANDED_STRINGS.common.motto}&rdquo;
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
