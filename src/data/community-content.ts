/**
 * Community Page Content Data
 *
 * Hero copy, value propositions, founding member profiles, and discovery quiz CTA.
 * Decouples marketing content from component rendering.
 *
 * @module data/community-content
 */

import type { LucideIcon } from 'lucide-react';
import { Users, Shield, TrendingUp } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface CommunityValueProp {
  title: string;
  description: string;
}

export interface FoundingMemberProfile {
  title: string;
  description: string;
  icon: LucideIcon;
  iconClassName: string;
  borderHoverColor: 'cyan' | 'gold';
}

export interface DiscoveryQuizCta {
  title: string;
  description: string;
  ctaText: string;
  ctaHref: string;
}

// ============================================================================
// Hero Content
// ============================================================================

export const COMMUNITY_HERO = {
  title: 'Where Independent Professionals Grow',
  description: "A network built for vigilant professionals who want to advance their careers, sharpen their skills, and stay committed to critical safety outcomes.",
  tagline: 'Your career, on your terms.',
} as const;

// ============================================================================
// Discovery Quiz CTA
// ============================================================================

export const DISCOVERY_QUIZ_CTA: DiscoveryQuizCta = {
  title: 'Find Where You Fit Best',
  description: 'Take our 2-minute assessment to match your expertise with the right projects, networks, and opportunities.',
  ctaText: 'Start Assessment',
  ctaHref: '/community/discover',
};

// ============================================================================
// Ecosystem Section
// ============================================================================

export const ECOSYSTEM_SECTION = {
  label: 'The Community',
  title: 'Built By and For Practitioners',
  description: "The AlgoVigilance Community\u2122 gives you the tools, insights, and professional network to advocate for patients and advance your career at the same time.",
  secondParagraph: 'Connect with peers who share your commitment to patient safety. Build real capabilities. Access independent insights you can trust.',
  ctaText: 'Join the Community',
  ctaHref: '/auth/signup',
} as const;

// ============================================================================
// Value Propositions ("What We Are Building Together")
// ============================================================================

export const COMMUNITY_VALUE_PROPS: CommunityValueProp[] = [
  {
    title: 'Prove What You Can Do',
    description: 'Show your expertise through practical assessments that demonstrate real capability — not just credentials on a resume.',
  },
  {
    title: 'Professional-Grade Tools',
    description: 'Access frameworks, SOPs, and governance tools built by and for safety professionals.',
  },
  {
    title: 'Independent Insights',
    description: 'Get safety insights that are free from commercial influence. No sponsors, no conflicts.',
  },
  {
    title: 'Find Your People',
    description: 'Connect with peers who share your standards, and discover where your skills create the most impact.',
  },
];

// ============================================================================
// Founding Member Profiles
// ============================================================================

export const FOUNDING_MEMBER_PROFILES: FoundingMemberProfile[] = [
  {
    title: 'The Builder',
    description: "You see what needs to change and you build the solution. You'd rather create something better than complain about what exists.",
    icon: Users,
    iconClassName: 'text-cyan',
    borderHoverColor: 'cyan',
  },
  {
    title: 'The Safety Champion',
    description: 'Patient safety is your north star. You want a platform that supports your commitment to clinical integrity — without holding back your career.',
    icon: Shield,
    iconClassName: 'text-gold',
    borderHoverColor: 'gold',
  },
  {
    title: 'The Results-Driven Professional',
    description: 'You measure success by the impact you make, not the titles you hold. You value demonstrated capability over traditional credentials.',
    icon: TrendingUp,
    iconClassName: 'text-cyan',
    borderHoverColor: 'cyan',
  },
];

// ============================================================================
// Profile Section Header
// ============================================================================

export const PROFILE_SECTION = {
  label: 'Who It\'s For',
  title: 'Is This You?',
  description: 'AlgoVigilance is built for professionals who want to do meaningful work and grow on their own terms.',
} as const;
