'use client';

/**
 * Service Discovery Wizard - Main Container
 *
 * Manages wizard state and orchestrates screen transitions.
 * Uses useReducer for predictable state management.
 */

import { useReducer, useCallback, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import type {
  WizardState,
  WizardAction,
  WizardRecommendations,
  WizardBranch,
} from '@/types/service-wizard';
import { createInitialWizardState } from '@/types/service-wizard';
import {
  wizardQuestions,
  resolveQuestionFlow,
} from '@/data/wizard-questions';
import {
  processAnswer,
  generateRecommendations,
} from '@/lib/wizard-scoring';

import { WizardWelcome } from './wizard-welcome';
import { WizardQuestion } from './wizard-question';
import { WizardProgress } from './wizard-progress';
import { WizardResults } from './wizard-results';
import { WizardBooking } from './wizard-booking';

// =============================================================================
// State Reducer
// =============================================================================

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'START_WIZARD': {
      return {
        ...createInitialWizardState(),
        screen: 'question',
        questionFlow: ['q1-situation'],
      };
    }

    case 'SELECT_OPTION': {
      const { questionId, option } = action;
      const updates = processAnswer(state, questionId, option.id);
      const newState = { ...state, ...updates };

      // Update question flow based on new branch
      const newFlow = resolveQuestionFlow(newState);

      // Check if we should advance to next question or show results
      const currentIndex = newFlow.indexOf(questionId);
      const hasMore = currentIndex < newFlow.length - 1;

      if (hasMore) {
        return {
          ...newState,
          questionFlow: newFlow,
          questionIndex: currentIndex + 1,
        };
      } else {
        // No more questions, show processing then results
        return {
          ...newState,
          questionFlow: newFlow,
          screen: 'processing',
          isProcessing: true,
        };
      }
    }

    case 'GO_BACK': {
      if (state.questionIndex > 0) {
        return {
          ...state,
          questionIndex: state.questionIndex - 1,
        };
      }
      // At first question, go back to welcome
      return {
        ...createInitialWizardState(),
        screen: 'welcome',
      };
    }

    case 'START_PROCESSING': {
      return {
        ...state,
        screen: 'processing',
        isProcessing: true,
      };
    }

    case 'SHOW_RESULTS': {
      return {
        ...state,
        screen: 'results',
        isProcessing: false,
      };
    }

    case 'GO_TO_BOOKING': {
      return {
        ...state,
        screen: 'booking',
      };
    }

    case 'RESET': {
      return createInitialWizardState();
    }

    default:
      return state;
  }
}

// =============================================================================
// Main Component
// =============================================================================

export function WizardContainer() {
  const searchParams = useSearchParams();
  const [state, dispatch] = useReducer(wizardReducer, createInitialWizardState());
  const hasInitializedFromParams = useRef(false);

  // Initialize from URL parameters if available (handoff from Agent)
  useEffect(() => {
    if (hasInitializedFromParams.current) return;
    
    const branch = searchParams.get('branch') as WizardBranch;
    const intent = searchParams.get('intent');
    
    if (branch || intent) {
      hasInitializedFromParams.current = true;
      dispatch({ type: 'START_WIZARD' });
      
      // If we have a branch, we can pre-select the first question
      if (branch === 'challenge' || branch === 'opportunity' || branch === 'exploration') {
        const firstQuestion = wizardQuestions['q1-situation'];
        const option = firstQuestion.options.find(o => o.id === branch);
        if (option) {
          // Small delay to ensure the start action has processed
          setTimeout(() => {
            dispatch({
              type: 'SELECT_OPTION',
              questionId: 'q1-situation',
              option,
            });
          }, 100);
        }
      }
    }
  }, [searchParams]);

  // Get current question from flow
  const currentQuestion = useMemo(() => {
    if (state.screen !== 'question') return null;
    const questionId = state.questionFlow[state.questionIndex];
    return questionId ? wizardQuestions[questionId] : null;
  }, [state.screen, state.questionFlow, state.questionIndex]);

  // Generate recommendations when on results screen
  const recommendations = useMemo<WizardRecommendations | null>(() => {
    if (state.screen === 'results' || state.screen === 'booking') {
      return generateRecommendations(state);
    }
    return null;
  }, [state]);

  // Handlers
  const handleStart = useCallback(() => {
    dispatch({ type: 'START_WIZARD' });
  }, []);

  const handleSelectOption = useCallback(
    (optionId: string) => {
      if (!currentQuestion) return;
      const option = currentQuestion.options.find((o) => o.id === optionId);
      if (!option) return;

      dispatch({
        type: 'SELECT_OPTION',
        questionId: currentQuestion.id,
        option,
      });
    },
    [currentQuestion]
  );

  const handleBack = useCallback(() => {
    dispatch({ type: 'GO_BACK' });
  }, []);

  const handleShowResults = useCallback(() => {
    dispatch({ type: 'SHOW_RESULTS' });
  }, []);

  const handleGoToBooking = useCallback(() => {
    dispatch({ type: 'GO_TO_BOOKING' });
  }, []);

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  // Calculate progress
  // Use estimated total of 5 questions until we have enough answers to know the real flow
  const progress = useMemo(() => {
    if (state.screen === 'welcome') return 0;
    if (state.screen === 'processing' || state.screen === 'results' || state.screen === 'booking') {
      return 100;
    }
    // After Q1 is answered, we know the branch and have the real flow length
    const answeredCount = Object.keys(state.answers).length;
    const estimatedTotal = answeredCount > 0 ? state.questionFlow.length : 5;
    return Math.round(((state.questionIndex + 1) / estimatedTotal) * 100);
  }, [state.screen, state.questionFlow.length, state.questionIndex, state.answers]);

  // Calculate estimated total for display
  const estimatedTotalSteps = useMemo(() => {
    const answeredCount = Object.keys(state.answers).length;
    return answeredCount > 0 ? state.questionFlow.length : 5;
  }, [state.questionFlow.length, state.answers]);

  // Render based on current screen
  return (
    <div className="min-h-screen bg-nex-background">
      {/* Progress bar - shown during questions */}
      {state.screen === 'question' && (
        <WizardProgress
          progress={progress}
          currentStep={state.questionIndex + 1}
          totalSteps={estimatedTotalSteps}
        />
      )}

      {/* Screen content */}
      <div className="container mx-auto max-w-4xl px-4 py-8 md:py-16">
        {state.screen === 'welcome' && <WizardWelcome onStart={handleStart} />}

        {state.screen === 'question' && currentQuestion && (
          <WizardQuestion
            question={currentQuestion}
            questionIndex={state.questionIndex}
            selectedOption={state.answers[currentQuestion.id]}
            onSelectOption={handleSelectOption}
            onBack={handleBack}
            canGoBack={state.questionIndex > 0}
          />
        )}

        {state.screen === 'processing' && (
          <ProcessingScreen onComplete={handleShowResults} />
        )}

        {state.screen === 'results' && recommendations && (
          <WizardResults
            recommendations={recommendations}
            branch={state.branch}
            scores={state.scores}
            tags={state.tags}
            onBookCall={handleGoToBooking}
            onStartOver={handleReset}
          />
        )}

        {state.screen === 'booking' && recommendations && (
          <WizardBooking
            recommendations={recommendations}
            maturityScore={state.scores.maturity}
            onBack={() => dispatch({ type: 'SHOW_RESULTS' })}
            onStartOver={handleReset}
          />
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Processing Screen (Brief Animation)
// =============================================================================

function ProcessingScreen({ onComplete }: { onComplete: () => void }) {
  // Auto-advance after brief delay
  useEffect(() => {
    const timer = setTimeout(onComplete, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="mb-6">
        <div className="w-16 h-16 border-4 border-cyan/30 border-t-cyan rounded-full animate-spin" />
      </div>
      <h2 className="text-2xl font-headline font-bold text-white mb-2">
        Analyzing your needs...
      </h2>
      <p className="text-slate-dim">
        Matching you with the right solution
      </p>
    </div>
  );
}
