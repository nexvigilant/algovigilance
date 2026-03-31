'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Briefcase,
  Target,
  FolderOpen,
  ClipboardCheck,
  Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useState } from 'react';
import { useDeviceType } from '@/hooks/use-mobile';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  comingSoon?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Overview', href: '/nucleus/careers', icon: Briefcase },
  { label: 'Capability Tracker', href: '/nucleus/careers/skills', icon: Target },
  { label: 'Portfolio', href: '/nucleus/careers/portfolio', icon: FolderOpen, comingSoon: true },
  { label: 'Assessments', href: '/nucleus/careers/assessments', icon: ClipboardCheck, comingSoon: true },
];

export function CareersNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const deviceType = useDeviceType();
  const isMobileOrTablet = deviceType === 'phone' || deviceType === 'tablet';

  const isActive = (href: string) => {
    if (href === '/nucleus/careers') {
      return pathname === href;
    }
    return pathname.startsWith(href);
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
                className="h-14 w-14 rounded-full bg-copper text-nex-deep shadow-lg hover:bg-copper/90"
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open careers menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-72 bg-nex-dark border-nex-light p-0"
            >
              <SheetHeader className="border-b border-nex-light p-4">
                <SheetTitle className="text-copper">Careers</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col p-3 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.comingSoon ? '#' : item.href}
                      onClick={() => !item.comingSoon && setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                        item.comingSoon && 'opacity-50 cursor-not-allowed',
                        active
                          ? 'bg-nex-light text-copper border border-copper/30'
                          : 'bg-nex-dark text-slate-light hover:bg-nex-light hover:text-white'
                      )}
                    >
                      <Icon className={cn('h-5 w-5 flex-shrink-0', active && 'text-copper')} />
                      <span className="flex-1">{item.label}</span>
                      {item.comingSoon && (
                        <span className="text-xs bg-nex-light px-1.5 py-0.5 rounded text-slate-dim">Soon</span>
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
    <nav className="sticky top-16 z-20 w-full border-b border-nex-light bg-nex-dark">
      <div className="flex items-center justify-between px-4 py-2">
        {/* Navigation Items */}
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.comingSoon ? '#' : item.href}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                  item.comingSoon && 'opacity-50 cursor-not-allowed',
                  active
                    ? 'bg-nex-light text-copper border border-copper/30'
                    : 'text-slate-light hover:bg-nex-light hover:text-white'
                )}
              >
                <Icon className={cn('h-4 w-4 flex-shrink-0', active && 'text-copper')} />
                <span>{item.label}</span>
                {item.comingSoon && (
                  <span className="text-xs bg-nex-light px-1.5 py-0.5 rounded text-slate-dim">Soon</span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
