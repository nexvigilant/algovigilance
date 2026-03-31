import {
  GraduationCap,
  Briefcase,
  Users,
  BookOpen,
  Target,
  Award,
  Sparkles,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Affiliate Programs Configuration
 *
 * Defines the Ambassador and Advisor program details.
 * Used on /grow and related affiliate pages.
 */

export interface AffiliateProgram {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  features: string[];
  idealFor: string[];
  cta: string;
  href: string;
  accentColor: 'cyan' | 'gold';
  featured?: boolean;
}

/**
 * Benefit card with icon for detail pages
 */
export interface ProgramBenefit {
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * Row in the advisor vs consultant comparison table
 */
export interface RoleComparisonRow {
  dimension: string;
  advisor: string;
  consultant: string;
}

export const affiliatePrograms: AffiliateProgram[] = [
  {
    id: 'ambassador',
    title: 'Ambassador Program',
    subtitle: 'Early Career Professionals',
    description:
      'For students, recent graduates, and early-career professionals (0-2 years) looking to build their network and accelerate their pharmaceutical industry career.',
    icon: GraduationCap,
    features: [
      'Network building with industry professionals',
      'Skill development workshops',
      'Portfolio building opportunities',
      'Mentorship from experienced advisors',
      'Access to exclusive events and content',
      'Career guidance and pathway planning',
    ],
    idealFor: [
      'Current pharmacy/healthcare students',
      'Recent graduates',
      'Fellowship candidates',
      'Entry-level professionals',
    ],
    cta: 'Apply as Ambassador',
    href: '/grow/ambassador',
    accentColor: 'cyan',
  },
  {
    id: 'advisor',
    title: 'Advisor Program',
    subtitle: 'Experienced Professionals',
    description:
      'For experienced professionals (2+ years FTE) with subject matter expertise who want to contribute to the community while building their advisory and consulting practice.',
    icon: Briefcase,
    features: [
      'Advisory engagement opportunities',
      'Consulting project placements',
      'Curriculum review and content creation',
      'Mentorship leadership roles',
      'Professional visibility and recognition',
      'Path to fractional executive roles',
    ],
    idealFor: [
      'Mid-career professionals (2-5 years)',
      'Senior professionals (5-10 years)',
      'Subject matter experts',
      'Aspiring consultants',
    ],
    cta: 'Apply as Advisor',
    href: '/grow/advisor',
    accentColor: 'gold',
    featured: true,
  },
];

/**
 * Ambassador Program Benefits (detail page)
 */
export const ambassadorBenefits: ProgramBenefit[] = [
  {
    icon: Users,
    title: 'Network Building',
    description:
      'Connect with industry professionals, mentors, and fellow ambassadors in pharmaceutical safety.',
  },
  {
    icon: BookOpen,
    title: 'Skill Development',
    description:
      'Access exclusive workshops, training sessions, and professional development resources.',
  },
  {
    icon: Target,
    title: 'Portfolio Projects',
    description:
      'Participate in real projects that build your portfolio and demonstrate your capabilities.',
  },
  {
    icon: Award,
    title: 'Mentorship',
    description: 'Get matched with experienced advisors who can guide your career journey.',
  },
  {
    icon: Sparkles,
    title: 'Exclusive Access',
    description: 'Priority access to events, content, job postings, and career opportunities.',
  },
  {
    icon: GraduationCap,
    title: 'Career Pathway',
    description: 'Clear progression path from Ambassador to Advisor, Consultant, and beyond.',
  },
];

/**
 * Advisor Program Benefits (detail page)
 */
export const advisorBenefits: ProgramBenefit[] = [
  {
    icon: Target,
    title: 'Advisory Opportunities',
    description:
      'Provide strategic guidance to organizations seeking your expertise in pharmaceutical safety.',
  },
  {
    icon: Briefcase,
    title: 'Consulting Projects',
    description:
      'Access project-based consulting engagements with pharmaceutical and healthcare organizations.',
  },
  {
    icon: Users,
    title: 'Mentorship Leadership',
    description: 'Guide the next generation of professionals as a mentor in our Ambassador program.',
  },
  {
    icon: MessageSquare,
    title: 'Content & Curriculum',
    description: 'Review, create, and shape educational content for the AlgoVigilance Academy.',
  },
  {
    icon: Award,
    title: 'Professional Recognition',
    description:
      'Build your thought leadership through speaking opportunities and featured expertise.',
  },
  {
    icon: TrendingUp,
    title: 'Path to Executive',
    description:
      'Clear progression to Consultant and Fractional Executive roles with increased engagement.',
  },
];

/**
 * Advisor vs Consultant comparison (simplified, for advisor detail page)
 */
export const advisorVsConsultantSimple: RoleComparisonRow[] = [
  {
    dimension: 'Focus',
    advisor: 'Problem Definer (strategy)',
    consultant: 'Problem Solver (execution)',
  },
  {
    dimension: 'Duration',
    advisor: 'Long-term / ongoing',
    consultant: 'Project-based',
  },
  {
    dimension: 'Engagement',
    advisor: 'Relational ("think with us")',
    consultant: 'Transactional ("do this")',
  },
  {
    dimension: 'Deliverables',
    advisor: 'Intangible (guidance)',
    consultant: 'Tangible (reports)',
  },
  {
    dimension: 'Compensation',
    advisor: 'Retainer / access-based',
    consultant: 'Hourly / project fee',
  },
];
