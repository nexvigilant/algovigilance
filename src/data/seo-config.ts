/**
 * SEO Configuration - Central source of truth for Schema.org data
 */

import { SITE_CONFIG, SOCIAL_LINKS } from '@/lib/constants/urls';

export const SEO_CONFIG = {
  organization: {
    name: 'AlgoVigilance',
    legalName: 'AlgoVigilance, LLC',
    alternateName: 'AlgoVigilance Nucleus',
    url: SITE_CONFIG.url,
    logo: `${SITE_CONFIG.url}/logo.png`,
    description:
      'Independent safety intelligence and professional development for healthcare professionals.',
    foundingDate: '2025',
    founder: {
      name: 'Matthew Campion',
      jobTitle: 'Founder & Chief Executive',
    },
    address: {
      addressRegion: 'Massachusetts',
      addressCountry: 'US',
    },
    contactEmail: SITE_CONFIG.supportEmail,
    contactUrl: `${SITE_CONFIG.url}/contact`,
    sameAs: [
      SOCIAL_LINKS.linkedin,
      SOCIAL_LINKS.twitter,
      SOCIAL_LINKS.github,
      SOCIAL_LINKS.youtube,
    ],
  },
  website: {
    name: 'AlgoVigilance Nucleus',
    url: SITE_CONFIG.url,
    description:
      'Independent safety intelligence and career development for healthcare professionals.',
  },
} as const;

export type SEOConfig = typeof SEO_CONFIG;
