"use client";

import Link from "next/link";
import {
  Users,
  BookOpen,
  Briefcase,
  Building2,
  ShieldCheck,
  Activity,
  Wrench,
  Scale,
  FlaskConical,
  Store,
  Telescope,
  Bell,
  Radio,
  CreditCard,
  Settings,
  Hammer,
  type LucideIcon,
} from "lucide-react";
import { SpringCard } from "./spring-card";
import {
  platformSections,
  type PlatformSectionId,
} from "@/config/site-navigation";

// ============================================================================
// Presentation — icons and category styling are component concerns
// ============================================================================

const PAGE_ICONS: Record<string, LucideIcon> = {
  "/nucleus/academy": BookOpen,
  "/observatory": Telescope,
  "/nucleus/regulatory": Scale,
  "/nucleus/vigilance": Activity,
  "/nucleus/tools": Wrench,
  "/nucleus/forge": Hammer,
  "/nucleus/community": Users,
  "/nucleus/careers": Briefcase,
  "/nucleus/marketplace": Store,
  "/nucleus/alerts": Bell,
  "/nucleus/guardian": ShieldCheck,
  "/nucleus/live-feed": Radio,
  "/nucleus/organization": Building2,
  "/nucleus/billing": CreditCard,
  "/nucleus/admin": Settings,
};

const SECTION_STYLE: Record<
  PlatformSectionId,
  { label: string; accent: string }
> = {
  learn: {
    label: "Learn",
    accent: "text-gold/70 border-gold/20",
  },
  work: {
    label: "Work",
    accent: "text-red-400/70 border-red-400/20",
  },
  grow: {
    label: "Grow",
    accent: "text-cyan/70 border-cyan/20",
  },
  monitor: {
    label: "Monitor",
    accent: "text-amber-400/70 border-amber-400/20",
  },
  manage: {
    label: "Manage",
    accent: "text-slate-dim/70 border-slate-dim/20",
  },
};

const SECTION_ORDER: PlatformSectionId[] = [
  "learn",
  "work",
  "grow",
  "monitor",
  "manage",
];

export function NucleusDirectory() {
  const totalPages = platformSections.reduce(
    (sum, s) => sum + s.pages.length,
    0,
  );

  return (
    <nav
      aria-label="Nucleus service directory"
      className="relative bg-nex-deep"
    >
      <div className="h-16 bg-gradient-to-b from-transparent to-nex-surface/10" />

      <div className="mx-auto max-w-5xl px-golden-3 pb-golden-5">
        <header className="mb-golden-4 text-center">
          <h2 className="text-golden-xs font-mono uppercase tracking-[0.2em] text-cyan/70 mb-golden-2">
            Service Directory
          </h2>
          <p className="text-golden-sm text-slate-dim/60 max-w-md mx-auto leading-golden">
            {totalPages} capabilities across {platformSections.length} domains
          </p>
        </header>

        {SECTION_ORDER.map((sectionId) => {
          const section = platformSections.find((s) => s.id === sectionId);
          if (!section) return null;
          const style = SECTION_STYLE[sectionId];
          return (
            <section
              key={sectionId}
              className="mb-golden-3"
              aria-label={style.label}
            >
              <h3
                className={`text-xs font-mono uppercase tracking-widest mb-golden-2 border-b pb-2 ${style.accent}`}
              >
                {style.label}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-golden-2">
                {section.pages.map((page, i) => {
                  const Icon = PAGE_ICONS[page.path] ?? FlaskConical;
                  return (
                    <SpringCard key={page.path} hoverY={-3} hoverScale={1.015}>
                      <Link
                        href={page.path}
                        className="scroll-reveal-stagger group flex items-start gap-golden-2 border border-nex-border/40 bg-nex-surface/30 p-golden-3 hover:border-cyan/50 hover:bg-cyan/10 transition-colors duration-200 h-full"
                        style={{ "--stagger-index": i } as React.CSSProperties}
                      >
                        <Icon
                          className="h-5 w-5 mt-0.5 text-cyan/40 group-hover:text-cyan transition-colors shrink-0"
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <p className="text-golden-sm font-medium text-white/90 group-hover:text-cyan-soft transition-colors">
                            {page.title}
                          </p>
                          <p className="text-golden-xs text-slate-dim/60 leading-golden mt-1">
                            {page.description}
                          </p>
                        </div>
                      </Link>
                    </SpringCard>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </nav>
  );
}
