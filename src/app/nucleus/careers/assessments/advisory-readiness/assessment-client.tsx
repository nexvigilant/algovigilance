'use client';

import { useState, useCallback } from 'react';
import { Zap, Award, Network, Rocket, BarChart3 } from 'lucide-react';
import { AssessmentProgressHeader, type AssessmentStep } from '@/components/careers/assessments/assessment-progress-header';
import { AssessmentStepBadge } from '@/components/careers/assessments/assessment-step-badge';
import {
  ValueAssessmentStep,
  ExperienceStep,
  NetworkStep,
  ReadinessStep,
  ResultsStep
} from './step-components';

type Step = 'value' | 'experience' | 'network' | 'readiness' | 'results';

interface AssessmentResponses {
  valueProposition: Record<string, number>;
  experience: Record<string, number>;
  network: Record<string, number>;
  readiness: Record<string, number>;
}

const STEPS: AssessmentStep<Step>[] = [
  { id: 'value', label: 'Value', icon: Zap, color: 'cyan' },
  { id: 'experience', label: 'Experience', icon: Award, color: 'gold' },
  { id: 'network', label: 'Network', icon: Network, color: 'purple-400' },
  { id: 'readiness', label: 'Readiness', icon: Rocket, color: 'green-400' },
  { id: 'results', label: 'Results', icon: BarChart3, color: 'cyan' },
];

const STEP_ORDER: Step[] = ['value', 'experience', 'network', 'readiness', 'results'];

export function AssessmentClient() {
  const [currentStep, setCurrentStep] = useState<Step>('value');
  const [responses, setResponses] = useState<AssessmentResponses>({
    valueProposition: {},
    experience: {},
    network: {},
    readiness: {}
  });

  const currentStepIndex = STEP_ORDER.indexOf(currentStep);

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

  const updateResponses = useCallback((section: keyof AssessmentResponses, newResponses: Record<string, number>) => {
    setResponses(prev => ({
      ...prev,
      [section]: newResponses
    }));
  }, []);

  const handleReset = useCallback(() => {
    setResponses({
      valueProposition: {},
      experience: {},
      network: {},
      readiness: {}
    });
    setCurrentStep('value');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="space-y-6">
      {/* Standardized Progress Header */}
      <AssessmentProgressHeader
        steps={STEPS}
        currentStepId={currentStep}
        assessmentTitle="Advisory Readiness Assessment"
        onStepClick={goToStep}
      />

      {/* Standardized Current Step Badge */}
      {currentStep !== 'results' && (
        <AssessmentStepBadge
          currentStep={currentStepIndex + 1}
          totalSteps={STEPS.length - 1}
          label={`${STEPS[currentStepIndex]?.label} Assessment`}
        />
      )}

      {/* Step Content */}
      {currentStep === 'value' && (
        <ValueAssessmentStep
          responses={responses.valueProposition}
          onUpdate={(newResponses) => updateResponses('valueProposition', newResponses)}
          onNext={goNext}
        />
      )}

      {currentStep === 'experience' && (
        <ExperienceStep
          responses={responses.experience}
          onUpdate={(newResponses) => updateResponses('experience', newResponses)}
          onNext={goNext}
          onBack={goBack}
        />
      )}

      {currentStep === 'network' && (
        <NetworkStep
          responses={responses.network}
          onUpdate={(newResponses) => updateResponses('network', newResponses)}
          onNext={goNext}
          onBack={goBack}
        />
      )}

      {currentStep === 'readiness' && (
        <ReadinessStep
          responses={responses.readiness}
          onUpdate={(newResponses) => updateResponses('readiness', newResponses)}
          onNext={goNext}
          onBack={goBack}
        />
      )}

      {currentStep === 'results' && (
        <ResultsStep
          allResponses={responses}
          onBack={goBack}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
