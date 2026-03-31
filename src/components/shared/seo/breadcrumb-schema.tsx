/**
 * BreadcrumbSchema - Standalone Schema.org BreadcrumbList markup
 *
 * Use this when you need breadcrumb structured data without the visual component,
 * or when building custom breadcrumb UIs that still need SEO markup.
 *
 * SECURITY NOTE: This component uses dangerouslySetInnerHTML for JSON-LD output.
 * This is SAFE because:
 * 1. We use JSON.stringify() which escapes all special characters
 * 2. Input is our own breadcrumb config, not user-provided content
 * 3. This is the standard pattern for Schema.org structured data in React
 *
 * See: https://developers.google.com/search/docs/appearance/structured-data
 */

import type { BreadcrumbItem } from '@/components/layout/navigation';

// Use consistent base URL for SSR/CSR to prevent hydration mismatch
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://algovigilance.net';

interface BreadcrumbSchemaProps {
  /** Array of breadcrumb items */
  items: BreadcrumbItem[];
  /** Whether to include Home as the first item (default: true) */
  showHome?: boolean;
}

/**
 * Generates Schema.org BreadcrumbList structured data for SEO.
 *
 * @example
 * // In a page component
 * <BreadcrumbSchema
 *   items={[
 *     { label: 'Academy', href: '/academy' },
 *     { label: 'Courses', href: '/academy/courses' },
 *     { label: 'Pharmacovigilance Fundamentals' }, // Current page (no href)
 *   ]}
 * />
 */
export function BreadcrumbSchema({ items, showHome = true }: BreadcrumbSchemaProps) {
  // Build Schema.org BreadcrumbList - safe config data only
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      ...(showHome
        ? [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: BASE_URL,
            },
          ]
        : []),
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

  // JSON.stringify safely escapes the config for JSON-LD output
  const jsonLd = JSON.stringify(breadcrumbSchema);

  return (
    <script
      type="application/ld+json"
      // Safe: JSON.stringify on our own breadcrumb config data
       
      dangerouslySetInnerHTML={{ __html: jsonLd }}
    />
  );
}
