/**
 * Membership Page Content Data (Hero & Section Copy)
 *
 * Supplements data/membership.ts (which has FAQs and benefits).
 * This file covers hero text, founding member disclaimer, and
 * FAQ section headers that were hardcoded in the page component.
 *
 * @module data/membership-content
 */

// ============================================================================
// Hero Section
// ============================================================================

export const MEMBERSHIP_HERO = {
  label: 'Professional Society of Pharmacovigilance',
  title: 'We Don\'t Sell Credentials. We Sell the Cause-Effect Chain Between What You Can Do and What You Can Prove.',
  description: '50,000+ people do pharmacovigilance every day. They have no professional society. PSPV changes that.',
  subdescription: 'Every subscriber becomes a founding member with lifetime status when PSPV incorporates as a 501(c)(6).',
} as const;

// ============================================================================
// Founding Member Disclaimer
// ============================================================================

export const FOUNDING_MEMBER_DISCLAIMER = 'PSPV is being incorporated as a 501(c)(6) professional society in Delaware. Founding members at each tier receive lifetime status at their membership class when PSPV incorporates. Professional and Fellow members receive voting rights on PSPV standards and practices. Membership is managed through Patreon during the founding period.' as const;

// ============================================================================
// PSPV Tier Data
// ============================================================================

export const PSPV_TIERS = [
  {
    name: 'Associate Member',
    price: '$9.99/mo',
    audience: 'Early-career PV professionals and career changers',
    description: 'Academy access, weekly signal detection walkthroughs, Boundary Lab speculative science, mentorship matching.',
    cta: 'Join as Associate',
    href: 'https://www.patreon.com/checkout/AlgoVigilance?rid=28204605',
    highlighted: false,
  },
  {
    name: 'Professional Member',
    price: '$19.99/mo',
    audience: 'Practicing PV professionals',
    description: 'KSB competency tracking across 1,286 PV competencies. Build a verifiable portfolio that proves what you know. Voting rights on PSPV standards.',
    cta: 'Join as Professional',
    href: 'https://www.patreon.com/checkout/AlgoVigilance?rid=28242674',
    highlighted: true,
  },
  {
    name: 'Fellow (FPSPV)',
    price: '$29.99/mo',
    audience: 'Senior PV professionals (10+ years)',
    description: 'Committee leadership, publication privileges, mentor role, early tool access. Shape the standards that define the profession.',
    cta: 'Join as Fellow',
    href: 'https://www.patreon.com/checkout/AlgoVigilance?rid=28204610',
    highlighted: false,
  },
  {
    name: 'Organizational Member',
    price: '$49.99/mo',
    audience: 'Companies with PV departments',
    description: 'Co-design sessions, full microgram fleet, SOP templates, 1:1 with the founder. Your department becomes a recognized contributor.',
    cta: 'Join as Organization',
    href: 'https://www.patreon.com/checkout/AlgoVigilance?rid=28242679',
    highlighted: false,
  },
] as const;

// ============================================================================
// FAQ Section
// ============================================================================

export const FAQ_SECTION = {
  label: 'FAQ',
  title: 'Common Questions',
} as const;
