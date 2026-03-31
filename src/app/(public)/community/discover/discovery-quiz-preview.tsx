'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Check,
  X,
  Keyboard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  QUIZ_STEPS,
  TOTAL_QUIZ_STEPS,
  QUIZ_UI_CONFIG,
  saveQuizState,
  loadQuizState,
  isValidInterest,
  isValidGoal,
  isValidTopic,
  type CommunityQuizData,
  type ExperienceLevel,
} from '@/data/community-quiz';
import { QuizCompletionScreen } from './quiz-completion-screen';
import { QuizStepContent } from './quiz-step-content';
import { useQuizNavigation } from './use-quiz-navigation';

export function DiscoveryQuizPreview() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<CommunityQuizData>({
    interests: [],
    goals: [],
    preferredTopics: [],
  });
  const [showCompletion, setShowCompletion] = useState(false);
  const [showKeyboardHints, setShowKeyboardHints] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null
  );
  const [saveError, setSaveError] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Refs for focus management and scroll
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const previousStep = useRef(step);

  // Load saved state on mount (resume functionality)
  useEffect(() => {
    const savedState = loadQuizState();
    if (savedState) {
      setFormData({
        interests: savedState.interests,
        goals: savedState.goals,
        preferredTopics: savedState.preferredTopics,
        experience: savedState.experience,
      });
      setStep(savedState.currentStep);
    }
    setIsInitialized(true);
  }, []);

  // Autosave on form data or step change (debounced)
  useEffect(() => {
    if (!isInitialized) return;

    const timeoutId = setTimeout(() => {
      saveQuizState(formData, step);
    }, QUIZ_UI_CONFIG.autosaveDelay);

    return () => clearTimeout(timeoutId);
  }, [formData, step, isInitialized]);

  // Focus management via useEffect (idiomatic React pattern)
  useEffect(() => {
    if (previousStep.current !== step && stepHeadingRef.current) {
      stepHeadingRef.current.focus();
      // Scroll card to top on step change (mobile UX)
      cardRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
    previousStep.current = step;
  }, [step]);

  // Type-safe toggle selection with proper generics
  const toggleInterest = useCallback((value: string) => {
    if (!isValidInterest(value)) return;
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(value)
        ? prev.interests.filter((i) => i !== value)
        : [...prev.interests, value],
    }));
  }, []);

  const toggleGoal = useCallback((value: string) => {
    if (!isValidGoal(value)) return;
    setFormData((prev) => ({
      ...prev,
      goals: prev.goals.includes(value)
        ? prev.goals.filter((g) => g !== value)
        : [...prev.goals, value],
    }));
  }, []);

  const toggleTopic = useCallback((value: string) => {
    if (!isValidTopic(value)) return;
    setFormData((prev) => ({
      ...prev,
      preferredTopics: prev.preferredTopics.includes(value)
        ? prev.preferredTopics.filter((t) => t !== value)
        : [...prev.preferredTopics, value],
    }));
  }, []);

  const setExperience = useCallback((value: ExperienceLevel) => {
    setFormData((prev) => ({ ...prev, experience: value }));
  }, []);

  const { canProceed, handleNext, handleBack, handleComplete, handleExit, confirmExit } =
    useQuizNavigation({
      step,
      formData,
      showCompletion,
      showExitDialog,
      setStep,
      setShowCompletion,
      setShowExitDialog,
      setShowKeyboardHints,
      setValidationMessage,
      setSaveError,
    });

  if (showCompletion) {
    return <QuizCompletionScreen formData={formData} saveError={saveError} />;
  }

  return (
    <>
      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent className="border-cyan/30 bg-nex-surface">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Leave quiz?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-dim">
              You have unsaved progress. Your selections will be saved for 24
              hours if you leave now.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-cyan/30 text-slate-light hover:bg-nex-light/10">
              Continue Quiz
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmExit}
              className="bg-cyan hover:bg-cyan/90 text-nex-deep"
            >
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex min-h-screen items-center justify-center bg-nex-deep p-4">
        <Card
          ref={cardRef}
          className="relative w-full max-w-3xl border-cyan/30 bg-nex-surface p-8 max-h-[90vh] overflow-y-auto"
        >
          {/* Close Button */}
          <button
            onClick={handleExit}
            className="group absolute right-4 top-4 rounded-lg border border-cyan/30 bg-nex-dark p-2 transition-all hover:border-cyan/50 hover:bg-cyan/10 touch-target min-w-[44px] flex items-center justify-center"
            aria-label="Close quiz"
          >
            <X className="h-5 w-5 text-cyan group-hover:text-cyan" />
          </button>

          {/* Keyboard Hints Toggle */}
          <button
            onClick={() => setShowKeyboardHints((prev) => !prev)}
            className={cn(
              'absolute right-16 top-4 rounded-lg border p-2 transition-all touch-target min-w-[44px] flex items-center justify-center',
              showKeyboardHints
                ? 'border-cyan bg-cyan/20 text-cyan'
                : 'border-cyan/30 bg-nex-dark text-slate-dim hover:border-cyan/50 hover:text-cyan'
            )}
            aria-label="Toggle keyboard shortcuts (press ? to toggle)"
            aria-pressed={showKeyboardHints}
            aria-expanded={showKeyboardHints}
            aria-controls="keyboard-hints"
          >
            <Keyboard className="h-5 w-5" />
          </button>

          {/* Keyboard Hints Panel */}
          {showKeyboardHints && (
            <div
              className="absolute right-4 top-16 w-48 rounded-lg border border-cyan/30 bg-nex-dark p-3 shadow-lg"
              style={{ zIndex: QUIZ_UI_CONFIG.tooltipZIndex }}
              role="tooltip"
              id="keyboard-hints"
            >
              <p className="mb-2 text-xs font-semibold text-cyan">
                Keyboard Shortcuts
              </p>
              <ul className="space-y-1 text-xs text-slate-dim">
                <li>
                  <kbd className="rounded bg-nex-surface px-1">←</kbd> Previous
                  step
                </li>
                <li>
                  <kbd className="rounded bg-nex-surface px-1">→</kbd> Next step
                </li>
                <li>
                  <kbd className="rounded bg-nex-surface px-1">Enter</kbd>{' '}
                  Confirm
                </li>
                <li>
                  <kbd className="rounded bg-nex-surface px-1">Esc</kbd> Exit
                </li>
                <li>
                  <kbd className="rounded bg-nex-surface px-1">?</kbd> Toggle
                  hints
                </li>
              </ul>
            </div>
          )}

          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-cyan/30 bg-cyan/10">
              <Sparkles className="h-8 w-8 text-cyan" />
            </div>
            <h1 className="mb-2 text-3xl font-bold font-headline text-white">
              Find Your Professional Home
            </h1>
            <p className="text-lg text-slate-dim">
              Discover communities tailored to your interests and goals
            </p>
            <p className="mt-2 text-sm text-cyan/70">
              Preview • No account required •{' '}
              <span className="hidden sm:inline">Press ? for shortcuts</span>
              <span className="sm:hidden">Tap ⌨ for shortcuts</span>
            </p>
          </div>

          {/* Progress Bar with Semantic Step Indicators */}
          <div className="mb-8" role="group" aria-label="Quiz progress">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-light">
                Step {step} of {TOTAL_QUIZ_STEPS}
              </span>
              <span className="text-sm text-cyan">
                {Math.round((step / TOTAL_QUIZ_STEPS) * 100)}% Complete
              </span>
            </div>

            {/* Semantic Step Indicators */}
            <ol
              className="mb-3 flex items-center justify-between"
              aria-label="Quiz steps"
            >
              {QUIZ_STEPS.map((quizStep, idx) => (
                <li
                  key={quizStep.id}
                  className="flex flex-1 items-center"
                  aria-current={quizStep.id === step ? 'step' : undefined}
                >
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300',
                      quizStep.id < step
                        ? 'border-green-500 bg-green-500'
                        : quizStep.id === step
                          ? 'border-cyan bg-cyan ring-4 ring-cyan/20'
                          : 'border-cyan/30 bg-nex-dark'
                    )}
                    aria-label={`Step ${quizStep.id}: ${quizStep.title}${quizStep.id < step ? ' (completed)' : quizStep.id === step ? ' (current)' : ''}`}
                  >
                    {quizStep.id < step ? (
                      <Check
                        className="h-5 w-5 text-white"
                        aria-hidden="true"
                      />
                    ) : (
                      <span
                        className={cn(
                          'text-sm font-bold',
                          quizStep.id === step
                            ? 'text-nex-deep'
                            : 'text-slate-dim'
                        )}
                        aria-hidden="true"
                      >
                        {quizStep.id}
                      </span>
                    )}
                  </div>

                  {idx < QUIZ_STEPS.length - 1 && (
                    <div className="mx-2 h-1 flex-1" aria-hidden="true">
                      <div
                        className={cn(
                          'h-full transition-all duration-300',
                          quizStep.id < step ? 'bg-green-500' : 'bg-cyan/30'
                        )}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </div>

          {/* Aria-live region for validation announcements */}
          <div
            className="sr-only"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {validationMessage}
          </div>

          {/* Step Content */}
          <QuizStepContent
            step={step}
            formData={formData}
            toggleInterest={toggleInterest}
            toggleGoal={toggleGoal}
            toggleTopic={toggleTopic}
            setExperience={setExperience}
            stepHeadingRef={stepHeadingRef}
          />

          {/* Visible Validation Error Message */}
          {validationMessage && (
            <div
              className="mt-6 flex items-start gap-3 rounded-lg border border-orange-500/30 bg-orange-500/10 p-4"
              role="alert"
            >
              <AlertCircle
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-400"
                aria-hidden="true"
              />
              <p className="text-sm text-orange-300">{validationMessage}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between border-t border-cyan/30 pt-6">
            <Button
              onClick={handleBack}
              variant="outline"
              disabled={step === 1}
              className="border-cyan/30 text-slate-light hover:bg-cyan/10 touch-target"
            >
              <ChevronLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              Back
            </Button>

            {step < TOTAL_QUIZ_STEPS ? (
              <div className="flex gap-2">
                {(step === 3 || step === 4) && (
                  <Button
                    onClick={() => handleNext(true)}
                    variant="outline"
                    className="border-cyan/30 text-slate-light hover:bg-cyan/10 touch-target"
                  >
                    Skip
                  </Button>
                )}
                <Button
                  onClick={() => handleNext()}
                  disabled={!canProceed()}
                  className="bg-cyan hover:bg-cyan/90 text-nex-deep touch-target"
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleComplete}
                className="bg-cyan hover:bg-cyan/90 text-nex-deep touch-target"
              >
                Show My Matches
                <Sparkles className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
