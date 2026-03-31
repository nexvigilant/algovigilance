'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

// Map route segments to human-readable labels for admin
const segmentLabels: Record<string, string> = {
  admin: 'Admin',
  community: 'Community',
  circles: 'Circles',
  moderation: 'Security & Moderation',
  analytics: 'Analytics',
  users: 'Member Management',
  discovery: 'Discovery Config',
  settings: 'Settings',
  edit: 'Edit',
  badges: 'Achievement Systems',
};

interface BreadcrumbItem {
  label: string;
  href: string;
  isLast: boolean;
}

export function AdminCommunityBreadcrumbs() {
  const pathname = usePathname();

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Always start with Admin Community hub
    breadcrumbs.push({
      label: segmentLabels.community,
      href: '/nucleus/admin/community',
      isLast: segments.length <= 3,
    });

    let currentPath = '/nucleus/admin/community';

    // Start processing from after /nucleus/admin/community
    for (let i = 3; i < segments.length; i++) {
      const segment = segments[i];
      currentPath += `/${segment}`;

      const isDynamic = segment.startsWith('[') || /^[a-zA-Z0-9]{20,}$/.test(segment);

      let label = segmentLabels[segment];
      if (!label) {
        if (isDynamic) {
          const parent = segments[i - 1];
          label = parent === 'circles' ? 'Edit Circle' : 'Details';
        } else {
          label = segment
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }
      }

      breadcrumbs.push({
        label,
        href: currentPath,
        isLast: i === segments.length - 1,
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length <= 1 && pathname === '/nucleus/admin/community') {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.href} className="flex items-center gap-1">
            {index === 0 && (
              <ShieldCheck className="mr-1 h-3.5 w-3.5 text-gold" />
            )}
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-slate-dim/50" />
            )}
            {crumb.isLast ? (
              <span className="font-semibold text-white">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className={cn(
                  'text-slate-dim transition-colors hover:text-gold',
                  index === 0 && 'font-medium'
                )}
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
