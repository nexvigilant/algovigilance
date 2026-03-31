'use client';

/**
 * Nucleus Breadcrumbs - Auto-generated from URL
 *
 * Note: Uses JSON.stringify for JSON-LD structured data (Schema.org).
 * This is safe as we're serializing our own breadcrumb data, not user input.
 */

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs';
import { cn } from '@/lib/utils';

// Consistent base URL for Schema.org (SSR/CSR hydration safety)
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://algovigilance.net';

interface NucleusBreadcrumbsProps {
  className?: string;
  /** Include Schema.org BreadcrumbList structured data for SEO */
  includeSchema?: boolean;
}

/**
 * Auto-generated breadcrumbs for Nucleus authenticated pages.
 * Uses useBreadcrumbs() hook to derive breadcrumbs from current URL.
 *
 * For manual breadcrumbs on public pages, use `Breadcrumbs` instead.
 */
export function NucleusBreadcrumbs({ className, includeSchema = false }: NucleusBreadcrumbsProps) {
  const breadcrumbs = useBreadcrumbs();

  // Don't render if at root or only one level deep
  if (breadcrumbs.length <= 1) {
    return null;
  }

  // Generate Schema.org structured data when enabled
  // Safe: JSON.stringify on our own breadcrumb config, not user input
  const breadcrumbSchema = includeSchema ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.label,
      ...(crumb.href && { item: `${BASE_URL}${crumb.href}` }),
    })),
  } : null;

  return (
    <>
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
           
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
      <nav aria-label="Breadcrumb" className={cn('mb-4', className)}>
        <ol className="flex items-center gap-1 text-sm flex-wrap">
          {breadcrumbs.map((crumb, index) => (
            <li key={crumb.href || crumb.label} className="flex items-center gap-1">
              {index === 0 && (
                <Home className="mr-1 h-3.5 w-3.5 text-slate-dim" aria-hidden="true" />
              )}
              {index > 0 && (
                <ChevronRight className="h-3.5 w-3.5 text-slate-dim/50" aria-hidden="true" />
              )}
              {!crumb.href ? (
                <span className="font-medium text-slate-light" aria-current="page">
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
    </>
  );
}
