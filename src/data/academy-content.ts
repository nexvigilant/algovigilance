/**
 * Academy Page Content Data
 *
 * Section headers, value propositions, feature lists, and CTA copy
 * for the public academy marketing page.
 *
 * @module data/academy-content
 */

// ============================================================================
// Section Headers
// ============================================================================

export const ACADEMY_HERO = {
  title: 'AlgoVigilance Academy',
  description: 'Go from clinical knowledge to industry-ready skills. Practical training with verified credentials, built for the realities of safety practice.',
  ctaPrimary: 'Explore Pathways',
  ctaPrimaryHref: '#pathways',
  ctaSecondary: 'Sign Up Free',
  ctaSecondaryHref: '/auth/signup',
} as const;

export const VALUE_PROP_SECTION = {
  label: 'Our Approach',
  title: 'Skills You Can Prove, Not Just Claim',
  description: 'Credentials get old. Capabilities grow. We give you a living, verifiable record of what you can actually do — not just another certificate for the wall.',
} as const;

export const ACCESS_PROTOCOL_SECTION = {
  label: 'What\'s Included',
  title: 'Free During Open Beta',
  description: 'Full Academy access is included while we\'re in open beta — no payment, no credit card required.',
  features: [
    'Unlimited Pathway Access',
    'All Future Pathways',
    'Capability Verifications',
  ],
  footnote: 'Founding rate locks in permanently when pricing launches. Sign up now to secure it.',
} as const;

export const PATHWAYS_SECTION = {
  label: 'What You\'ll Build',
  title: 'Capability Pathways',
  description: 'Specialized tracks that turn clinical knowledge into practical, industry-ready skills.',
} as const;

export const PLATFORM_SECTION = {
  label: 'The Platform',
  title: 'Built for Professionals, Not Consumers',
  description: 'No gamification, no filler. Just rigorous capability tracking, clear taxonomy, and real role-readiness — built to industry standards.',
} as const;

// ============================================================================
// Pharmaceutical Advantage Card
// ============================================================================

export const PHARMA_ADVANTAGE = {
  title: 'Why This Is Different',
  subtitle: 'Generic platforms optimize for engagement. We optimize for your next role.',
  columns: [
    {
      title: 'Industry-Aligned Framework',
      variant: 'cyan' as const,
      items: [
        'Covers critical safety, regulatory, and technical domains in depth',
        'Aligned with global regulatory and industry standards',
        'Tracks what you can do, not just what you\'ve watched',
      ],
    },
    {
      title: 'Career Advancement Tools',
      variant: 'gold' as const,
      items: [
        'See exactly where your skills match target roles',
        'Guided pathways to close specific gaps',
        'Benchmark your capabilities against market expectations',
      ],
    },
  ],
  footer: {
    primary: 'Built by safety professionals. Validated by industry standards.',
    secondary: 'We build capabilities, not content libraries.',
  },
  ctaText: 'Sign Up Free',
  ctaHref: '/auth/signup',
} as const;

// ============================================================================
// Capability Verification Section
// ============================================================================

export const CAPABILITY_VERIFICATION = {
  title: 'Verifiable Proof of Capability',
  description: 'Every skill you verify gets a permanent, unique record (format: NVA-YYYY-XXXXX) that anyone can check — accessible at',
  verifyPathSuffix: '/verify/[verification-id]',
  exampleId: 'NVA-2025-12345',
  examplePath: '/verify/NVA-2025-12345',
} as const;

// ============================================================================
// CTA Section
// ============================================================================

export const CTA_SECTION = {
  label: 'Get Started',
  title: 'Ready to Build Your Skills?',
  description: 'Get full Academy access, join our professional network, and start building the capabilities that advance your career — free during open beta.',
  ctaText: 'Sign Up Free',
  ctaHref: '/auth/signup',
  disclaimer: 'Beta is open. No credit card. Founding rate locks in at launch.',
} as const;

// ============================================================================
// Independence Statement
// ============================================================================

export const INDEPENDENCE_STATEMENT = {
  title: 'No Sponsors. No Conflicts.',
  description: 'Our training is funded by members, not manufacturers. We accept no industry sponsorship — so our curriculum serves patient safety, not corporate interests.',
} as const;
