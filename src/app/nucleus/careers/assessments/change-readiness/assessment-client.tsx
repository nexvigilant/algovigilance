'use client';

import { useState, useCallback } from 'react';
import {
  Wallet,
  Users,
  Heart,
  Settings,
  BarChart3
} from 'lucide-react';
import { AssessmentLayout } from '@/components/careers/assessments/assessment-layout';
import { type AssessmentStep } from '@/components/careers/assessments/assessment-progress-header';
import {
  FinancialReadinessStep,
  NetworkReadinessStep,
  EmotionalReadinessStep,
  PracticalReadinessStep,
  ResultsStep
} from './step-components';

type Step = 'financial' | 'network' | 'emotional' | 'practical' | 'results';

export interface ReadinessResponse {
  score: number; // 1-5
  notes?: string;
}

export interface ReadinessResponses {
  // Financial (4 items)
  financialRunway: ReadinessResponse | null;
  incomeStability: ReadinessResponse | null;
  emergencyFund: ReadinessResponse | null;
  debtLevel: ReadinessResponse | null;
  // Network (4 items)
  professionalNetwork: ReadinessResponse | null;
  industryReputation: ReadinessResponse | null;
  referralSources: ReadinessResponse | null;
  mentorAccess: ReadinessResponse | null;
  // Emotional (4 items)
  identityFlexibility: ReadinessResponse | null;
  uncertaintyTolerance: ReadinessResponse | null;
  rejectionResilience: ReadinessResponse | null;
  selfMotivation: ReadinessResponse | null;
  // Practical (3 items)
  timeAvailability: ReadinessResponse | null;
  familySupport: ReadinessResponse | null;
  healthInsurance: ReadinessResponse | null;
}

const STEPS: AssessmentStep<Step>[] = [
  { id: 'financial', label: 'Financial', icon: Wallet, color: 'green-500' },
  { id: 'network', label: 'Network', icon: Users, color: 'cyan' },
  { id: 'emotional', label: 'Emotional', icon: Heart, color: 'pink-500' },
  { id: 'practical', label: 'Practical', icon: Settings, color: 'gold' },
  { id: 'results', label: 'Results', icon: BarChart3, color: 'purple-400' },
];

const STEP_ORDER: Step[] = ['financial', 'network', 'emotional', 'practical', 'results'];

const initialResponses: ReadinessResponses = {
  financialRunway: null,
  incomeStability: null,
  emergencyFund: null,
  debtLevel: null,
  professionalNetwork: null,
  industryReputation: null,
  referralSources: null,
  mentorAccess: null,
  identityFlexibility: null,
  uncertaintyTolerance: null,
  rejectionResilience: null,
  selfMotivation: null,
  timeAvailability: null,
  familySupport: null,
  healthInsurance: null,
};

export function AssessmentClient() {
  const [currentStep, setCurrentStep] = useState<Step>('financial');
  const [responses, setResponses] = useState<ReadinessResponses>(initialResponses);

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

  const updateResponses = useCallback((updates: Partial<ReadinessResponses>) => {
    setResponses(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  const handleReset = useCallback(() => {
    setResponses(initialResponses);
    setCurrentStep('financial');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <AssessmentLayout
      steps={STEPS}
      currentStepId={currentStep}
      assessmentTitle="Change Readiness Assessment"
      badgeLabel={`${STEPS.find(s => s.id === currentStep)?.label} Readiness`}
      onStepClick={(id) => id !== 'results' && STEP_ORDER.indexOf(id) < currentStepIndex && goToStep(id)}
    >
      {currentStep === 'financial' && (
        <FinancialReadinessStep
          responses={responses}
          onUpdate={updateResponses}
          onNext={goNext}
        />
      )}

      {currentStep === 'network' && (
        <NetworkReadinessStep
          responses={responses}
          onUpdate={updateResponses}
          onNext={goNext}
          onBack={goBack}
        />
      )}

      {currentStep === 'emotional' && (
        <EmotionalReadinessStep
          responses={responses}
          onUpdate={updateResponses}
          onNext={goNext}
          onBack={goBack}
        />
      )}

      {currentStep === 'practical' && (
        <PracticalReadinessStep
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
    </AssessmentLayout>
  );
}
