'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  FileText,
  Image,
  Mail,
  UserPlus,
  Menu,
  Newspaper,
  ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useState, useEffect } from 'react';
import { useDeviceType } from '@/hooks/use-mobile';
import { TIMING } from '@/lib/constants/timing';
import { getPlatformStats, type PlatformStats } from '../platform-stats-actions';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: 'Hub', href: '/nucleus/admin', icon: LayoutDashboard },
  { label: 'Academy', href: '/nucleus/admin/academy', icon: BookOpen },
  { label: 'Community', href: '/nucleus/admin/community', icon: Users },
  { label: 'Intelligence', href: '/nucleus/admin/intelligence', icon: Newspaper },
  { label: 'Content', href: '/nucleus/admin/content', icon: FileText },
  { label: 'Media', href: '/nucleus/admin/media', icon: Image },
  { label: 'Leads', href: '/nucleus/admin/website-leads', icon: ClipboardList },
  { label: 'Waitlist', href: '/nucleus/admin/waitlist', icon: Mail },
  { label: 'Affiliates', href: '/nucleus/admin/affiliate-applications', icon: UserPlus },
];

export function AdminNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const deviceType = useDeviceType();
  const isMobileOrTablet = deviceType === 'phone' || deviceType === 'tablet';

  useEffect(() => {
    async function loadStats() {
      const data = await getPlatformStats();
      setStats(data);
    }
    loadStats();
    // Refresh stats every 5 minutes
    const interval = setInterval(loadStats, TIMING.dashboardStatsRefresh);
    return () => clearInterval(interval);
  }, []);

  const isActive = (href: string) => {
    if (href === '/nucleus/admin') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const renderLeadBadge = (itemLabel: string) => {
    if (itemLabel === 'Leads' && stats && stats.criticalLeads > 0) {
      return (
        <span className="relative flex h-2 w-2 ml-1">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-glow shadow-glow-cyan"></span>
        </span>
      );
    }
    return null;
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
                className="h-14 w-14 rounded-full bg-amber-500 text-nex-deep shadow-lg hover:bg-amber-500/90"
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open admin menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-72 bg-nex-dark border-nex-light p-0"
            >
              <SheetHeader className="border-b border-nex-light p-4">
                <SheetTitle className="text-amber-400">Admin</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col p-3 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                        active
                          ? 'bg-nex-light text-amber-400 border border-amber-500/30'
                          : 'bg-nex-dark text-slate-light hover:bg-nex-light hover:text-white'
                      )}
                    >
                      <Icon className={cn('h-5 w-5 flex-shrink-0', active && 'text-amber-400')} />
                      <span className="flex-1">{item.label}</span>
                      {renderLeadBadge(item.label)}
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
    <nav className="sticky top-16 z-20 w-full border-b border-nex-light bg-nex-dark">
      <div className="flex items-center justify-between px-4 py-2">
        {/* Navigation Items */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap group',
                  active
                    ? 'bg-nex-light text-amber-400 border border-amber-500/30'
                    : 'text-slate-light hover:bg-nex-light hover:text-white'
                )}
              >
                <Icon className={cn('h-4 w-4 flex-shrink-0', active && 'text-amber-400')} />
                <span>{item.label}</span>
                {renderLeadBadge(item.label)}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
