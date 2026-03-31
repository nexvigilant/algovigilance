/**
 * Crate Detail Page (Server Component)
 *
 * Generates SEO metadata from static manifest.
 * Renders CrateDetailClient for interactive UI.
 * Pattern: Same as /academy/ksb/[ksbId]/page.tsx
 */

import type { Metadata } from 'next';
import { getCrateByName, getAllCrateNames } from '@/lib/crate-registry';
import { LAYER_CONFIG } from '@/types/crate-registry';
import { CrateDetailClient } from './crate-detail-client';

interface PageProps {
  params: Promise<{ name: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { name } = await params;
  const decoded = decodeURIComponent(name);
  const crate = getCrateByName(decoded);

  const title = crate
    ? `${crate.name} — ${LAYER_CONFIG[crate.layer].label} | AlgoVigilance Registry`
    : `${decoded} | AlgoVigilance Registry`;

  const description = crate?.description ?? `Crate detail page for ${decoded}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'AlgoVigilance',
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export function generateStaticParams() {
  return getAllCrateNames().map(name => ({ name }));
}

export default async function Page({ params }: PageProps) {
  const { name } = await params;
  return <CrateDetailClient name={decodeURIComponent(name)} />;
}
