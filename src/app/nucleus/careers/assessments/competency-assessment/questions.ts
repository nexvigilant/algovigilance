'use client';

/**
 * PV Competency Self-Assessment Questions
 * 30 questions covering all 8 CPAs at L1-L3 difficulty
 * 5-point Likert scale: Not Confident (1) → Very Confident (5)
 */

export interface AssessmentQuestion {
  id: string;
  cpa: string; // Universal, Causality, Pharmacology, etc.
  text: string;
  description?: string;
  level: 'L1' | 'L2' | 'L3'; // Proficiency level tested
  category: 'knowledge' | 'application' | 'judgment';
}

export const assessmentQuestions: AssessmentQuestion[] = [
  // UNIVERSAL CPA (L1-L3) - 4 questions
  {
    id: 'U1',
    cpa: 'Universal',
    level: 'L1',
    category: 'knowledge',
    text: 'I can recognize serious adverse events (SAEs) and distinguish them from non-serious events',
    description: 'Understanding SAE classification and definitions'
  },
  {
    id: 'U2',
    cpa: 'Universal',
    level: 'L2',
    category: 'application',
    text: 'I can evaluate whether an adverse event meets causality criteria based on temporal relationship and dechallenge/rechallenge evidence',
    description: 'Applying WHO-UMC causality assessment criteria'
  },
  {
    id: 'U3',
    cpa: 'Universal',
    level: 'L3',
    category: 'judgment',
    text: 'I can prioritize among multiple suspected adverse events based on medical importance, regulatory significance, and signal potential',
    description: 'Making judgments about event significance and priority'
  },
  {
    id: 'U4',
    cpa: 'Universal',
    level: 'L2',
    category: 'knowledge',
    text: 'I understand the pharmacovigilance regulatory landscape including ICH E2A, E2B(R3), and regional requirements',
    description: 'Knowledge of regulatory frameworks'
  },

  // CAUSALITY ASSESSMENT CPA (L1-L3) - 4 questions
  {
    id: 'CA1',
    cpa: 'Causality Assessment',
    level: 'L1',
    category: 'knowledge',
    text: 'I can apply the WHO-UMC causality categories (Certain, Probable, Possible, Unlikely) to case narratives',
    description: 'Understanding causality categories'
  },
  {
    id: 'CA2',
    cpa: 'Causality Assessment',
    level: 'L2',
    category: 'application',
    text: 'I can identify factors that strengthen causality assessment (temporal sequence, dose-response, dechallenge evidence) and factors that weaken it',
    description: 'Evaluating evidence strength'
  },
  {
    id: 'CA3',
    cpa: 'Causality Assessment',
    level: 'L3',
    category: 'judgment',
    text: 'I can develop a causality assessment strategy for complex multi-system adverse events with multiple potential drug contributors',
    description: 'Strategic judgment on complex cases'
  },
  {
    id: 'CA4',
    cpa: 'Causality Assessment',
    level: 'L2',
    category: 'knowledge',
    text: 'I understand how alternative causes (concomitant medications, underlying disease, lifestyle factors) impact causality determinations',
    description: 'Knowledge of alternative causality'
  },

  // SIGNAL DETECTION & ANALYSIS CPA (L1-L3) - 4 questions
  {
    id: 'SD1',
    cpa: 'Signal Detection',
    level: 'L1',
    category: 'knowledge',
    text: 'I can recognize when individual case reports suggest a potential safety signal requiring investigation',
    description: 'Understanding signal concepts'
  },
  {
    id: 'SD2',
    cpa: 'Signal Detection',
    level: 'L2',
    category: 'application',
    text: 'I can interpret disproportionality analyses (ROR, PRR, EBGM) and understand what statistical thresholds indicate a potential signal',
    description: 'Interpreting statistical signal detection methods'
  },
  {
    id: 'SD3',
    cpa: 'Signal Detection',
    level: 'L3',
    category: 'judgment',
    text: 'I can weigh statistical evidence against clinical context to determine whether a potential signal warrants investigation and escalation',
    description: 'Making judgment calls on signal significance'
  },
  {
    id: 'SD4',
    cpa: 'Signal Detection',
    level: 'L1',
    category: 'knowledge',
    text: 'I understand the role of media monitoring, literature surveillance, and social media in early signal detection',
    description: 'Knowledge of signal sources'
  },

  // RISK MANAGEMENT CPA (L1-L3) - 4 questions
  {
    id: 'RM1',
    cpa: 'Risk Management',
    level: 'L1',
    category: 'knowledge',
    text: 'I can identify risks within a Risk Management Plan (RMP) and understand how Risk Minimization Measures (RMMs) address identified risks',
    description: 'Understanding RMPs and RMMs'
  },
  {
    id: 'RM2',
    cpa: 'Risk Management',
    level: 'L2',
    category: 'application',
    text: 'I can evaluate whether implemented risk minimization measures are effective and identify gaps in risk mitigation',
    description: 'Assessing RMM effectiveness'
  },
  {
    id: 'RM3',
    cpa: 'Risk Management',
    level: 'L3',
    category: 'judgment',
    text: 'I can develop risk management strategies for emerging safety issues, balancing benefit-risk and selecting appropriate RMMs (training, monitoring, restrictions)',
    description: 'Strategic risk management development'
  },
  {
    id: 'RM4',
    cpa: 'Risk Management',
    level: 'L2',
    category: 'knowledge',
    text: 'I understand the EMA RMP template and PRAC review processes for risk management assessments',
    description: 'Knowledge of regulatory frameworks'
  },

  // COMMUNICATION & REPORTING CPA (L1-L3) - 4 questions
  {
    id: 'CR1',
    cpa: 'Communication',
    level: 'L1',
    category: 'knowledge',
    text: 'I can prepare ICSRs (Individual Case Safety Reports) with accurate narratives and appropriate causality assessments',
    description: 'ICSR preparation skills'
  },
  {
    id: 'CR2',
    cpa: 'Communication',
    level: 'L2',
    category: 'application',
    text: 'I can write regulatory reports (PSURs, Dear Healthcare Provider Letters) that communicate safety information clearly to healthcare providers',
    description: 'Regulatory communication'
  },
  {
    id: 'CR3',
    cpa: 'Communication',
    level: 'L3',
    category: 'judgment',
    text: 'I can determine appropriate communication channels and messaging for different audiences (HCPs, patients, regulators) based on safety urgency',
    description: 'Strategic communication judgment'
  },
  {
    id: 'CR4',
    cpa: 'Communication',
    level: 'L2',
    category: 'knowledge',
    text: 'I understand ICSR transmission timelines (15-day expedited, periodic) and E2B(R3) electronic submission requirements',
    description: 'Knowledge of reporting timelines'
  },

  // ORGANIZATIONAL & STRATEGIC CPA (L1-L3) - 4 questions
  {
    id: 'OS1',
    cpa: 'Organizational',
    level: 'L1',
    category: 'knowledge',
    text: 'I understand the roles and responsibilities of different functions (Medical, Regulatory, Safety) in pharmacovigilance',
    description: 'Understanding organizational structures'
  },
  {
    id: 'OS2',
    cpa: 'Organizational',
    level: 'L2',
    category: 'application',
    text: 'I can identify how organizational systems and processes support or hinder effective safety monitoring and signal detection',
    description: 'Evaluating organizational systems'
  },
  {
    id: 'OS3',
    cpa: 'Organizational',
    level: 'L3',
    category: 'judgment',
    text: 'I can recommend process improvements and organizational changes to strengthen the overall safety culture and pharmacovigilance effectiveness',
    description: 'Strategic organizational recommendations'
  },
  {
    id: 'OS4',
    cpa: 'Organizational',
    level: 'L2',
    category: 'knowledge',
    text: 'I understand cross-functional collaboration needs and how to work effectively with Medical, Statistical, and Regulatory teams',
    description: 'Knowledge of cross-functional collaboration'
  },

  // LITERATURE & GLOBAL SAFETY CPA (L1-L3) - 4 questions
  {
    id: 'LG1',
    cpa: 'Literature & Global',
    level: 'L1',
    category: 'knowledge',
    text: 'I can identify relevant safety literature and understand how published evidence impacts pharmacovigilance decisions',
    description: 'Literature awareness'
  },
  {
    id: 'LG2',
    cpa: 'Literature & Global',
    level: 'L2',
    category: 'application',
    text: 'I can evaluate scientific literature for causality implications and determine when external safety data should inform RMMs or communications',
    description: 'Literature evaluation skills'
  },
  {
    id: 'LG3',
    cpa: 'Literature & Global',
    level: 'L3',
    category: 'judgment',
    text: 'I can synthesize global safety data (US, EU, Japan perspectives) and make recommendations that account for regional regulatory differences',
    description: 'Global safety perspective'
  },
  {
    id: 'LG4',
    cpa: 'Literature & Global',
    level: 'L1',
    category: 'knowledge',
    text: 'I understand how to access and interpret WHO VigiBase and other global safety databases',
    description: 'Global database knowledge'
  },

  // ANALYTICAL & TECHNICAL CPA (L1-L3) - 2 questions
  {
    id: 'AT1',
    cpa: 'Analytical',
    level: 'L2',
    category: 'application',
    text: 'I can work with pharmacovigilance databases to query data, generate reports, and identify trends in adverse event reporting',
    description: 'Database query and analysis'
  },
  {
    id: 'AT2',
    cpa: 'Analytical',
    level: 'L3',
    category: 'judgment',
    text: 'I can identify data quality issues in adverse event databases and recommend improvements to data integrity and reporting accuracy',
    description: 'Data quality judgment'
  }
];

/**
 * CPA Reference Data
 */
export const cpaDefinitions = {
  'Universal': {
    name: 'Universal Competency',
    description: 'Foundational pharmacovigilance knowledge and event recognition',
    color: 'bg-blue-500'
  },
  'Causality Assessment': {
    name: 'Causality Assessment',
    description: 'Ability to assess drug-event causal relationships',
    color: 'bg-purple-500'
  },
  'Signal Detection': {
    name: 'Signal Detection & Analysis',
    description: 'Identifying and analyzing potential safety signals',
    color: 'bg-amber-500'
  },
  'Risk Management': {
    name: 'Risk Management',
    description: 'Developing and implementing risk minimization strategies',
    color: 'bg-red-500'
  },
  'Communication': {
    name: 'Communication & Reporting',
    description: 'Safety reporting and healthcare provider communication',
    color: 'bg-green-500'
  },
  'Organizational': {
    name: 'Organizational & Strategic',
    description: 'Cross-functional leadership and safety culture',
    color: 'bg-cyan-500'
  },
  'Literature & Global': {
    name: 'Literature & Global Safety',
    description: 'External data and international regulatory perspectives',
    color: 'bg-indigo-500'
  },
  'Analytical': {
    name: 'Analytical & Technical',
    description: 'Database management and technical competencies',
    color: 'bg-slate-500'
  }
};

export type CPA = keyof typeof cpaDefinitions;

/**
 * Scoring Algorithm
 * Response scale: 1-5 (Not Confident → Very Confident)
 * Proficiency levels inferred from responses
 */
export interface QuestionResponse {
  questionId: string;
  score: number; // 1-5
}

export interface AssessmentResult {
  cpa: CPA;
  questionsAnswered: number;
  averageScore: number;
  proficiencyLevel: 'L1' | 'L2' | 'L3' | 'Pre-L1';
  strengthAreas: string[];
  gapAreas: string[];
  developmentRecommendations: string[];
}

export function calculateProficiencyLevel(averageScore: number): 'L1' | 'L2' | 'L3' | 'Pre-L1' {
  if (averageScore >= 4.5) return 'L3';
  if (averageScore >= 3.5) return 'L2';
  if (averageScore >= 2.5) return 'L1';
  return 'Pre-L1';
}

export function getProfileMessage(cpa: CPA, level: 'L1' | 'L2' | 'L3' | 'Pre-L1', _score: number): string {
  const cpaName = cpaDefinitions[cpa].name;

  if (level === 'L3') {
    return `You demonstrate strong proficiency in ${cpaName}. You're ready for advanced responsibilities and mentoring others.`;
  } else if (level === 'L2') {
    return `You have solid foundational competency in ${cpaName}. Focus on practical application and complex scenarios.`;
  } else if (level === 'L1') {
    return `You have basic knowledge of ${cpaName}. Focused skill development and practical experience will accelerate growth.`;
  } else {
    return `${cpaName} requires foundational knowledge building. Consider training resources and mentored case review.`;
  }
}
