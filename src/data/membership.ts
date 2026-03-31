import { Bell, Zap, Shield, Star } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Membership Page Configuration
 *
 * Centralized data for the PSPV founding membership page.
 * Used for both UI rendering and SEO schema generation.
 */

export interface FAQ {
  question: string;
  answer: string;
}

export interface MembershipBenefit {
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * FAQ data used for both:
 * - FAQSchema (structured data for SEO)
 * - FAQ section rendering (single source of truth)
 */
export const membershipFAQs: FAQ[] = [
  {
    question: 'What is PSPV?',
    answer:
      'The Professional Society of Pharmacovigilance — a 501(c)(6) professional society being incorporated in Delaware. PSPV serves practitioners who actually do PV daily: processing cases, detecting signals, writing PSURs, running PV systems. No other society serves this population.',
  },
  {
    question: 'Why Patreon instead of a traditional membership portal?',
    answer:
      'Speed and transparency. Patreon lets us launch the founding membership immediately while PSPV incorporates. Every subscriber becomes a founding member with lifetime status at their tier when the 501(c)(6) is formed.',
  },
  {
    question: 'How is PSPV different from ISoP or DIA?',
    answer:
      'ISoP serves academic researchers who publish papers. DIA serves industry executives who attend conferences. PSPV serves practitioners who do the work. We provide verifiable capability portfolios backed by live FDA, EMA, and WHO data — not certificates that test memorization.',
  },
  {
    question: 'What are the tools I get access to?',
    answer:
      'AlgoVigilance Station provides 1,800+ live drug safety tools connected to 20 real data sources. The public tools are free at mcp.nexvigilant.com. Members get guided walkthroughs, competency tracking, and portfolio building around these tools.',
  },
  {
    question: 'What does "founding member" status mean?',
    answer:
      'When PSPV incorporates as a 501(c)(6), every current Patreon subscriber receives lifetime membership at their tier class — Associate, Professional, Fellow, or Organizational. This status is permanent and cannot be revoked.',
  },
];

/**
 * Benefits displayed in the hero section grid.
 * Beta is open — no waitlist, no launch gate.
 */
export const membershipBenefits: MembershipBenefit[] = [
  {
    icon: Star,
    title: 'Founding Member Status',
    description: 'Secure your place in the founding circle with exclusive lifetime benefits.',
  },
  {
    icon: Zap,
    title: 'Full Access Now',
    description: 'Beta is open. Sign up at nexvigilant.com and access the full portal today — no waitlist, no credit card.',
  },
  {
    icon: Shield,
    title: 'Founding Rate Locked at Launch',
    description: 'Sign up during beta and your rate locks in permanently when pricing launches. No price increases, ever.',
  },
  {
    icon: Bell,
    title: 'Stay Informed',
    description: 'Platform updates, new releases, and important changes delivered to your inbox.',
  },
];
