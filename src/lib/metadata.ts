/**
 * Metadata Generator Utility
 *
 * Creates consistent Next.js metadata objects to eliminate duplication
 * between title, openGraph, and twitter fields.
 *
 * @example
 * ```tsx
 * import { createMetadata } from '@/lib/metadata';
 *
 * export const metadata = createMetadata({
 *   title: 'Community',
 *   description: 'Connect with practitioners...',
 *   path: '/community',
 * });
 * ```
 */

import type { Metadata } from 'next';

const SITE_NAME = 'AlgoVigilance';
const DEFAULT_IMAGE = '/og-image.png';

/**
 * Determine the base URL for metadata.
 *
 * Priority order:
 * 1. NEXT_PUBLIC_BASE_URL (explicit override)
 * 2. VERCEL_URL (preview deployments on Vercel)
 * 3. VERCEL_PROJECT_PRODUCTION_URL (production on Vercel)
 * 4. Production fallback
 *
 * Note: VERCEL_URL doesn't include protocol, so we add https://
 */
export function getBaseUrl(): string {
  // Explicit override takes priority
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  // Vercel preview deployments (e.g., pr-123-nexvigilant.vercel.app)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Vercel production URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  // Final fallback
  return 'https://algovigilance.com';
}

const BASE_URL = getBaseUrl();

export interface MetadataInput {
  /** Page title (layout template appends " | AlgoVigilance" automatically) */
  title: string;
  /** Meta description for SEO */
  description: string;
  /** URL path (e.g., '/community') */
  path?: string;
  /** Custom OG image path (defaults to /og-image.png) */
  image?: string;
  /** Image alt text */
  imageAlt?: string;
  /** Additional keywords for SEO */
  keywords?: string[];
  /** Whether to include the site name suffix in title */
  includeSiteName?: boolean;
  /** Whether to tell search engines not to index this page */
  noIndex?: boolean;
}

/**
 * Create a complete Next.js Metadata object with consistent structure
 */
export function createMetadata({
  title,
  description,
  path,
  image = DEFAULT_IMAGE,
  imageAlt,
  keywords,
  includeSiteName = true,
  noIndex = false,
}: MetadataInput): Metadata {
  const ogTitle = includeSiteName ? `${title} | ${SITE_NAME}` : title;
  const url = path ? `${BASE_URL}${path}` : undefined;
  const imageUrl = image.startsWith('http') ? image : `${BASE_URL}${image}`;

  const metadata: Metadata = {
    title,
    description,
    robots: noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: ogTitle,
      description,
      url,
      siteName: SITE_NAME,
      type: 'website',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: imageAlt || `${title} - ${SITE_NAME}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      images: [imageUrl],
    },
  };

  if (keywords && keywords.length > 0) {
    metadata.keywords = keywords;
  }

  return metadata;
}

/**
 * Create metadata for intelligence/blog articles
 */
export function createArticleMetadata({
  title,
  description,
  path,
  image,
  imageAlt,
  publishedTime,
  authors,
  tags,
}: MetadataInput & {
  publishedTime?: string;
  authors?: string[];
  tags?: string[];
}): Metadata {
  const base = createMetadata({ title, description, path, image, imageAlt });

  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      type: 'article',
      publishedTime,
      authors,
      tags,
    },
  };
}
