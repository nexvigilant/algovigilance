import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

// Use consistent base URL for SSR/CSR to prevent hydration mismatch
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://algovigilance.net';

export function Breadcrumbs({ items, className, showHome = true }: BreadcrumbsProps) {
  // Generate Schema.org BreadcrumbList structured data
  // Always use BASE_URL for consistent SSR/CSR output
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      ...(showHome ? [{
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: BASE_URL,
      }] : []),
      ...items.map((item, index) => ({
        '@type': 'ListItem',
        position: showHome ? index + 2 : index + 1,
        name: item.label,
        ...(item.href && {
          item: `${BASE_URL}${item.href}`,
        }),
      })),
    ],
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Visual Breadcrumbs */}
      <nav aria-label="Breadcrumb" className={cn('flex items-center gap-2 text-sm', className)}>
        {/* Home Link (optional) */}
        {showHome && (
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            aria-label="Home"
          >
            <Home className="h-4 w-4" />
          </Link>
        )}

        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isFirst = index === 0;

          return (
            <div key={index} className="flex items-center gap-2">
              {/* Separator (skip before first item if showHome is false) */}
              {(showHome || !isFirst) && (
                <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              )}

              {/* Breadcrumb Item */}
              {isLast || !item.href ? (
                <span className="text-foreground font-medium" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-muted-foreground hover:text-cyan-glow transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </div>
          );
        })}
      </nav>
    </>
  );
}
