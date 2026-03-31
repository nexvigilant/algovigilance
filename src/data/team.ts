/**
 * Team & Leadership Data
 *
 * Centralized team member data for the About page and other components.
 * This decouples content from presentation, making updates easier
 * and enabling future CMS integration.
 *
 * @example
 * ```tsx
 * import { leadership, advisors } from '@/data/team';
 * ```
 */

import { SOCIAL_LINKS } from '@/lib/constants/urls';

export interface TeamMember {
  /** Stable unique identifier for React keys and data binding */
  id: string;
  /** Full name with credentials */
  name: string;
  /** Job title or role */
  role: string;
  /** Brief biography */
  bio: string;
  /**
   * Path to headshot image in /public folder.
   * Ensure image exists at build time.
   */
  imageSrc: string;
  /** Optional LinkedIn profile URL */
  linkedIn?: string;
  /** Optional personal website */
  website?: string;
}

/**
 * Core leadership team
 */
export const leadership: TeamMember[] = [
  {
    id: 'matthew-campion',
    name: 'Matthew Campion, PharmD',
    role: 'Founder & CEO',
    bio: 'Matthew founded AlgoVigilance to build a structural firewall between commercial interests and clinical truth — redefining how the industry approaches safety oversight.',
    imageSrc: '/mc_headshot.jpg',
    linkedIn: SOCIAL_LINKS.matthewLinkedIn,
  },
];

/**
 * Advisory board members (for future expansion)
 */
export const advisors: TeamMember[] = [];

/**
 * All team members combined
 */
export const allTeamMembers: TeamMember[] = [...leadership, ...advisors];
