'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

// Map route segments to human-readable labels
const segmentLabels: Record<string, string> = {
  community: 'Community',
  'for-you': 'For You',
  discover: 'Discover',
  results: 'Results',
  matches: 'Your Matches',
  search: 'Search',
  members: 'Members',
  messages: 'Messages',
  notifications: 'Notifications',
  settings: 'Settings',
  profile: 'Profile',
  circles: 'Circles',
  analytics: 'Analytics',
  onboarding: 'Getting Started',
  'find-your-home': 'AI Match', // Legacy route - redirects to discover
  'create-post': 'New Post',
  create: 'Create Circle',
  post: 'Post',
  admin: 'Admin',
  governance: 'Governance',
};

interface BreadcrumbItem {
  label: string;
  href: string;
  isLast: boolean;
}

export function CommunityBreadcrumbs() {
  const pathname = usePathname();

  // Generate breadcrumb items from pathname
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Always start with Community hub
    breadcrumbs.push({
      label: 'Community',
      href: '/nucleus/community',
      isLast: segments.length <= 2,
    });

    // Skip 'nucleus' and 'community' in path building
    let currentPath = '/nucleus/community';

    for (let i = 2; i < segments.length; i++) {
      const segment = segments[i];
      currentPath += `/${segment}`;

      // Skip dynamic segments (like [category] or [postId]) in breadcrumb labels
      // but still build the path
      const isDynamic = segment.startsWith('[') || /^[a-zA-Z0-9]{20,}$/.test(segment);

      // Get label - use mapped label or format the segment
      let label = segmentLabels[segment];
      if (!label) {
        if (isDynamic) {
          // For dynamic segments, use a generic label based on parent
          const parent = segments[i - 1];
          if (parent === 'circles') {
            label = 'Circle';
          } else if (parent === 'post') {
            label = 'Discussion';
          } else if (parent === 'members') {
            label = 'Profile';
          } else if (parent === 'messages') {
            label = 'Conversation';
          } else {
            label = 'Details';
          }
        } else {
          // Format segment as title case
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

  // Don't render if only at community root
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.href} className="flex items-center gap-1">
            {index === 0 && (
              <Home className="mr-1 h-3.5 w-3.5 text-slate-dim" />
            )}
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-slate-dim/50" />
            )}
            {crumb.isLast ? (
              <span className="font-medium text-slate-light">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className={cn(
                  'text-slate-dim transition-colors hover:text-cyan',
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
