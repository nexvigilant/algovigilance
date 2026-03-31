'use client';

import { useState, useCallback } from 'react';
import { AssessmentProgressHeader, type AssessmentStep } from '@/components/careers/assessments/assessment-progress-header';
import { CompanyInfoStep } from './step-components/company-info-step';
import { TeamCultureStep } from './step-components/team-culture-step';
import { ProductMarketStep } from './step-components/product-market-step';
import { FinancialsTractionStep } from './step-components/financials-traction-step';
import { GovernanceLegalStep } from './step-components/governance-legal-step';
import { FitAssessmentStep } from './step-components/fit-assessment-step';
import { ResultsStep } from './step-components/results-step';
import type {
  CompanyInfo,
  HealthCheckResponse,
  StartupHealthResponses
} from './types';

// Initialize empty responses
const createEmptyResponse = (): HealthCheckResponse => ({
  score: null,
  notes: '',
});

const createInitialResponses = (): StartupHealthResponses => ({
  // Area 1: Founding Team
  founderExperience: createEmptyResponse(),
  founderCommitment: createEmptyResponse(),
  founderCoachability: createEmptyResponse(),
  teamComplementary: createEmptyResponse(),

  // Area 2: Culture & Values
  cultureClarity: createEmptyResponse(),
  valuesAlignment: createEmptyResponse(),
  decisionMaking: createEmptyResponse(),
  conflictResolution: createEmptyResponse(),

  // Area 3: Product/Service
  problemClarity: createEmptyResponse(),
  solutionViability: createEmptyResponse(),
  competitiveAdvantage: createEmptyResponse(),
  productRoadmap: createEmptyResponse(),

  // Area 4: Market Opportunity
  marketSize: createEmptyResponse(),
  marketTiming: createEmptyResponse(),
  customerValidation: createEmptyResponse(),
  competitiveLandscape: createEmptyResponse(),

  // Area 5: Business Model
  revenueModel: createEmptyResponse(),
  unitEconomics: createEmptyResponse(),
  scalability: createEmptyResponse(),
  pricingStrategy: createEmptyResponse(),

  // Area 6: Traction & Metrics
  currentTraction: createEmptyResponse(),
  growthRate: createEmptyResponse(),
  keyMetrics: createEmptyResponse(),
  customerRetention: createEmptyResponse(),

  // Area 7: Financials
  currentRunway: createEmptyResponse(),
  fundraisingPlan: createEmptyResponse(),
  burnRate: createEmptyResponse(),
  financialTransparency: createEmptyResponse(),

  // Area 8: Governance & Structure
  legalStructure: createEmptyResponse(),
  capTable: createEmptyResponse(),
  advisorTerms: createEmptyResponse(),
  boardComposition: createEmptyResponse(),

  // Area 9: Risk & Legal
  regulatoryRisk: createEmptyResponse(),
  ipProtection: createEmptyResponse(),
  liabilityExposure: createEmptyResponse(),
  complianceStatus: createEmptyResponse(),

  // Area 10: Your Fit
  expertiseRelevance: createEmptyResponse(),
  networkValue: createEmptyResponse(),
  timeCommitment: createEmptyResponse(),
  compensationFairness: createEmptyResponse(),
  passionAlignment: createEmptyResponse(),
});

const createInitialCompanyInfo = (): CompanyInfo => ({
  name: '',
  website: '',
  stage: '',
  industry: '',
  contactName: '',
  contactRole: '',
  howIntroduced: '',
  advisoryType: '',
  compensationType: '',
  notes: '',
});

type Step = 'company-info' | 'team-culture' | 'product-market' | 'financials-traction' | 'governance-legal' | 'fit-assessment' | 'results';

const STEP_DATA: AssessmentStep<Step>[] = [
  { id: 'company-info', label: 'Company Info' },
  { id: 'team-culture', label: 'Team & Culture' },
  { id: 'product-market', label: 'Product & Market' },
  { id: 'financials-traction', label: 'Financials & Traction' },
  { id: 'governance-legal', label: 'Governance & Legal' },
  { id: 'fit-assessment', label: 'Your Fit' },
  { id: 'results', label: 'Results' },
];

export function AssessmentClient() {
  const [currentStep, setCurrentStep] = useState<Step>('company-info');
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(createInitialCompanyInfo());
  const [responses, setResponses] = useState<StartupHealthResponses>(createInitialResponses());

  const currentStepIndex = STEP_DATA.findIndex(s => s.id === currentStep);
  const _progress = ((currentStepIndex + 1) / STEP_DATA.length) * 100;

  const handleNext = useCallback(() => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEP_DATA.length) {
      setCurrentStep(STEP_DATA[nextIndex].id);
    }
  }, [currentStepIndex]);

  const handleBack = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEP_DATA[prevIndex].id);
    }
  }, [currentStepIndex]);

  const handleCompanyInfoUpdate = useCallback((updates: Partial<CompanyInfo>) => {
    setCompanyInfo(prev => ({ ...prev, ...updates }));
  }, []);

  const handleResponsesUpdate = useCallback((updates: Partial<StartupHealthResponses>) => {
    setResponses(prev => ({ ...prev, ...updates }));
  }, []);

  const handleReset = useCallback(() => {
    setCurrentStep('company-info');
    setCompanyInfo(createInitialCompanyInfo());
    setResponses(createInitialResponses());
  }, []);

  const renderStep = () => {
    switch (currentStep) {
      case 'company-info':
        return (
          <CompanyInfoStep
            companyInfo={companyInfo}
            onUpdate={handleCompanyInfoUpdate}
            onNext={handleNext}
          />
        );
      case 'team-culture':
        return (
          <TeamCultureStep
            responses={responses}
            onUpdate={handleResponsesUpdate}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 'product-market':
        return (
          <ProductMarketStep
            responses={responses}
            onUpdate={handleResponsesUpdate}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 'financials-traction':
        return (
          <FinancialsTractionStep
            responses={responses}
            onUpdate={handleResponsesUpdate}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 'governance-legal':
        return (
          <GovernanceLegalStep
            responses={responses}
            onUpdate={handleResponsesUpdate}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 'fit-assessment':
        return (
          <FitAssessmentStep
            responses={responses}
            onUpdate={handleResponsesUpdate}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 'results':
        return (
          <ResultsStep
            companyInfo={companyInfo}
            responses={responses}
            onBack={handleBack}
            onReset={handleReset}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Standardized Progress Header (Pills Variant) */}
      <AssessmentProgressHeader
        steps={STEP_DATA}
        currentStepId={currentStep}
        assessmentTitle="Startup Health Check"
        variant="pills"
        onStepClick={(id) => setCurrentStep(id)}
      />

      {/* Current Step Content */}
      {renderStep()}
    </div>
  );
}
