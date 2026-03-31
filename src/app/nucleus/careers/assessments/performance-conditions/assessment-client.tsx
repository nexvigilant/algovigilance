'use client';

import { useState, useCallback, useEffect } from 'react';
import { Gauge } from 'lucide-react';
import { useAssessmentProgress } from '@/hooks/use-local-storage';
import { AssessmentTour, PERFORMANCE_CONDITIONS_TOUR } from '@/components/assessment-tour';
import { AssessmentLayout } from '@/components/careers/assessments/assessment-layout';
import { AssessmentResumeDialog } from '@/components/careers/assessments/assessment-resume-dialog';
import { type AssessmentStep } from '@/components/careers/assessments/assessment-progress-header';
import {
  IntroductionStep,
  EnvironmentStep,
  AutonomyStep,
  ChallengeStep,
  FeedbackStep,
  CollaborationStep,
  PurposeStep,
  ResultsStep,
} from './step-components';

// Slider scale: 1-7 for nuanced preferences
export type PreferenceLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface ConditionPreference {
  value: PreferenceLevel | null;
  importance: 'critical' | 'important' | 'nice-to-have' | null;
  notes: string;
}

export interface PerformanceContext {
  currentRole: string;
  yearsExperience: string;
  assessmentPurpose: 'job-search' | 'role-optimization' | 'self-awareness' | 'team-building' | '';
}

export interface PerformanceResponses {
  context: PerformanceContext;

  // Environment (6 items)
  envRemoteVsOffice: ConditionPreference;
  envNoiseLevel: ConditionPreference;
  envStructuredVsFlexible: ConditionPreference;
  envPrivacyLevel: ConditionPreference;
  envToolsAccess: ConditionPreference;
  envTravelFrequency: ConditionPreference;

  // Autonomy & Control (5 items)
  autoDecisionAuthority: ConditionPreference;
  autoScheduleFlexibility: ConditionPreference;
  autoMethodFreedom: ConditionPreference;
  autoPrioritySetting: ConditionPreference;
  autoResourceControl: ConditionPreference;

  // Challenge & Growth (5 items)
  challengeStretchLevel: ConditionPreference;
  challengeVariety: ConditionPreference;
  challengeLearningOpportunity: ConditionPreference;
  challengeFailureTolerance: ConditionPreference;
  challengeProgressionSpeed: ConditionPreference;

  // Feedback & Recognition (5 items)
  feedbackFrequency: ConditionPreference;
  feedbackFormat: ConditionPreference;
  feedbackSource: ConditionPreference;
  recognitionType: ConditionPreference;
  recognitionVisibility: ConditionPreference;

  // Team & Collaboration (5 items)
  teamSize: ConditionPreference;
  teamInteractionFrequency: ConditionPreference;
  teamDiversity: ConditionPreference;
  teamCompetitionVsCollaboration: ConditionPreference;
  teamSocialConnection: ConditionPreference;

  // Purpose & Meaning (4 items)
  purposeMissionAlignment: ConditionPreference;
  purposeImpactVisibility: ConditionPreference;
  purposeCustomerConnection: ConditionPreference;
  purposeValueContribution: ConditionPreference;
}

const createEmptyPreference = (): ConditionPreference => ({
  value: null,
  importance: null,
  notes: '',
});

const createEmptyResponses = (): PerformanceResponses => ({
  context: {
    currentRole: '',
    yearsExperience: '',
    assessmentPurpose: '',
  },

  // Environment
  envRemoteVsOffice: createEmptyPreference(),
  envNoiseLevel: createEmptyPreference(),
  envStructuredVsFlexible: createEmptyPreference(),
  envPrivacyLevel: createEmptyPreference(),
  envToolsAccess: createEmptyPreference(),
  envTravelFrequency: createEmptyPreference(),

  // Autonomy
  autoDecisionAuthority: createEmptyPreference(),
  autoScheduleFlexibility: createEmptyPreference(),
  autoMethodFreedom: createEmptyPreference(),
  autoPrioritySetting: createEmptyPreference(),
  autoResourceControl: createEmptyPreference(),

  // Challenge
  challengeStretchLevel: createEmptyPreference(),
  challengeVariety: createEmptyPreference(),
  challengeLearningOpportunity: createEmptyPreference(),
  challengeFailureTolerance: createEmptyPreference(),
  challengeProgressionSpeed: createEmptyPreference(),

  // Feedback
  feedbackFrequency: createEmptyPreference(),
  feedbackFormat: createEmptyPreference(),
  feedbackSource: createEmptyPreference(),
  recognitionType: createEmptyPreference(),
  recognitionVisibility: createEmptyPreference(),

  // Collaboration
  teamSize: createEmptyPreference(),
  teamInteractionFrequency: createEmptyPreference(),
  teamDiversity: createEmptyPreference(),
  teamCompetitionVsCollaboration: createEmptyPreference(),
  teamSocialConnection: createEmptyPreference(),

  // Purpose
  purposeMissionAlignment: createEmptyPreference(),
  purposeImpactVisibility: createEmptyPreference(),
  purposeCustomerConnection: createEmptyPreference(),
  purposeValueContribution: createEmptyPreference(),
});

type Step = 'intro' | 'environment' | 'autonomy' | 'challenge' | 'feedback' | 'collaboration' | 'purpose' | 'results';

const STEPS: AssessmentStep<Step>[] = [
  { id: 'intro', label: 'Introduction' },
  { id: 'environment', label: 'Environment' },
  { id: 'autonomy', label: 'Autonomy' },
  { id: 'challenge', label: 'Challenge' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'collaboration', label: 'Collaboration' },
  { id: 'purpose', label: 'Purpose' },
  { id: 'results', label: 'Your Map' },
];

export function PerformanceConditionsClient() {
  // Session persistence
  const {
    responses: savedResponses,
    currentStep: savedStep,
    setResponses: saveResponses,
    setStep: saveStep,
    clearProgress,
    hasExistingProgress,
    isLoaded,
    lastUpdated,
  } = useAssessmentProgress<PerformanceResponses>(
    'performance-conditions-v1',
    createEmptyResponses(),
    1
  );

  const [currentStep, setCurrentStep] = useState<Step>('intro');
  const [responses, setResponses] = useState<PerformanceResponses>(createEmptyResponses);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Check for existing progress on load
  useEffect(() => {
    if (isLoaded && !hasInitialized) {
      if (hasExistingProgress && savedStep) {
        setShowResumeDialog(true);
      }
      setHasInitialized(true);
    }
  }, [isLoaded, hasInitialized, hasExistingProgress, savedStep]);

  // Auto-save on step/response changes
  useEffect(() => {
    if (hasInitialized && currentStep !== 'intro') {
      saveStep(currentStep);
      saveResponses(responses);
    }
  }, [currentStep, responses, hasInitialized, saveStep, saveResponses]);

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);
  const _progress = ((currentStepIndex) / (STEPS.length - 1)) * 100;

  const handleResumeProgress = useCallback(() => {
    if (savedStep && STEPS.some(s => s.id === savedStep)) {
      setCurrentStep(savedStep as Step);
      setResponses(savedResponses);
    }
    setShowResumeDialog(false);
  }, [savedStep, savedResponses]);

  const handleStartFresh = useCallback(() => {
    clearProgress();
    setCurrentStep('intro');
    setResponses(createEmptyResponses());
    setShowResumeDialog(false);
  }, [clearProgress]);

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

  const handleUpdate = useCallback((updates: Partial<PerformanceResponses>) => {
    setResponses(prev => ({ ...prev, ...updates }));
  }, []);

  const handleReset = useCallback(() => {
    clearProgress();
    setResponses(createEmptyResponses());
    setCurrentStep('intro');
  }, [clearProgress]);

  // Show loading state while checking localStorage
  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-12 md:px-6 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Loading assessment...</div>
        </div>
      </div>
    );
  }

  // Show resume dialog if there's existing progress
  if (showResumeDialog) {
    const stepLabel = savedStep ? STEPS.find(s => s.id === savedStep as Step)?.label || 'Unknown' : 'Unknown';

    return (
      <div className="container mx-auto px-4 py-8 md:py-12 md:px-6 max-w-4xl">
        <AssessmentResumeDialog
          lastUpdated={lastUpdated}
          lastStepLabel={stepLabel}
          onResume={handleResumeProgress}
          onStartFresh={handleStartFresh}
          variant="emerald"
        />
      </div>
    );
  }

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
      case 'environment':
        return (
          <EnvironmentStep
            responses={responses}
            onUpdate={handleUpdate}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 'autonomy':
        return (
          <AutonomyStep
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
      case 'feedback':
        return (
          <FeedbackStep
            responses={responses}
            onUpdate={handleUpdate}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 'collaboration':
        return (
          <CollaborationStep
            responses={responses}
            onUpdate={handleUpdate}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 'purpose':
        return (
          <PurposeStep
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
      <header className="mb-8" data-tour="step-header">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl">
            <Gauge className="h-8 w-8 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-headline text-gold">
              High-Performance Conditions Map
            </h1>
            <p className="text-muted-foreground">
              Discover where you do your best work
            </p>
          </div>
        </div>
      </header>

      <AssessmentLayout
        steps={STEPS}
        currentStepId={currentStep}
        assessmentTitle="High-Performance Conditions Map"
        onStepClick={(id) => id !== 'results' && STEPS.findIndex(s => s.id === id) < currentStepIndex && setCurrentStep(id)}
      >
        {renderStep()}
      </AssessmentLayout>

      {/* Onboarding Tour */}
      {currentStep !== 'results' && (
        <AssessmentTour
          tourId="performance-conditions-v1"
          steps={PERFORMANCE_CONDITIONS_TOUR}
        />
      )}
    </div>
  );
}
