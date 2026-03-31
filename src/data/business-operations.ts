/**
 * Business Operations Configuration
 *
 * Centralized contact information, operational hours, and business commitments.
 * Single source of truth for all business contact data across the site.
 *
 * @module data/business-operations
 */

import { SITE_CONFIG, SOCIAL_LINKS as GLOBAL_SOCIAL_LINKS } from '@/lib/constants/urls';

/**
 * Contact email addresses by department
 */
export const CONTACT_EMAILS = {
  /** Services and enterprise solutions inquiries */
  solutions: `solutions@${SITE_CONFIG.domain}`,
  /** Member support and operations */
  support: SITE_CONFIG.supportEmail,
  /** Legal and privacy matters */
  legal: `legal@${SITE_CONFIG.domain}`,
} as const;

/**
 * Department labels for display
 */
export const CONTACT_DEPARTMENTS = {
  solutions: 'Services and Solutions',
  support: 'Member Operations',
  legal: 'Legal & Privacy',
} as const;

/**
 * Website URLs
 */
export const WEBSITE_URLS = {
  main: SITE_CONFIG.url,
  displayName: SITE_CONFIG.domain,
} as const;

/**
 * Operational hours configuration
 */
export const OPERATIONAL_HOURS = {
  /** Weekday schedule display string */
  weekdays: 'Monday – Friday: 0900 – 1700 EST',
  /** Timezone */
  timezone: 'EST',
  /** Start hour (24h format) */
  startHour: 9,
  /** End hour (24h format) */
  endHour: 17,
} as const;

/**
 * Response time commitments
 */
export const RESPONSE_COMMITMENTS = {
  /** Standard response time in hours */
  standardResponseHours: 24,
  /** Display string for response commitment */
  responseMessage: 'We respond within 24 hours.',
} as const;

/**
 * Service commitments and guarantees
 */
export const SERVICE_COMMITMENTS = {
  /** Complimentary initial consultation */
  complimentaryDiagnosis: {
    enabled: true,
    title: 'Free Initial Consultation',
    description:
      'Your first conversation is always free. No obligations — just honest advice.',
  },
  /** Risk-sharing engagement model */
  riskSharing: {
    enabled: true,
    title: 'Aligned Incentives',
    description:
      'Our fees are tied to your results, not our hours. We succeed when you succeed.',
  },
  /** No commitment required for initial contact */
  noCommitment: {
    enabled: true,
    message: 'No commitment required',
  },
} as const;

/**
 * Consulting page specific promises
 */
export const CONSULTING_PROMISES = {
  responseTime: 'Response within 24 hours',
  noCommitment: 'No commitment required',
  diagnosis: 'Free initial consultation',
} as const;

/**
 * Social media links (for future use)
 */
export const SOCIAL_LINKS = {
  linkedin: GLOBAL_SOCIAL_LINKS.linkedin,
  // Add more as needed
} as const;

/**
 * Helper to get mailto link for a department
 */
export function getMailtoLink(
  department: keyof typeof CONTACT_EMAILS,
  subject?: string
): string {
  const email = CONTACT_EMAILS[department];
  if (subject) {
    return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
  }
  return `mailto:${email}`;
}

/**
 * Combined contact info for display in contact cards
 */
export const CONTACT_INFO_CARDS = [
  {
    department: 'solutions' as const,
    label: CONTACT_DEPARTMENTS.solutions,
    email: CONTACT_EMAILS.solutions,
  },
  {
    department: 'support' as const,
    label: CONTACT_DEPARTMENTS.support,
    email: CONTACT_EMAILS.support,
  },
  {
    department: 'legal' as const,
    label: CONTACT_DEPARTMENTS.legal,
    email: CONTACT_EMAILS.legal,
  },
];
