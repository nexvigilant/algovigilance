/**
 * Vigilance Domain Configuration
 *
 * Central configuration for AlgoVigilance's vigilance domains.
 * Used by PVMissionBar and potentially other components.
 *
 * Abbreviation codes (PV, AV, CV, MV, SAV) are retained as programmatic
 * identifiers — not displayed in user-facing text.
 */

import type { LucideIcon } from 'lucide-react';
import { Shield, Brain, Server, TrendingUp, Activity } from 'lucide-react';

export interface LandingDomain {
  /** Lucide icon component */
  icon: LucideIcon;
  /** Domain display name */
  title: string;
  /** Programmatic abbreviation — retained as identifier, not displayed */
  abbreviation: string;
  /** Domain description (≤2 sentences) */
  description: string;
  /** Imperative action tagline (≤6 words) */
  tagline: string;
  /** Tailwind text color class */
  color: string;
  /** Tailwind hover glow shadow class */
  glowColor: string;
  /** Tailwind accent background class */
  accentBg: string;
  /** Tailwind accent border class */
  accentBorder: string;
}

export const vigilanceDomains: LandingDomain[] = [
  {
    icon: Shield,
    title: 'Patient Safety',
    abbreviation: 'PV',
    description:
      'Safety signal detection, causality assessment, and benefit-risk analysis.',
    tagline: 'Detect signals before harm spreads',
    color: 'text-emerald-400',
    glowColor: 'hover:shadow-[0_0_30px_rgba(52,211,153,0.15)]',
    accentBg: 'bg-emerald-400/15',
    accentBorder: 'border-emerald-400/40',
  },
  {
    icon: Brain,
    title: 'AI Safety',
    abbreviation: 'AV',
    description:
      'AI safety — drift detection, bias monitoring, and model governance.',
    tagline: 'Monitor AI. Prevent harm.',
    color: 'text-violet-400',
    glowColor: 'hover:shadow-[0_0_30px_rgba(167,139,250,0.15)]',
    accentBg: 'bg-violet-400/15',
    accentBorder: 'border-violet-400/40',
  },
  {
    icon: Server,
    title: 'Cyber Vigilance',
    abbreviation: 'CV',
    description:
      'Availability, resilience, and incident prevention at scale.',
    tagline: 'Predict threats before they strike',
    color: 'text-amber-400',
    glowColor: 'hover:shadow-[0_0_30px_rgba(251,191,36,0.15)]',
    accentBg: 'bg-amber-400/15',
    accentBorder: 'border-amber-400/40',
  },
  {
    icon: TrendingUp,
    title: 'Market Vigilance',
    abbreviation: 'MV',
    description:
      'Competitive intelligence, trend analysis, and market risk monitoring.',
    tagline: 'Anticipate markets. Act decisively.',
    color: 'text-blue-400',
    glowColor: 'hover:shadow-[0_0_30px_rgba(96,165,250,0.15)]',
    accentBg: 'bg-blue-400/15',
    accentBorder: 'border-blue-400/40',
  },
  {
    icon: Activity,
    title: 'Sports Analytics',
    abbreviation: 'SAV',
    description:
      'Performance anomaly detection and biomechanical risk assessment.',
    tagline: 'Prevent injury through prediction',
    color: 'text-rose-400',
    glowColor: 'hover:shadow-[0_0_30px_rgba(251,113,133,0.15)]',
    accentBg: 'bg-rose-400/15',
    accentBorder: 'border-rose-400/40',
  },
];
