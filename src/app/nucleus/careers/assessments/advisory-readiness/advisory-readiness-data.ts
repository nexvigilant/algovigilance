// Advisory Readiness Assessment Data
// Framework: Holistic evaluation across Value, Experience, Network, and Readiness dimensions

export interface AssessmentDimension {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  prompts: AssessmentPrompt[];
}

export interface AssessmentPrompt {
  id: string;
  label: string;
  question: string;
  guidance: string;
  scoringCriteria: ScoringCriteria;
  pvContext?: string;
}

export interface ScoringCriteria {
  low: string;
  medium: string;
  high: string;
}

export interface ReadinessLevel {
  id: string;
  title: string;
  scoreRange: [number, number];
  description: string;
  characteristics: string[];
  nextSteps: string[];
  timeframe: string;
}

export interface AdvisoryPathway {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  pvExamples: string[];
  compensation: string;
  timeCommitment: string;
}

// Assessment Dimensions
export const ASSESSMENT_DIMENSIONS: AssessmentDimension[] = [
  {
    id: 'value-proposition',
    title: 'Value Proposition',
    description: 'Assess the strength and clarity of your professional value using the NECS framework',
    icon: 'Zap',
    color: 'cyan',
    prompts: [
      {
        id: 'niche-clarity',
        label: 'Niche Clarity',
        question: 'How clearly can you articulate your specific area of expertise and the unique problems you solve?',
        guidance: 'Think about whether someone could immediately understand what you do and for whom. Can you explain your specialization in one sentence?',
        scoringCriteria: {
          low: 'General PV professional without clear specialization',
          medium: 'Known for specific area but positioning could be sharper',
          high: 'Crystal clear niche with unique positioning that differentiates you'
        },
        pvContext: 'Examples: Signal detection specialist for oncology products, EU QPPV advisory for biotech startups, pediatric safety database expert'
      },
      {
        id: 'evidence-portfolio',
        label: 'Evidence of Impact',
        question: 'What concrete evidence demonstrates your expertise and the results you have achieved?',
        guidance: 'Consider: publications, presentations, successful projects, regulatory submissions, audit outcomes, process improvements with measurable results.',
        scoringCriteria: {
          low: 'Limited documented evidence of impact',
          medium: 'Some evidence but not systematically documented or shared',
          high: 'Strong portfolio of documented successes with quantifiable outcomes'
        },
        pvContext: 'Examples: Led PSMF that passed inspection, built signal detection system that identified X signals, reduced case processing time by Y%'
      },
      {
        id: 'credibility-markers',
        label: 'Credibility Markers',
        question: 'What external recognition or credentials support your expertise claims?',
        guidance: 'Think beyond certifications to include: speaking invitations, peer recognition, committee memberships, published work, industry awards.',
        scoringCriteria: {
          low: 'Basic credentials with limited external recognition',
          medium: 'Solid credentials with some external recognition',
          high: 'Strong external validation through multiple credibility markers'
        },
        pvContext: 'Examples: ISOP/DIA committee member, invited speaker, published author, recognized expert by peers'
      },
      {
        id: 'story-articulation',
        label: 'Story Articulation',
        question: 'How compelling is your professional narrative when you explain why you do this work?',
        guidance: 'Your story should connect your background, expertise, and passion. It should resonate emotionally while demonstrating competence.',
        scoringCriteria: {
          low: 'Task-focused description without compelling narrative',
          medium: 'Good story but could be more memorable or differentiated',
          high: 'Compelling narrative that connects authentically and memorably'
        },
        pvContext: 'Why did you choose PV? What drives your passion for patient safety? What unique perspective do you bring?'
      }
    ]
  },
  {
    id: 'experience-track-record',
    title: 'Experience & Track Record',
    description: 'Evaluate your advisory-relevant experience and demonstrated track record',
    icon: 'Award',
    color: 'gold',
    prompts: [
      {
        id: 'advisory-experience',
        label: 'Advisory Experience',
        question: 'What formal or informal advisory experience do you have?',
        guidance: 'Include: consulting engagements, mentoring relationships, committee work, internal advisory roles, board observer positions.',
        scoringCriteria: {
          low: 'Limited advisory experience beyond day job',
          medium: 'Some advisory experience through consulting or mentoring',
          high: 'Substantial advisory track record across multiple engagements'
        },
        pvContext: 'Examples: Consulting for startups on PV setup, advising on regulatory strategy, mentoring emerging professionals'
      },
      {
        id: 'strategic-contribution',
        label: 'Strategic Contribution',
        question: 'Can you demonstrate experience contributing at a strategic level, not just operational?',
        guidance: 'Strategic work involves shaping direction, not just executing. Think: influencing company decisions, advising leadership, setting policy.',
        scoringCriteria: {
          low: 'Primarily operational experience with limited strategic input',
          medium: 'Some strategic contributions within current role',
          high: 'Demonstrated history of strategic-level contributions and influence'
        },
        pvContext: 'Examples: Shaped company PV strategy, influenced board decisions on safety matters, advised on M&A due diligence'
      },
      {
        id: 'reference-availability',
        label: 'Reference Availability',
        question: 'Do you have strong references who can speak to your advisory capabilities?',
        guidance: 'Quality references are senior people who have seen your work firsthand and will actively advocate for you.',
        scoringCriteria: {
          low: 'Limited references beyond direct supervisors',
          medium: 'Good references but may need cultivation',
          high: 'Strong advocates at senior levels who actively refer opportunities'
        },
        pvContext: 'Think: former executives, board members, VPs, CMOs, regulatory leaders who know your work'
      },
      {
        id: 'domain-depth',
        label: 'Domain Expertise Depth',
        question: 'How deep is your expertise in your chosen domain(s)?',
        guidance: 'Depth means being recognized as an expert, not just experienced. Could you write the definitive guide on your topic?',
        scoringCriteria: {
          low: 'Competent practitioner with broad but shallow expertise',
          medium: 'Strong expertise in one or two areas',
          high: 'Recognized deep expert that others consult for complex problems'
        },
        pvContext: 'Are you the person others call when they have a complex question in your area?'
      }
    ]
  },
  {
    id: 'network-visibility',
    title: 'Network & Visibility',
    description: 'Assess your network strength and professional visibility in target markets',
    icon: 'Network',
    color: 'purple-400',
    prompts: [
      {
        id: 'network-quality',
        label: 'Network Quality',
        question: 'How strong are your relationships with decision-makers who hire advisors?',
        guidance: 'Quality over quantity. Focus on: executives, founders, board members, investors, senior consultants who make hiring decisions.',
        scoringCriteria: {
          low: 'Network primarily of peers with few senior relationships',
          medium: 'Some senior relationships but not systematically cultivated',
          high: 'Strong relationships with multiple decision-makers in target market'
        },
        pvContext: 'CEOs, CMOs, VPs of Regulatory/Safety, board members, VC partners focused on life sciences'
      },
      {
        id: 'visibility-channels',
        label: 'Visibility & Presence',
        question: 'Are you visible to your target market through content, speaking, or thought leadership?',
        guidance: 'Visibility means being findable and known. Consider: LinkedIn presence, conference speaking, publications, media mentions.',
        scoringCriteria: {
          low: 'Limited public visibility or thought leadership',
          medium: 'Some visibility but inconsistent or not targeted',
          high: 'Strong, consistent visibility in target market through multiple channels'
        },
        pvContext: 'Do startups/companies in your target market find you when searching for expertise?'
      },
      {
        id: 'connector-access',
        label: 'Connector Access',
        question: 'Do you have relationships with connectors who can refer advisory opportunities?',
        guidance: 'Connectors include: executive recruiters, VC partners, consultants, attorneys, accountants serving your target market.',
        scoringCriteria: {
          low: 'Limited relationships with connectors',
          medium: 'Some connector relationships but not actively referring',
          high: 'Strong connector relationships that regularly surface opportunities'
        },
        pvContext: 'Life sciences recruiters, healthcare VCs, biotech attorneys, Big 4 life sciences partners'
      },
      {
        id: 'reputation-strength',
        label: 'Reputation Strength',
        question: 'What would people in your target market say about you if asked?',
        guidance: 'Reputation is what others say when you are not in the room. Think about how you are known and whether it matches your positioning.',
        scoringCriteria: {
          low: 'Unknown to most in target market',
          medium: 'Known but reputation may not match desired positioning',
          high: 'Strong positive reputation aligned with advisory positioning'
        },
        pvContext: 'Would a biotech CEO have heard your name when asking their network about PV advisory help?'
      }
    ]
  },
  {
    id: 'readiness-commitment',
    title: 'Readiness & Commitment',
    description: 'Evaluate your practical readiness and commitment to advisory work',
    icon: 'Rocket',
    color: 'green-400',
    prompts: [
      {
        id: 'time-availability',
        label: 'Time Availability',
        question: 'Do you have realistic time available for advisory work alongside other commitments?',
        guidance: 'Advisory boards typically require 4-8 hours/month per engagement. Consider your current workload and flexibility.',
        scoringCriteria: {
          low: 'Very limited availability with inflexible schedule',
          medium: 'Some availability but may need to decline opportunities',
          high: 'Clear availability and flexibility for multiple advisory engagements'
        },
        pvContext: 'Can you attend quarterly board meetings, be available for ad-hoc calls, review documents between meetings?'
      },
      {
        id: 'business-infrastructure',
        label: 'Business Infrastructure',
        question: 'Do you have the business infrastructure to operate as an advisor?',
        guidance: 'Consider: legal entity, contracts/agreements, invoicing capability, professional liability insurance, conflict policies.',
        scoringCriteria: {
          low: 'No infrastructure in place',
          medium: 'Basic infrastructure that needs refinement',
          high: 'Professional infrastructure ready for advisory engagements'
        },
        pvContext: 'LLC/consulting entity, standard advisory agreement template, clear conflict of interest policy'
      },
      {
        id: 'risk-tolerance',
        label: 'Risk & Compensation Comfort',
        question: 'Are you comfortable with advisory compensation models including equity?',
        guidance: 'Advisory compensation often includes equity (0.1-0.5% typical for advisors). Understand the risk/reward tradeoffs.',
        scoringCriteria: {
          low: 'Prefer cash only, uncomfortable with equity risk',
          medium: 'Open to equity but prefer balanced compensation',
          high: 'Comfortable with equity-heavy compensation for right opportunities'
        },
        pvContext: 'Startup equity is high-risk/high-reward. Most advisory equity ends up worthless, but some can be very valuable.'
      },
      {
        id: 'learning-commitment',
        label: 'Continuous Learning',
        question: 'Are you committed to staying current and continuously developing your expertise?',
        guidance: 'Advisory value depends on current, relevant knowledge. How do you stay sharp and expand your expertise?',
        scoringCriteria: {
          low: 'Rely primarily on existing knowledge',
          medium: 'Some ongoing learning but could be more systematic',
          high: 'Systematic approach to staying current and expanding expertise'
        },
        pvContext: 'Following regulatory changes, attending conferences, reading literature, engaging with emerging topics'
      }
    ]
  }
];

// Readiness Levels
export const READINESS_LEVELS: ReadinessLevel[] = [
  {
    id: 'building',
    title: 'Building Foundation',
    scoreRange: [0, 40],
    description: 'You are building the foundation for advisory work. Focus on developing your value proposition and expanding your network.',
    characteristics: [
      'Clear career direction but positioning needs refinement',
      'Growing expertise that needs documentation',
      'Network primarily of peers',
      'Limited visibility in target market'
    ],
    nextSteps: [
      'Complete the NECS Value Proposition Builder assessment',
      'Document 3-5 key accomplishments with quantifiable results',
      'Identify 10 target connections to cultivate',
      'Create or update LinkedIn with advisory-ready positioning',
      'Identify one speaking or content opportunity'
    ],
    timeframe: '6-12 months to advisory readiness'
  },
  {
    id: 'developing',
    title: 'Developing Readiness',
    scoreRange: [41, 60],
    description: 'You have good foundations and are developing advisory-ready capabilities. Focus on visibility and network expansion.',
    characteristics: [
      'Clear value proposition with room for refinement',
      'Solid track record with some documentation',
      'Mix of peer and senior relationships',
      'Some visibility through content or speaking'
    ],
    nextSteps: [
      'Sharpen positioning to be more differentiated',
      'Build systematic visibility through content calendar',
      'Cultivate 5 senior relationships intentionally',
      'Pursue one advisory-adjacent opportunity (consulting, mentoring)',
      'Develop standard advisory materials (bio, one-pager)'
    ],
    timeframe: '3-6 months to advisory readiness'
  },
  {
    id: 'ready',
    title: 'Advisory Ready',
    scoreRange: [61, 80],
    description: 'You are ready to pursue advisory opportunities. Focus on targeting the right opportunities and making strategic asks.',
    characteristics: [
      'Strong, differentiated value proposition',
      'Documented track record with references',
      'Relationships with decision-makers',
      'Visible in target market'
    ],
    nextSteps: [
      'Identify 5 specific target companies or opportunities',
      'Reach out to connector network with specific ask',
      'Prepare advisory pitch materials',
      'Set up business infrastructure if not done',
      'Use Hidden Job Market Navigator to access opportunities'
    ],
    timeframe: 'Ready now - actively pursue opportunities'
  },
  {
    id: 'established',
    title: 'Established Advisor',
    scoreRange: [81, 100],
    description: 'You have strong advisory credentials and should be selective about opportunities. Focus on portfolio curation and leverage.',
    characteristics: [
      'Recognized expert with clear positioning',
      'Strong track record with advocate references',
      'Well-connected to opportunity sources',
      'High visibility in target market'
    ],
    nextSteps: [
      'Define ideal advisory portfolio composition',
      'Be selective - say no to misaligned opportunities',
      'Leverage existing positions for referrals',
      'Consider board observer or full board roles',
      'Mentor emerging advisors to expand influence'
    ],
    timeframe: 'Optimize existing portfolio and pursue premium opportunities'
  }
];

// Advisory Pathways
export const ADVISORY_PATHWAYS: AdvisoryPathway[] = [
  {
    id: 'scientific-advisory-board',
    title: 'Scientific Advisory Board (SAB)',
    description: 'Provide scientific and clinical guidance on product development and research strategy',
    requirements: [
      'Deep domain expertise (therapeutic area, methodology)',
      'Academic or industry research credentials',
      'Publication record or clinical experience',
      'Ability to evaluate scientific data critically'
    ],
    pvExamples: [
      'Epidemiologist advising on RWE strategy',
      'Clinical pharmacologist on drug interaction risk',
      'Therapeutic area expert on benefit-risk assessment'
    ],
    compensation: 'Typically $500-2,000/meeting + equity (0.1-0.25%)',
    timeCommitment: '2-4 meetings/year + document review'
  },
  {
    id: 'regulatory-advisory',
    title: 'Regulatory/Safety Advisory',
    description: 'Guide regulatory strategy, compliance, and safety system development',
    requirements: [
      'Deep regulatory expertise (FDA, EMA, etc.)',
      'Track record of successful submissions',
      'Understanding of global regulatory landscape',
      'Experience with regulatory agency interactions'
    ],
    pvExamples: [
      'QPPV advisory for EU market entry',
      'FDA safety reporting strategy',
      'Global PV system design for startups',
      'Signal detection and risk management'
    ],
    compensation: 'Typically $1,000-3,000/meeting + equity (0.15-0.35%)',
    timeCommitment: '4-8 hours/month including ad-hoc availability'
  },
  {
    id: 'strategic-advisory',
    title: 'Strategic Business Advisory',
    description: 'Provide strategic business guidance on company direction and growth',
    requirements: [
      'Executive or senior leadership experience',
      'Strategic thinking and business acumen',
      'Network in relevant industry sectors',
      'Experience scaling organizations'
    ],
    pvExamples: [
      'PV function build-out strategy',
      'Vendor selection and partnership strategy',
      'Organizational design for safety operations',
      'M&A due diligence on PV aspects'
    ],
    compensation: 'Typically $1,500-5,000/meeting + equity (0.2-0.5%)',
    timeCommitment: 'Monthly meetings + strategic availability'
  },
  {
    id: 'board-observer',
    title: 'Board Observer',
    description: 'Attend board meetings to learn governance while providing informal guidance',
    requirements: [
      'Strong advisory track record',
      'Interest in board-level governance',
      'Relationship with founders or investors',
      'Potential for future board seat'
    ],
    pvExamples: [
      'PV expert observing biotech board',
      'Regulatory leader learning governance',
      'Path to future board membership'
    ],
    compensation: 'Usually equity-only (0.1-0.2%)',
    timeCommitment: 'Quarterly board meetings + occasional input'
  }
];

// Synthesis Prompts
export const SYNTHESIS_PROMPTS = {
  strengthsAnalysis: {
    title: 'Key Strengths',
    prompt: 'Based on your assessment, identify your top 3 strengths for advisory work:'
  },
  gapsAnalysis: {
    title: 'Development Areas',
    prompt: 'Identify the 2-3 areas that most need development before pursuing advisory roles:'
  },
  targetPathway: {
    title: 'Target Pathway',
    prompt: 'Which advisory pathway best matches your current profile and interests?'
  },
  thirtyDayActions: {
    title: '30-Day Action Plan',
    prompt: 'What are the 3 most impactful actions you can take in the next 30 days?'
  }
};

// Key Principles
export const ADVISORY_PRINCIPLES = {
  valueFirst: {
    title: 'Lead with Value',
    description: 'Advisory relationships are built on demonstrated value, not credentials. What specific problems can you solve?'
  },
  networkBeforeNeed: {
    title: 'Build Before You Need',
    description: 'The best advisory opportunities come through relationships built over time, not job applications.'
  },
  selectivity: {
    title: 'Quality Over Quantity',
    description: 'Better to have 2-3 high-quality advisory relationships than 10 superficial ones. Be selective.'
  },
  continuousValue: {
    title: 'Continuous Contribution',
    description: 'Advisory value comes from ongoing engagement, not just showing up to meetings. Stay involved.'
  }
};

// Score calculation helper
export const calculateDimensionScore = (responses: Record<string, number>): number => {
  const values = Object.values(responses);
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / (values.length * 3)) * 100); // Assuming 1-3 scale
};

export const calculateOverallScore = (dimensionScores: Record<string, number>): number => {
  const scores = Object.values(dimensionScores);
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((acc, val) => acc + val, 0) / scores.length);
};

export const getReadinessLevel = (score: number): ReadinessLevel => {
  return READINESS_LEVELS.find(
    level => score >= level.scoreRange[0] && score <= level.scoreRange[1]
  ) || READINESS_LEVELS[0];
};
