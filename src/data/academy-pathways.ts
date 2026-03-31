/**
 * Academy Capability Pathways Data
 *
 * Centralized data for AlgoVigilance Academy course categories.
 * This decouples content from presentation, enabling:
 * - CMS integration in the future
 * - Content updates without code deployments
 * - Consistent data across multiple components
 *
 * @example
 * ```tsx
 * import { capabilityPathways, getAvailablePathways } from '@/data/academy-pathways';
 * ```
 */

import { RELEASE_STATUS, type ReleaseStatus } from './launch-timeline';

export interface CapabilityPathway {
  /** Unique identifier for the pathway */
  id: string;
  /** Display title */
  title: string;
  /** Brief description of the pathway */
  description: string;
  /** Current release status */
  status: ReleaseStatus;
  /** URL slug for the pathway detail page (when available) */
  slug: string;
  /** Whether this pathway accepts waitlist signups */
  hasWaitlist: boolean;
  /** Icon name from lucide-react (for future use) */
  icon?: string;
  /** Sort order for display */
  order: number;
}

/**
 * All capability pathways offered by AlgoVigilance Academy
 */
export const capabilityPathways: CapabilityPathway[] = [
  {
    id: 'theory-of-vigilance',
    title: 'Theory of Vigilance',
    description:
      'The universal, axiom-grounded theory of safety monitoring. Five axioms, eleven conservation laws, eight harm types — applicable to any domain where systems affect human welfare.',
    status: RELEASE_STATUS.AVAILABLE,
    slug: 'theory-of-vigilance',
    hasWaitlist: false,
    icon: 'Eye',
    order: 0,
  },
  {
    id: 'pharmacovigilance',
    title: 'Pharmacovigilance',
    description:
      'The backbone of patient safety. Master signal detection, risk management, and global regulatory reporting.',
    status: RELEASE_STATUS.AT_LAUNCH,
    slug: 'pharmacovigilance',
    hasWaitlist: false,
    icon: 'Shield',
    order: 1,
  },
  {
    id: 'clinical-translation',
    title: 'Clinical Translation Protocol',
    description:
      'Execute your healthcare-to-industry transition with precision. Convert clinical expertise into industry-ready operational capability.',
    status: RELEASE_STATUS.AT_LAUNCH,
    slug: 'clinical-translation',
    hasWaitlist: false,
    icon: 'ArrowRightLeft',
    order: 2,
  },
  {
    id: 'executive-command',
    title: 'Executive Command',
    description:
      'Strategic leadership for life sciences. Lead organizational change, shape regulatory strategy, and drive cross-functional results.',
    status: RELEASE_STATUS.AT_LAUNCH,
    slug: 'executive-command',
    hasWaitlist: false,
    icon: 'Crown',
    order: 3,
  },
  {
    id: 'medical-affairs',
    title: 'Medical Affairs',
    description:
      'Medical information, KOL engagement, publication strategy, and scientific communication.',
    status: RELEASE_STATUS.EARLY_2026,
    slug: 'medical-affairs',
    hasWaitlist: true,
    icon: 'Stethoscope',
    order: 4,
  },
  {
    id: 'regulatory-affairs',
    title: 'Regulatory Affairs',
    description:
      'FDA regulations, submission strategies, compliance frameworks, and global regulatory pathways.',
    status: RELEASE_STATUS.EARLY_2026,
    slug: 'regulatory-affairs',
    hasWaitlist: true,
    icon: 'FileCheck',
    order: 5,
  },
  {
    id: 'market-access',
    title: 'Market Access',
    description:
      'HEOR, payer strategy, reimbursement, health economics, and value demonstration.',
    status: RELEASE_STATUS.EARLY_2026,
    slug: 'market-access',
    hasWaitlist: true,
    icon: 'TrendingUp',
    order: 6,
  },
];

/**
 * Get pathways available at launch
 */
export function getLaunchPathways(): CapabilityPathway[] {
  return capabilityPathways
    .filter((p) => p.status === RELEASE_STATUS.AT_LAUNCH)
    .sort((a, b) => a.order - b.order);
}

/**
 * Get pathways coming in future releases
 */
export function getUpcomingPathways(): CapabilityPathway[] {
  return capabilityPathways
    .filter((p) => p.status !== RELEASE_STATUS.AT_LAUNCH && p.status !== RELEASE_STATUS.AVAILABLE)
    .sort((a, b) => a.order - b.order);
}

/**
 * Get all pathways sorted by order
 */
export function getAllPathways(): CapabilityPathway[] {
  return [...capabilityPathways].sort((a, b) => a.order - b.order);
}
