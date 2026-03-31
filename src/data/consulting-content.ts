/**
 * Consulting Page Content Data (Hero & Section Copy)
 *
 * Supplements data/consulting.ts (which has SERVICE_AREAS, DIFFERENTIATORS,
 * ENGAGEMENT_PROTOCOL, ROUTES). This file covers the remaining hero text,
 * section headers, and CTA copy that were hardcoded in the page component.
 *
 * @module data/consulting-content
 */

// ============================================================================
// Hero Section
// ============================================================================

export const CONSULTING_HERO = {
  badge: 'Independent Safety Advisory',
  title: 'Build Stronger Safety Organizations',
  description: 'We help pharmaceutical companies strengthen their safety operations — with independence, clinical expertise, and a focus on measurable outcomes.',
  subtitle: 'AlgoVigilance combines clinical expertise, data science, and strategic foresight. We build your capabilities so you can operate independently — not create dependency on us.',
  tagline: 'Independent advice. Measurable outcomes. Aligned incentives.',
  ctaText: 'Start a Conversation',
} as const;

// ============================================================================
// Service Discovery CTA
// ============================================================================

export const SERVICE_DISCOVERY_CTA = {
  title: 'Find the Right Fit',
  description: 'Answer a few questions about your organization and we\'ll recommend the service that fits your needs.',
  ctaText: 'Get a Recommendation',
} as const;

// ============================================================================
// Engagement Protocol Section Header
// ============================================================================

export const ENGAGEMENT_SECTION = {
  label: 'How We Work',
  title: 'Our Process',
  description: 'Every engagement follows a clear process. We understand before we advise. We measure before we call it done.',
} as const;

// ============================================================================
// Contact CTA Section
// ============================================================================

export const CONTACT_CTA = {
  label: 'Contact',
  title: 'Let\'s Talk',
  description: 'Ready to strengthen your safety organization? Schedule a free introductory call — no commitment required.',
} as const;

// ============================================================================
// Quick Chat Section
// ============================================================================

export const QUICK_CHAT = {
  title: 'Prefer a Quick Chat?',
  description: "Have a question or want to start with a brief call? Book a time directly or use our contact form.",
  promises: [
    'Response within 24 hours',
    'No commitment required',
    'Free initial consultation',
  ],
} as const;
