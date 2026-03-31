"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useAnalytics } from "@/hooks/use-analytics";
import {
  LayoutDashboard,
  Menu,
  ChevronDown,
  GraduationCap,
  Shield,
  FileSearch,
  BookOpen,
  Code2,
  Radio,
  Handshake,
  Wrench,
  Sparkles,
  Users,
  Briefcase,
  TrendingUp,
  Ticket,
  Info,
  FileText,
  Zap,
  Mail,
  Activity,
  ClipboardList,
  Cable,
  FlaskConical,
  DollarSign,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandName } from "@/components/shared/branding";
import {
  marketingSections,
  type MarketingSectionId,
} from "@/config/site-navigation";

// ============================================================================
// Presentation Maps (icons + colors are component concerns, not registry)
// ============================================================================

const PAGE_ICONS: Record<string, LucideIcon> = {
  "/academy": GraduationCap,
  "/drugs": Shield,
  "/glass": FlaskConical,
  "/intelligence": FileSearch,
  "/library": BookOpen,
  "/open-source": Code2,
  "/station": Radio,
  "/station/connect": Cable,
  "/consulting": Handshake,
  "/services": Wrench,
  "/reports": ClipboardList,
  "/skills": Sparkles,
  "/community": Users,
  "/careers": Briefcase,
  "/grow": TrendingUp,
  "/about": Info,
  "/doctrine": FileText,
  "/changelog": Zap,
  "/contact": Mail,
  "/pricing": DollarSign,
  "/status": Activity,
};

const SECTION_STYLE: Record<
  MarketingSectionId,
  {
    description: string;
    activeClass: string;
    iconClass: string;
    mobileActiveClass: string;
    mobileLabelClass: string;
  }
> = {
  learn: {
    description: "Build Your Knowledge",
    activeClass: "text-cyan bg-cyan/10",
    iconClass: "text-cyan",
    mobileActiveClass: "bg-cyan/10 text-cyan",
    mobileLabelClass: "text-cyan",
  },
  work: {
    description: "Tools & Services",
    activeClass: "text-cyan bg-cyan/10",
    iconClass: "text-cyan",
    mobileActiveClass: "bg-cyan/10 text-cyan",
    mobileLabelClass: "text-cyan",
  },
  grow: {
    description: "Build Your Career",
    activeClass: "text-cyan bg-cyan/10",
    iconClass: "text-cyan",
    mobileActiveClass: "bg-cyan/10 text-cyan",
    mobileLabelClass: "text-cyan",
  },
  company: {
    description: "About AlgoVigilance",
    activeClass: "text-slate-light bg-nex-surface",
    iconClass: "text-slate-dim",
    mobileActiveClass: "bg-cyan/10 text-cyan",
    mobileLabelClass: "text-slate-dim",
  },
};

export function SiteHeader() {
  const { user, loading } = useAuth();
  const { track } = useAnalytics();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  function isSectionActive(sectionId: MarketingSectionId): boolean {
    if (!pathname) return false;
    const section = marketingSections.find((s) => s.id === sectionId);
    if (!section) return false;
    return section.pages.some(
      (page) => pathname === page.path || pathname.startsWith(`${page.path}/`),
    );
  }

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between border-b border-nex-light bg-nex-deep/90 p-4 backdrop-blur-lg"
      data-neural-exclude
      data-testid="site-header"
    >
      <Link
        href="/"
        className="inline-flex items-center touch-target"
        aria-label="AlgoVigilance home"
      >
        <BrandName size="lg" />
      </Link>

      {/* Desktop Navigation — registry-driven */}
      <nav
        className="hidden items-center gap-1 lg:flex"
        aria-label="Main navigation"
      >
        {marketingSections.map((section) => (
          <DropdownMenu key={section.id}>
            <DropdownMenuTrigger
              className={cn(
                "group circuit-link relative flex items-center gap-1.5 px-3 py-2 touch-target text-sm font-medium transition-colors outline-none rounded-md",
                isSectionActive(section.id)
                  ? SECTION_STYLE[section.id].activeClass
                  : "text-slate-dim hover:text-slate-light hover:bg-nex-surface",
              )}
            >
              {section.label}
              <ChevronDown className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-72 bg-nex-surface/95 backdrop-blur-sm border-nex-light"
              align="start"
            >
              <DropdownMenuLabel className="text-slate-dim text-xs uppercase tracking-wider">
                {SECTION_STYLE[section.id].description}
              </DropdownMenuLabel>
              {section.pages.map((page) => {
                const Icon = PAGE_ICONS[page.path];
                return (
                  <DropdownMenuItem
                    key={page.path}
                    asChild
                    className="cursor-pointer"
                  >
                    <Link
                      href={page.path}
                      className="flex items-start gap-3 py-3 touch-target"
                    >
                      {Icon && (
                        <Icon
                          className={cn(
                            "h-5 w-5 mt-0.5",
                            SECTION_STYLE[section.id].iconClass,
                          )}
                          aria-hidden="true"
                        />
                      )}
                      <div>
                        <div className="font-medium text-slate-light">
                          {page.title}
                        </div>
                        <div className="text-xs text-slate-dim">
                          {page.description}
                        </div>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        ))}
      </nav>

      {/* Mobile Navigation — registry-driven */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild className="lg:hidden">
          <Button variant="ghost" size="icon" aria-label="Open menu">
            <Menu className="h-6 w-6 text-slate-light" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-[300px] border-nex-light bg-nex-deep sm:w-[400px] overflow-y-auto"
        >
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <nav className="mt-8 flex flex-col gap-2">
            {marketingSections.map((section, sectionIndex) => (
              <div key={section.id}>
                {sectionIndex > 0 && (
                  <div className="my-2 border-t border-nex-light" />
                )}
                <div className="mb-2">
                  <p
                    className={cn(
                      "px-4 py-1 text-xs font-semibold uppercase tracking-wider",
                      SECTION_STYLE[section.id].mobileLabelClass,
                    )}
                  >
                    {section.label}
                  </p>
                  {section.pages.map((page) => {
                    const Icon = PAGE_ICONS[page.path];
                    return (
                      <Link
                        key={page.path}
                        href={page.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-4 py-3 touch-target text-base font-medium transition-colors",
                          pathname === page.path
                            ? SECTION_STYLE[section.id].mobileActiveClass
                            : "text-slate-dim hover:bg-nex-surface hover:text-slate-light",
                        )}
                      >
                        {Icon && (
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        )}
                        {page.title}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="my-4 border-t border-nex-light" />

            {/* Auth CTAs */}
            {mounted &&
              !loading &&
              (user ? (
                <Button
                  asChild
                  className="w-full border-cyan text-cyan hover:bg-cyan/10"
                  variant="outline"
                >
                  <Link
                    href="/nucleus"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Go to Nucleus
                  </Link>
                </Button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button
                    asChild
                    variant="outline"
                    className="border-nex-light text-slate-light hover:bg-nex-surface touch-target"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      track("sign_in_clicked", { location: "mobile_menu" });
                    }}
                  >
                    <Link href="/auth/signin">Sign In</Link>
                  </Button>
                  <Button
                    asChild
                    className="border border-emerald-500/50 bg-emerald-500/10 text-emerald-400 transition-all hover:border-emerald-500 hover:bg-emerald-500/20 touch-target"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      track("connect_ai_clicked", {
                        location: "mobile_menu",
                      });
                    }}
                  >
                    <Link href="/station/connect">
                      <Cable className="mr-2 h-4 w-4" />
                      Connect Your AI
                    </Link>
                  </Button>
                </div>
              ))}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Desktop CTAs */}
      <div className="hidden lg:block">
        {!mounted || loading ? (
          <div className="h-9 w-24 rounded-md bg-white/[0.06] animate-pulse" />
        ) : user ? (
          <Button
            asChild
            className="border-cyan text-cyan hover:bg-cyan/10 hover:shadow-glow-cyan"
            variant="outline"
          >
            <Link href="/nucleus">
              <LayoutDashboard className="mr-2 h-4 w-4" aria-hidden="true" />
              Nucleus
            </Link>
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              asChild
              className="text-slate-dim hover:bg-nex-surface hover:text-slate-light touch-target"
              onClick={() => track("sign_in_clicked", { location: "header" })}
            >
              <Link href="/auth/signin">Sign In</Link>
            </Button>
            <Button
              asChild
              className="border border-emerald-500/50 bg-emerald-500/10 text-emerald-400 backdrop-blur-sm transition-all hover:border-emerald-500 hover:bg-emerald-500/20 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] touch-target"
              onClick={() =>
                track("connect_ai_clicked", { location: "header" })
              }
            >
              <Link href="/station/connect">
                <Cable className="mr-2 h-4 w-4" aria-hidden="true" />
                Connect Your AI
              </Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
