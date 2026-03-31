/**
 * Careers Page Content Data
 *
 * Hero content and ComingSoon features for the careers page.
 *
 * @module data/careers-content
 */

export const CAREERS_HERO = {
  label: 'Career Placement',
  description: 'We match qualified professionals with vetted roles — cutting through the noise of traditional recruiting.',
} as const;

export const CAREERS_COMING_SOON = {
  title: 'Smart Matching, Real Roles',
  description: 'A talent pipeline for verified capabilities, not keyword bingo. We match what you can do with where you\'re needed.',
  waitlistTitle: 'Get Early Access',
  waitlistBody: 'Founding Members get priority placement and early access when we launch. Join the Community to secure your spot.',
} as const;

export const CAREERS_FEATURES: string[] = [
  'Vetted Opportunities Only',
  'Skills-Based Matching',
  'Market Value Benchmarking',
  'Clinical-to-Industry Guidance',
  'Capability-Role Fit Analysis',
  'Direct Employer Connections',
];
