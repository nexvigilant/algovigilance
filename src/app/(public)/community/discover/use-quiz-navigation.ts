'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  TOTAL_QUIZ_STEPS,
  QUIZ_ROUTES,
  saveQuizData,
  clearQuizState,
  flushQuizState,
  hasUnsavedProgress,
  type CommunityQuizData,
} from '@/data/community-quiz';

interface UseQuizNavigationOptions {
  step: number;
  formData: CommunityQuizData;
  showCompletion: boolean;
  showExitDialog: boolean;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  setShowCompletion: React.Dispatch<React.SetStateAction<boolean>>;
  setShowExitDialog: React.Dispatch<React.SetStateAction<boolean>>;
  setShowKeyboardHints: React.Dispatch<React.SetStateAction<boolean>>;
  setValidationMessage: React.Dispatch<React.SetStateAction<string | null>>;
  setSaveError: React.Dispatch<React.SetStateAction<boolean>>;
}

interface UseQuizNavigationReturn {
  canProceed: () => boolean;
  handleNext: (skipValidation?: boolean) => void;
  handleBack: () => void;
  handleComplete: () => void;
  handleExit: () => void;
  confirmExit: () => void;
}

export function useQuizNavigation({
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
}: UseQuizNavigationOptions): UseQuizNavigationReturn {
  const router = useRouter();

  const canProceed = useCallback(() => {
    switch (step) {
      case 1:
        return formData.interests.length > 0;
      case 2:
        return formData.goals.length > 0;
      default:
        return true;
    }
  }, [step, formData.interests.length, formData.goals.length]);

  const handleNext = useCallback(
    (skipValidation = false) => {
      if (!skipValidation && !canProceed()) {
        setValidationMessage(
          step === 1
            ? 'Please select at least one area of interest to continue'
            : 'Please select at least one goal to continue'
        );
        return;
      }
      setValidationMessage(null);
      if (step < TOTAL_QUIZ_STEPS) {
        setStep((prev) => prev + 1);
      }
    },
    [step, canProceed, setValidationMessage, setStep]
  );

  const handleBack = useCallback(() => {
    setValidationMessage(null);
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  }, [step, setValidationMessage, setStep]);

  const handleComplete = useCallback(() => {
    const saved = saveQuizData(formData);
    if (!saved) {
      setSaveError(true);
    }
    clearQuizState();
    setShowCompletion(true);
  }, [formData, setSaveError, setShowCompletion]);

  const handleExit = useCallback(() => {
    if (hasUnsavedProgress(formData)) {
      setShowExitDialog(true);
    } else {
      router.push(QUIZ_ROUTES.community);
    }
  }, [formData, router, setShowExitDialog]);

  const confirmExit = useCallback(() => {
    flushQuizState(formData, step);
    router.push(QUIZ_ROUTES.community);
  }, [formData, step, router]);

  // Keyboard navigation with unified exit behavior
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Disable keyboard shortcuts when exit dialog is open
      if (showExitDialog) {
        return;
      }

      // Don't intercept when user is typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // For Enter key, don't intercept if focus is on a button or link
      const isInteractiveElement =
        e.target instanceof HTMLButtonElement ||
        e.target instanceof HTMLAnchorElement ||
        (e.target instanceof Element && e.target.getAttribute('role') === 'button');

      switch (e.key) {
        case 'Escape':
          handleExit();
          break;
        case 'Enter':
          if (isInteractiveElement) return;
          if (step < TOTAL_QUIZ_STEPS) {
            handleNext();
          } else if (step === TOTAL_QUIZ_STEPS && !showCompletion) {
            handleComplete();
          }
          break;
        case 'ArrowLeft':
          if (step > 1 && !showCompletion) {
            handleBack();
          }
          break;
        case 'ArrowRight':
          if (step < TOTAL_QUIZ_STEPS && canProceed() && !showCompletion) {
            handleNext();
          }
          break;
        case '?':
          setShowKeyboardHints((prev) => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [
    step,
    showCompletion,
    showExitDialog,
    canProceed,
    handleNext,
    handleBack,
    handleComplete,
    handleExit,
    setShowKeyboardHints,
  ]);

  return {
    canProceed,
    handleNext,
    handleBack,
    handleComplete,
    handleExit,
    confirmExit,
  };
}
