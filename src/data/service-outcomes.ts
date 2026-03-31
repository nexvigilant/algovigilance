/**
 * Service Discovery Wizard - Service Outcomes Data
 *
 * Complete information about each consulting service category including
 * outcomes, deliverables, and display configuration.
 */

import type { ServiceCategory, ServiceInfo } from '@/types/service-wizard';

// =============================================================================
// Service Information
// =============================================================================

export const serviceInfo: Record<ServiceCategory, ServiceInfo> = {
  strategic: {
    title: 'Strategic Positioning',
    tagline: 'Chart Your Course',
    icon: 'Compass',
    color: 'gold',
    outcomes: [
      'Clear strategic direction with measurable pharmacovigilance objectives',
      'Defensible competitive positioning for your safety organization',
      'Execution roadmap with Go/No-Go decision gates',
      'Aligned stakeholders from QPPV to C-suite',
    ],
    deliverables: [
      'Strategic Direction Report',
      'Competitive Landscape Brief',
      'Capability Investment Plan',
      'Execution Roadmap',
    ],
    detailLink: '/consulting',
  },

  innovation: {
    title: 'Risk Assessment',
    tagline: 'See Around Corners',
    icon: 'Telescope',
    color: 'cyan',
    outcomes: [
      'Early identification of regulatory and competitive threats',
      'Spot risks before they become problems',
      'Proactive positioning instead of reactive scrambling',
      'Strategic resilience across multiple future scenarios',
    ],
    deliverables: [
      'Threat & Opportunity Brief',
      'Early Warning Report',
      'Competitive Landscape Report',
      'Scenario Analysis Package',
    ],
    detailLink: '/consulting',
  },

  tactical: {
    title: 'Operational Strategy',
    tagline: 'Keep Moving Forward',
    icon: 'Target',
    color: 'emerald',
    outcomes: [
      'Struggling initiatives diagnosed and put back on track',
      'Governance gaps and organizational friction resolved',
      'Momentum maintained through periods of change',
      'Sustainable frameworks for ongoing success',
    ],
    deliverables: [
      'Diagnostic Report',
      'Recovery Plan',
      'Executive Status Reports',
      'Transition Package',
    ],
    detailLink: '/consulting',
  },

  talent: {
    title: 'Capability Architecture',
    tagline: 'Build Your Team\'s Strengths',
    icon: 'Users',
    color: 'purple',
    outcomes: [
      'Competency frameworks aligned to your real needs',
      'Learning programs that build capabilities over time',
      'Institutional knowledge captured and preserved',
      'Leadership pipeline strengthened for succession',
    ],
    deliverables: [
      'Competency Framework',
      'Capability Development Plan',
      'Learning System Design',
      'Capability Validation Approach',
    ],
    detailLink: '/consulting',
  },

  technology: {
    title: 'Safety Systems',
    tagline: 'Build Smarter Systems',
    icon: 'Code',
    color: 'blue',
    outcomes: [
      'Technology strategies aligned with how you actually work',
      'AI/ML adoption with high-value applications identified',
      'Data strategies that turn information into insight',
      'Custom solutions that give you a real edge',
    ],
    deliverables: [
      'Technology Strategy Document',
      'Solution Architecture Spec',
      'AI/ML Readiness Assessment',
      'Custom Solution Design',
    ],
    detailLink: '/consulting',
  },

  maturity: {
    title: 'Organizational Maturity',
    tagline: 'Scale Your Excellence',
    icon: 'TrendingUp',
    color: 'emerald',
    outcomes: [
      'Comprehensive assessment of organizational pharmacovigilance maturity',
      'Identified bottlenecks in process, people, and technology',
      'Prioritized roadmap for reaching next-level operational excellence',
      'Benchmarks against industry standards and best practices',
    ],
    deliverables: [
      'Maturity Assessment Report',
      'Capability Gap Analysis',
      'Operational Excellence Roadmap',
      'Maturity Benchmark Dashboard',
    ],
    detailLink: '/consulting',
  },
};

// =============================================================================
// Personalized Outcome Variants
// =============================================================================

/**
 * Outcome variations based on user context tags
 * Used to personalize the results display
 */
export const personalizedOutcomes: Record<ServiceCategory, Record<string, string[]>> = {
  strategic: {
    'challenge-focused': [
      'Transform strategic uncertainty into a clear action plan',
      'Identify the root causes blocking your organization\'s progress',
      'Build defensible positioning that competitors can\'t easily replicate',
    ],
    'opportunity-focused': [
      'Move on the right market opportunities at the right time',
      'Build sustainable competitive advantages in new areas',
      'Create growth strategies with clear success metrics',
    ],
    'market-expansion': [
      'Map the optimal path into new therapeutic areas',
      'Identify where you have genuine "right to win"',
      'Develop market entry strategies that minimize risk',
    ],
    'urgent': [
      'Rapid strategic assessment to inform immediate decisions',
      'Quick-win opportunities identified within your current position',
      'Crisis-mode strategic guidance with clear priorities',
    ],
  },

  innovation: {
    'challenge-focused': [
      'Stop reacting and start anticipating market shifts',
      'Build systematic foresight into your planning process',
      'Identify emerging threats before they become crises',
    ],
    'opportunity-focused': [
      'Discover untapped opportunities others haven\'t seen',
      'Build an innovation pipeline that continuously generates value',
      'Position your organization at the forefront of industry evolution',
    ],
    'future-focused': [
      'Comprehensive scanning of your industry\'s horizon',
      'Scenario planning for multiple possible futures',
      'Early warning systems for disruptive changes',
    ],
    'reactive-mode': [
      'Transition from firefighting to strategic foresight',
      'Build organizational muscle for continuous environmental scanning',
      'Create competitive advantage through superior anticipation',
    ],
  },

  tactical: {
    'challenge-focused': [
      'Find the root causes of what\'s stalling your initiatives',
      'Design governance changes that restore momentum',
      'Build sustainable frameworks that prevent recurrence',
    ],
    'project-risk': [
      'Rapid diagnostic of what\'s actually blocking progress',
      'Senior-level engagement to realign stakeholders',
      'Governance restructuring until you\'re back on track',
    ],
    'urgent': [
      'Same-week engagement for critical situations',
      'Hands-on approach for deadline-driven transformations',
      'Structured intervention to recover lost momentum',
    ],
    'operational-improvement': [
      'Remove the governance and organizational friction slowing you down',
      'Improve operations without disrupting what\'s already working',
      'Measurable improvements with clear accountability',
    ],
  },

  talent: {
    'challenge-focused': [
      'Design capability frameworks that close real gaps',
      'Build learning systems that compound over time',
      'Create sustainable capability programs, not one-off training',
    ],
    'capability-gap': [
      'Precise diagnosis of capability gaps against real requirements',
      'Targeted development plans that close specific gaps',
      'Validation methods to ensure competencies actually transfer',
    ],
    'people-focused': [
      'Turn organizational potential into measurable performance',
      'Build learning programs that scale with your organization',
      'Preserve institutional knowledge that outlasts individuals',
    ],
    'team-development': [
      'Leadership development programs for succession planning',
      'Cross-functional capability building for organizational agility',
      'Knowledge preservation systems that capture tacit expertise',
    ],
  },

  technology: {
    'challenge-focused': [
      'Design technology strategies that amplify your capabilities',
      'Build custom solutions when off-the-shelf tools fall short',
      'Connect disconnected systems into a coherent whole',
    ],
    'technology-gap': [
      'Technology assessment aligned to how you actually operate',
      'Architecture design tailored to your specific needs',
      'Integration specs for your existing systems',
    ],
    'automation-focused': [
      'Design automation that gives your team more capacity',
      'Build intelligent workflows that multiply team effectiveness',
      'Scale operations without scaling headcount',
    ],
    'ai-focused': [
      'Develop AI/ML strategies focused on high-value applications',
      'Build data pipelines that turn information into insight',
      'Design machine learning solutions for pharmacovigilance',
    ],
    'infrastructure-focused': [
      'Architecture optimized for your specific workloads',
      'Infrastructure that scales automatically with demand',
      'Cost-effective solutions without sacrificing performance',
    ],
    'opportunity-focused': [
      'Build technology capabilities that set you apart',
      'Create data-driven advantages in your market',
      'Transform operations with the right technology',
    ],
  },

  maturity: {
    'challenge-focused': [
      'Address the structural bottlenecks slowing your organization down',
      'Modernize legacy processes for better operational agility',
      'Transform reactive operations into a scalable maturity framework',
    ],
    'opportunity-focused': [
      'Benchmark your organization against industry leaders',
      'Identify the highest-impact areas for immediate maturity gains',
      'Build a systematic path to operational excellence',
    ],
  },
};

// =============================================================================
// Message Templates
// =============================================================================

/**
 * Personalized messages based on user's branch/situation
 */
export const situationMessages: Record<string, string> = {
  'challenge-focused': 'Based on the challenges you\'ve described, here\'s how we can help you move forward.',
  'opportunity-focused': 'You\'re positioned to capitalize on real opportunities. Here\'s how we can accelerate your progress.',
  'exploration-focused': 'Great that you\'re thinking ahead. Here\'s what we recommend exploring first.',
  'urgent': 'We understand time is critical. Here\'s how we can help you move quickly.',
  'strategic-timeline': 'With a strategic horizon, we can help you build something sustainable.',
  'complex-situation': 'Multiple interconnected challenges often benefit from an integrated approach.',
};

/**
 * Call-to-action messages for the booking step
 */
export const bookingMessages: Record<string, string> = {
  'challenge-focused': 'Let\'s discuss your challenge and map a path forward.',
  'opportunity-focused': 'Let\'s explore how to make the most of this opportunity.',
  'exploration-focused': 'Let\'s have a conversation about what\'s possible.',
  'urgent': 'Let\'s talk this week to understand your situation.',
  'default': 'Schedule a complimentary discovery call to discuss your needs.',
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Gets personalized outcomes for a service based on user tags
 */
export function getPersonalizedOutcomes(
  category: ServiceCategory,
  tags: string[]
): string[] {
  const baseOutcomes = serviceInfo[category].outcomes;
  const categoryPersonalized = personalizedOutcomes[category];

  // Find first matching tag that has personalized outcomes
  for (const tag of tags) {
    if (categoryPersonalized[tag]) {
      return categoryPersonalized[tag];
    }
  }

  // Fall back to base outcomes
  return baseOutcomes;
}

/**
 * Gets the appropriate situation message based on tags
 */
export function getSituationMessage(tags: string[]): string {
  for (const tag of tags) {
    if (situationMessages[tag]) {
      return situationMessages[tag];
    }
  }
  return 'Based on what you\'ve shared, here\'s our recommendation.';
}

/**
 * Gets the appropriate booking CTA message based on tags
 */
export function getBookingMessage(tags: string[]): string {
  for (const tag of tags) {
    if (bookingMessages[tag]) {
      return bookingMessages[tag];
    }
  }
  return bookingMessages['default'];
}

/**
 * Gets the service display color class
 */
export function getServiceColorClasses(color: ServiceInfo['color']): {
  bg: string;
  border: string;
  text: string;
  iconBg: string;
} {
  const colorMap = {
    cyan: {
      bg: 'bg-cyan/10',
      border: 'border-cyan/30 hover:border-cyan/60',
      text: 'text-cyan',
      iconBg: 'bg-cyan/20',
    },
    gold: {
      bg: 'bg-gold/10',
      border: 'border-gold/30 hover:border-gold/60',
      text: 'text-gold',
      iconBg: 'bg-gold/20',
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30 hover:border-emerald-500/60',
      text: 'text-emerald-400',
      iconBg: 'bg-emerald-500/20',
    },
    purple: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30 hover:border-purple-500/60',
      text: 'text-purple-400',
      iconBg: 'bg-purple-500/20',
    },
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30 hover:border-blue-500/60',
      text: 'text-blue-400',
      iconBg: 'bg-blue-500/20',
    },
  };

  return colorMap[color];
}
