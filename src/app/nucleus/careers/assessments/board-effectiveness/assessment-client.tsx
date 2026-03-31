'use client';

import { useState, useCallback, useEffect } from 'react';
import { ClipboardList } from 'lucide-react';
import { useAssessmentProgress } from '@/hooks/use-local-storage';
import { AssessmentTour, BOARD_EFFECTIVENESS_TOUR } from '@/components/assessment-tour';
import { AssessmentLayout } from '@/components/careers/assessments/assessment-layout';
import { AssessmentResumeDialog } from '@/components/careers/assessments/assessment-resume-dialog';
import { type AssessmentStep } from '@/components/careers/assessments/assessment-progress-header';
import {
  IntroductionStep,
  StrategyStep,
  GovernanceStep,
  FinancialStep,
  RiskStep,
  LeadershipStep,
  CompositionStep,
  CultureStep,
  StakeholderStep,
  ResultsStep,
} from './step-components';

export type ChecklistRating = 'yes' | 'partial' | 'no' | 'na' | null;
export type ImportanceLevel = 'critical' | 'important' | 'nice-to-have' | null;

export interface ChecklistItem {
  rating: ChecklistRating;
  importance: ImportanceLevel;
  notes: string;
}

const createDefaultItem = (): ChecklistItem => ({
  rating: null,
  importance: null,
  notes: '',
});

export interface BoardEffectivenessResponses {
  // Context
  boardRole: 'board-member' | 'executive' | 'advisor' | 'observer' | 'evaluator' | null;
  boardType: 'corporate' | 'nonprofit' | 'startup' | 'advisory' | 'public-sector' | null;
  evaluationPurpose: 'self-assessment' | 'improvement-planning' | 'board-development' | 'due-diligence' | null;

  // Strategy & Oversight (6 items)
  strategyClarity: ChecklistItem;
  strategyAlignment: ChecklistItem;
  strategyMonitoring: ChecklistItem;
  strategyAdaptation: ChecklistItem;
  performanceMetrics: ChecklistItem;
  competitiveAwareness: ChecklistItem;

  // Governance & Compliance (6 items)
  governanceFramework: ChecklistItem;
  regulatoryCompliance: ChecklistItem;
  ethicsStandards: ChecklistItem;
  conflictManagement: ChecklistItem;
  documentationPractices: ChecklistItem;
  auditOversight: ChecklistItem;

  // Financial Stewardship (5 items)
  financialLiteracy: ChecklistItem;
  budgetOversight: ChecklistItem;
  financialReporting: ChecklistItem;
  capitalAllocation: ChecklistItem;
  financialRisk: ChecklistItem;

  // Risk Management (5 items)
  riskFramework: ChecklistItem;
  riskAppetite: ChecklistItem;
  riskMonitoring: ChecklistItem;
  crisisPreparedness: ChecklistItem;
  cybersecurityOversight: ChecklistItem;

  // CEO & Leadership (5 items)
  ceoRelationship: ChecklistItem;
  ceoEvaluation: ChecklistItem;
  successionPlanning: ChecklistItem;
  executiveCompensation: ChecklistItem;
  leadershipDevelopment: ChecklistItem;

  // Board Composition (5 items)
  skillsDiversity: ChecklistItem;
  demographicDiversity: ChecklistItem;
  independenceBalance: ChecklistItem;
  tenureMix: ChecklistItem;
  recruitmentProcess: ChecklistItem;

  // Board Culture (5 items)
  meetingEffectiveness: ChecklistItem;
  constructiveDebate: ChecklistItem;
  informationFlow: ChecklistItem;
  continuousLearning: ChecklistItem;
  boardEvaluation: ChecklistItem;

  // Stakeholder Relations (5 items)
  shareholderEngagement: ChecklistItem;
  stakeholderAwareness: ChecklistItem;
  transparencyCommunication: ChecklistItem;
  reputationManagement: ChecklistItem;
  esgOversight: ChecklistItem;
}

const createDefaultResponses = (): BoardEffectivenessResponses => ({
  // Context
  boardRole: null,
  boardType: null,
  evaluationPurpose: null,

  // Strategy & Oversight
  strategyClarity: createDefaultItem(),
  strategyAlignment: createDefaultItem(),
  strategyMonitoring: createDefaultItem(),
  strategyAdaptation: createDefaultItem(),
  performanceMetrics: createDefaultItem(),
  competitiveAwareness: createDefaultItem(),

  // Governance & Compliance
  governanceFramework: createDefaultItem(),
  regulatoryCompliance: createDefaultItem(),
  ethicsStandards: createDefaultItem(),
  conflictManagement: createDefaultItem(),
  documentationPractices: createDefaultItem(),
  auditOversight: createDefaultItem(),

  // Financial Stewardship
  financialLiteracy: createDefaultItem(),
  budgetOversight: createDefaultItem(),
  financialReporting: createDefaultItem(),
  capitalAllocation: createDefaultItem(),
  financialRisk: createDefaultItem(),

  // Risk Management
  riskFramework: createDefaultItem(),
  riskAppetite: createDefaultItem(),
  riskMonitoring: createDefaultItem(),
  crisisPreparedness: createDefaultItem(),
  cybersecurityOversight: createDefaultItem(),

  // CEO & Leadership
  ceoRelationship: createDefaultItem(),
  ceoEvaluation: createDefaultItem(),
  successionPlanning: createDefaultItem(),
  executiveCompensation: createDefaultItem(),
  leadershipDevelopment: createDefaultItem(),

  // Board Composition
  skillsDiversity: createDefaultItem(),
  demographicDiversity: createDefaultItem(),
  independenceBalance: createDefaultItem(),
  tenureMix: createDefaultItem(),
  recruitmentProcess: createDefaultItem(),

  // Board Culture
  meetingEffectiveness: createDefaultItem(),
  constructiveDebate: createDefaultItem(),
  informationFlow: createDefaultItem(),
  continuousLearning: createDefaultItem(),
  boardEvaluation: createDefaultItem(),

  // Stakeholder Relations
  shareholderEngagement: createDefaultItem(),
  stakeholderAwareness: createDefaultItem(),
  transparencyCommunication: createDefaultItem(),
  reputationManagement: createDefaultItem(),
  esgOversight: createDefaultItem(),
});

type Step =
  | 'introduction'
  | 'strategy'
  | 'governance'
  | 'financial'
  | 'risk'
  | 'leadership'
  | 'composition'
  | 'culture'
  | 'stakeholder'
  | 'results';

const STEPS: AssessmentStep<Step>[] = [
  { id: 'introduction', label: 'Context' },
  { id: 'strategy', label: 'Strategy' },
  { id: 'governance', label: 'Governance' },
  { id: 'financial', label: 'Financial' },
  { id: 'risk', label: 'Risk' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'composition', label: 'Composition' },
  { id: 'culture', label: 'Culture' },
  { id: 'stakeholder', label: 'Stakeholders' },
  { id: 'results', label: 'Results' },
];

export function BoardEffectivenessClient() {
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
  } = useAssessmentProgress<BoardEffectivenessResponses>(
    'board-effectiveness-v1',
    createDefaultResponses(),
    1
  );

  const [currentStep, setCurrentStep] = useState<Step>('introduction');
  const [responses, setResponses] = useState<BoardEffectivenessResponses>(createDefaultResponses);
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
    if (hasInitialized && currentStep !== 'introduction') {
      saveStep(currentStep);
      saveResponses(responses);
    }
  }, [currentStep, responses, hasInitialized, saveStep, saveResponses]);

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);
  const _progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const handleResumeProgress = useCallback(() => {
    if (savedStep && STEPS.some(s => s.id === savedStep)) {
      setCurrentStep(savedStep as Step);
      setResponses(savedResponses);
    }
    setShowResumeDialog(false);
  }, [savedStep, savedResponses]);

  const handleStartFresh = useCallback(() => {
    clearProgress();
    setCurrentStep('introduction');
    setResponses(createDefaultResponses());
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

  const handleUpdateResponses = useCallback((updates: Partial<BoardEffectivenessResponses>) => {
    setResponses(prev => ({ ...prev, ...updates }));
  }, []);

  const handleReset = useCallback(() => {
    clearProgress();
    setResponses(createDefaultResponses());
    setCurrentStep('introduction');
  }, [clearProgress]);

  // Show loading state while checking localStorage
  if (!isLoaded) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8 md:py-12 md:px-6">
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
      <div className="container max-w-4xl mx-auto px-4 py-8 md:py-12 md:px-6">
        <AssessmentResumeDialog
          lastUpdated={lastUpdated}
          lastStepLabel={stepLabel}
          onResume={handleResumeProgress}
          onStartFresh={handleStartFresh}
        />
      </div>
    );
  }

  const renderStep = () => {
    const commonProps = {
      responses,
      onUpdate: handleUpdateResponses,
      onNext: handleNext,
      onBack: handleBack,
    };

    switch (currentStep) {
      case 'introduction':
        return <IntroductionStep {...commonProps} />;
      case 'strategy':
        return <StrategyStep {...commonProps} />;
      case 'governance':
        return <GovernanceStep {...commonProps} />;
      case 'financial':
        return <FinancialStep {...commonProps} />;
      case 'risk':
        return <RiskStep {...commonProps} />;
      case 'leadership':
        return <LeadershipStep {...commonProps} />;
      case 'composition':
        return <CompositionStep {...commonProps} />;
      case 'culture':
        return <CultureStep {...commonProps} />;
      case 'stakeholder':
        return <StakeholderStep {...commonProps} />;
      case 'results':
        return <ResultsStep responses={responses} onBack={handleBack} onReset={handleReset} />;
      default:
        return null;
    }
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 md:py-12 md:px-6">
      {/* Header */}
      <header className="mb-8" data-tour="step-header">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-amber-500/10 rounded-xl">
            <ClipboardList className="h-8 w-8 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-headline text-gold">
              Board Effectiveness Checklist
            </h1>
            <p className="text-muted-foreground">
              Comprehensive evaluation across 8 governance dimensions
            </p>
          </div>
        </div>
      </header>

      <AssessmentLayout
        steps={STEPS}
        currentStepId={currentStep}
        assessmentTitle="Board Effectiveness Assessment"
        onStepClick={(id) => id !== 'results' && STEPS.findIndex(s => s.id === id) < currentStepIndex && setCurrentStep(id)}
      >
        {renderStep()}
      </AssessmentLayout>

      {/* Onboarding Tour */}
      {currentStep !== 'results' && (
        <AssessmentTour
          tourId="board-effectiveness-v1"
          steps={BOARD_EFFECTIVENESS_TOUR}
        />
      )}
    </div>
  );
}
