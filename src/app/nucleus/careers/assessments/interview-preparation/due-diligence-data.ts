/**
 * Interview Preparation & Company Due Diligence Data
 *
 * Framework: Three-Area Due Diligence (Ecosystem, Company, Sector)
 * Source: Connected Board Advisor Academy - Module 5 (Getting A Role)
 *
 * Key principles:
 * - "Active listening > jumping to solutions"
 * - "Research before you meet"
 * - "Understand their context before offering expertise"
 */

export interface ResearchPrompt {
  id: string;
  question: string;
  placeholder: string;
  helpText: string;
  sources: string[];
  pvSpecificGuidance?: string;
}

export interface ResearchArea {
  id: 'ecosystem' | 'company' | 'sector';
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  prompts: ResearchPrompt[];
  keyQuestions: string[];
}

export const RESEARCH_AREAS: ResearchArea[] = [
  {
    id: 'ecosystem',
    title: 'The Ecosystem',
    subtitle: 'Market Context & Industry Landscape',
    description: 'Understanding the broader environment in which the company operates. This includes market trends, funding landscape, regulatory climate, and how the company positions itself within the larger industry context.',
    icon: 'Globe',
    color: 'cyan',
    prompts: [
      {
        id: 'market-position',
        question: 'What is the company\'s position in the pharmaceutical ecosystem?',
        placeholder: 'Research their market segment (Big Pharma, Biotech, CRO, Specialty), size, and general positioning...',
        helpText: 'Understanding ecosystem position helps frame your value proposition appropriately.',
        sources: [
          'Company investor presentations',
          'Industry reports (Evaluate Pharma, BioPharma Dive)',
          'LinkedIn company page',
          'Recent press releases'
        ],
        pvSpecificGuidance: 'Different ecosystem positions have different PV needs: Big Pharma needs efficiency/scale, Biotech needs flexibility/expertise, CROs need process discipline.'
      },
      {
        id: 'funding-stage',
        question: 'What is their funding situation and growth trajectory?',
        placeholder: 'Document funding rounds, IPO status, recent acquisitions, or financial health indicators...',
        helpText: 'Funding stage directly impacts PV priorities and investment appetite.',
        sources: [
          'Crunchbase or PitchBook',
          'SEC filings (for public companies)',
          'Company website investor relations',
          'Recent news on funding/acquisitions'
        ],
        pvSpecificGuidance: 'Pre-revenue biotechs often outsource PV. Post-IPO companies typically build internal capabilities. M&A activity signals integration challenges.'
      },
      {
        id: 'regulatory-climate',
        question: 'What regulatory environment are they navigating?',
        placeholder: 'Note key markets (US, EU, Asia), recent regulatory interactions, any compliance history...',
        helpText: 'Regulatory context shapes PV priorities and resource allocation.',
        sources: [
          'FDA Warning Letters database',
          'ClinicalTrials.gov for trial activity',
          'EMA/FDA approval history',
          'Company press releases on regulatory milestones'
        ],
        pvSpecificGuidance: 'Check FDA warning letters, 483 observations, and consent decrees. Look for REMS programs or post-market commitments.'
      },
      {
        id: 'ecosystem-trends',
        question: 'What industry trends affect this company?',
        placeholder: 'Note relevant trends: AI/automation adoption, outsourcing patterns, therapeutic focus shifts...',
        helpText: 'Understanding trends helps position your expertise as forward-looking.',
        sources: [
          'Industry publications (Pink Sheet, Scrip)',
          'Conference themes (DIA, ISPE)',
          'Consulting reports (McKinsey, Deloitte Life Sciences)',
          'LinkedIn thought leadership'
        ],
        pvSpecificGuidance: 'Key PV trends: AI in signal detection, patient voice integration, RWE in safety surveillance, global harmonization challenges.'
      }
    ],
    keyQuestions: [
      'How does their ecosystem position shape their PV needs?',
      'What external pressures (funding, competition, regulation) affect their priorities?',
      'How might industry trends create opportunities for your expertise?',
      'What pain points are common for companies in their position?'
    ]
  },
  {
    id: 'company',
    title: 'The Company',
    subtitle: 'Organization, Products & People',
    description: 'Deep dive into the specific company: their products, pipeline, leadership team, culture, and current challenges. This is where you build understanding of what they actually do and who makes decisions.',
    icon: 'Building2',
    color: 'purple',
    prompts: [
      {
        id: 'product-portfolio',
        question: 'What is their product portfolio and pipeline?',
        placeholder: 'List marketed products, development pipeline, therapeutic areas, and key milestones...',
        helpText: 'Product understanding is essential for demonstrating relevant PV expertise.',
        sources: [
          'Company pipeline page',
          'ClinicalTrials.gov',
          'SEC 10-K/10-Q filings',
          'Investor presentations'
        ],
        pvSpecificGuidance: 'Map each product to PV lifecycle stage: development (clinical safety), launch (REMS, labeling), post-market (signal detection, PSURs). Note any high-risk categories.'
      },
      {
        id: 'leadership-team',
        question: 'Who are the key leaders and decision-makers?',
        placeholder: 'Document CMO, Head of Drug Safety, VP Regulatory, CEO backgrounds and tenure...',
        helpText: 'Understanding leadership helps you tailor your approach and identify potential champions.',
        sources: [
          'LinkedIn profiles',
          'Company leadership page',
          'Press releases on appointments',
          'Conference speaker bios'
        ],
        pvSpecificGuidance: 'Note if PV leader reports to CMO, R&D, or Quality. Look for their background (industry vs regulatory, big pharma vs biotech). Check tenure - new leaders often seek change.'
      },
      {
        id: 'pv-structure',
        question: 'What is their current PV/Drug Safety setup?',
        placeholder: 'Document what you can learn about their PV function size, structure, outsourcing...',
        helpText: 'Current state assessment helps identify gaps where you can add value.',
        sources: [
          'LinkedIn job postings',
          'LinkedIn employee search',
          'Conference presentations by their staff',
          'RFP/vendor announcements'
        ],
        pvSpecificGuidance: 'Job postings reveal pain points. Multiple openings for same role suggest retention issues. Vendor RFPs suggest transition or expansion.'
      },
      {
        id: 'recent-events',
        question: 'What significant events have affected them recently?',
        placeholder: 'Note FDA actions, product launches, M&A, leadership changes, clinical trial results...',
        helpText: 'Recent events create context for current priorities and potential opportunities.',
        sources: [
          'Google News alerts',
          'Company press releases',
          'BioPharma Dive / Endpoints News',
          'FDA databases'
        ],
        pvSpecificGuidance: 'Key events: warning letters, clinical holds, labeling changes, REMS implementations, acquisitions (integration = opportunity), IPO (scaling = opportunity).'
      }
    ],
    keyQuestions: [
      'What products are in critical PV phases (launch, safety issues, renewals)?',
      'Who would be your primary point of contact and what motivates them?',
      'What is the current PV capability maturity level?',
      'What recent events might create urgency for safety improvements?'
    ]
  },
  {
    id: 'sector',
    title: 'The Sector',
    subtitle: 'Competitors & Therapeutic Landscape',
    description: 'Understanding the competitive landscape and therapeutic area context. This includes how competitors approach similar challenges and what sector-specific safety considerations apply.',
    icon: 'Network',
    color: 'gold',
    prompts: [
      {
        id: 'direct-competitors',
        question: 'Who are their direct competitors?',
        placeholder: 'List companies with similar products or therapeutic focus, noting relative positioning...',
        helpText: 'Competitor awareness shows business sophistication and helps position your value.',
        sources: [
          'Industry reports',
          'Investor presentations (they list competitors)',
          'Clinical trial landscape',
          'LinkedIn competitive intelligence'
        ],
        pvSpecificGuidance: 'Research how competitors handle PV: in-house vs outsourced, any public safety issues, REMS programs. This reveals industry benchmarks.'
      },
      {
        id: 'therapeutic-landscape',
        question: 'What is the therapeutic area safety landscape?',
        placeholder: 'Document key safety concerns for their therapeutic area(s), class-wide issues...',
        helpText: 'Therapeutic expertise is a key differentiator in PV advisory.',
        sources: [
          'FDA guidance documents for the therapeutic area',
          'Published literature on class effects',
          'ISMP/FDA safety communications',
          'Medical society guidelines'
        ],
        pvSpecificGuidance: 'Identify class effects, target population risks, common adverse events, and standard monitoring approaches. This demonstrates therapeutic depth.'
      },
      {
        id: 'sector-challenges',
        question: 'What sector-wide PV challenges exist?',
        placeholder: 'Note common safety challenges, regulatory focus areas, or emerging risks in this sector...',
        helpText: 'Understanding shared challenges positions you as a sector expert.',
        sources: [
          'Regulatory inspection trends',
          'Industry working group publications',
          'DIA/ISOP conference themes',
          'Regulatory guidance documents'
        ],
        pvSpecificGuidance: 'Examples: Oncology faces immune-related AE challenges, Gene therapy has long-term follow-up requirements, CNS has complex benefit-risk assessments.'
      },
      {
        id: 'sector-innovation',
        question: 'What innovation is happening in their sector?',
        placeholder: 'Note emerging technologies, new modalities, or evolving approaches relevant to safety...',
        helpText: 'Innovation awareness shows forward-thinking perspective.',
        sources: [
          'Industry publications',
          'VC investment trends',
          'Academic publications',
          'Conference innovation tracks'
        ],
        pvSpecificGuidance: 'Connect innovation to PV implications: new modalities need new safety frameworks, digital therapeutics have unique monitoring needs, AI is transforming signal detection.'
      }
    ],
    keyQuestions: [
      'How do they compare to competitors in safety reputation?',
      'What therapeutic area expertise would be most valuable to them?',
      'What sector-specific challenges can you help them navigate?',
      'How can innovation trends create opportunities for your expertise?'
    ]
  }
];

export interface OutputTemplate {
  id: string;
  name: string;
  description: string;
  format: 'brief' | 'checklist' | 'questions';
  useCase: string;
}

export const OUTPUT_TEMPLATES: OutputTemplate[] = [
  {
    id: 'preparation-brief',
    name: 'Preparation Brief',
    description: 'A comprehensive summary of your research for pre-meeting review',
    format: 'brief',
    useCase: 'Review 30 minutes before any meeting or interview'
  },
  {
    id: 'discussion-questions',
    name: 'Discussion Questions',
    description: 'Thoughtful questions that demonstrate your research and understanding',
    format: 'questions',
    useCase: 'Active listening prompts for meetings and interviews'
  },
  {
    id: 'value-alignment',
    name: 'Value Alignment Map',
    description: 'How your NECS value proposition aligns with their specific needs',
    format: 'brief',
    useCase: 'Internal preparation for articulating your value'
  },
  {
    id: 'research-checklist',
    name: 'Research Checklist',
    description: 'Outstanding research items and information gaps',
    format: 'checklist',
    useCase: 'Track what you still need to learn'
  }
];

export const INTERVIEW_PRINCIPLES = {
  activeListening: {
    title: 'Active Listening Over Solutions',
    description: 'The biggest mistake in advisory conversations is jumping to solutions before fully understanding the context. Your research enables better questions, not better answers.',
    practices: [
      'Ask open-ended questions based on your research',
      'Listen for problems behind the problems',
      'Validate your research assumptions before advising',
      'Take notes on their specific language and priorities'
    ]
  },
  demonstratingValue: {
    title: 'Demonstrating (Not Claiming) Value',
    description: 'Research demonstrates preparation. Thoughtful questions demonstrate expertise. Listening demonstrates advisory capability.',
    practices: [
      'Reference specific research in your questions',
      'Connect their challenges to your relevant experience',
      'Show understanding of their context before sharing solutions',
      'Ask about outcomes they want, not just problems they have'
    ]
  },
  buildingTrust: {
    title: 'Building Trust Through Understanding',
    description: 'Trust comes from feeling understood. Your research should help them feel that you "get it" before you offer expertise.',
    practices: [
      'Acknowledge their specific challenges',
      'Reference their recent wins or milestones',
      'Ask about their priorities, not your assumptions',
      'Be curious about their perspective'
    ]
  }
};

export const STEP_INSTRUCTIONS = {
  ecosystem: {
    title: 'Map the Industry Context',
    instructions: [
      'Start broad: understand their market position and competitive environment',
      'Look for funding/growth signals that indicate priorities',
      'Identify regulatory pressures or opportunities',
      'Note industry trends that affect their decision-making'
    ]
  },
  company: {
    title: 'Deep Dive on the Organization',
    instructions: [
      'Map their product portfolio to PV lifecycle stages',
      'Research key decision-makers and their backgrounds',
      'Look for clues about their current PV maturity',
      'Identify recent events that create context for your conversation'
    ]
  },
  sector: {
    title: 'Understand Competitive & Therapeutic Context',
    instructions: [
      'Research how competitors handle similar PV challenges',
      'Deepen your therapeutic area knowledge',
      'Identify sector-wide challenges where you can add value',
      'Connect innovation trends to PV implications'
    ]
  },
  preparation: {
    title: 'Synthesize Your Research',
    instructions: [
      'Review your findings across all three areas',
      'Generate thoughtful questions for your meeting',
      'Map your value proposition to their specific needs',
      'Identify gaps that require more research'
    ]
  }
};

export const COMPANY_TYPES = [
  { id: 'big-pharma', label: 'Big Pharma', description: 'Large multinational pharmaceutical companies' },
  { id: 'mid-pharma', label: 'Mid-Size Pharma', description: 'Established companies with focused portfolios' },
  { id: 'biotech', label: 'Biotech', description: 'Biotechnology companies (pre or post revenue)' },
  { id: 'specialty-pharma', label: 'Specialty Pharma', description: 'Focused therapeutic or delivery specialists' },
  { id: 'cro', label: 'CRO/Vendor', description: 'Contract research or PV service providers' },
  { id: 'consulting', label: 'Consulting', description: 'Life sciences consulting firms' },
  { id: 'health-authority', label: 'Health Authority', description: 'Regulatory agencies or government bodies' },
  { id: 'other', label: 'Other', description: 'Healthcare, MedTech, or other related organizations' }
];

export const RESEARCH_SOURCES = {
  free: [
    { name: 'Company Website', url: '', description: 'Investor relations, pipeline, leadership' },
    { name: 'LinkedIn', url: 'https://linkedin.com', description: 'People, job postings, company updates' },
    { name: 'ClinicalTrials.gov', url: 'https://clinicaltrials.gov', description: 'Pipeline and development activity' },
    { name: 'FDA Databases', url: 'https://www.fda.gov/drugs/drug-safety-and-availability', description: 'Warning letters, approvals, safety communications' },
    { name: 'SEC EDGAR', url: 'https://www.sec.gov/edgar', description: '10-K, 10-Q filings for public companies' },
    { name: 'Google News', url: 'https://news.google.com', description: 'Recent press coverage' },
    { name: 'Crunchbase', url: 'https://crunchbase.com', description: 'Funding and investment data' }
  ],
  subscription: [
    { name: 'Evaluate Pharma', description: 'Industry analysis and forecasts' },
    { name: 'Pink Sheet / Scrip', description: 'Regulatory and industry news' },
    { name: 'BioPharma Dive', description: 'Industry news and analysis' },
    { name: 'PitchBook', description: 'Private company financials' },
    { name: 'Cortellis', description: 'Drug development intelligence' }
  ]
};
