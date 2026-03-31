'use client';

import { useState, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { AssessmentLayout } from '@/components/careers/assessments/assessment-layout';
import { type AssessmentStep } from '@/components/careers/assessments/assessment-progress-header';
import {
  IntroductionStep,
  ClarityStep,
  ConnectionStep,
  ChallengeStep,
  CommitmentStep,
  CapabilityStep,
  ResultsStep,
} from './step-components';

// Rating scale: 1-5 (Strongly Disagree to Strongly Agree)
export type MentoringRating = 1 | 2 | 3 | 4 | 5 | null;

export interface MentoringItem {
  rating: MentoringRating;
  reflection: string;
}

export interface MentoringContext {
  mentoringRole: 'mentor' | 'mentee' | 'both' | '';
  relationshipDuration: 'new' | '3-6months' | '6-12months' | '1year+' | '';
  relationshipType: 'formal' | 'informal' | 'peer' | 'reverse' | '';
  primaryGoal: string;
}

export interface MentoringResponses {
  // Context
  context: MentoringContext;

  // Clarity (5 items) - Clear expectations, goals, boundaries
  clarityGoals: MentoringItem;
  clarityExpectations: MentoringItem;
  clarityBoundaries: MentoringItem;
  clarityFeedback: MentoringItem;
  clarityProgress: MentoringItem;

  // Connection (5 items) - Building rapport, trust, psychological safety
  connectionTrust: MentoringItem;
  connectionRapport: MentoringItem;
  connectionSafety: MentoringItem;
  connectionEmpathy: MentoringItem;
  connectionAuthenticity: MentoringItem;

  // Challenge (5 items) - Pushing growth, stretch assignments
  challengeStretch: MentoringItem;
  challengeGrowth: MentoringItem;
  challengeAccountability: MentoringItem;
  challengeResilience: MentoringItem;
  challengeComfort: MentoringItem;

  // Commitment (5 items) - Consistent engagement, dedication
  commitmentConsistency: MentoringItem;
  commitmentPriority: MentoringItem;
  commitmentFollow: MentoringItem;
  commitmentInvestment: MentoringItem;
  commitmentLongterm: MentoringItem;

  // Capability (5 items) - Skills transfer, knowledge sharing
  capabilityExpertise: MentoringItem;
  capabilityTransfer: MentoringItem;
  capabilityResources: MentoringItem;
  capabilityNetwork: MentoringItem;
  capabilityAdaptation: MentoringItem;
}

const createEmptyItem = (): MentoringItem => ({
  rating: null,
  reflection: '',
});

const createEmptyResponses = (): MentoringResponses => ({
  context: {
    mentoringRole: '',
    relationshipDuration: '',
    relationshipType: '',
    primaryGoal: '',
  },

  // Clarity
  clarityGoals: createEmptyItem(),
  clarityExpectations: createEmptyItem(),
  clarityBoundaries: createEmptyItem(),
  clarityFeedback: createEmptyItem(),
  clarityProgress: createEmptyItem(),

  // Connection
  connectionTrust: createEmptyItem(),
  connectionRapport: createEmptyItem(),
  connectionSafety: createEmptyItem(),
  connectionEmpathy: createEmptyItem(),
  connectionAuthenticity: createEmptyItem(),

  // Challenge
  challengeStretch: createEmptyItem(),
  challengeGrowth: createEmptyItem(),
  challengeAccountability: createEmptyItem(),
  challengeResilience: createEmptyItem(),
  challengeComfort: createEmptyItem(),

  // Commitment
  commitmentConsistency: createEmptyItem(),
  commitmentPriority: createEmptyItem(),
  commitmentFollow: createEmptyItem(),
  commitmentInvestment: createEmptyItem(),
  commitmentLongterm: createEmptyItem(),

  // Capability
  capabilityExpertise: createEmptyItem(),
  capabilityTransfer: createEmptyItem(),
  capabilityResources: createEmptyItem(),
  capabilityNetwork: createEmptyItem(),
  capabilityAdaptation: createEmptyItem(),
});

type Step = 'intro' | 'clarity' | 'connection' | 'challenge' | 'commitment' | 'capability' | 'results';

const STEPS: AssessmentStep<Step>[] = [
  { id: 'intro', label: 'Introduction' },
  { id: 'clarity', label: 'Clarity' },
  { id: 'connection', label: 'Connection' },
  { id: 'challenge', label: 'Challenge' },
  { id: 'commitment', label: 'Commitment' },
  { id: 'capability', label: 'Capability' },
  { id: 'results', label: 'Results' },
];

export function MentoringFrameworkClient() {
  const [currentStep, setCurrentStep] = useState<Step>('intro');
  const [responses, setResponses] = useState<MentoringResponses>(createEmptyResponses);

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);
  const _progress = ((currentStepIndex) / (STEPS.length - 1)) * 100;

  const handleNext = useCallback(() => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].id);
    }
  }, [currentStepIndex]);

  const handleBack = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id);
    }
  }, [currentStepIndex]);

  const handleUpdate = useCallback((updates: Partial<MentoringResponses>) => {
    setResponses(prev => ({ ...prev, ...updates }));
  }, []);

  const handleReset = useCallback(() => {
    setResponses(createEmptyResponses());
    setCurrentStep('intro');
  }, []);

  const renderStep = () => {
    switch (currentStep) {
      case 'intro':
        return (
          <IntroductionStep
            context={responses.context}
            onUpdate={(context) => handleUpdate({ context })}
            onNext={handleNext}
          />
        );
      case 'clarity':
        return (
          <ClarityStep
            responses={responses}
            onUpdate={handleUpdate}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 'connection':
        return (
          <ConnectionStep
            responses={responses}
            onUpdate={handleUpdate}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 'challenge':
        return (
          <ChallengeStep
            responses={responses}
            onUpdate={handleUpdate}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 'commitment':
        return (
          <CommitmentStep
            responses={responses}
            onUpdate={handleUpdate}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 'capability':
        return (
          <CapabilityStep
            responses={responses}
            onUpdate={handleUpdate}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 'results':
        return (
          <ResultsStep
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
    <div className="container mx-auto px-4 py-8 md:py-12 md:px-6 max-w-4xl">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-pink-500/10 rounded-xl">
            <Heart className="h-8 w-8 text-pink-500" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-headline text-gold">
              5 C&apos;s Mentoring Framework
            </h1>
            <p className="text-muted-foreground">
              Evaluate and strengthen your mentoring relationships
            </p>
          </div>
        </div>
      </header>

      <AssessmentLayout
        steps={STEPS}
        currentStepId={currentStep}
        assessmentTitle="Mentoring Framework Assessment"
        onStepClick={(id) => id !== 'results' && STEPS.findIndex(s => s.id === id) < currentStepIndex && setCurrentStep(id)}
      >
        {renderStep()}
      </AssessmentLayout>
    </div>
  );
}
