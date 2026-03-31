"use client";

import Link from "next/link";
import {
  LogOut,
  User,
  Home,
  BookOpen,
  Telescope,
  Scale,
  Activity,
  Wrench,
  Hammer,
  Users,
  Briefcase,
  Store,
  Bell,
  ShieldCheck,
  Radio,
  Building2,
  CreditCard,
  Settings,
  HeartPulse,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { trackEvent } from "@/lib/analytics";
import {
  platformSections,
  platformUtilityRoutes,
} from "@/config/site-navigation";

import { logger } from "@/lib/logger";
const log = logger.scope("components/universal-nav-menu");

// ============================================================================
// Icon map — presentation concern, keyed by path
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
  "/nucleus/vitals": HeartPulse,
  "/nucleus/alerts": Bell,
  "/nucleus/guardian": ShieldCheck,
  "/nucleus/live-feed": Radio,
  "/nucleus/organization": Building2,
  "/nucleus/billing": CreditCard,
  "/nucleus/admin": Settings,
};

export function UniversalNavMenu() {
  const { user } = useAuth();
  const handleSignOut = async () => {
    try {
      trackEvent("user_signed_out", { route: window.location.pathname });
      await signOut(auth);
      window.location.href = "/";
    } catch (error) {
      log.error("Error signing out:", error);
    }
  };

  const initials = user?.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user?.email?.[0].toUpperCase() || "U";

  const profileRoute = platformUtilityRoutes.find(
    (r) => r.path === "/nucleus/profile",
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-11 w-11 rounded-full backdrop-blur-sm bg-nex-surface/50 border border-cyan/30 hover:bg-nex-light/50 hover:border-cyan/50 focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-nex-dark"
          aria-label="User menu"
        >
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-cyan/20 text-cyan-glow font-semibold border border-cyan/30">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 bg-nex-surface/95 backdrop-blur-sm border-cyan/30"
        align="end"
        forceMount
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-cyan-soft">
              {user?.displayName || "User"}
            </p>
            <p className="text-xs leading-none text-cyan-glow/60">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-cyan/20" />

        {/* Nucleus Home */}
        <DropdownMenuItem
          asChild
          className="cursor-pointer text-cyan-soft focus:text-cyan-pale focus:bg-cyan/10"
        >
          <Link href="/nucleus">
            <Home className="mr-2 h-4 w-4" aria-hidden="true" />
            <span>Nucleus Home</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-cyan/20" />

        {/* Registry-driven section groups */}
        {platformSections.map((section, sectionIndex) => (
          <DropdownMenuGroup key={section.id}>
            {sectionIndex > 0 && (
              <DropdownMenuSeparator className="bg-cyan/10" />
            )}
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-cyan-glow/40 py-1">
              {section.label}
            </DropdownMenuLabel>
            {section.pages.map((page) => {
              const Icon = PAGE_ICONS[page.path];
              return (
                <DropdownMenuItem
                  key={page.path}
                  asChild
                  className="cursor-pointer text-cyan-soft focus:text-cyan-pale focus:bg-cyan/10"
                >
                  <Link href={page.path}>
                    {Icon && (
                      <Icon className="mr-2 h-4 w-4" aria-hidden="true" />
                    )}
                    <span>{page.title}</span>
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>
        ))}

        <DropdownMenuSeparator className="bg-cyan/20" />

        {/* Profile & Settings */}
        <DropdownMenuItem
          asChild
          className="cursor-pointer text-cyan-soft focus:text-cyan-pale focus:bg-cyan/10"
        >
          <Link href={profileRoute?.path ?? "/nucleus/profile"}>
            <User className="mr-2 h-4 w-4" aria-hidden="true" />
            <span>Profile & Settings</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-cyan/20" />

        {/* Sign Out */}
        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer text-red-400 focus:text-red-300 focus:bg-red-500/10"
        >
          <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
