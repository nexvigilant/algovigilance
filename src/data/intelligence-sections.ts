/**
 * Intelligence Section Configuration
 *
 * Centralized metadata for all intelligence content sections.
 * Used across the intelligence page, components, and navigation.
 *
 * @module data/intelligence-sections
 */

import type { ContentType } from '@/types/intelligence';

export interface IntelligenceSection {
  /** Unique identifier matching ContentType */
  id: ContentType;
  /** Display title for the section */
  title: string;
  /** URL-friendly slug for filtering */
  filterParam: string;
  /** Short description of content type */
  description: string;
  /** Visual theme color name */
  theme: 'slate' | 'blue' | 'amber' | 'purple';
  /** Border color class */
  borderColor: string;
  /** Background gradient class */
  bgGradient: string;
  /** Accent bar color class */
  accentBarColor: string;
  /** Text color class for buttons/links */
  textColor: string;
  /** Hover text color class */
  hoverTextColor: string;
}

/**
 * Main intelligence content sections with theming
 */
export const INTELLIGENCE_SECTIONS: Record<string, IntelligenceSection> = {
  fieldNotes: {
    id: 'field-note',
    title: 'Field Notes',
    filterParam: 'field-note',
    description: 'Observations and insights from industry practitioners',
    theme: 'slate',
    borderColor: 'border-slate-700/30',
    bgGradient: 'bg-gradient-to-br from-slate-600/5 via-transparent to-transparent',
    accentBarColor: 'bg-slate-400/60',
    textColor: 'text-slate-300',
    hoverTextColor: 'hover:text-slate-100',
  },
  perspectives: {
    id: 'perspective',
    title: 'Deep Dives',
    filterParam: 'perspective',
    description: 'Deep-dive analysis and strategic perspectives',
    theme: 'blue',
    borderColor: 'border-blue-800/30',
    bgGradient: 'bg-gradient-to-br from-blue-600/5 via-transparent to-transparent',
    accentBarColor: 'bg-blue-500/60',
    textColor: 'text-blue-300',
    hoverTextColor: 'hover:text-blue-100',
  },
  signals: {
    id: 'signal',
    title: 'Signals',
    filterParam: 'signal',
    description: 'Time-sensitive updates and emerging trends',
    theme: 'amber',
    borderColor: 'border-amber-800/30',
    bgGradient: 'bg-gradient-to-br from-amber-600/5 via-transparent to-transparent',
    accentBarColor: 'bg-amber-500/60',
    textColor: 'text-amber-300',
    hoverTextColor: 'hover:text-amber-100',
  },
  publications: {
    id: 'publication',
    title: 'Frameworks',
    filterParam: 'publication',
    description: 'Long-form publications and strategic frameworks',
    theme: 'blue',
    borderColor: 'border-blue-800/30',
    bgGradient: 'bg-gradient-to-br from-blue-600/5 via-transparent to-transparent',
    accentBarColor: 'bg-blue-500/60',
    textColor: 'text-blue-300',
    hoverTextColor: 'hover:text-blue-100',
  },
};

/**
 * Podcast branding
 */
export const PODCAST_BRANDING = {
  name: 'Signal In the Static',
  tagline: 'Cutting through the noise in pharmaceutical safety',
  accentColor: 'text-purple-400',
  launchingMessage: 'Podcast launching soon',
} as const;

/**
 * Trending section branding
 */
export const TRENDING_SECTION = {
  title: 'Trending Now',
  accentColor: 'text-gold',
} as const;

/**
 * Newsletter call-to-action content
 */
export const NEWSLETTER_CTA = {
  stickyBarMessage: 'Stay ahead of the curve.',
  stickyBarCta: 'Join the weekly newsletter.',
  midStreamHeadline: 'Stay informed. Stay independent.',
} as const;

/**
 * Empty state content for when no intelligence content exists
 */
export const INTELLIGENCE_EMPTY_STATE = {
  title: 'Insights Hub Launching Soon',
  description:
    "We're building a library of insights on pharmaceutical safety, career development, and industry trends.",
  expectations: [
    'Deep-dive industry analysis & perspectives',
    '"Signal in the Static" Podcast episodes',
    'Field notes from industry veterans',
  ],
} as const;
