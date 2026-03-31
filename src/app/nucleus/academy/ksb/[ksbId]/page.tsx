/**
 * KSB Learning Page (Server Component Wrapper)
 *
 * Provides dynamic SEO metadata for Knowledge, Skill, Behavior learning pages.
 * Wraps the client-side interactive KSBLearningPage component.
 *
 * @module app/nucleus/academy/ksb/[ksbId]/page
 */

import type { Metadata } from 'next';
import KSBLearningPage from './ksb-learning-client';

interface PageProps {
  params: Promise<{ ksbId: string }>;
}

/**
 * Parse KSB ID to extract type and generate descriptive title
 * Format: KSB-D01-K0001 (Knowledge), KSB-D01-S0001 (Skill), KSB-D01-B0001 (Behavior)
 */
function parseKsbType(ksbId: string): { type: string; typeLabel: string } {
  const parts = ksbId.split('-');
  if (parts.length >= 3) {
    const componentPart = parts[2]; // K0001, S0001, or B0001
    const typeChar = componentPart?.[0];
    switch (typeChar) {
      case 'K':
        return { type: 'Knowledge', typeLabel: 'Knowledge Component' };
      case 'S':
        return { type: 'Skill', typeLabel: 'Skill Component' };
      case 'B':
        return { type: 'Behavior', typeLabel: 'Behavior Component' };
      default:
        return { type: 'Capability', typeLabel: 'Capability Component' };
    }
  }
  return { type: 'Capability', typeLabel: 'Capability Component' };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { ksbId } = await params;

  const { typeLabel } = parseKsbType(ksbId);

  // KSB data is loaded client-side due to auth requirements
  // We provide a meaningful default based on the ID structure
  const title = `${typeLabel} ${ksbId} | AlgoVigilance Academy`;
  const description = `Build your ${typeLabel.toLowerCase()} through hands-on practice activities and real-world applications.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'AlgoVigilance Academy',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    robots: {
      index: false, // KSB pages are authenticated content
      follow: false,
    },
  };
}

export default function Page() {
  return <KSBLearningPage />;
}
