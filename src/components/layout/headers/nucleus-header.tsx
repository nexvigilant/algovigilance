"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ChevronRight } from "lucide-react";
import { UniversalNavMenu } from "@/components/layout/navigation";
import { NavBadgeIndicators } from "@/components/nav-badge-indicators";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { BrandName } from "@/components/shared/branding";
import { CommandPalette, SearchTrigger } from "@/components/command-palette";

export function NucleusHeader() {
  const pathname = usePathname();
  const breadcrumbs = useBreadcrumbs();

  // Check if we're at Nucleus home (show logo prominently)
  const isNucleusHome = pathname === "/nucleus";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-nex-light bg-nex-dark">
      <div className="max-w-7xl mx-auto">
        <div className="flex h-14 items-center justify-between px-4 gap-4">
          {/* Left: Breadcrumbs (or Logo at home) */}
          <nav aria-label="Breadcrumb" className="flex-1 min-w-0">
            {isNucleusHome ? (
              // At Nucleus home - show logo
              <Link
                href="/nucleus"
                className="flex items-center hover:opacity-80 transition-opacity touch-target py-2"
              >
                <BrandName size="md" />
              </Link>
            ) : (
              // Deeper in app - show breadcrumbs
              <ol className="flex items-center gap-1 text-sm">
                {breadcrumbs.map((crumb, index) => (
                  <li
                    key={crumb.href || crumb.label}
                    className="flex items-center gap-1 min-w-0"
                  >
                    {index === 0 ? (
                      // First item: Home icon linking to Nucleus
                      <Link
                        href="/nucleus"
                        className="flex items-center gap-1.5 text-slate-dim hover:text-cyan transition-colors touch-target py-2"
                        aria-label="Nucleus Home"
                      >
                        <Home
                          className="h-4 w-4 flex-shrink-0"
                          aria-hidden="true"
                        />
                        <span className="hidden sm:inline">Nucleus</span>
                      </Link>
                    ) : (
                      <>
                        <ChevronRight
                          className="h-3.5 w-3.5 text-slate-dim/50 flex-shrink-0"
                          aria-hidden="true"
                        />
                        {!crumb.href ? (
                          // Current page (no link) - aria-current for screen readers
                          <span
                            className="font-medium text-slate-light truncate max-w-[150px] sm:max-w-[200px]"
                            aria-current="page"
                          >
                            {crumb.label}
                          </span>
                        ) : (
                          // Linkable parent
                          <Link
                            href={crumb.href}
                            className="text-slate-dim hover:text-cyan transition-colors truncate max-w-[100px] sm:max-w-[150px] touch-target flex items-center py-2"
                          >
                            {crumb.label}
                          </Link>
                        )}
                      </>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </nav>

          {/* Center: Logo (only when not at home, acts as home link) */}
          {!isNucleusHome && (
            <Link
              href="/nucleus"
              className="hidden md:flex items-center hover:opacity-80 transition-opacity absolute left-1/2 -translate-x-1/2 touch-target py-2"
              aria-label="Go to Nucleus Home"
            >
              <BrandName size="md" className="opacity-80" />
            </Link>
          )}

          {/* Center-right: Search trigger */}
          <SearchTrigger />

          {/* Right: Messages, Notifications & User Profile Menu */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <NavBadgeIndicators />
            <UniversalNavMenu />
          </div>
        </div>
      </div>

      {/* Command palette (Cmd+K) — keyboard shortcut always active */}
      <CommandPalette />
    </header>
  );
}
