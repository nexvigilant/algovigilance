'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  Sparkles,
  Users,
  Compass,
  Search,
  Settings,
  Menu,
  UserSearch,
  Route,
  ChevronRight,
  BarChart3,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useState } from 'react';
import { useDeviceType } from '@/hooks/use-mobile';
import { useOnboardingStatus } from '../shared/onboarding-gate';
import { useDynamicSidebar, getTrustLevelBadgeClass } from '../../hooks/use-dynamic-sidebar';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const navItems: NavItem[] = [
  { label: 'Hub', href: '/nucleus/community', icon: Home },
  { label: 'For You', href: '/nucleus/community/for-you', icon: Sparkles },
  { label: 'Circles', href: '/nucleus/community/circles', icon: Users },
  { label: 'Members', href: '/nucleus/community/members', icon: UserSearch },
  { label: 'Discover', href: '/nucleus/community/discover', icon: Compass },
  { label: 'Analytics', href: '/nucleus/community/analytics', icon: BarChart3 },
];

// Secondary nav items - Messages and Notifications are accessible via header NavBadgeIndicators
// to avoid duplicate navigation (WCAG best practice)
const secondaryItems: NavItem[] = [
  { label: 'Search', href: '/nucleus/community/search', icon: Search },
  { label: 'Governance', href: '/nucleus/community/admin/governance', icon: ShieldAlert },
  { label: 'Settings', href: '/nucleus/community/settings/profile', icon: Settings },
];

export function CommunitySidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pathwaysOpen, setPathwaysOpen] = useState(true);
  const deviceType = useDeviceType();
  const { completed, progressPercent } = useOnboardingStatus();
  const { isEnabled: isDynamicSidebarEnabled, pathwayNavItems } = useDynamicSidebar();
  const isMobileOrTablet = deviceType === 'phone' || deviceType === 'tablet';

  const isActive = (href: string) => {
    if (href === '/nucleus/community') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  // Dynamically build nav items based on status
  const activeNavItems = [...navItems];
  if (!completed && progressPercent > 0) {
    activeNavItems.splice(1, 0, {
      label: 'My Pathway',
      href: '/nucleus/community/onboarding',
      icon: Compass
    });
  }


  // Render pathway navigation section
  const renderPathwayNav = () => {
    if (!isDynamicSidebarEnabled || pathwayNavItems.length === 0) return null;

    return (
      <Collapsible open={pathwaysOpen} onOpenChange={setPathwaysOpen}>
        <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium text-gold hover:bg-nex-light rounded-lg transition-colors touch-target">
          <div className="flex items-center gap-2">
            <Route className="h-4 w-4" aria-hidden="true" />
            <span>My Pathways</span>
          </div>
          <ChevronRight className={cn('h-4 w-4 transition-transform', pathwaysOpen && 'rotate-90')} aria-hidden="true" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 pl-4 pt-1">
          {pathwayNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.pathwayId}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 touch-target',
                  active
                    ? 'bg-nex-light text-cyan border border-cyan/30'
                    : 'text-slate-light hover:bg-nex-light hover:text-white'
                )}
              >
                <Icon className={cn('h-4 w-4 flex-shrink-0', active && 'text-cyan')} aria-hidden="true" />
                <span className="flex-1 truncate">{item.pathwayName}</span>
                {item.badge && (
                  <Badge className={cn('text-[10px] px-1.5 py-0', getTrustLevelBadgeClass(item.requiredTrustLevel))}>
                    {item.badge === 'verified' ? 'V' : item.badge === 'expert' ? 'E' : ''}
                  </Badge>
                )}
              </Link>
            );
          })}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  // Mobile: Show hamburger menu that opens a sheet
  if (isMobileOrTablet) {
    return (
      <>
        {/* Mobile Menu Toggle - Fixed position */}
        <div className="fixed bottom-4 left-4 z-50 lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                size="lg"
                className="h-14 w-14 rounded-full bg-cyan text-nex-deep shadow-lg hover:bg-cyan/90"
                aria-label="Open community menu"
              >
                <Menu className="h-6 w-6" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-72 bg-nex-dark border-nex-light p-0"
            >
              <SheetHeader className="border-b border-nex-light p-4">
                <SheetTitle className="text-gold">Community</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col p-3 space-y-1">
                {/* Pathway Navigation (if enabled) */}
                {renderPathwayNav()}
                {isDynamicSidebarEnabled && pathwayNavItems.length > 0 && (
                  <div className="my-2 h-[1px] bg-nex-light" />
                )}
                {/* Standard Navigation */}
                {[...activeNavItems, ...secondaryItems].map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 touch-target',
                        active
                          ? 'bg-nex-light text-cyan border border-cyan/30'
                          : 'bg-nex-dark text-slate-light hover:bg-nex-light hover:text-white'
                      )}
                    >
                      <div className="relative">
                        <Icon className={cn('h-5 w-5 flex-shrink-0', active && 'text-cyan')} aria-hidden="true" />
                        {item.badge && item.badge > 0 && (
                          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan text-[10px] font-bold text-nex-deep" aria-hidden="true">
                            {item.badge > 9 ? '9+' : item.badge}
                          </span>
                        )}
                      </div>
                      <span className="flex-1">{item.label}</span>
                      {item.badge && item.badge > 0 && (
                        <span className="rounded-full bg-cyan/20 px-2 py-0.5 text-xs font-medium text-cyan" aria-hidden="true">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>

      </>
    );
  }

  // Desktop: Horizontal nav bar below header
  return (
    <nav aria-label="Community navigation" className="sticky top-16 z-20 w-full border-b border-nex-light bg-nex-dark">
      <div className="flex items-center justify-between px-4 py-2">
        {/* Primary Navigation - Left */}
        <div className="flex items-center gap-1">
          {activeNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 touch-target',
                  active
                    ? 'bg-nex-light text-cyan border border-cyan/30'
                    : 'text-slate-light hover:bg-nex-light hover:text-white'
                )}
              >
                <Icon className={cn('h-4 w-4 flex-shrink-0', active && 'text-cyan')} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Pathway-specific links (desktop) */}
          {isDynamicSidebarEnabled && pathwayNavItems.length > 0 && (
            <>
              <div className="mx-2 h-4 w-[1px] bg-nex-light" />
              {pathwayNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.pathwayId}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 touch-target',
                      active
                        ? 'bg-gold/10 text-gold border border-gold/30'
                        : 'text-gold/70 hover:bg-gold/10 hover:text-gold'
                    )}
                    title={`${item.pathwayName} (${item.requiredTrustLevel})`}
                  >
                    <Icon className={cn('h-4 w-4 flex-shrink-0', active && 'text-gold')} aria-hidden="true" />
                    <span className="max-w-[100px] truncate">{item.pathwayName}</span>
                  </Link>
                );
              })}
            </>
          )}
        </div>

        {/* Secondary Navigation - Right */}
        <div className="flex items-center gap-1">
          {secondaryItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 touch-target',
                  active
                    ? 'bg-nex-light text-cyan border border-cyan/30'
                    : 'text-slate-light hover:bg-nex-light hover:text-white'
                )}
              >
                <div className="relative">
                  <Icon className={cn('h-4 w-4 flex-shrink-0', active && 'text-cyan')} aria-hidden="true" />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-cyan text-[10px] font-bold text-nex-deep" aria-hidden="true">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
