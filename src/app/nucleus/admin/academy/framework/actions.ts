'use server';

/**
 * @deprecated LEGACY FILE - DO NOT USE FOR NEW DEVELOPMENT
 *
 * This file contains HARDCODED STATIC DATA for EPAs and CPAs.
 * It does NOT fetch from Firestore - all data is embedded in this file.
 *
 * For new development, use:
 * - `framework-browser/actions.ts` for PDC v4.1 domains, EPAs, and CPAs
 *   - `getDomainsAction()` - fetches from `pdc_framework/domains/items`
 *   - `getEPAsAction()` - fetches from `pdc_framework/epas/items`
 *   - `getCPAsAction()` - fetches from `pdc_framework/cpas/items`
 *
 * The data in this file may be outdated. The source of truth is:
 * - Firestore: `pdc_framework/{type}/items`
 * - Excel: AlgoVigilance_PDC_v4.1_Analytics_Workbook.xlsx
 *
 * Files that need updating to use framework-browser/actions.ts:
 * - src/app/nucleus/admin/academy/framework/page.tsx
 * - src/app/nucleus/admin/academy/framework/[areaId]/page.tsx
 */

// Types for EPAs and CPAs
export interface EPA {
  id: string;
  name: string;
  definition: string;
  tier: 'core' | 'executive';
  primaryDomains: string[];
  aiIntegration: string;
  careerStage: string;
}

export interface CPA {
  id: string;
  name: string;
  focusArea: string;
  summary: string;
  primaryDomains: string[];
  keyEPAs: string[];
  aiIntegration: string;
  careerStage: string;
}

// Extended EPA detail from MCP server
export interface EPADetail {
  id: string;
  title: string;
  category: 'core' | 'executive';
  definition: string;
  career_stage: string;
  required_level?: string;
  educational_rationale?: string;
  scope_and_boundaries?: string[];
  required_domains?: { domain: string; level: string; description: string }[];
  supporting_domains?: { domain: string; level: string; description: string }[];
  observable_components?: { category: string; items: string[] }[];
  entrustment_levels?: Record<string, { title: string; description: string; behavioral_anchors?: string[] }>;
  ai_integration_requirements?: string[];
  quality_metrics?: string[];
  ai_integration: string;
  supports_cpas?: string[];
  drive_doc_id?: string;
  drive_link?: string;
  // Legacy fields for backward compatibility
  primary_domains?: (number | string)[];
  key_behavioral_anchors?: string[];
}

// Extended CPA detail
export interface CPADetail {
  id: string;
  name: string;
  focusArea: string;
  summary: string;
  primaryDomains: string[];
  supportingDomains?: string[];
  keyEPAs: string[];
  supportingEPAs?: string[];
  aiIntegration: string;
  careerStage: string;
  proficiencyLevels?: Record<string, { title: string; description: string; scope?: string; keyCapability?: string; supervision?: string }>;
  behavioralAnchors?: Record<string, string[]>;
  successMetrics?: string[];
  developmentPathway?: string[];
  integrationModules?: string[];
  educationalPhilosophy?: string;
  implementationPhase?: string;
}

// EPA Data extracted from PDC Manual Chapter 5
const epasData: EPA[] = [
  {
    id: 'EPA1',
    name: 'Process and Evaluate Individual Case Safety Reports',
    definition: 'Independently process and evaluate individual adverse event reports from receipt through regulatory submission, ensuring accuracy, completeness, and compliance with global requirements while recognizing important adverse drug reaction patterns.',
    tier: 'core',
    primaryDomains: ['Domain 4 - ICSRs', 'Domain 2 - Clinical ADRs', 'Domain 3 - Important ADRs', 'Domain 1 - Foundations', 'Domain 14 - Communication'],
    aiIntegration: 'Natural language processing for coding, duplicate detection, AI validation',
    careerStage: 'Foundation-Professional',
  },
  {
    id: 'EPA2',
    name: 'Perform Literature Screening and Evaluation for Safety Signals',
    definition: 'Systematically search, evaluate, and synthesize scientific literature including clinical trial publications to identify potential safety signals and support comprehensive safety assessments.',
    tier: 'core',
    primaryDomains: ['Domain 15 - Information Sources', 'Domain 8 - Signal Detection', 'Domain 2 - Clinical ADRs', 'Domain 5 - Clinical Trials'],
    aiIntegration: 'Machine learning for relevance ranking, NLP for data extraction',
    careerStage: 'Foundation-Professional',
  },
  {
    id: 'EPA3',
    name: 'Prepare and Present Safety Information to Stakeholders',
    definition: 'Develop and deliver clear, accurate, and actionable safety communications tailored to diverse stakeholder needs and contexts.',
    tier: 'core',
    primaryDomains: ['Domain 14 - Communication', 'Domain 1 - Foundations', 'Domain 2 - Clinical ADRs'],
    aiIntegration: 'AI-assisted content generation and audience analysis',
    careerStage: 'Foundation-Professional',
  },
  {
    id: 'EPA4',
    name: 'Manage Pharmacovigilance Documentation and Quality Systems',
    definition: 'Maintain comprehensive pharmacovigilance documentation systems ensuring regulatory compliance and audit readiness.',
    tier: 'core',
    primaryDomains: ['Domain 7 - Quality Systems', 'Domain 12 - Audit & Inspection', 'Domain 4 - ICSRs'],
    aiIntegration: 'Automated quality monitoring and compliance tracking',
    careerStage: 'Foundation-Professional',
  },
  {
    id: 'EPA5',
    name: 'Conduct Signal Detection and Evaluation Activities',
    definition: 'Perform systematic signal detection using multiple methodologies and evaluate identified signals for regulatory and clinical significance.',
    tier: 'core',
    primaryDomains: ['Domain 8 - Signal Detection', 'Domain 9 - Post-Authorization Studies', 'Domain 10 - Benefit-Risk'],
    aiIntegration: 'Machine learning detection algorithms, predictive analytics',
    careerStage: 'Foundation-Advanced',
  },
  {
    id: 'EPA6',
    name: 'Prepare Regulatory Safety Documents',
    definition: 'Develop comprehensive regulatory safety documents including PSURs, DSURs, and risk management plans.',
    tier: 'core',
    primaryDomains: ['Domain 4 - ICSRs', 'Domain 11 - Risk Management', 'Domain 13 - Global PV'],
    aiIntegration: 'AI-assisted document generation and data synthesis',
    careerStage: 'Foundation-Advanced',
  },
  {
    id: 'EPA7',
    name: 'Design and Implement Risk Minimization Measures',
    definition: 'Develop targeted interventions to minimize medication risks while preserving therapeutic access.',
    tier: 'core',
    primaryDomains: ['Domain 11 - Risk Management', 'Domain 6 - Medication Errors', 'Domain 14 - Communication'],
    aiIntegration: 'Predictive risk modeling, effectiveness monitoring',
    careerStage: 'Foundation-Advanced',
  },
  {
    id: 'EPA8',
    name: 'Conduct Safety Investigations and Root Cause Analysis',
    definition: 'Lead comprehensive safety investigations to identify root causes and develop corrective actions.',
    tier: 'core',
    primaryDomains: ['Domain 2 - Clinical ADRs', 'Domain 6 - Medication Errors', 'Domain 7 - Quality Systems'],
    aiIntegration: 'Pattern analysis, automated investigation support',
    careerStage: 'Foundation-Advanced',
  },
  {
    id: 'EPA9',
    name: 'Manage Pharmacovigilance Agreements and Partnerships',
    definition: 'Establish and maintain pharmacovigilance agreements with partners ensuring compliance and efficient safety data exchange.',
    tier: 'core',
    primaryDomains: ['Domain 13 - Global PV', 'Domain 7 - Quality Systems', 'Domain 14 - Communication'],
    aiIntegration: 'Automated compliance monitoring, contract analytics',
    careerStage: 'Foundation-Advanced',
  },
  {
    id: 'EPA10',
    name: 'Implement and Validate AI Tools for Pharmacovigilance',
    definition: 'Lead implementation of AI-powered pharmacovigilance tools with appropriate validation and change management.',
    tier: 'core',
    primaryDomains: ['Domain 1 - Foundations', 'Domain 7 - Quality Systems', 'Domain 15 - Information Sources'],
    aiIntegration: 'AI Gateway - enables CPA8 progression',
    careerStage: 'Advanced-Executive',
  },
  {
    id: 'EPA11',
    name: 'Lead Global Pharmacovigilance Strategy Development',
    definition: 'Develop and implement enterprise-wide pharmacovigilance strategies aligned with organizational objectives.',
    tier: 'executive',
    primaryDomains: ['Domain 13 - Global PV', 'Domain 11 - Risk Management', 'Domain 10 - Benefit-Risk'],
    aiIntegration: 'Strategic analytics, predictive modeling',
    careerStage: 'Executive',
  },
  {
    id: 'EPA12',
    name: 'Drive Regulatory Policy and Industry Standards',
    definition: 'Influence regulatory policy development and contribute to industry standard-setting activities.',
    tier: 'executive',
    primaryDomains: ['Domain 13 - Global PV', 'Domain 14 - Communication', 'Domain 1 - Foundations'],
    aiIntegration: 'Policy impact analysis, stakeholder mapping',
    careerStage: 'Executive',
  },
  {
    id: 'EPA13',
    name: 'Transform Pharmacovigilance Through Innovation',
    definition: 'Lead transformational initiatives that advance pharmacovigilance practice and patient safety.',
    tier: 'executive',
    primaryDomains: ['Domain 1 - Foundations', 'Domain 8 - Signal Detection', 'Domain 15 - Information Sources'],
    aiIntegration: 'Innovation leadership, emerging technology integration',
    careerStage: 'Executive',
  },
  {
    id: 'EPA14',
    name: 'Build and Lead High-Performing PV Teams',
    definition: 'Develop and lead pharmacovigilance teams that deliver excellence in safety surveillance.',
    tier: 'executive',
    primaryDomains: ['Domain 14 - Communication', 'Domain 7 - Quality Systems', 'Domain 1 - Foundations'],
    aiIntegration: 'Team analytics, performance optimization',
    careerStage: 'Executive',
  },
  {
    id: 'EPA15',
    name: 'Manage Crisis Communications and Safety Emergencies',
    definition: 'Lead organizational response to safety crises with effective communication and decision-making.',
    tier: 'executive',
    primaryDomains: ['Domain 14 - Communication', 'Domain 11 - Risk Management', 'Domain 2 - Clinical ADRs'],
    aiIntegration: 'Real-time monitoring, automated alert systems',
    careerStage: 'Executive',
  },
];

// CPA Data extracted from PDC Manual Chapter 6
const cpasData: CPA[] = [
  {
    id: 'CPA1',
    name: 'Case Management Activities',
    focusArea: 'Case Management',
    summary: 'Transforms adverse event information into actionable safety intelligence through systematic case processing, pattern recognition, and quality documentation.',
    primaryDomains: ['Domain 2 - Clinical ADRs', 'Domain 3 - Important ADRs', 'Domain 4 - ICSRs', 'Domain 14 - Communication'],
    keyEPAs: ['EPA 1', 'EPA 2', 'EPA 3'],
    aiIntegration: 'Natural language processing, pattern recognition, quality validation',
    careerStage: 'Foundation-Advanced',
  },
  {
    id: 'CPA2',
    name: 'Signal Management Activities',
    focusArea: 'Signal Detection & Analytics',
    summary: 'Transforms data patterns into validated safety signals through sophisticated analytical approaches, multi-source integration, and stakeholder communication.',
    primaryDomains: ['Domain 8 - Signal Detection', 'Domain 9 - Post-Authorization Studies', 'Domain 10 - Benefit-Risk', 'Domain 15 - Information Sources'],
    keyEPAs: ['EPA 5', 'EPA 6', 'EPA 2'],
    aiIntegration: 'Machine learning detection, predictive analytics, automated validation',
    careerStage: 'Foundation-Advanced',
  },
  {
    id: 'CPA3',
    name: 'Risk Management Activities',
    focusArea: 'Risk Strategy & Prevention',
    summary: 'Develops and implements targeted interventions that minimize medication risks while preserving therapeutic access, with emphasis on medication error prevention.',
    primaryDomains: ['Domain 11 - Risk Management', 'Domain 13 - Global PV', 'Domain 14 - Communication', 'Domain 6 - Medication Errors'],
    keyEPAs: ['EPA 7', 'EPA 8', 'EPA 6'],
    aiIntegration: 'Predictive risk modeling, effectiveness monitoring, behavioral analytics',
    careerStage: 'Foundation-Advanced',
  },
  {
    id: 'CPA4',
    name: 'Quality & Compliance Activities',
    focusArea: 'Quality Systems & Standards',
    summary: 'Ensures pharmacovigilance operations meet regulatory requirements and quality standards through systematic monitoring and continuous improvement.',
    primaryDomains: ['Domain 7 - Quality Systems', 'Domain 12 - Audit & Inspection', 'Domain 4 - ICSRs'],
    keyEPAs: ['EPA 4', 'EPA 9', 'EPA 6'],
    aiIntegration: 'Automated compliance monitoring, quality metrics tracking',
    careerStage: 'Foundation-Advanced',
  },
  {
    id: 'CPA5',
    name: 'Data & Technology Activities',
    focusArea: 'Information & AI Systems',
    summary: 'Manages pharmacovigilance data systems and technology infrastructure to enable efficient safety surveillance and regulatory compliance.',
    primaryDomains: ['Domain 15 - Information Sources', 'Domain 4 - ICSRs', 'Domain 8 - Signal Detection'],
    keyEPAs: ['EPA 10', 'EPA 4', 'EPA 5'],
    aiIntegration: 'System integration, data analytics, AI tool implementation',
    careerStage: 'Foundation-Advanced',
  },
  {
    id: 'CPA6',
    name: 'Communication & Stakeholder Activities',
    focusArea: 'Engagement & Influence',
    summary: 'Develops and maintains effective communication with internal and external stakeholders to support safety objectives.',
    primaryDomains: ['Domain 14 - Communication', 'Domain 1 - Foundations', 'Domain 13 - Global PV'],
    keyEPAs: ['EPA 3', 'EPA 9', 'EPA 15'],
    aiIntegration: 'Stakeholder analytics, communication optimization',
    careerStage: 'Foundation-Advanced',
  },
  {
    id: 'CPA7',
    name: 'Research & Development Activities',
    focusArea: 'Science & Innovation',
    summary: 'Advances pharmacovigilance science through research initiatives and innovative approaches to safety surveillance.',
    primaryDomains: ['Domain 5 - Clinical Trials', 'Domain 9 - Post-Authorization Studies', 'Domain 2 - Clinical ADRs'],
    keyEPAs: ['EPA 2', 'EPA 5', 'EPA 13'],
    aiIntegration: 'Research analytics, hypothesis generation, study design support',
    careerStage: 'Foundation-Advanced',
  },
  {
    id: 'CPA8',
    name: 'AI-Enhanced Pharmacovigilance Activities',
    focusArea: 'AI Transformation & Leadership',
    summary: 'Leads organizational transformation through strategic AI implementation, representing the capstone achievement in AI integration for pharmacovigilance practice.',
    primaryDomains: ['Domain 1 - Foundations', 'Domain 8 - Signal Detection', 'Domain 15 - Information Sources'],
    keyEPAs: ['EPA 10', 'EPA 13', 'EPA 11'],
    aiIntegration: 'AI Gateway capstone - requires EPA10 L4+ mastery',
    careerStage: 'Advanced-Executive',
  },
];

/**
 * Fetch all EPAs
 */
export async function getEPAs(): Promise<EPA[]> {
  return epasData;
}

/**
 * Fetch EPAs by tier
 */
export async function getEPAsByTier(tier: 'core' | 'executive'): Promise<EPA[]> {
  return epasData.filter(epa => epa.tier === tier);
}

/**
 * Fetch a single EPA by ID
 */
export async function getEPA(epaId: string): Promise<EPA | null> {
  return epasData.find(epa => epa.id === epaId) || null;
}

/**
 * Fetch all CPAs
 */
export async function getCPAs(): Promise<CPA[]> {
  return cpasData;
}

/**
 * Fetch a single CPA by ID
 */
export async function getCPA(cpaId: string): Promise<CPA | null> {
  return cpasData.find(cpa => cpa.id === cpaId) || null;
}

// Rich EPA detail data from PDC Manual Chapter 5
const epaDetailData: Record<string, Partial<EPADetail>> = {
  'EPA1': {
    educational_rationale: 'Individual case processing represents the fundamental activity of pharmacovigilance practice. Competency in this EPA establishes the foundation for all subsequent pharmacovigilance activities, requiring professionals to integrate clinical knowledge, regulatory requirements, and communication skills in every case evaluation.',
    scope_and_boundaries: [
      'Encompasses complete case lifecycle from initial receipt through regulatory submission',
      'Includes both serious and non-serious events across all product types and reporting sources',
      'Integrates AI-assisted processing while maintaining essential human oversight and clinical judgment',
      'Covers important ADR pattern recognition as a core component of case evaluation',
      'Addresses medication errors as integral elements of case processing',
    ],
    required_domains: [
      { domain: 'Domain 4 - ICSRs in the AI Era', level: 'L3', description: 'Complete understanding of case processing procedures with AI integration' },
      { domain: 'Domain 2 - Clinical Aspects of ADRs', level: 'L3', description: 'Independent clinical evaluation capability' },
      { domain: 'Domain 3 - Important ADRs Recognition', level: 'L3', description: 'Pattern recognition and clinical significance assessment' },
    ],
    supporting_domains: [
      { domain: 'Domain 1 - Foundations of PV', level: 'L2', description: 'Solid understanding of pharmacovigilance principles' },
      { domain: 'Domain 14 - Communication', level: 'L2', description: 'Clear documentation and stakeholder communication' },
      { domain: 'Domain 6 - Medication Errors', level: 'L2', description: 'Recognition and appropriate handling of error components' },
    ],
    observable_components: [
      {
        category: 'Case Intake and Triage',
        items: [
          'Accurately identifies reportable events using established criteria',
          'Recognizes important ADR patterns immediately upon case receipt',
          'Detects medication error components during initial case review',
          'Prioritizes cases appropriately based on seriousness and clinical significance',
          'Utilizes AI triage tools effectively while maintaining clinical oversight',
        ],
      },
      {
        category: 'Data Collection and Evaluation',
        items: [
          'Systematically gathers comprehensive patient and event information',
          'Identifies important ADRs requiring special attention or expedited processing',
          'Screens for medication error components and documents findings',
          'Evaluates data quality and completeness using established standards',
        ],
      },
      {
        category: 'Medical Assessment and Coding',
        items: [
          'Applies MedDRA coding accurately and consistently',
          'Recognizes organ-specific ADR patterns and codes appropriately',
          'Conducts comprehensive causality assessment using validated methods',
          'Evaluates event seriousness correctly according to regulatory definitions',
        ],
      },
      {
        category: 'Narrative Development',
        items: [
          'Creates clear, concise, medically accurate narratives',
          'Highlights important ADRs appropriately within narrative structure',
          'Integrates all relevant information in logical, chronological sequence',
          'Maintains regulatory compliance while ensuring narrative clarity',
        ],
      },
      {
        category: 'Quality Assurance and Submission',
        items: [
          'Performs comprehensive quality checks using systematic approaches',
          'Ensures regulatory timeline compliance across all jurisdictions',
          'Validates AI-generated content against source documents',
          'Confirms appropriate documentation of important ADR information',
        ],
      },
    ],
    entrustment_levels: {
      'L1': {
        title: 'Observation Only',
        description: 'Observes experienced professionals processing cases with active questioning and engagement',
        behavioral_anchors: [
          'Correctly uses basic PV terminology in documentation',
          'Recognizes when AI is being used in PV processes',
          'Reviews completed cases for learning opportunities',
        ],
      },
      'L2': {
        title: 'Direct Supervision',
        description: 'Processes straightforward cases with supervisor physically present and actively guiding decisions',
        behavioral_anchors: [
          'Identifies basic ADR types (Type A vs Type B reactions)',
          'Recognizes common temporal patterns in adverse event descriptions',
          'Requires validation of all decisions before implementation',
        ],
      },
      'L3': {
        title: 'Indirect Supervision',
        description: 'Processes routine cases independently with supervisor available for consultation',
        behavioral_anchors: [
          'Independently identifies and evaluates important ADR presentations',
          'Applies causality assessment criteria consistently',
          'Identifies medication errors and handles according to procedures',
        ],
      },
      'L4': {
        title: 'Remote Supervision',
        description: 'Manages all case types including complex cases with minimal supervision',
        behavioral_anchors: [
          'Develops new approaches to complex clinical assessment challenges',
          'Creates innovative approaches to important ADR pattern documentation',
          'Leads medication error investigations',
        ],
      },
      'L5': {
        title: 'Independent Practice',
        description: 'Functions as case processing expert with full autonomy and teaching responsibilities',
        behavioral_anchors: [
          'Creates new frameworks for clinical assessment with industry adoption',
          'Pioneers new understanding of important ADR mechanisms',
          'Trains others in advanced ADR recognition and case processing',
        ],
      },
    },
    ai_integration_requirements: [
      'Serves as entry point for AI Gateway (EPA10) progression',
      'Utilizes natural language processing for initial coding suggestions',
      'Validates all AI-generated content against source documents',
      'Employs duplicate detection algorithms effectively',
      'Documents AI tool usage and decision rationale',
    ],
    quality_metrics: [
      'Case processing accuracy >98%',
      'Important ADR identification rate 100%',
      'Medication error detection rate >95%',
      'Regulatory timeline compliance 100%',
      'Coding consistency >95%',
      'AI validation accuracy >99%',
    ],
    supports_cpas: ['CPA1', 'CPA4', 'CPA5'],
  },
  'EPA5': {
    educational_rationale: 'Signal detection and validation represents the core analytical function of pharmacovigilance, requiring integration of statistical methods, clinical expertise, and regulatory knowledge. This EPA demonstrates the transformation of data patterns into actionable safety insights.',
    scope_and_boundaries: [
      'Covers all signal sources including spontaneous reports, literature, epidemiological studies, and clinical trials',
      'Emphasizes important ADR pattern recognition as central to signal evaluation',
      'Includes clinical trial signal evaluation and integration with post-marketing data',
      'Encompasses both qualitative and quantitative signal detection methodologies',
      'Integrates human expertise with AI capabilities for comprehensive signal evaluation',
    ],
    required_domains: [
      { domain: 'Domain 8 - Signal Detection and Management', level: 'L4', description: 'Advanced signal methodology and evaluation' },
      { domain: 'Domain 2 - Clinical Aspects of ADRs', level: 'L3', description: 'Clinical interpretation of signal findings' },
      { domain: 'Domain 10 - Benefit-Risk Assessment', level: 'L3', description: 'Context for signal significance' },
      { domain: 'Domain 3 - Important ADRs Recognition', level: 'L3', description: 'Pattern recognition and clinical significance' },
    ],
    supporting_domains: [
      { domain: 'Domain 15 - Sources of Information', level: 'L3', description: 'Multi-source data integration' },
      { domain: 'Domain 14 - Communication', level: 'L3', description: 'Signal communication and presentation' },
      { domain: 'Domain 5 - PV in Clinical Trials', level: 'L2', description: 'Trial signal evaluation' },
    ],
    observable_components: [
      {
        category: 'Signal Identification',
        items: [
          'Integrates multiple data sources for comprehensive detection',
          'Recognizes important ADR patterns promptly through systematic screening',
          'Incorporates clinical trial signals appropriately',
          'Prioritizes signals based on clinical significance and public health impact',
          'Utilizes AI detection algorithms effectively with human oversight',
        ],
      },
      {
        category: 'Initial Evaluation',
        items: [
          'Assesses signal strength and consistency across data sources',
          'Evaluates important ADR characteristics including severity and reversibility',
          'Integrates pharmacokinetic and pharmacodynamic principles',
          'Analyzes temporal relationships and dose-response patterns',
        ],
      },
      {
        category: 'Evidence Gathering',
        items: [
          'Develops comprehensive information strategies for signal investigation',
          'Analyzes relevant clinical trial data considering design and population',
          'Validates AI-generated signals independently',
          'Integrates real-world evidence appropriately',
        ],
      },
      {
        category: 'Signal Validation',
        items: [
          'Applies structured frameworks for signal evaluation',
          'Confirms important ADR patterns through multiple validation approaches',
          'Develops signal evaluation strategies appropriate to signal characteristics',
          'Assesses public health impact and clinical significance',
        ],
      },
    ],
    entrustment_levels: {
      'L1': {
        title: 'Observation Only',
        description: 'Observes signal detection activities and learns basic methods',
        behavioral_anchors: ['Understands signal detection terminology', 'Reviews completed signal assessments'],
      },
      'L2': {
        title: 'Direct Supervision',
        description: 'Assists with signal evaluation components under direct supervision',
        behavioral_anchors: ['Applies multiple signal detection methods', 'Presents simple signal findings clearly'],
      },
      'L3': {
        title: 'Indirect Supervision',
        description: 'Conducts routine signal assessments including ADR pattern evaluation independently',
        behavioral_anchors: ['Integrates multiple data sources', 'Prioritizes signals based on clinical significance'],
      },
      'L4': {
        title: 'Remote Supervision',
        description: 'Leads complex signal investigations across multiple data sources',
        behavioral_anchors: ['Optimizes AI algorithms for improved accuracy', 'Develops signal evaluation strategies'],
      },
      'L5': {
        title: 'Independent Practice',
        description: 'Develops signal detection strategies and methodological innovations',
        behavioral_anchors: ['Creates industry-standard frameworks', 'Pioneers new signal detection approaches'],
      },
    },
    ai_integration_requirements: [
      'Machine learning detection algorithms',
      'Predictive analytics for signal prioritization',
      'Automated validation against clinical knowledge',
      'Pattern recognition across large datasets',
    ],
    supports_cpas: ['CPA2', 'CPA5', 'CPA7'],
  },
  'EPA10': {
    educational_rationale: 'AI implementation and validation represents the integration of technological innovation with traditional pharmacovigilance expertise. This EPA serves as the gateway to advanced AI competency development, ensuring professionals develop comprehensive technological literacy while maintaining human expertise essential for medication safety.',
    scope_and_boundaries: [
      'Serves as the structured gateway to AI competency progression and CPA8 capstone achievement',
      'Covers all AI applications including pattern recognition, decision support, and automation',
      'Emphasizes ADR pattern recognition and medication error detection as key AI application areas',
      'Includes validation methodology development and regulatory compliance for AI systems',
      'Produces validated, production-ready systems that enhance rather than replace human expertise',
    ],
    required_domains: [
      { domain: 'Domain 1 - Foundations of PV in AI Era', level: 'L4', description: 'Advanced understanding of AI integration with PV principles' },
      { domain: 'Domain 8 - Signal Detection with AI', level: 'L4', description: 'Advanced AI-enhanced signal detection capability' },
      { domain: 'Domain 12 - Regulatory Requirements', level: 'L3', description: 'Understanding of AI regulatory framework and compliance' },
    ],
    supporting_domains: [
      { domain: 'Domain 15 - Information Sources', level: 'L3', description: 'AI-enhanced information management' },
      { domain: 'Domain 14 - Communication', level: 'L3', description: 'AI implementation communication and training' },
      { domain: 'Domain 3 - Important ADRs Recognition', level: 'L3', description: 'AI-enhanced pattern recognition' },
      { domain: 'Domain 6 - Medication Errors', level: 'L3', description: 'AI-enhanced error detection and prevention' },
    ],
    observable_components: [
      {
        category: 'AI Gateway Prerequisites',
        items: [
          'Completion of foundational competency development in domains 1-3 (minimum L2)',
          'Basic understanding of PV processes across domains 4-9 through practical experience',
          'Demonstrated competency in domains with AI focus (3, 5, 6)',
          'Ethics training completion with focus on AI applications in healthcare',
          'AI fundamentals examination achievement (80% pass rate required)',
        ],
      },
      {
        category: 'Phase 1: Foundation (L1-L2)',
        items: [
          'Basic AI tool exposure across domains with supervised application',
          'Observes AI implementation in various PV contexts',
          'Understands AI basic concepts and their application to safety monitoring',
          'Prerequisites verification: Domains 1-3 at L2 minimum',
        ],
      },
      {
        category: 'Phase 2: Application (L3)',
        items: [
          'Independent AI tool usage with systematic validation approaches',
          'Uses AI tools with supervision while developing independent capability',
          'Proposes AI solutions for workflow improvements',
          'Entry Assessment: L2 achievement in domains 1, 4, 8',
        ],
      },
      {
        category: 'Phase 3: Integration (L4)',
        items: [
          'AI implementation leadership with cross-functional impact',
          'Designs comprehensive AI integration strategies for teams and departments',
          'Optimizes AI algorithms for improved performance and accuracy',
          'Assessment: L3 achievement in 5+ domains',
        ],
      },
      {
        category: 'Phase 4: Innovation (L5)',
        items: [
          'AI innovation and governance leadership with organizational impact',
          'Pioneers new AI applications that advance PV practice',
          'Creates industry-standard frameworks for AI implementation',
          'Prerequisites for CPA8: EPA10 achievement at Level 4+',
        ],
      },
    ],
    entrustment_levels: {
      'L1': {
        title: 'Observation Only',
        description: 'Understands AI tool concepts and ethics',
        behavioral_anchors: ['Observes AI implementation', 'Understands AI basic concepts'],
      },
      'L2': {
        title: 'Direct Supervision',
        description: 'Uses validated AI tools under supervision',
        behavioral_anchors: ['Uses AI tools with supervision', 'Identifies AI application opportunities'],
      },
      'L3': {
        title: 'Indirect Supervision',
        description: 'Implements AI tools independently with oversight',
        behavioral_anchors: ['Proposes AI solutions for workflow improvements', 'Validates AI tool outputs'],
      },
      'L4': {
        title: 'Remote Supervision',
        description: 'Validates and customizes AI tools',
        behavioral_anchors: ['Designs comprehensive AI integration strategies', 'Optimizes AI algorithms'],
      },
      'L5': {
        title: 'Independent Practice',
        description: 'Develops and innovates AI applications for PV',
        behavioral_anchors: ['Pioneers new AI applications', 'Creates industry-standard frameworks'],
      },
    },
    ai_integration_requirements: [
      'AI Gateway - enables CPA8 progression',
      'Validation methodology development',
      'Regulatory compliance for AI systems',
      'Human oversight framework design',
      'Performance monitoring and optimization',
    ],
    supports_cpas: ['CPA5', 'CPA8'],
  },
  'EPA2': {
    educational_rationale: 'Literature screening and evaluation represents a critical capability for evidence-based pharmacovigilance practice. This EPA requires professionals to integrate information science skills with clinical knowledge and signal detection expertise, demonstrating the multidisciplinary nature of modern safety surveillance.',
    scope_and_boundaries: [
      'Covers all literature types including published peer-reviewed research, gray literature, conference abstracts, and regulatory documents',
      'Includes clinical trial safety publications and post-marketing study reports',
      'Encompasses both proactive searches for ongoing surveillance and targeted investigations',
      'Integrates AI-powered literature surveillance tools with human expertise',
      'Produces actionable safety insights that inform regulatory and clinical decision-making',
    ],
    required_domains: [
      { domain: 'Domain 15 - Sources of Information', level: 'L3', description: 'Advanced information management and evaluation skills' },
      { domain: 'Domain 8 - Signal Detection and Management', level: 'L3', description: 'Signal identification and evaluation capability' },
      { domain: 'Domain 2 - Clinical Aspects of ADRs', level: 'L3', description: 'Clinical interpretation of literature findings' },
      { domain: 'Domain 5 - PV in Clinical Trials', level: 'L3', description: 'Understanding of trial safety data and publications' },
    ],
    supporting_domains: [
      { domain: 'Domain 9 - Post-Authorization Studies', level: 'L2', description: 'Real-world evidence evaluation' },
      { domain: 'Domain 14 - Communication', level: 'L2', description: 'Clear presentation of findings and recommendations' },
    ],
    observable_components: [
      {
        category: 'Search Strategy Development',
        items: [
          'Designs comprehensive, systematic search strategies appropriate to specific questions',
          'Includes clinical trial registries and results databases in search protocols',
          'Selects appropriate databases and information sources',
          'Uses AI tools for information discovery with supervision',
          'Documents search methodology clearly for reproducibility',
        ],
      },
      {
        category: 'Literature Screening and Selection',
        items: [
          'Applies inclusion and exclusion criteria consistently',
          'Identifies clinical trial safety findings relevant to surveillance objectives',
          'Utilizes AI-enhanced tools for sophisticated information analysis',
          'Prioritizes high-impact publications based on scientific quality and relevance',
        ],
      },
      {
        category: 'Critical Evaluation',
        items: [
          'Assesses clinical trial methodology quality using established criteria',
          'Integrates pharmacokinetic and pharmacodynamic principles',
          'Analyzes clinical relevance of findings within broader safety context',
          'Identifies potential biases, confounders, and limitations',
        ],
      },
      {
        category: 'Synthesis and Analysis',
        items: [
          'Integrates findings across multiple sources for comprehensive understanding',
          'Combines trial and real-world evidence appropriately',
          'Applies multiple signal detection methods',
          'Generates hypotheses for further investigation',
        ],
      },
    ],
    entrustment_levels: {
      'L1': { title: 'Observation Only', description: 'Observes literature review processes and learns search techniques', behavioral_anchors: ['Reviews completed literature assessments', 'Understands database types'] },
      'L2': { title: 'Direct Supervision', description: 'Conducts searches with direct supervision and guidance on evaluation', behavioral_anchors: ['Uses AI tools for information discovery', 'Applies basic screening criteria'] },
      'L3': { title: 'Indirect Supervision', description: 'Performs routine literature reviews independently with quality oversight', behavioral_anchors: ['Utilizes AI-enhanced tools for analysis', 'Validates AI-generated insights'] },
      'L4': { title: 'Remote Supervision', description: 'Manages complex, multi-source syntheses and develops search strategies', behavioral_anchors: ['Designs comprehensive search strategies', 'Leads systematic reviews'] },
      'L5': { title: 'Independent Practice', description: 'Leads literature strategy development and establishes search protocols', behavioral_anchors: ['Creates organizational standards', 'Innovates search methodologies'] },
    },
    ai_integration_requirements: [
      'Machine learning algorithms for relevance ranking and screening efficiency',
      'Natural language processing for automated data extraction and synthesis',
      'Validates AI-generated insights against established quality standards',
      'Citation network analysis for comprehensive literature mapping',
      'Contributes to EPA10 AI Gateway progression',
    ],
    supports_cpas: ['CPA2', 'CPA5', 'CPA7'],
  },
  'EPA3': {
    educational_rationale: 'Effective communication represents the bridge between technical pharmacovigilance work and its practical impact on patient safety. This EPA requires professionals to translate complex safety information into accessible, actionable communications while maintaining scientific accuracy and regulatory compliance.',
    scope_and_boundaries: [
      'Encompasses all stakeholder types including internal teams, external partners, regulatory authorities, healthcare providers, and patients',
      'Covers routine safety updates, signal communications, crisis communications, and educational presentations',
      'Includes written, verbal, and visual communication modalities',
      'Integrates important ADR communication requirements with broader safety messaging',
      'Adapts to cultural, linguistic, and regulatory contexts across global markets',
    ],
    required_domains: [
      { domain: 'Domain 14 - Communication in the AI Era', level: 'L3', description: 'Advanced communication strategy and execution' },
      { domain: 'Domain 10 - Benefit-Risk Assessment', level: 'L3', description: 'Balanced presentation of safety and efficacy information' },
      { domain: 'Domain 1 - Foundations of PV', level: 'L3', description: 'Solid grounding in pharmacovigilance principles' },
    ],
    supporting_domains: [
      { domain: 'Domain 13 - Global PV and Public Health', level: 'L2', description: 'Understanding of diverse stakeholder contexts' },
      { domain: 'Domain 2 - Clinical Aspects of ADRs', level: 'L3', description: 'Clinical knowledge for accurate communication' },
      { domain: 'Domain 3 - Important ADRs Recognition', level: 'L2', description: 'Appropriate emphasis on significant safety concerns' },
    ],
    observable_components: [
      {
        category: 'Audience Analysis and Adaptation',
        items: [
          'Analyzes audience needs systematically before communication development',
          'Applies basic ethical principles to communication decisions',
          'Assesses health literacy levels and adapts complexity accordingly',
          'Incorporates important ADR information appropriately based on audience needs',
          'Selects communication channels and formats optimal for audience and message',
        ],
      },
      {
        category: 'Message Development',
        items: [
          'Synthesizes complex safety data clearly while maintaining technical accuracy',
          'Incorporates important ADR information within broader safety context',
          'Integrates ethical considerations naturally in all communications',
          'Ensures scientific accuracy through systematic fact-checking',
        ],
      },
      {
        category: 'Visual Communication Design',
        items: [
          'Creates effective data visualizations that enhance understanding',
          'Highlights important safety patterns through appropriate visual emphasis',
          'Uses AI-enhanced communication tools for improved efficiency',
          'Ensures accessibility compliance for diverse audiences',
        ],
      },
      {
        category: 'Delivery and Presentation',
        items: [
          'Presents confidently to diverse audiences with appropriate adaptation',
          'Explains pharmacovigilance foundations when necessary',
          'Handles challenging questions professionally while maintaining accuracy',
          'Adapts presentation style dynamically based on audience response',
        ],
      },
    ],
    entrustment_levels: {
      'L1': { title: 'Observation Only', description: 'Uses clear, appropriate language for basic PV communications', behavioral_anchors: ['Uses appropriate terminology', 'Understands audience differences'] },
      'L2': { title: 'Direct Supervision', description: 'Adapts communication style for different audiences', behavioral_anchors: ['Analyzes audience needs', 'Uses AI-enhanced tools'] },
      'L3': { title: 'Indirect Supervision', description: 'Develops comprehensive communication strategies independently', behavioral_anchors: ['Creates effective visualizations', 'Presents confidently to diverse audiences'] },
      'L4': { title: 'Remote Supervision', description: 'Creates innovative communication approaches', behavioral_anchors: ['Develops new communication methods', 'Manages complex stakeholder communications'] },
      'L5': { title: 'Independent Practice', description: 'Pioneers new paradigms for AI-enhanced communication', behavioral_anchors: ['Creates industry standards', 'Transforms organizational communication'] },
    },
    ai_integration_requirements: [
      'AI-assisted content generation and adaptation',
      'Automated audience analysis and segmentation',
      'Natural language processing for message optimization',
      'Visual communication tools with AI enhancement',
    ],
    supports_cpas: ['CPA3', 'CPA6', 'CPA8'],
  },
  'EPA4': {
    educational_rationale: 'Post-marketing surveillance analysis represents the analytical foundation of pharmacovigilance practice. This EPA requires professionals to integrate statistical methods, clinical knowledge, and regulatory understanding to generate actionable insights from complex, heterogeneous data sources.',
    scope_and_boundaries: [
      'Includes spontaneous reporting databases, clinical databases, and administrative healthcare data',
      'Covers clinical trial extension studies and long-term follow-up data analysis',
      'Encompasses medication error pattern analysis and trend identification',
      'Integrates traditional statistical methods with AI-powered analytical approaches',
      'Produces regulatory-quality outputs that meet international standards',
    ],
    required_domains: [
      { domain: 'Domain 7 - Spontaneous Reporting Systems', level: 'L3', description: 'Advanced database management and analysis' },
      { domain: 'Domain 9 - Post-Authorization Studies', level: 'L3', description: 'Study design and interpretation capability' },
      { domain: 'Domain 8 - Signal Detection', level: 'L3', description: 'Pattern recognition and statistical analysis' },
      { domain: 'Domain 5 - PV in Clinical Trials', level: 'L3', description: 'Trial data analysis and interpretation' },
    ],
    supporting_domains: [
      { domain: 'Domain 15 - Sources of Information', level: 'L3', description: 'Multi-source data integration' },
      { domain: 'Domain 10 - Benefit-Risk Assessment', level: 'L2', description: 'Context for safety findings' },
      { domain: 'Domain 6 - Medication Errors', level: 'L2', description: 'Error pattern recognition and analysis' },
    ],
    observable_components: [
      {
        category: 'Analysis Planning',
        items: [
          'Defines clear analytical objectives aligned with surveillance goals',
          'Incorporates trial extension data appropriately',
          'Plans medication error trend analysis using established taxonomies',
          'Designs appropriate studies for specific safety questions',
          'Considers analytical limitations and confounding factors',
        ],
      },
      {
        category: 'Data Management',
        items: [
          'Performs routine database queries independently across multiple systems',
          'Identifies medication error patterns through systematic screening',
          'Uses AI tools for patient cohort identification',
          'Creates analytical datasets with appropriate documentation',
        ],
      },
      {
        category: 'Statistical Analysis',
        items: [
          'Applies multiple signal detection methods appropriately',
          'Analyzes trial versus real-world differences',
          'Implements standard operating procedures for database management',
          'Conducts stratified analyses to explore subgroup effects',
        ],
      },
      {
        category: 'AI-Enhanced Analytics',
        items: [
          'Utilizes AI analytics to identify subtle patterns not apparent through traditional methods',
          'Identifies medication error trends using machine learning',
          'Validates AI-generated study results against clinical knowledge',
          'Contributes to EPA10 progression through practical AI application',
        ],
      },
    ],
    entrustment_levels: {
      'L1': { title: 'Observation Only', description: 'Observes data analysis processes and learns analytical techniques', behavioral_anchors: ['Understands data types', 'Reviews completed analyses'] },
      'L2': { title: 'Direct Supervision', description: 'Performs basic queries with supervision and guidance', behavioral_anchors: ['Performs routine database queries', 'Uses AI tools for cohort identification'] },
      'L3': { title: 'Indirect Supervision', description: 'Conducts routine analyses independently with quality oversight', behavioral_anchors: ['Utilizes AI analytics for pattern identification', 'Validates AI-generated results'] },
      'L4': { title: 'Remote Supervision', description: 'Designs complex analytical approaches for novel safety questions', behavioral_anchors: ['Designs appropriate studies', 'Leads complex analyses'] },
      'L5': { title: 'Independent Practice', description: 'Innovates analytical methodologies that advance surveillance practice', behavioral_anchors: ['Creates new analytical methods', 'Establishes organizational standards'] },
    },
    ai_integration_requirements: [
      'Machine learning for pattern detection across large datasets',
      'AI-powered cohort identification and matching',
      'Automated data quality assessment',
      'Predictive analytics for trend identification',
    ],
    supports_cpas: ['CPA2', 'CPA4', 'CPA5'],
  },
  'EPA6': {
    educational_rationale: 'Regulatory document development represents the critical interface between safety science and regulatory decision-making. This EPA requires professionals to synthesize complex safety information into formats that support informed regulatory and clinical decisions.',
    scope_and_boundaries: [
      'Includes all regulatory document types across global regulatory frameworks',
      'Covers initial marketing applications, periodic safety updates, and post-marketing variations',
      'Addresses medication errors and important ADRs comprehensively within regulatory context',
      'Encompasses initial submissions, updates, and responses to regulatory questions',
      'Requires cross-functional collaboration with medical, regulatory, and quality teams',
    ],
    required_domains: [
      { domain: 'Domain 12 - Industry and Regulatory Authorities', level: 'L3', description: 'Regulatory framework knowledge and application' },
      { domain: 'Domain 11 - Risk Management', level: 'L3', description: 'Risk assessment and communication' },
      { domain: 'Domain 14 - Communication', level: 'L3', description: 'Technical writing and stakeholder communication' },
    ],
    supporting_domains: [
      { domain: 'Domain 10 - Benefit-Risk Assessment', level: 'L3', description: 'Balanced safety and efficacy presentation' },
      { domain: 'Domain 2 - Clinical Aspects of ADRs', level: 'L2', description: 'Clinical interpretation of safety data' },
      { domain: 'Domain 6 - Medication Errors', level: 'L2', description: 'Error prevention and communication' },
      { domain: 'Domain 3 - Important ADRs Recognition', level: 'L2', description: 'Appropriate emphasis on significant risks' },
    ],
    observable_components: [
      {
        category: 'Requirements Analysis',
        items: [
          'Applies regulatory requirements consistently across document sections',
          'Identifies region-specific requirements and adapts content',
          'Plans comprehensive safety sections meeting all applicable requirements',
          'Includes medication error prevention requirements in planning',
        ],
      },
      {
        category: 'Data Integration',
        items: [
          'Synthesizes safety data comprehensively from multiple sources',
          'Includes medication error information appropriately',
          'Highlights important ADRs based on clinical significance',
          'Develops comprehensive benefit-risk frameworks',
        ],
      },
      {
        category: 'Content Development',
        items: [
          'Develops comprehensive communication strategies for technical content',
          'Documents all ADR categories systematically',
          'Creates appropriate data displays enhancing understanding',
          'Ensures internal consistency across all sections',
        ],
      },
      {
        category: 'Quality Assurance',
        items: [
          'Manages regulatory compliance independently through systematic quality checks',
          'Implements AI-supported compliance monitoring',
          'Reviews trial compliance systematically',
          'Manages version control and change documentation',
        ],
      },
    ],
    entrustment_levels: {
      'L1': { title: 'Observation Only', description: 'Reviews completed regulatory documents and learns requirements', behavioral_anchors: ['Understands document types', 'Reviews regulatory guidelines'] },
      'L2': { title: 'Direct Supervision', description: 'Drafts document sections with close supervision', behavioral_anchors: ['Applies regulatory requirements', 'Drafts basic sections'] },
      'L3': { title: 'Indirect Supervision', description: 'Develops routine submissions independently with quality oversight', behavioral_anchors: ['Manages regulatory compliance independently', 'Implements AI-supported monitoring'] },
      'L4': { title: 'Remote Supervision', description: 'Leads complex submission development including novel strategies', behavioral_anchors: ['Develops comprehensive SOPs', 'Leads inspection preparation'] },
      'L5': { title: 'Independent Practice', description: 'Serves as regulatory document expert and establishes standards', behavioral_anchors: ['Creates organizational frameworks', 'Innovates regulatory approaches'] },
    },
    ai_integration_requirements: [
      'AI-assisted document generation and data synthesis',
      'Automated compliance checking and validation',
      'Natural language processing for consistency review',
      'Version control and change tracking automation',
    ],
    supports_cpas: ['CPA3', 'CPA6', 'CPA7'],
  },
  'EPA7': {
    educational_rationale: 'Risk minimization represents the proactive application of safety knowledge to prevent harm while maintaining therapeutic benefits. This EPA requires professionals to integrate safety science with behavioral understanding and implementation science.',
    scope_and_boundaries: [
      'Covers all types of risk minimization tools from routine measures to additional risk minimization systems',
      'Emphasizes medication error prevention as integral component of risk management',
      'Includes both routine and additional measures across diverse healthcare settings',
      'Encompasses global and local regulatory requirements and cultural considerations',
      'Integrates effectiveness evaluation and continuous improvement approaches',
    ],
    required_domains: [
      { domain: 'Domain 11 - Risk Management with AI', level: 'L4', description: 'Advanced risk assessment and intervention design' },
      { domain: 'Domain 13 - Global PV and Public Health', level: 'L3', description: 'Multi-cultural implementation considerations' },
      { domain: 'Domain 14 - Communication', level: 'L3', description: 'Stakeholder engagement and educational material development' },
      { domain: 'Domain 6 - Medication Errors', level: 'L3', description: 'Error prevention strategy development and implementation' },
    ],
    supporting_domains: [
      { domain: 'Domain 10 - Benefit-Risk Assessment', level: 'L3', description: 'Proportionate response to identified risks' },
      { domain: 'Domain 3 - Important ADRs Recognition', level: 'L2', description: 'Appropriate focus on significant safety concerns' },
    ],
    observable_components: [
      {
        category: 'Risk Characterization',
        items: [
          'Develops comprehensive risk management programs based on thorough risk assessment',
          'Prioritizes medication error risks based on frequency, severity, and preventability',
          'Conducts independent medication error investigations including complex cases',
          'Adapts to different markets considering regulatory and cultural factors',
        ],
      },
      {
        category: 'Measure Design',
        items: [
          'Develops error prevention strategies based on human factors principles',
          'Designs comprehensive risk management programs integrating multiple intervention types',
          'Develops comprehensive communication strategies for stakeholder engagement',
          'Incorporates behavioral insights in intervention design',
        ],
      },
      {
        category: 'Implementation Planning',
        items: [
          'Implements AI-enhanced monitoring systems for effectiveness tracking',
          'Creates training programs that drive behavioral change',
          'Coordinates with stakeholders across healthcare system levels',
          'Plans error reporting mechanisms that capture intervention impact',
        ],
      },
      {
        category: 'Effectiveness Evaluation',
        items: [
          'Evaluates effectiveness using appropriate metrics and analytical approaches',
          'Monitors error reduction rates and other safety outcomes',
          'Measures improvement impact across organizational levels',
          'Identifies improvement opportunities based on evaluation findings',
        ],
      },
    ],
    entrustment_levels: {
      'L1': { title: 'Observation Only', description: 'Observes risk minimization development and learns basic principles', behavioral_anchors: ['Understands RMM types', 'Reviews completed risk assessments'] },
      'L2': { title: 'Direct Supervision', description: 'Assists with measure component creation under supervision', behavioral_anchors: ['Contributes to risk characterization', 'Assists with educational materials'] },
      'L3': { title: 'Indirect Supervision', description: 'Develops routine risk minimization tools independently', behavioral_anchors: ['Develops comprehensive programs', 'Implements AI-enhanced monitoring'] },
      'L4': { title: 'Remote Supervision', description: 'Leads comprehensive program design for complex safety issues', behavioral_anchors: ['Incorporates behavioral insights', 'Creates training programs'] },
      'L5': { title: 'Independent Practice', description: 'Innovates risk minimization approaches that advance practice standards', behavioral_anchors: ['Drives innovation', 'Measures improvement impact'] },
    },
    ai_integration_requirements: [
      'Predictive risk modeling and prioritization',
      'AI-enhanced effectiveness monitoring',
      'Behavioral analytics for intervention optimization',
      'Automated compliance tracking across markets',
    ],
    supports_cpas: ['CPA4', 'CPA6', 'CPA7'],
  },
  'EPA8': {
    educational_rationale: 'Cross-functional safety investigations represent the highest level of collaborative professional practice, requiring integration of technical expertise with leadership and project management capabilities. This EPA demonstrates the transformation from individual contributor to team leader.',
    scope_and_boundaries: [
      'Encompasses emerging safety concerns requiring multidisciplinary investigation',
      'Requires benefit-risk integration across clinical, regulatory, and commercial perspectives',
      'Includes clinical trial safety investigations and post-marketing safety evaluations',
      'Demands project management capability and stakeholder coordination',
      'Produces executive-level recommendations that inform strategic decisions',
    ],
    required_domains: [
      { domain: 'Domain 8 - Signal Detection and Management', level: 'L4', description: 'Advanced signal investigation leadership' },
      { domain: 'Domain 14 - Communication', level: 'L4', description: 'Team leadership and stakeholder management' },
      { domain: 'Domain 1 - Foundations of PV', level: 'L3', description: 'Solid grounding in pharmacovigilance principles' },
      { domain: 'Domain 10 - Benefit-Risk Assessment', level: 'L3', description: 'Integrated assessment capability' },
    ],
    supporting_domains: [
      { domain: 'Domain 13 - Global PV', level: 'L3', description: 'Multi-cultural team management' },
      { domain: 'Domain 5 - PV in Clinical Trials', level: 'L3', description: 'Trial safety investigation leadership' },
    ],
    observable_components: [
      {
        category: 'Investigation Planning',
        items: [
          'Develops signal evaluation strategies appropriate to investigation complexity',
          'Applies foundational pharmacovigilance principles in investigation design',
          'Leads complex signal investigations across multiple data sources',
          'Includes clinical trial evidence appropriately',
          'Allocates resources effectively across investigation components',
        ],
      },
      {
        category: 'Team Leadership',
        items: [
          'Creates innovative communication approaches for complex team coordination',
          'Integrates benefit-risk perspectives across diverse functional areas',
          'Manages diverse viewpoints while maintaining investigation focus',
          'Navigates cultural differences in global team environments',
        ],
      },
      {
        category: 'Evidence Integration',
        items: [
          'Develops comprehensive frameworks for complex evidence synthesis',
          'Includes clinical trial evidence within broader safety evaluation',
          'Influences organizational strategy through investigation findings',
          'Applies foundational principles in evidence evaluation',
        ],
      },
      {
        category: 'Recommendation Development',
        items: [
          'Develops actionable recommendations balancing scientific evidence with practical constraints',
          'Balances benefits and risks in recommendation development',
          'Influences organizational strategy through evidence-based recommendations',
          'Presents recommendations to senior leadership with appropriate context',
        ],
      },
    ],
    entrustment_levels: {
      'L1': { title: 'Observation Only', description: 'Participates as team member and learns investigation processes', behavioral_anchors: ['Understands investigation workflow', 'Contributes to team discussions'] },
      'L2': { title: 'Direct Supervision', description: 'Leads investigation workstreams under supervision', behavioral_anchors: ['Manages specific workstreams', 'Coordinates with team members'] },
      'L3': { title: 'Indirect Supervision', description: 'Manages straightforward investigations independently', behavioral_anchors: ['Develops signal evaluation strategies', 'Leads routine investigations'] },
      'L4': { title: 'Remote Supervision', description: 'Leads complex, high-stakes investigations with organizational impact', behavioral_anchors: ['Leads complex investigations', 'Influences organizational strategy'] },
      'L5': { title: 'Independent Practice', description: 'Directs enterprise-level safety initiatives and establishes standards', behavioral_anchors: ['Directs enterprise initiatives', 'Creates organizational standards'] },
    },
    ai_integration_requirements: [
      'AI-enhanced evidence synthesis and pattern detection',
      'Automated investigation tracking and documentation',
      'Predictive analytics for investigation prioritization',
      'Cross-functional collaboration tools with AI support',
    ],
    supports_cpas: ['CPA5', 'CPA7', 'CPA8'],
  },
  'EPA9': {
    educational_rationale: 'Quality and compliance management represents the systematic application of quality principles to ensure consistent excellence in pharmacovigilance practice. This EPA requires professionals to integrate regulatory knowledge with quality management expertise and continuous improvement approaches.',
    scope_and_boundaries: [
      'Covers all pharmacovigilance processes including clinical trials and post-marketing surveillance',
      'Includes quality by design principles in process development and improvement',
      'Addresses medication error reporting quality as integral component of overall quality management',
      'Encompasses audit and inspection readiness across global regulatory frameworks',
      'Requires continuous improvement mindset and systematic change management',
    ],
    required_domains: [
      { domain: 'Domain 12 - Regulatory Authorities', level: 'L4', description: 'Advanced regulatory compliance management' },
      { domain: 'Domain 1 - Foundations of PV', level: 'L3', description: 'Solid understanding of pharmacovigilance principles' },
      { domain: 'Domain 11 - Risk Management', level: 'L3', description: 'Quality system design and implementation' },
    ],
    supporting_domains: [
      { domain: 'Domain 4 - ICSRs', level: 'L3', description: 'Case processing quality standards' },
      { domain: 'Domain 7 - Spontaneous Reporting', level: 'L3', description: 'Database quality management' },
      { domain: 'Domain 5 - PV in Clinical Trials', level: 'L3', description: 'Trial quality assurance' },
      { domain: 'Domain 6 - Medication Errors', level: 'L2', description: 'Error reporting quality management' },
    ],
    observable_components: [
      {
        category: 'Quality System Design',
        items: [
          'Develops comprehensive SOPs that ensure consistent, high-quality practice',
          'Includes trial safety procedures in quality system design',
          'Creates quality metrics and KPIs that drive continuous improvement',
          'Implements CAPA systems that address root causes',
          'Ensures medication error reporting quality through systematic process design',
        ],
      },
      {
        category: 'Compliance Monitoring',
        items: [
          'Prepares comprehensive regulatory submissions meeting all requirements',
          'Monitors medication error reporting quality and completeness',
          'Implements AI-supported compliance monitoring',
          'Reviews trial compliance systematically',
          'Tracks performance trends and identifies improvement opportunities',
        ],
      },
      {
        category: 'Audit Management',
        items: [
          'Leads comprehensive inspection preparation across all PV areas',
          'Manages external audits effectively',
          'Develops robust CAPAs that address findings comprehensively',
          'Implements corrective actions effectively',
        ],
      },
      {
        category: 'Continuous Improvement',
        items: [
          'Drives innovation in quality approaches and methodologies',
          'Leads quality initiatives that advance organizational capability',
          'Measures improvement impact systematically',
          'Shares best practices across teams and organizational units',
        ],
      },
    ],
    entrustment_levels: {
      'L1': { title: 'Observation Only', description: 'Follows quality procedures and learns quality principles', behavioral_anchors: ['Understands quality systems', 'Follows SOPs correctly'] },
      'L2': { title: 'Direct Supervision', description: 'Contributes to quality activities under supervision', behavioral_anchors: ['Assists with audits', 'Contributes to CAPA development'] },
      'L3': { title: 'Indirect Supervision', description: 'Manages routine quality processes independently', behavioral_anchors: ['Prepares regulatory submissions', 'Implements AI-supported monitoring'] },
      'L4': { title: 'Remote Supervision', description: 'Leads quality system enhancements and improvement initiatives', behavioral_anchors: ['Develops comprehensive SOPs', 'Leads inspection preparation'] },
      'L5': { title: 'Independent Practice', description: 'Transforms quality approaches and establishes organizational excellence', behavioral_anchors: ['Drives innovation', 'Builds quality culture'] },
    },
    ai_integration_requirements: [
      'AI-powered compliance monitoring and alerting',
      'Automated quality metrics tracking and trending',
      'Predictive analytics for compliance risk identification',
      'Machine learning for audit finding pattern analysis',
    ],
    supports_cpas: ['CPA4', 'CPA6', 'CPA7'],
  },
  'EPA11': {
    educational_rationale: 'Global pharmacovigilance strategy development represents the pinnacle of professional strategic thinking, requiring integration of safety science, business acumen, and organizational leadership to create transformative approaches to medication safety across diverse markets and regulatory frameworks.',
    scope_and_boundaries: [
      'Creates comprehensive strategies aligning safety objectives with business goals',
      'Ensures global regulatory compliance and operational excellence',
      'Builds organizational capabilities for sustainable safety monitoring',
      'Addresses portfolio-wide safety considerations and resource allocation',
      'Influences industry standards and regulatory evolution',
    ],
    required_domains: [
      { domain: 'Domain 13 - Global PV and Public Health', level: 'L5', description: 'Advanced global perspective and strategy' },
      { domain: 'Domain 11 - Risk Management', level: 'L5', description: 'Strategic risk management across portfolios' },
      { domain: 'Domain 12 - Regulatory Authorities', level: 'L5', description: 'Global regulatory strategy and engagement' },
      { domain: 'Domain 1 - Foundations of PV', level: 'L5', description: 'Philosophical and strategic understanding' },
    ],
    supporting_domains: [
      { domain: 'Domain 10 - Benefit-Risk', level: 'L4', description: 'Strategic benefit-risk assessment' },
    ],
    observable_components: [
      {
        category: 'Strategic Analysis',
        items: [
          'Influences global regulatory policy through thought leadership',
          'Shapes organizational PV philosophy that guides decision-making',
          'Transforms organizational approach to risk management',
          'Creates organizational frameworks that ensure compliance and efficiency',
        ],
      },
      {
        category: 'Strategy Development',
        items: [
          'Shapes industry-wide standards through professional leadership',
          'Creates frameworks adopted by others that advance PV practice',
          'Influences regulatory interpretation through expert consultation',
          'Develops comprehensive strategies balancing multiple objectives',
        ],
      },
    ],
    entrustment_levels: {
      'L3': { title: 'Indirect Supervision', description: 'Contributes meaningfully to strategy development processes', behavioral_anchors: ['Analyzes strategic options', 'Contributes to planning'] },
      'L4': { title: 'Remote Supervision', description: 'Leads strategic initiatives with organizational impact', behavioral_anchors: ['Leads strategic projects', 'Influences policy'] },
      'L5': { title: 'Independent Practice', description: 'Develops comprehensive strategies that transform capability', behavioral_anchors: ['Creates organizational frameworks', 'Shapes organizational philosophy'] },
      'L5+': { title: 'Executive Leadership', description: 'Transforms organizational capability with lasting impact', behavioral_anchors: ['Influences global policy', 'Transforms approaches'] },
      'L5++': { title: 'Industry Leadership', description: 'Shapes industry direction through visionary leadership', behavioral_anchors: ['Shapes industry standards', 'Creates lasting legacy'] },
    },
    ai_integration_requirements: [
      'AI-powered strategic analytics and forecasting',
      'Predictive modeling for resource allocation',
      'Automated competitive intelligence gathering',
      'Strategic scenario planning with AI support',
    ],
    supports_cpas: ['CPA6', 'CPA7', 'CPA8'],
  },
  'EPA12': {
    educational_rationale: 'Digital transformation leadership represents the integration of technological innovation with pharmacovigilance expertise to fundamentally reimagine safety operations. This EPA develops capabilities essential for navigating the profound technological changes reshaping the pharmaceutical industry.',
    scope_and_boundaries: [
      'Drives enterprise-wide digital transformation initiatives',
      'Fundamentally reimagines pharmacovigilance operations through technology',
      'Leads advanced technology adoption and process innovation',
      'Creates AI ecosystems that enhance rather than replace human expertise',
      'Builds organizational capabilities for sustained digital innovation',
    ],
    required_domains: [
      { domain: 'All domains with AI components', level: 'L5', description: 'Comprehensive AI integration across practice areas' },
      { domain: 'Domain 15 - Information Sources', level: 'L5', description: 'Advanced information management and technology' },
      { domain: 'Domain 14 - Communication', level: 'L5', description: 'Change management and stakeholder engagement' },
    ],
    supporting_domains: [
      { domain: 'Domain 11 - Risk Management', level: 'L4', description: 'Technology risk assessment and management' },
    ],
    observable_components: [
      {
        category: 'Transformation Vision',
        items: [
          'Transforms global approach to information through innovative technology',
          'Pioneers paradigm shifts in how organizations approach safety monitoring',
          'Creates AI ecosystems that enhance rather than replace human expertise',
          'Builds stakeholder coalitions supporting transformation initiatives',
        ],
      },
      {
        category: 'Technology Leadership',
        items: [
          'Designs AI systems meeting organizational needs and regulatory requirements',
          'Creates technology architecture supporting current and future needs',
          'Manages vendor relationships effectively',
          'Evaluates emerging technologies systematically',
        ],
      },
    ],
    entrustment_levels: {
      'L3': { title: 'Indirect Supervision', description: 'Leads digital projects with department-level impact', behavioral_anchors: ['Implements digital solutions', 'Manages projects'] },
      'L4': { title: 'Remote Supervision', description: 'Manages digital programs across organizational functions', behavioral_anchors: ['Designs AI systems', 'Creates technology architecture'] },
      'L5': { title: 'Independent Practice', description: 'Transforms organizations digitally with measurable outcomes', behavioral_anchors: ['Transforms approaches', 'Creates AI ecosystems'] },
      'L5+': { title: 'Executive Leadership', description: 'Creates industry digital standards with broad adoption', behavioral_anchors: ['Pioneers paradigm shifts', 'Creates industry standards'] },
      'L5++': { title: 'Industry Leadership', description: 'Influences global digital evolution in pharmacovigilance', behavioral_anchors: ['Transforms global approach', 'Shapes digital evolution'] },
    },
    ai_integration_requirements: [
      'Enterprise AI platform design and implementation',
      'Machine learning model governance and lifecycle management',
      'AI-powered process automation and optimization',
      'Digital twin and simulation technologies',
    ],
    supports_cpas: ['CPA5', 'CPA7', 'CPA8'],
  },
  'EPA13': {
    educational_rationale: 'High-performance team leadership represents the evolution from individual expertise to organizational capability building. This EPA develops professionals who can inspire diverse teams to exceed performance expectations while fostering innovation and professional growth.',
    scope_and_boundaries: [
      'Develops, inspires, and leads diverse, globally distributed teams',
      'Consistently exceeds performance expectations',
      'Fosters innovation and professional growth',
      'Builds lasting organizational capabilities that persist beyond individual tenure',
      'Creates succession pipelines ensuring organizational continuity',
    ],
    required_domains: [
      { domain: 'Domain 14 - Communication', level: 'L5', description: 'Advanced leadership communication and engagement' },
      { domain: 'Domain 13 - Global PV', level: 'L5', description: 'Global perspective and cultural competency' },
      { domain: 'Domain 1 - Foundations', level: 'L5', description: 'Leadership philosophy and professional development' },
    ],
    supporting_domains: [
      { domain: 'All other domains', level: 'L4', description: 'Technical competency to support team development' },
    ],
    observable_components: [
      {
        category: 'Team Architecture',
        items: [
          'Builds high-performing organizations that deliver exceptional results',
          'Creates lasting institutional capabilities that persist beyond tenure',
          'Designs optimal team structures maximizing collaboration and performance',
          'Builds diverse teams leveraging different perspectives',
        ],
      },
      {
        category: 'Talent Development',
        items: [
          'Develops next-generation leaders through systematic mentoring',
          'Shapes academic curricula globally to improve professional preparation',
          'Creates development pathways that accelerate professional growth',
          'Builds succession pipeline ensuring organizational continuity',
        ],
      },
    ],
    entrustment_levels: {
      'L3': { title: 'Indirect Supervision', description: 'Leads small teams effectively with positive outcomes', behavioral_anchors: ['Manages teams', 'Develops individuals'] },
      'L4': { title: 'Remote Supervision', description: 'Manages large, complex teams across multiple functions', behavioral_anchors: ['Creates development pathways', 'Builds diverse teams'] },
      'L5': { title: 'Independent Practice', description: 'Transforms organizational culture through leadership excellence', behavioral_anchors: ['Creates institutional capabilities', 'Designs optimal structures'] },
      'L5+': { title: 'Executive Leadership', description: 'Builds global leadership networks advancing the profession', behavioral_anchors: ['Develops next-generation leaders', 'Shapes academic curricula'] },
      'L5++': { title: 'Industry Leadership', description: 'Influences global talent development across the industry', behavioral_anchors: ['Builds high-performing organizations', 'Creates lasting legacy'] },
    },
    ai_integration_requirements: [
      'AI-enhanced talent analytics and succession planning',
      'Machine learning for performance optimization',
      'Automated skills gap analysis and development planning',
      'Virtual collaboration and team coordination tools',
    ],
    supports_cpas: ['CPA6', 'CPA7', 'CPA8'],
  },
  'EPA14': {
    educational_rationale: 'Regulatory policy influence represents the highest level of professional engagement with the regulatory ecosystem. This EPA develops capabilities essential for shaping the regulatory frameworks that govern pharmacovigilance practice globally.',
    scope_and_boundaries: [
      'Shapes regulatory thinking and industry practices through thought leadership',
      'Strategic engagement with authorities and standard-setting initiatives',
      'Focuses on global harmonization and practical implementation',
      'Bridges regional differences to facilitate international alignment',
      'Creates innovation-friendly policies that advance patient safety',
    ],
    required_domains: [
      { domain: 'Domain 12 - Regulatory Authorities', level: 'L5+', description: 'Advanced regulatory expertise and influence' },
      { domain: 'Domain 1 - Foundations', level: 'L5+', description: 'Philosophical understanding and thought leadership' },
      { domain: 'Domain 13 - Global PV', level: 'L5', description: 'Global perspective and cross-cultural competency' },
    ],
    supporting_domains: [
      { domain: 'Domain 14 - Communication', level: 'L5', description: 'Stakeholder engagement and influence' },
      { domain: 'Domain 10 - Benefit-Risk', level: 'L5', description: 'Advanced assessment and policy development' },
      { domain: 'Domain 5 - PV in Clinical Trials', level: 'L4', description: 'Trial safety policy and standards' },
    ],
    observable_components: [
      {
        category: 'Regulatory Thought Leadership',
        items: [
          'Influences regulatory evolution at highest levels through expert advisory roles',
          'Leaves lasting legacy through policy transformation improving medication safety',
          'Publishes peer-reviewed articles advancing scientific understanding',
          'Influences global regulatory policy through international engagement',
        ],
      },
      {
        category: 'Policy Development',
        items: [
          'Shapes regulatory expectations through expert consultation and guidance',
          'Advises regulatory bodies on policy development and implementation',
          'Represents industry positions while maintaining scientific objectivity',
          'Promotes innovation-friendly policies that advance patient safety',
        ],
      },
    ],
    entrustment_levels: {
      'L4': { title: 'Remote Supervision', description: 'Contributes meaningfully to policy discussions and development', behavioral_anchors: ['Contributes to policy discussions', 'Engages with regulators'] },
      'L5': { title: 'Independent Practice', description: 'Influences regulatory thinking through expert engagement', behavioral_anchors: ['Shapes regulatory expectations', 'Advises regulatory bodies'] },
      'L5+': { title: 'Executive Leadership', description: 'Shapes industry direction through policy leadership', behavioral_anchors: ['Influences global policy', 'Promotes innovation-friendly policies'] },
      'L5++': { title: 'Industry Leadership', description: 'Transforms global regulatory frameworks through sustained influence', behavioral_anchors: ['Influences evolution at highest levels', 'Leaves lasting legacy'] },
    },
    ai_integration_requirements: [
      'AI-powered regulatory intelligence and trend analysis',
      'Automated policy impact assessment',
      'Natural language processing for regulatory document analysis',
      'Predictive analytics for regulatory evolution',
    ],
    supports_cpas: ['CPA6', 'CPA7', 'CPA8'],
  },
  'EPA15': {
    educational_rationale: 'Scientific innovation leadership represents the advancement of pharmacovigilance science itself. This EPA develops capabilities essential for creating breakthrough methodologies and approaches that are adopted across the industry.',
    scope_and_boundaries: [
      'Leads breakthrough innovations advancing the science and practice of pharmacovigilance',
      'Creates new methodologies, technologies, or approaches adopted across the industry',
      'Advances theoretical understanding of safety monitoring',
      'Pioneers new paradigms for trial safety and real-world evidence',
      'Establishes new research paradigms and scientific frameworks',
    ],
    required_domains: [
      { domain: 'Domain 8 - Signal Detection', level: 'L5+', description: 'Scientific innovation in signal detection' },
      { domain: 'Domain 9 - Studies', level: 'L5+', description: 'Methodological innovation in safety studies' },
      { domain: 'Domain 10 - Benefit-Risk', level: 'L5+', description: 'Framework development and advancement' },
      { domain: 'Domain 5 - PV in Clinical Trials', level: 'L5+', description: 'Trial safety innovation and methodology' },
    ],
    supporting_domains: [
      { domain: 'All domains', level: 'L4+', description: 'Comprehensive understanding for innovation development' },
    ],
    observable_components: [
      {
        category: 'Innovation Identification',
        items: [
          'Establishes new research paradigms that advance signal detection science',
          'Advances theoretical understanding of safety monitoring in real-world settings',
          'Creates new frameworks for benefit-risk assessment and communication',
          'Pioneers new paradigms for trial safety that improve patient protection',
        ],
      },
      {
        category: 'Research Leadership',
        items: [
          'Influences international guidelines through scientific expertise',
          'Creates new methodologies that become standard practice',
          'Shapes future directions of benefit-risk science',
          'Creates industry-standard methodologies for trial safety monitoring',
        ],
      },
    ],
    entrustment_levels: {
      'L4': { title: 'Remote Supervision', description: 'Implements innovations with organizational impact', behavioral_anchors: ['Implements novel approaches', 'Leads research projects'] },
      'L5': { title: 'Independent Practice', description: 'Creates novel approaches that advance the field', behavioral_anchors: ['Establishes research paradigms', 'Creates new frameworks'] },
      'L5+': { title: 'Executive Leadership', description: 'Transforms field practices through scientific leadership', behavioral_anchors: ['Creates new methodologies', 'Influences international guidelines'] },
      'L5++': { title: 'Industry Leadership', description: 'Revolutionizes scientific understanding through breakthrough discoveries', behavioral_anchors: ['Pioneers new paradigms', 'Advances theoretical understanding'] },
    },
    ai_integration_requirements: [
      'AI-powered scientific discovery and hypothesis generation',
      'Machine learning for novel pattern identification',
      'Automated literature synthesis for research planning',
      'Advanced analytics for methodological innovation',
    ],
    supports_cpas: ['CPA5', 'CPA7', 'CPA8'],
  },
};

// Get detailed EPA information
export async function getEPADetail(epaId: string): Promise<EPADetail | null> {
  const basicEpa = epasData.find(epa => epa.id === epaId);
  if (!basicEpa) return null;

  // Get rich data if available
  const richData = epaDetailData[epaId];

  // Map basic EPA to detailed format with rich data
  const detail: EPADetail = {
    id: basicEpa.id,
    title: basicEpa.name,
    category: basicEpa.tier,
    definition: basicEpa.definition,
    career_stage: basicEpa.careerStage,
    ai_integration: basicEpa.aiIntegration,
    primary_domains: basicEpa.primaryDomains,

    // Rich data from PDC manual or defaults
    educational_rationale: richData?.educational_rationale || `This EPA establishes competency in ${basicEpa.name.toLowerCase()}, requiring professionals to integrate clinical knowledge, regulatory requirements, and communication skills.`,
    scope_and_boundaries: richData?.scope_and_boundaries || [
      `Encompasses complete lifecycle of ${basicEpa.name.toLowerCase()}`,
      'Integrates AI-assisted approaches while maintaining human oversight',
      'Produces actionable outcomes that impact patient safety',
    ],
    required_domains: richData?.required_domains || basicEpa.primaryDomains.slice(0, 3).map(d => ({
      domain: d,
      level: 'L3',
      description: `Core competency requirement`,
    })),
    supporting_domains: richData?.supporting_domains || basicEpa.primaryDomains.slice(3).map(d => ({
      domain: d,
      level: 'L2',
      description: 'Supporting competency',
    })),
    observable_components: richData?.observable_components || [
      {
        category: 'Core Activities',
        items: [
          `Performs ${basicEpa.name.toLowerCase()} activities systematically`,
          'Applies established procedures and guidelines',
          'Documents activities appropriately',
        ],
      },
    ],
    entrustment_levels: richData?.entrustment_levels || {
      'L1': { title: 'Observation Only', description: 'Observes activities with active engagement', behavioral_anchors: [] },
      'L2': { title: 'Direct Supervision', description: 'Performs with supervisor present', behavioral_anchors: [] },
      'L3': { title: 'Indirect Supervision', description: 'Works independently with supervisor available', behavioral_anchors: [] },
      'L4': { title: 'Remote Supervision', description: 'Manages complex cases with minimal oversight', behavioral_anchors: [] },
      'L5': { title: 'Independent Practice', description: 'Functions as expert with full autonomy', behavioral_anchors: [] },
    },
    ai_integration_requirements: richData?.ai_integration_requirements || [basicEpa.aiIntegration],
    quality_metrics: richData?.quality_metrics,
    supports_cpas: richData?.supports_cpas || (basicEpa.tier === 'core' ? ['CPA1', 'CPA2', 'CPA3'] : ['CPA6', 'CPA7', 'CPA8']),
    drive_link: 'https://docs.google.com/document/d/1faUP6hdmvcMejNNv4YrmXXHG5haiL05wgmJhn_3BsXg/edit',
  };

  return detail;
}

// CPA proficiency levels data
// Rich CPA detail data from PDC Manual Chapter 6
const cpaDetailData: Record<string, Partial<CPADetail>> = {
  'CPA1': {
    educationalPhilosophy: 'Case Management represents the foundation of pharmacovigilance practice. This CPA transforms adverse event information into actionable safety intelligence through systematic case processing, pattern recognition, and quality documentation.',
    supportingDomains: ['Domain 1 - Foundations', 'Domain 6 - Medication Errors'],
    supportingEPAs: ['EPA 4', 'EPA 10'],
    proficiencyLevels: {
      'L1-L2': { title: 'Foundation with Supervision', description: 'Supervised case processing with pattern recognition development', scope: 'Basic competency demonstration', keyCapability: 'Foundational skill development', supervision: 'Direct guidance required' },
      'L3': { title: 'Independent Professional Practice', description: 'Independent complex case management with mentoring capability', scope: 'Integrated decision-making', keyCapability: 'Autonomous professional capability', supervision: 'Available for consultation' },
      'L4': { title: 'Advanced Innovation and Leadership', description: 'Process optimization and innovation leadership', scope: 'Strategic thinking and innovation', keyCapability: 'Organizational influence', supervision: 'Remote oversight only' },
      'L5+': { title: 'Strategic Transformation', description: 'Enterprise case management transformation', scope: 'Industry influence and paradigm creation', keyCapability: 'Field advancement and legacy creation', supervision: 'None - recognized expert' },
    },
    behavioralAnchors: {
      'L1': ['Correctly identifies basic ADR types (Type A vs Type B)', 'Uses basic PV terminology correctly', 'Reviews completed cases for learning'],
      'L2': ['Applies causality assessment criteria consistently', 'Recognizes common temporal patterns', 'Requires validation of decisions before implementation'],
      'L3': ['Conducts comprehensive clinical evaluations independently', 'Identifies important ADRs requiring special attention', 'Mentors junior staff on case processing'],
      'L4': ['Creates innovative approaches to complex clinical challenges', 'Develops new case processing workflows', 'Leads quality improvement initiatives'],
      'L5': ['Pioneers new understanding of ADR mechanisms', 'Creates industry-standard frameworks', 'Transforms organizational case management'],
    },
    successMetrics: ['Processing accuracy >98%', 'ADR identification rate 100%', 'Medication error detection rate >95%', 'Timeline compliance 100%', 'Coding consistency >95%'],
    developmentPathway: ['Basic case intake and triage', 'Data collection and evaluation', 'Medical assessment and coding', 'Narrative development', 'Quality assurance and submission'],
    integrationModules: ['Foundation-Communication Integration Module (Domains 1 + 14)'],
    implementationPhase: 'Phase 1: Foundation Building (Months 1-6)',
  },
  'CPA2': {
    educationalPhilosophy: 'Signal Management transforms data patterns into validated safety signals through sophisticated analytical approaches, multi-source integration, and stakeholder communication. This CPA represents proactive safety surveillance excellence.',
    supportingDomains: ['Domain 2 - Clinical ADRs', 'Domain 5 - Clinical Trials', 'Domain 14 - Communication'],
    supportingEPAs: ['EPA 3', 'EPA 4'],
    proficiencyLevels: {
      'L1-L2': { title: 'Foundation with Supervision', description: 'Basic detection support with data compilation and simple statistics', scope: 'Data compilation and basic analysis', keyCapability: 'Foundation signal detection skills', supervision: 'Direct' },
      'L3': { title: 'Independent Professional Practice', description: 'Routine signal evaluation with multi-methodology application', scope: 'Multi-methodology application', keyCapability: 'Independent signal evaluation', supervision: 'Indirect' },
      'L4': { title: 'Advanced Innovation and Leadership', description: 'Complex investigation leadership with novel methodology development', scope: 'Novel methodology development', keyCapability: 'Innovation in signal detection', supervision: 'Remote' },
      'L5+': { title: 'Strategic Transformation', description: 'Enterprise signal strategy with paradigm transformation', scope: 'Industry paradigm transformation', keyCapability: 'Strategic signal leadership', supervision: 'Independent' },
    },
    behavioralAnchors: {
      'L2': ['Applies multiple signal detection methods to routine analyses', 'Presents simple signal findings clearly', 'Compiles data from multiple sources'],
      'L3': ['Integrates multiple data sources for comprehensive signal detection', 'Prioritizes signals based on clinical significance', 'Leads routine signal assessments'],
      'L4': ['Develops novel signal detection methodologies using AI', 'Optimizes AI algorithms for improved accuracy', 'Leads complex signal investigations'],
      'L5': ['Creates industry-standard frameworks for AI-enhanced detection', 'Pioneers new signal detection paradigms', 'Transforms organizational signal management'],
    },
    successMetrics: ['Signal detection accuracy >95%', 'False positive rate <10%', 'Signal validation completeness 100%', 'Stakeholder communication effectiveness >4.5/5.0'],
    developmentPathway: ['Signal identification', 'Initial evaluation', 'Evidence gathering', 'Signal validation', 'Stakeholder communication'],
    integrationModules: ['Signal-Communication Integration Module (Domains 8 + 14)'],
    implementationPhase: 'Phase 2: Technical Development (Months 7-12)',
  },
  'CPA3': {
    educationalPhilosophy: 'Risk Management develops and implements targeted interventions that minimize medication risks while preserving therapeutic access. This CPA emphasizes strategic safety risk mitigation with focus on medication error prevention.',
    supportingDomains: ['Domain 10 - Benefit-Risk Assessment', 'Domain 3 - Important ADRs Recognition'],
    supportingEPAs: ['EPA 3', 'EPA 9'],
    proficiencyLevels: {
      'L1-L2': { title: 'Foundation', description: 'Risk documentation and basic intervention support', scope: 'Basic risk documentation', keyCapability: 'Foundation risk management', supervision: 'Direct' },
      'L3': { title: 'Independent Professional', description: 'Program design and implementation leadership', scope: 'Program design', keyCapability: 'Independent risk management', supervision: 'Indirect' },
      'L4': { title: 'Advanced Practice', description: 'Strategic risk portfolio management and innovation', scope: 'Strategic portfolio management', keyCapability: 'Risk innovation', supervision: 'Remote' },
      'L5+': { title: 'Strategic Transformation', description: 'Enterprise risk philosophy and industry transformation', scope: 'Enterprise risk philosophy', keyCapability: 'Industry transformation', supervision: 'Independent' },
    },
    behavioralAnchors: {
      'L2': ['Contributes to risk characterization', 'Assists with educational material development', 'Documents risk minimization activities'],
      'L3': ['Designs comprehensive risk management programs independently', 'Implements AI-enhanced monitoring', 'Develops error prevention strategies'],
      'L4': ['Creates comprehensive frameworks for complex risk challenges', 'Incorporates behavioral insights', 'Leads cross-functional risk initiatives'],
      'L5': ['Pioneers new paradigms for AI-enhanced risk management', 'Transforms organizational risk culture', 'Influences industry risk standards'],
    },
    successMetrics: ['Risk minimization effectiveness >90%', 'Medication error reduction >50%', 'Stakeholder compliance >95%', 'Program implementation on time 100%'],
    developmentPathway: ['Risk characterization', 'Measure design', 'Implementation planning', 'Effectiveness evaluation', 'Continuous improvement'],
    integrationModules: ['Foundation-Communication Module', 'Benefit-Risk-Communication Module', 'Signal-Communication Module'],
    implementationPhase: 'Phase 1: Foundation Building (Months 1-6)',
  },
  'CPA4': {
    educationalPhilosophy: 'Quality and Compliance ensures systematic quality across all pharmacovigilance processes through comprehensive compliance management, audit readiness, and continuous improvement.',
    supportingDomains: ['Domain 4 - ICSRs', 'Domain 5 - Clinical Trials', 'Domain 6 - Medication Errors', 'Domain 7 - Spontaneous Reporting'],
    supportingEPAs: ['EPA 1', 'EPA 10'],
    proficiencyLevels: {
      'L1-L2': { title: 'Foundation', description: 'Process following and basic quality support', scope: 'Process following', keyCapability: 'Foundation quality skills', supervision: 'Direct' },
      'L3': { title: 'Independent Management', description: 'Independent quality process management', scope: 'Independent management', keyCapability: 'Quality process ownership', supervision: 'Indirect' },
      'L4': { title: 'System Innovation', description: 'Quality system enhancement and innovation', scope: 'System innovation', keyCapability: 'Quality innovation', supervision: 'Remote' },
      'L5+': { title: 'Transformation', description: 'Quality transformation and organizational excellence', scope: 'Quality transformation', keyCapability: 'Organizational excellence', supervision: 'Independent' },
    },
    behavioralAnchors: {
      'L2': ['Follows SOPs correctly', 'Assists with audit preparation', 'Contributes to CAPA development'],
      'L3': ['Manages routine quality processes independently', 'Implements AI-supported compliance monitoring', 'Prepares comprehensive regulatory submissions'],
      'L4': ['Develops comprehensive SOPs', 'Leads inspection preparation', 'Drives quality improvement initiatives'],
      'L5': ['Drives innovation in quality approaches', 'Builds organizational quality culture', 'Establishes industry quality standards'],
    },
    successMetrics: ['SOP compliance 100%', 'Audit effectiveness: High ratings', 'Training delivery satisfaction >4.5/5.0', 'CAPA success rate >90%'],
    developmentPathway: ['Quality system design', 'Compliance monitoring', 'Audit management', 'Continuous improvement'],
    integrationModules: ['Foundation-Communication Integration Module (Domains 1 + 14)'],
    implementationPhase: 'Phase 2: Technical Development (Months 7-12)',
  },
  'CPA5': {
    educationalPhilosophy: 'Data and Technology leverages data analytics and AI capabilities to transform pharmacovigilance efficiency while maintaining data integrity and regulatory compliance. This CPA serves as the primary pathway for EPA10 → CPA8 progression.',
    supportingDomains: ['Domain 1 - Foundations', 'Domain 8 - Signal Detection', 'Domain 12 - Regulatory'],
    supportingEPAs: ['EPA 1', 'EPA 2', 'EPA 5'],
    proficiencyLevels: {
      'L1-L2': { title: 'Foundation', description: 'Basic system usage and AI tool observation', scope: 'Basic system usage', keyCapability: 'Foundation technology skills', supervision: 'Direct' },
      'L3': { title: 'Advanced Analytics', description: 'Advanced analytics and AI tool application', scope: 'AI tool application', keyCapability: 'Independent AI usage', supervision: 'Indirect' },
      'L4': { title: 'AI Strategy Development', description: 'AI strategy development and innovation leadership', scope: 'Strategy development', keyCapability: 'AI innovation leadership', supervision: 'Remote' },
      'L5+': { title: 'Technology Vision', description: 'Technology vision and digital ecosystem creation', scope: 'Digital ecosystem creation', keyCapability: 'Technology transformation', supervision: 'Independent' },
    },
    behavioralAnchors: {
      'L2': ['Uses AI tools with supervision', 'Identifies AI application opportunities', 'Performs basic data queries'],
      'L3': ['Proposes AI solutions for workflow improvements', 'Validates AI tool outputs', 'Implements advanced analytics'],
      'L4': ['Designs comprehensive AI integration strategies', 'Optimizes AI algorithms', 'Leads digital transformation projects'],
      'L5': ['Pioneers new AI applications', 'Creates industry-standard frameworks', 'Transforms organizational technology approach'],
    },
    successMetrics: ['Data accuracy >99%', 'System uptime >99.9%', 'AI tool adoption rate >80%', 'Efficiency gains >50%'],
    developmentPathway: ['System fundamentals', 'Data management', 'Analytics application', 'AI implementation', 'Digital transformation'],
    integrationModules: ['EPA10 AI Gateway Integration'],
    implementationPhase: 'Phase 2: Technical Development (Months 7-12)',
  },
  'CPA6': {
    educationalPhilosophy: 'Communication and Stakeholder Activities creates and delivers impactful safety communications tailored to diverse audiences while building stakeholder trust and facilitating informed decision-making.',
    supportingDomains: ['Domain 1 - Foundations', 'Domain 8 - Signal Detection', 'Domain 10 - Benefit-Risk'],
    supportingEPAs: ['EPA 8', 'EPA 10'],
    proficiencyLevels: {
      'L1-L2': { title: 'Foundation', description: 'Document preparation and meeting support', scope: 'Document preparation', keyCapability: 'Foundation communication', supervision: 'Direct' },
      'L3': { title: 'Professional', description: 'Strategy development and relationship building', scope: 'Strategy development', keyCapability: 'Stakeholder engagement', supervision: 'Indirect' },
      'L4': { title: 'Advanced', description: 'Executive communication and crisis management', scope: 'Executive communication', keyCapability: 'Crisis leadership', supervision: 'Remote' },
      'L5+': { title: 'Strategic', description: 'Organizational voice and industry influence', scope: 'Industry influence', keyCapability: 'Thought leadership', supervision: 'Independent' },
    },
    behavioralAnchors: {
      'L2': ['Uses appropriate language for communications', 'Analyzes audience needs', 'Prepares basic presentation materials'],
      'L3': ['Develops comprehensive communication strategies', 'Creates effective data visualizations', 'Presents confidently to diverse audiences'],
      'L4': ['Creates innovative communication approaches', 'Manages complex stakeholder communications', 'Leads crisis communications'],
      'L5': ['Creates industry communication standards', 'Transforms organizational communication', 'Influences external stakeholder perceptions'],
    },
    successMetrics: ['Stakeholder satisfaction >4.5/5.0', 'Communication clarity >95%', 'Response time compliance 100%', 'Crisis communication effectiveness'],
    developmentPathway: ['Audience analysis', 'Message development', 'Visual communication', 'Delivery and presentation', 'Stakeholder management'],
    integrationModules: ['Foundation-Communication Module (Domains 1 + 14)', 'Benefit-Risk-Communication Module (Domains 10 + 14)', 'Signal-Communication Module (Domains 8 + 14)'],
    implementationPhase: 'Phase 1: Foundation Building (Months 1-6)',
  },
  'CPA7': {
    educationalPhilosophy: 'Research and Development conducts rigorous research that advances pharmacovigilance science through methodology development, evidence generation, and knowledge dissemination.',
    supportingDomains: ['Domain 2 - Clinical ADRs', 'Domain 13 - Global PV', 'Domain 15 - Information Sources'],
    supportingEPAs: ['EPA 6', 'EPA 10'],
    proficiencyLevels: {
      'L1-L2': { title: 'Foundation', description: 'Literature search and data collection support', scope: 'Literature search support', keyCapability: 'Foundation research skills', supervision: 'Direct' },
      'L3': { title: 'Independent Practice', description: 'Study design and project management', scope: 'Study design', keyCapability: 'Research project leadership', supervision: 'Indirect' },
      'L4': { title: 'Advanced Practice', description: 'Methodology innovation and scientific leadership', scope: 'Methodology innovation', keyCapability: 'Scientific innovation', supervision: 'Remote' },
      'L5+': { title: 'Strategic Transformation', description: 'Research philosophy and field transformation', scope: 'Field transformation', keyCapability: 'Scientific legacy', supervision: 'Independent' },
    },
    behavioralAnchors: {
      'L2': ['Conducts systematic literature searches', 'Compiles research data accurately', 'Assists with study documentation'],
      'L3': ['Designs research studies independently', 'Manages research projects', 'Analyzes and interprets findings'],
      'L4': ['Develops novel research methodologies', 'Leads multi-site studies', 'Publishes in peer-reviewed journals'],
      'L5': ['Creates industry-standard research frameworks', 'Pioneers new research paradigms', 'Transforms field through scientific discovery'],
    },
    successMetrics: ['Publication rate', 'Research impact factor', 'Study completion rate >90%', 'Methodology adoption by peers'],
    developmentPathway: ['Literature evaluation', 'Study design', 'Data collection', 'Analysis and interpretation', 'Dissemination'],
    integrationModules: ['Signal-Communication Integration Module (Domains 8 + 14)'],
    implementationPhase: 'Phase 2: Technical Development (Months 7-12)',
  },
  'CPA8': {
    educationalPhilosophy: 'AI-Enhanced Pharmacovigilance represents the pinnacle achievement in AI-integrated pharmacovigilance practice, requiring EPA10 Level 4+ mastery and demonstrating comprehensive AI leadership across all domains. This is the capstone CPA.',
    supportingDomains: ['All 15 competency domains with AI enhancement'],
    supportingEPAs: ['All EPAs with AI integration focus'],
    proficiencyLevels: {
      'L4': { title: 'CPA8 Entry', description: 'Implements validated AI tools across operations with organizational impact', scope: 'AI implementation leadership', keyCapability: 'Cross-functional AI integration', supervision: 'Remote' },
      'L5': { title: 'Transformation Leadership', description: 'Leads organizational AI transformation with measurable outcomes', scope: 'Organizational transformation', keyCapability: 'AI transformation leadership', supervision: 'Independent' },
      'L5+': { title: 'Industry Innovation', description: 'Innovates AI applications for PV practice with industry recognition', scope: 'Industry innovation', keyCapability: 'Thought leadership', supervision: 'None - recognized expert' },
      'L5++': { title: 'Global Leadership', description: 'Shapes industry AI standards and practices with lasting legacy', scope: 'Global standards creation', keyCapability: 'Industry-shaping influence', supervision: 'None - industry leader' },
    },
    behavioralAnchors: {
      'L4': ['Implements validated AI tools across operations', 'Achieves efficiency gains >300%', 'Demonstrates cross-functional AI competency'],
      'L5': ['Leads organizational AI transformation', 'Develops AI governance frameworks', 'Creates innovation portfolios with measurable ROI'],
      'L5+': ['Pioneers new AI applications for PV', 'Publishes peer-reviewed articles on AI', 'Advises regulatory bodies on AI policy'],
      'L5++': ['Shapes industry AI standards and practices', 'Creates frameworks adopted globally', 'Leaves lasting legacy in AI-enhanced PV'],
    },
    successMetrics: ['Innovation adoption by >5 organizations', 'ROI achievement >300%', 'Industry speaking engagements', 'Publication impact', 'Advisory roles with regulatory bodies', 'Organizational capability building >5 years', 'Mentee advancement >20 professionals'],
    developmentPathway: ['EPA10 L4+ prerequisite completion', 'CPA8 preparation', 'Execution phase', 'Mastery demonstration', 'Industry leadership'],
    integrationModules: ['All integration modules', 'EPA10 AI Gateway completion'],
    implementationPhase: 'Phase 4: Advanced Practice (Months 19-24)',
  },
};

/**
 * Get detailed CPA information
 */
export async function getCPADetail(cpaId: string): Promise<CPADetail | null> {
  const basicCpa = cpasData.find(cpa => cpa.id === cpaId);
  if (!basicCpa) return null;

  // Get rich data if available
  const richData = cpaDetailData[cpaId];

  // Map basic CPA to detailed format with rich data
  const detail: CPADetail = {
    id: basicCpa.id,
    name: basicCpa.name,
    focusArea: basicCpa.focusArea,
    summary: basicCpa.summary,
    primaryDomains: basicCpa.primaryDomains,
    supportingDomains: richData?.supportingDomains,
    keyEPAs: basicCpa.keyEPAs,
    supportingEPAs: richData?.supportingEPAs,
    aiIntegration: basicCpa.aiIntegration,
    careerStage: basicCpa.careerStage,
    proficiencyLevels: richData?.proficiencyLevels || {
      'L1-L2': { title: 'Foundation', description: 'Practice with direct supervision', scope: 'Basic competency', keyCapability: 'Foundation skills', supervision: 'Direct' },
      'L3': { title: 'Independent Practice', description: 'Independent practice with oversight', scope: 'Integrated decision-making', keyCapability: 'Professional capability', supervision: 'Indirect' },
      'L4': { title: 'Advanced Practice', description: 'Advanced practice with consultation', scope: 'Strategic thinking', keyCapability: 'Organizational influence', supervision: 'Remote' },
      'L5+': { title: 'Expert Practice', description: 'Expert independent practice', scope: 'Industry influence', keyCapability: 'Field advancement', supervision: 'Independent' },
    },
    behavioralAnchors: richData?.behavioralAnchors || {
      'L2': [`Demonstrates basic ${basicCpa.focusArea} skills`],
      'L3': [`Applies ${basicCpa.focusArea} independently`],
      'L4': [`Leads ${basicCpa.focusArea} initiatives`],
      'L5': [`Transforms ${basicCpa.focusArea} practice`],
    },
    successMetrics: richData?.successMetrics,
    developmentPathway: richData?.developmentPathway,
    integrationModules: richData?.integrationModules,
    educationalPhilosophy: richData?.educationalPhilosophy,
    implementationPhase: richData?.implementationPhase,
  };

  return detail;
}
