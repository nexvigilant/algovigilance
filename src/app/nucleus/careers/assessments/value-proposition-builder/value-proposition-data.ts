/**
 * NECS Value Proposition Builder Data
 *
 * Framework: Networks, Expertise, Credibility, Support
 * Source: Connected Board Advisor Academy - Module 4 (Value Creation)
 *
 * Key principles:
 * - "Value must be demonstrated, not just claimed"
 * - "Outcome-based language > task-based descriptions"
 */

export interface NECSPrompt {
  id: string;
  question: string;
  placeholder: string;
  helpText: string;
  examples: string[];
}

export interface TransformExample {
  before: string;
  after: string;
  explanation: string;
}

export interface NECSDimension {
  id: 'networks' | 'expertise' | 'credibility' | 'support';
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  prompts: NECSPrompt[];
  transformExamples?: TransformExample[];
}

export const NECS_DIMENSIONS: NECSDimension[] = [
  {
    id: 'networks',
    title: 'Networks',
    subtitle: 'Who You Know',
    description: 'Your professional connections create value for organizations that need access to specific people, institutions, or communities. In pharmacovigilance, networks span regulatory bodies, industry partners, academic institutions, and patient communities.',
    icon: 'Users',
    color: 'cyan',
    prompts: [
      {
        id: 'regulatory',
        question: 'What regulatory relationships do you have?',
        placeholder: 'Describe your connections to health authorities, regulatory bodies, or former regulators...',
        helpText: 'Think about FDA, EMA, MHRA, PMDA contacts, or industry working groups you participate in.',
        examples: [
          'Active participant in FDA-industry collaborative working group on AI in safety surveillance',
          'Former EMA assessor with ongoing collegial relationships in PRAC',
          'Regular presenter at DIA conferences with established network across 50+ companies'
        ]
      },
      {
        id: 'industry',
        question: 'What industry connections can you leverage?',
        placeholder: 'Describe your network of pharmaceutical, biotech, or CRO contacts...',
        helpText: 'Include vendor relationships, peer networks, professional associations.',
        examples: [
          'Founding member of emerging biopharma PV leaders consortium (15 companies)',
          'Trusted advisor relationships with safety database vendors (Argus, ArisGlobal)',
          'Alumni network from 3 major pharma companies spanning 200+ PV professionals'
        ]
      },
      {
        id: 'academic',
        question: 'What academic or research connections do you have?',
        placeholder: 'Describe your relationships with universities, research institutions, or KOLs...',
        helpText: 'Include collaborations, advisory roles, or research partnerships.',
        examples: [
          'Adjunct faculty at [University] with access to pharmacoepidemiology researchers',
          'Collaborative relationships with 3 KOLs in cardiology safety',
          'Co-investigator on NIH-funded post-market surveillance study'
        ]
      },
      {
        id: 'patient',
        question: 'What patient or advocacy group connections do you have?',
        placeholder: 'Describe your relationships with patient communities or advocacy organizations...',
        helpText: 'Patient-centric connections are increasingly valuable in modern PV.',
        examples: [
          'Board advisor to rare disease patient foundation',
          'Established trust with oncology patient advocacy leaders',
          'Direct channel to patient community for safety communication feedback'
        ]
      }
    ]
  },
  {
    id: 'expertise',
    title: 'Expertise',
    subtitle: 'What You Know',
    description: 'Your deep knowledge creates value when it solves problems others cannot. Focus on outcome-based descriptions rather than task-based ones. What results did your expertise produce?',
    icon: 'Brain',
    color: 'purple',
    prompts: [
      {
        id: 'domain',
        question: 'What is your deepest area of PV expertise?',
        placeholder: 'Describe your core specialization and what outcomes it has produced...',
        helpText: 'Be specific. "Signal detection" is generic. "Disproportionality analysis interpretation in oncology immunotherapies" is specific.',
        examples: [
          'Signal detection methodology that identified 12 novel safety signals across 5 product portfolios',
          'Risk management strategy design that reduced REMS costs by 40% while improving patient outcomes',
          'Safety database migration expertise with 100% data integrity across 3 enterprise implementations'
        ]
      },
      {
        id: 'therapeutic',
        question: 'What therapeutic area expertise do you bring?',
        placeholder: 'Describe your therapeutic knowledge and its value...',
        helpText: 'Therapeutic expertise is often the differentiator in PV advisory roles.',
        examples: [
          'Oncology safety expert with deep understanding of immune-related adverse events',
          'CNS therapeutic expertise enabling accurate assessment of complex neurological safety signals',
          'Rare disease safety strategy experience across 8 orphan drug programs'
        ]
      },
      {
        id: 'technical',
        question: 'What technical or systems expertise do you have?',
        placeholder: 'Describe technical skills and their impact...',
        helpText: 'Include database systems, AI/ML, data analytics, or regulatory submission systems.',
        examples: [
          'Safety database architecture expertise reducing case processing time by 35%',
          'AI/ML implementation for literature screening achieving 95% sensitivity with 50% workload reduction',
          'E2B(R3) implementation lead for 2 successful regulatory submissions'
        ]
      },
      {
        id: 'regulatory',
        question: 'What regulatory expertise distinguishes you?',
        placeholder: 'Describe your regulatory knowledge and outcomes achieved...',
        helpText: 'Focus on how your regulatory knowledge solved problems or prevented issues.',
        examples: [
          'FDA inspection preparation that resulted in zero 483 observations across 4 inspections',
          'Global PSUR strategy reducing submission burden by 60% through aligned global timelines',
          'REMS design expertise leading to FDA approval of 3 complex REMS programs'
        ]
      }
    ],
    transformExamples: [
      {
        before: 'Responsible for signal detection activities',
        after: 'Identified 12 safety signals leading to 3 labeling updates and 1 Dear Healthcare Provider letter, protecting an estimated 50,000 patients',
        explanation: 'Transform responsibilities into measurable outcomes'
      },
      {
        before: 'Managed a team of safety scientists',
        after: 'Built and developed a 15-person signal management team that reduced signal evaluation time from 45 to 12 days while maintaining 100% regulatory compliance',
        explanation: 'Add specific metrics and outcomes to management experience'
      },
      {
        before: 'Experience with safety database systems',
        after: 'Led safety database migration (Oracle Argus to IQVIA ARISg) with zero data loss, completed 3 months ahead of schedule, saving $2M in vendor costs',
        explanation: 'Quantify technical expertise with business impact'
      }
    ]
  },
  {
    id: 'credibility',
    title: 'Credibility',
    subtitle: 'Why Trust You',
    description: 'Credibility is built through demonstrated results, recognized achievements, and validated outcomes. This is not self-promotion—it is evidence that your expertise delivers value.',
    icon: 'Award',
    color: 'gold',
    prompts: [
      {
        id: 'achievements',
        question: 'What are your most significant professional achievements?',
        placeholder: 'Describe measurable outcomes and recognized accomplishments...',
        helpText: 'Focus on outcomes that can be validated by others. Numbers and specific results build credibility.',
        examples: [
          'Zero FDA 483 observations across 15 years and 6 inspections',
          'Built PV function from ground up for 2 successful drug approvals',
          'Reduced serious AE reporting backlog from 500+ to zero in 90 days'
        ]
      },
      {
        id: 'recognition',
        question: 'What external recognition have you received?',
        placeholder: 'Describe awards, publications, speaking invitations, or other recognition...',
        helpText: 'External validation strengthens credibility. Include publications, awards, invited talks.',
        examples: [
          'Author of 12 peer-reviewed publications on pharmacovigilance methodology',
          'Invited speaker at DIA, ISOP, and ICPE conferences (20+ presentations)',
          'Recipient of company excellence award for inspection readiness program'
        ]
      },
      {
        id: 'references',
        question: 'Who can validate your expertise and outcomes?',
        placeholder: 'Describe reference relationships that can speak to your value...',
        helpText: 'Strong references are founders, executives, or peers who experienced your impact firsthand.',
        examples: [
          'Former CEO can speak to my role in building PV function that supported $2B acquisition',
          'Chief Medical Officer references my signal detection work that informed clinical development',
          'FDA reviewer (now industry) can validate my regulatory strategy approach'
        ]
      },
      {
        id: 'track-record',
        question: 'What is your track record of delivering results?',
        placeholder: 'Describe patterns of success across your career...',
        helpText: 'Look for themes: crisis resolution, system building, team development, regulatory success.',
        examples: [
          'Consistently promoted to rescue troubled PV programs (4 turnarounds in 15 years)',
          'Track record of building high-performing teams that stay together (avg. retention 5+ years)',
          'Pattern of identifying safety issues early that competitors missed'
        ]
      }
    ]
  },
  {
    id: 'support',
    title: 'Support',
    subtitle: 'How You Help',
    description: 'Support value comes from ongoing guidance, problem-solving, and mentorship. This is the "advisor" in board advisor—the continued value you provide beyond initial expertise.',
    icon: 'HandHelping',
    color: 'green',
    prompts: [
      {
        id: 'guidance',
        question: 'What ongoing guidance can you provide?',
        placeholder: 'Describe the types of problems you can help solve repeatedly...',
        helpText: 'Think about recurring challenges where your experience provides shortcuts.',
        examples: [
          'Real-time regulatory strategy guidance for emerging safety issues',
          'Sounding board for complex signal interpretation decisions',
          'Strategic planning support for PV function scaling during growth phases'
        ]
      },
      {
        id: 'mentorship',
        question: 'What mentorship or development support can you offer?',
        placeholder: 'Describe how you develop others and build capabilities...',
        helpText: 'Mentorship multiplies value. How do you help others grow?',
        examples: [
          'Career coaching for PV professionals transitioning to leadership roles',
          'Technical mentorship for signal detection and risk assessment',
          'Leadership development for first-time PV managers'
        ]
      },
      {
        id: 'problem-solving',
        question: 'What unique problem-solving approach do you bring?',
        placeholder: 'Describe your methodology or frameworks for solving PV challenges...',
        helpText: 'Advisors are valued for how they think, not just what they know.',
        examples: [
          'Structured decision framework for complex benefit-risk assessments',
          'Crisis communication methodology tested across 5 product safety events',
          'Systematic approach to inspection preparation that has never failed'
        ]
      },
      {
        id: 'availability',
        question: 'What level of support can you commit to?',
        placeholder: 'Describe your availability and engagement model...',
        helpText: 'Be realistic about time commitment. Quality over quantity.',
        examples: [
          'Monthly strategic advisory calls plus ad-hoc crisis support',
          'Quarterly board presentations with ongoing email availability',
          'Intensive engagement model for critical product launches (50-100 hours)'
        ]
      }
    ]
  }
];

export interface OutputTemplate {
  id: string;
  name: string;
  description: string;
  format: 'paragraph' | 'bullets' | 'sections';
  maxLength: number;
  useCase: string;
}

export const OUTPUT_TEMPLATES: OutputTemplate[] = [
  {
    id: 'linkedin-summary',
    name: 'LinkedIn Summary',
    description: 'A 300-word professional summary optimized for LinkedIn',
    format: 'paragraph',
    maxLength: 300,
    useCase: 'Profile headline and summary section'
  },
  {
    id: 'board-bio',
    name: 'Board Biography',
    description: 'A 150-word outcome-focused biography for advisory applications',
    format: 'paragraph',
    maxLength: 150,
    useCase: 'Advisory board applications and introductions'
  },
  {
    id: 'elevator-pitch',
    name: 'Elevator Pitch',
    description: 'A 60-second verbal introduction highlighting your NECS value',
    format: 'paragraph',
    maxLength: 100,
    useCase: 'Networking events and quick introductions'
  },
  {
    id: 'necs-breakdown',
    name: 'NECS Breakdown',
    description: 'A structured view of your value across all four dimensions',
    format: 'sections',
    maxLength: 400,
    useCase: 'Self-assessment and comprehensive profiles'
  }
];

export const STEP_INSTRUCTIONS = {
  networks: {
    title: 'Map Your Network Value',
    instructions: [
      'Think beyond direct reports and immediate colleagues',
      'Consider regulatory, industry, academic, and patient networks',
      'Focus on connections that are unique or valuable to others',
      'Quality matters more than quantity—5 strong relationships beat 500 LinkedIn connections'
    ]
  },
  expertise: {
    title: 'Transform Tasks to Outcomes',
    instructions: [
      'Replace "responsible for" with specific results achieved',
      'Add numbers wherever possible: savings, timelines, improvements',
      'Focus on expertise that solved problems others couldn\'t',
      'Be specific about therapeutic areas and technical specializations'
    ]
  },
  credibility: {
    title: 'Build Your Evidence Base',
    instructions: [
      'Focus on achievements that can be validated by others',
      'External recognition (publications, awards, invitations) strengthens credibility',
      'Identify references who experienced your impact firsthand',
      'Look for patterns of success across your career'
    ]
  },
  support: {
    title: 'Define Your Advisory Value',
    instructions: [
      'Think about ongoing value, not one-time contributions',
      'Advisors are valued for how they think, not just what they know',
      'Be realistic about time commitment and availability',
      'Consider mentorship and development as multipliers'
    ]
  },
  synthesis: {
    title: 'Generate Your Value Proposition',
    instructions: [
      'Review and refine your NECS inputs',
      'Select the output format that matches your use case',
      'Edit the generated content to match your voice',
      'Save and export for immediate use'
    ]
  }
};
