'use client';

// Company information
export interface CompanyInfo {
  name: string;
  website: string;
  stage: 'pre-seed' | 'seed' | 'series-a' | 'series-b' | 'growth' | '';
  industry: string;
  contactName: string;
  contactRole: string;
  howIntroduced: string;
  advisoryType: 'formal' | 'informal' | 'board' | 'consultant' | '';
  compensationType: 'equity' | 'cash' | 'hybrid' | 'pro-bono' | '';
  notes: string;
}

// Health check response with Red/Yellow/Green scoring
export type HealthScore = 1 | 2 | 3 | null; // 1=Red, 2=Yellow, 3=Green

export interface HealthCheckResponse {
  score: HealthScore;
  notes: string;
}

// All assessment areas with their items
export interface StartupHealthResponses {
  // Area 1: Founding Team
  founderExperience: HealthCheckResponse;
  founderCommitment: HealthCheckResponse;
  founderCoachability: HealthCheckResponse;
  teamComplementary: HealthCheckResponse;

  // Area 2: Culture & Values
  cultureClarity: HealthCheckResponse;
  valuesAlignment: HealthCheckResponse;
  decisionMaking: HealthCheckResponse;
  conflictResolution: HealthCheckResponse;

  // Area 3: Product/Service
  problemClarity: HealthCheckResponse;
  solutionViability: HealthCheckResponse;
  competitiveAdvantage: HealthCheckResponse;
  productRoadmap: HealthCheckResponse;

  // Area 4: Market Opportunity
  marketSize: HealthCheckResponse;
  marketTiming: HealthCheckResponse;
  customerValidation: HealthCheckResponse;
  competitiveLandscape: HealthCheckResponse;

  // Area 5: Business Model
  revenueModel: HealthCheckResponse;
  unitEconomics: HealthCheckResponse;
  scalability: HealthCheckResponse;
  pricingStrategy: HealthCheckResponse;

  // Area 6: Traction & Metrics
  currentTraction: HealthCheckResponse;
  growthRate: HealthCheckResponse;
  keyMetrics: HealthCheckResponse;
  customerRetention: HealthCheckResponse;

  // Area 7: Financials
  currentRunway: HealthCheckResponse;
  fundraisingPlan: HealthCheckResponse;
  burnRate: HealthCheckResponse;
  financialTransparency: HealthCheckResponse;

  // Area 8: Governance & Structure
  legalStructure: HealthCheckResponse;
  capTable: HealthCheckResponse;
  advisorTerms: HealthCheckResponse;
  boardComposition: HealthCheckResponse;

  // Area 9: Risk & Legal
  regulatoryRisk: HealthCheckResponse;
  ipProtection: HealthCheckResponse;
  liabilityExposure: HealthCheckResponse;
  complianceStatus: HealthCheckResponse;

  // Area 10: Your Fit
  expertiseRelevance: HealthCheckResponse;
  networkValue: HealthCheckResponse;
  timeCommitment: HealthCheckResponse;
  compensationFairness: HealthCheckResponse;
  passionAlignment: HealthCheckResponse;
}
