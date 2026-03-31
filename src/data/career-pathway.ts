import { GraduationCap, Briefcase, Users, Crown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Career Pathway Configuration
 *
 * Defines the progression stages from Ambassador to Fractional Executive.
 * Used on /grow/pathway and potentially in career assessments.
 */

export interface PathwayStage {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  color: 'cyan' | 'gold';
  duration: string;
  keyActivities: string[];
  outcomes: string[];
  compensation: string;
  nextStep: string;
  cta: {
    label: string;
    href: string;
    variant?: 'default' | 'outline';
  };
}

export const pathwayStages: PathwayStage[] = [
  {
    id: 'ambassador',
    title: 'Ambassador',
    subtitle: '0-2 Years Experience',
    description:
      'Build your foundation in pharmaceutical safety through networking, skill development, and portfolio building.',
    icon: GraduationCap,
    color: 'cyan',
    duration: '1-2 years typical',
    keyActivities: [
      'Participate in networking events and community discussions',
      'Complete skill development workshops and certifications',
      'Work on portfolio-building projects with guidance',
      'Get matched with a mentor from the Advisor network',
      'Contribute to content creation and community engagement',
    ],
    outcomes: [
      'Established professional network',
      'Core competencies in PV/Drug Safety',
      'Portfolio of demonstrable work',
      'Mentor relationships',
      'Foundation for career advancement',
    ],
    compensation: 'Access to free training, networking, and mentorship',
    nextStep: 'Transition to Advisor after 2+ years FTE experience',
    cta: { label: 'Apply as Ambassador', href: '/grow/ambassador' },
  },
  {
    id: 'advisor',
    title: 'Advisor',
    subtitle: '2-5 Years Experience',
    description:
      'Share your expertise through mentorship, content creation, and advisory engagements while building your consulting foundation.',
    icon: Briefcase,
    color: 'cyan',
    duration: '2-5 years typical',
    keyActivities: [
      'Mentor Ambassadors and early-career professionals',
      'Review and contribute to Academy curriculum',
      'Participate in advisory boards and strategic discussions',
      'Build thought leadership through content and speaking',
      'Take on initial consulting micro-projects',
    ],
    outcomes: [
      'Established advisory reputation',
      'Published thought leadership content',
      'Mentorship experience',
      'Initial consulting track record',
      'Professional recognition in the field',
    ],
    compensation: 'Honoraria for content, advisory fees, consulting project fees',
    nextStep: 'Qualify for Consultant tier with 5+ years and project portfolio',
    cta: { label: 'Apply as Advisor', href: '/grow/advisor' },
  },
  {
    id: 'consultant',
    title: 'Consultant',
    subtitle: '5-10 Years Experience',
    description:
      'Execute client engagements, deliver training, and build a sustainable consulting practice with AlgoVigilance support.',
    icon: Users,
    color: 'gold',
    duration: 'Ongoing engagement',
    keyActivities: [
      'Lead client consulting engagements end-to-end',
      'Deliver training programs and workshops',
      'Develop proprietary methodologies and frameworks',
      'Mentor Advisors on consulting skills',
      'Participate in business development',
    ],
    outcomes: [
      'Established consulting practice',
      'Client portfolio and testimonials',
      'Revenue generation through projects',
      'Industry-recognized expertise',
      'Path to executive opportunities',
    ],
    compensation: 'Project fees (50-70% revenue share), training delivery fees',
    nextStep: 'Invitation to Fractional Executive tier based on impact',
    cta: { label: 'Consultant by Invitation', href: '/grow/advisor', variant: 'outline' },
  },
  {
    id: 'executive',
    title: 'Fractional Executive',
    subtitle: '10+ Years Experience',
    description:
      'Provide strategic leadership as a part-time executive, board member, or strategic advisor to AlgoVigilance and partner organizations.',
    icon: Crown,
    color: 'gold',
    duration: 'Senior leadership',
    keyActivities: [
      'Serve on advisory boards and governance committees',
      'Provide fractional C-suite leadership to clients',
      'Shape strategic direction and industry initiatives',
      'Lead high-stakes consulting engagements',
      'Mentor Consultants on executive presence and strategy',
    ],
    outcomes: [
      'Executive leadership portfolio',
      'Board and governance experience',
      'Strategic impact at organizational level',
      'Equity and partnership opportunities',
      'Industry thought leader status',
    ],
    compensation: 'Executive retainers, equity participation, board compensation',
    nextStep: 'Partnership and equity opportunities',
    cta: { label: 'Executive by Invitation', href: '/grow/advisor', variant: 'outline' },
  },
];

/**
 * Advisor vs Consultant Comparison
 *
 * Explains the distinction between advisory and consulting roles.
 */
export interface RoleComparison {
  dimension: string;
  advisor: { text: string; detail: string };
  consultant: { text: string; detail: string };
}

export const advisorVsConsultant = {
  title: 'Understanding Advisor vs. Consultant',
  description: 'Two distinct but complementary roles in the AlgoVigilance ecosystem.',
  comparison: [
    {
      dimension: 'Primary Focus',
      advisor: { text: 'Problem Definer', detail: 'Strategic guidance and direction' },
      consultant: { text: 'Problem Solver', detail: 'Tactical execution and delivery' },
    },
    {
      dimension: 'Engagement Duration',
      advisor: { text: 'Long-term', detail: 'Ongoing relationship' },
      consultant: { text: 'Project-based', detail: 'Defined scope and timeline' },
    },
    {
      dimension: 'Relationship Style',
      advisor: { text: 'Relational', detail: '"Think with us"' },
      consultant: { text: 'Transactional', detail: '"Do this for us"' },
    },
    {
      dimension: 'Deliverables',
      advisor: { text: 'Intangible', detail: 'Guidance, mentorship, connections' },
      consultant: { text: 'Tangible', detail: 'Reports, implementations, training' },
    },
    {
      dimension: 'Compensation Model',
      advisor: { text: 'Retainer-based', detail: 'Access and availability fees' },
      consultant: { text: 'Fee-based', detail: 'Hourly or project rates' },
    },
    {
      dimension: 'Liability',
      advisor: { text: 'Lower', detail: 'Advisory opinions only' },
      consultant: { text: 'Higher', detail: 'Responsible for deliverables' },
    },
  ] as RoleComparison[],
} as const;
