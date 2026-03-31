'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
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
import { ACADEMY_NAV_ITEMS, ACADEMY_DASHBOARD_PATH } from '@/config/academy';

export function AcademyNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const deviceType = useDeviceType();
  const isMobileOrTablet = deviceType === 'phone' || deviceType === 'tablet';

  const isActive = (href: string) => {
    if (href === ACADEMY_DASHBOARD_PATH) {
      return pathname === href || pathname === '/nucleus/academy';
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
                className="h-14 w-14 rounded-full bg-cyan text-nex-deep shadow-lg hover:bg-cyan/90"
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open academy menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-72 bg-nex-dark border-nex-light p-0"
            >
              <SheetHeader className="border-b border-nex-light p-4">
                <SheetTitle className="text-gold">Academy</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col p-3 space-y-1">
                {ACADEMY_NAV_ITEMS.map((item) => {
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
                          ? 'bg-nex-light text-cyan border border-cyan/30'
                          : 'bg-nex-dark text-slate-light hover:bg-nex-light hover:text-white'
                      )}
                    >
                      <Icon className={cn('h-5 w-5 flex-shrink-0', active && 'text-cyan')} />
                      <span className="flex-1">{item.label}</span>
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
          {ACADEMY_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-nex-light text-cyan border border-cyan/30'
                    : 'text-slate-light hover:bg-nex-light hover:text-white'
                )}
              >
                <Icon className={cn('h-4 w-4 flex-shrink-0', active && 'text-cyan')} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
