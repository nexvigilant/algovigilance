'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import type { BreadcrumbItem } from '@/components/layout/navigation';

/**
 * Hook to automatically generate breadcrumbs from the current URL path.
 * Starts with the current ecosystem section (Admin, Nucleus, etc.) instead of "Home".
 *
 * @example
 * // For path: /nucleus/admin/academy/courses/abc123/preview
 * // Returns: [
 * //   { label: 'Admin', href: '/nucleus/admin' },
 * //   { label: 'Academy', href: '/nucleus/admin/academy' },
 * //   { label: 'Courses', href: '/nucleus/admin/academy/courses' },
 * //   { label: 'Preview' }
 * // ]
 */
export function useBreadcrumbs(): BreadcrumbItem[] {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    if (!pathname || pathname === '/') return [];

    const segments = pathname.split('/').filter(Boolean);
    const items: BreadcrumbItem[] = [];
    let currentPath = '';

    // Label mappings for common path segments
    const labelMap: Record<string, string> = {
      nucleus: 'Nucleus',
      admin: 'Admin',
      academy: 'Academy',
      courses: 'Courses',
      skills: 'Skills',
      students: 'Students',
      certificates: 'Certificates',
      analytics: 'Analytics',
      pipeline: 'Pipeline',
      community: 'Community',
      profile: 'Profile',
      settings: 'Settings',
      preview: 'Preview',
      edit: 'Edit',
      new: 'New',
      capabilities: 'Capabilities',
      progress: 'Progress',
      bookmarks: 'Bookmarks',
      assessments: 'Assessments',
      learn: 'Learn',
      forums: 'Forums',
      posts: 'Posts',
      messages: 'Messages',
      'competency-assessment': 'Competency Assessment',
      'fellowship-evaluator': 'Fellowship Evaluator',
      'maturity-model': 'Maturity Model',
      'pv-domains': 'PV Domains',
      'ksb-management': 'KSB Management',
    };

    // Process each segment
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      currentPath += `/${segment}`;

      // Skip UUIDs and long alphanumeric IDs (likely course/user IDs)
      if (
        segment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) || // UUID
        segment.match(/^[a-z0-9_-]{20,}$/i) || // Long IDs
        segment.startsWith('test_') || // Test IDs
        segment.match(/^\d{14,}$/) // Timestamp IDs
      ) {
        continue;
      }

      // Get label for segment
      const label = labelMap[segment] || segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      // Determine if this should be a link
      const isLast = i === segments.length - 1;
      const isSecondToLast = i === segments.length - 2;

      // Don't link the last item or items before IDs
      const shouldLink = !isLast && !(isSecondToLast && segments[i + 1].match(/^[a-z0-9_-]{20,}$/i));

      items.push({
        label,
        href: shouldLink ? currentPath : undefined,
      });
    }

    return items;
  }, [pathname]);

  return breadcrumbs;
}
