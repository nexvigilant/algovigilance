'use client';

import { useState, useCallback } from 'react';
import {
  Lightbulb,
  Users,
  Settings,
  BarChart3
} from 'lucide-react';
import { AssessmentProgressHeader, type AssessmentStep } from '@/components/careers/assessments/assessment-progress-header';
import { AssessmentStepBadge } from '@/components/careers/assessments/assessment-step-badge';
import {
  StrategicCompetenciesStep,
  RelationalCompetenciesStep,
  OperationalCompetenciesStep,
  ResultsStep
} from './step-components';

type Step = 'strategic' | 'relational' | 'operational' | 'results';

export interface CompetencyRating {
  rating: number;
  confidence: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface CompetencyResponses {
  // Strategic Competencies
  strategicThinking: CompetencyRating | null;
  industryExpertise: CompetencyRating | null;
  governanceUnderstanding: CompetencyRating | null;
  // Relational Competencies
  networkValue: CompetencyRating | null;
  communicationInfluence: CompetencyRating | null;
  mentoringCoaching: CompetencyRating | null;
  // Operational Competencies
  financialAcumen: CompetencyRating | null;
  riskAssessment: CompetencyRating | null;
  culturalIntelligence: CompetencyRating | null;
}

const STEPS: AssessmentStep<Step>[] = [
  { id: 'strategic', label: 'Strategic', icon: Lightbulb, color: 'cyan' },
  { id: 'relational', label: 'Relational', icon: Users, color: 'gold' },
  { id: 'operational', label: 'Operational', icon: Settings, color: 'purple-400' },
  { id: 'results', label: 'Results', icon: BarChart3, color: 'green-400' },
];

const STEP_ORDER: Step[] = ['strategic', 'relational', 'operational', 'results'];

const initialResponses: CompetencyResponses = {
  strategicThinking: null,
  industryExpertise: null,
  governanceUnderstanding: null,
  networkValue: null,
  communicationInfluence: null,
  mentoringCoaching: null,
  financialAcumen: null,
  riskAssessment: null,
  culturalIntelligence: null,
};

export function AssessmentClient() {
  const [currentStep, setCurrentStep] = useState<Step>('strategic');
  const [responses, setResponses] = useState<CompetencyResponses>(initialResponses);

  const currentStepIndex = STEP_ORDER.indexOf(currentStep);
  const _progress = ((currentStepIndex + 1) / STEP_ORDER.length) * 100;

  const goToStep = useCallback((step: Step) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goNext = useCallback(() => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEP_ORDER.length) {
      goToStep(STEP_ORDER[nextIndex]);
    }
  }, [currentStepIndex, goToStep]);

  const goBack = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      goToStep(STEP_ORDER[prevIndex]);
    }
  }, [currentStepIndex, goToStep]);

  const updateResponses = useCallback((updates: Partial<CompetencyResponses>) => {
    setResponses(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  const handleReset = useCallback(() => {
    setResponses(initialResponses);
    setCurrentStep('strategic');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="space-y-6">
      {/* Standardized Progress Header */}
      <AssessmentProgressHeader
        steps={STEPS}
        currentStepId={currentStep}
        assessmentTitle="9 Board Advisor Competencies"
        onStepClick={goToStep}
      />

      {/* Standardized Current Step Badge */}
      {currentStep !== 'results' && (
        <AssessmentStepBadge
          currentStep={currentStepIndex + 1}
          totalSteps={STEPS.length - 1}
          label={`${STEPS[currentStepIndex]?.label} Competencies`}
        />
      )}

      {/* Step Content */}
      {currentStep === 'strategic' && (
        <StrategicCompetenciesStep
          responses={responses}
          onUpdate={updateResponses}
          onNext={goNext}
        />
      )}

      {currentStep === 'relational' && (
        <RelationalCompetenciesStep
          responses={responses}
          onUpdate={updateResponses}
          onNext={goNext}
          onBack={goBack}
        />
      )}

      {currentStep === 'operational' && (
        <OperationalCompetenciesStep
          responses={responses}
          onUpdate={updateResponses}
          onNext={goNext}
          onBack={goBack}
        />
      )}

      {currentStep === 'results' && (
        <ResultsStep
          responses={responses}
          onBack={goBack}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
