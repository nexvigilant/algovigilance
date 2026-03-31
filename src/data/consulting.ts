/**
 * Consulting Page Data
 *
 * Centralized configuration for consulting services, differentiators,
 * and engagement protocol. Decouples content from UI for maintainability.
 *
 * Note: Protocol steps are strategic trade secrets - keep synchronized
 * with /doctrine page content.
 */

import type { LucideIcon } from 'lucide-react';
import { URLS } from '@/lib/constants/urls';
import {
  Compass,
  Radar,
  Target,
  Users,
  Code,
  Eye,
  Lock,
  TrendingUp,
  Shield,
} from 'lucide-react';

// ============================================================================
// Form Source Attribution
// ============================================================================

/**
 * Source identifiers for form attribution.
 * Using an enum prevents typos and enables autocomplete.
 */
export const INQUIRY_SOURCES = {
  CONSULTING_PAGE: 'consulting_page',
  SERVICES_PAGE: 'services_page',
  CONTACT_PAGE: 'contact_page',
  HEADER_CTA: 'header_cta',
  FOOTER_CTA: 'footer_cta',
} as const;

export type InquirySource = (typeof INQUIRY_SOURCES)[keyof typeof INQUIRY_SOURCES];

// ============================================================================
// Service Areas
// ============================================================================

export interface ServiceArea {
  icon: LucideIcon;
  label: string;
  color: string;
}

export const SERVICE_AREAS: ServiceArea[] = [
  { icon: Compass, label: 'Safety Strategy', color: 'text-gold' },
  { icon: Radar, label: 'Risk Assessment', color: 'text-amber-400' },
  { icon: Target, label: 'Operations', color: 'text-emerald-400' },
  { icon: Users, label: 'Team Development', color: 'text-purple-400' },
  { icon: Code, label: 'Safety Systems', color: 'text-blue-400' },
];

// ============================================================================
// Differentiators
// ============================================================================

export interface Differentiator {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const DIFFERENTIATORS: Differentiator[] = [
  {
    icon: Eye,
    title: 'Truly Independent',
    description:
      'We have no ties to technology vendors, service providers, or regulatory bodies. Our advice serves your interests — without conflicts.',
  },
  {
    icon: Lock,
    title: 'Confidential by Default',
    description:
      'Client engagements are confidential. We don\'t publish case studies or share engagement details. Your information stays secure.',
  },
  {
    icon: TrendingUp,
    title: 'Aligned Incentives',
    description:
      'Our compensation is tied to your outcomes, not our hours. When you succeed, we succeed.',
  },
  {
    icon: Shield,
    title: 'Real Clinical Expertise',
    description:
      'Our advisors are practicing healthcare and pharmaceutical professionals — not career consultants.',
  },
];

// ============================================================================
// Engagement Protocol
// ============================================================================

export interface ProtocolStep {
  step: string;
  title: string;
  description: string;
}

/**
 * The AlgoVigilance Engagement Protocol.
 * IMPORTANT: Keep synchronized with /doctrine page content.
 */
export const ENGAGEMENT_PROTOCOL: ProtocolStep[] = [
  {
    step: '01',
    title: 'Discovery',
    description:
      'We start with a confidential conversation to understand your situation, challenges, and goals. You walk away with actionable insights — whether or not we work together.',
  },
  {
    step: '02',
    title: 'Alignment',
    description:
      'We define clear success criteria and scope together. Specific deliverables and milestones are agreed upfront, so everyone is aligned before work begins.',
  },
  {
    step: '03',
    title: 'Build',
    description:
      'Our advisors work alongside your team to build lasting capabilities — not dependency. You stay informed throughout.',
  },
  {
    step: '04',
    title: 'Measure',
    description:
      'We measure results against the success criteria we set together. Our compensation is tied to your outcomes, not our hours.',
  },
];

// ============================================================================
// Routes
// ============================================================================

export const CONSULTING_ROUTES = {
  services: '/services',
  schedule: '/schedule',
  contact: '/contact',
} as const;

// ============================================================================
// External Links
// ============================================================================

export const EXTERNAL_LINKS = {
  calendar: URLS.bookingCalendar,
} as const;
