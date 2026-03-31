'use client';


import { logger } from '@/lib/logger';
const log = logger.scope('hooks/use-local-storage');
import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for persisting state in localStorage with SSR support.
 * Automatically serializes/deserializes JSON and handles hydration.
 *
 * @param key - The localStorage key
 * @param initialValue - Default value if nothing is stored
 * @returns [storedValue, setValue, clearValue, isLoaded]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void, boolean] {
  // Track whether we've loaded from localStorage (for hydration)
  const [isLoaded, setIsLoaded] = useState(false);

  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        setStoredValue(parsed);
      }
    } catch (error) {
      log.warn(`Error reading localStorage key "${key}":`, error);
    } finally {
      setIsLoaded(true);
    }
  }, [key]);

  // Return a wrapped version of useState's setter function that persists to localStorage
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        // Allow value to be a function so we have the same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;

        // Save state
        setStoredValue(valueToStore);

        // Save to localStorage
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        log.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Clear the stored value
  const clearValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      log.warn(`Error clearing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, clearValue, isLoaded];
}

/**
 * Hook specifically for assessment progress with auto-save and resume functionality.
 */
export interface AssessmentProgress<T> {
  step: string;
  responses: T;
  lastUpdated: string;
  version: number;
}

export function useAssessmentProgress<T>(
  assessmentId: string,
  initialResponses: T,
  version: number = 1
): {
  responses: T;
  currentStep: string;
  setResponses: (responses: T) => void;
  setStep: (step: string) => void;
  clearProgress: () => void;
  hasExistingProgress: boolean;
  isLoaded: boolean;
  lastUpdated: Date | null;
} {
  const storageKey = `nexvigilant-assessment-${assessmentId}`;

  const initialProgress: AssessmentProgress<T> = {
    step: '',
    responses: initialResponses,
    lastUpdated: new Date().toISOString(),
    version,
  };

  const [progress, setProgress, clearProgress, isLoaded] = useLocalStorage<AssessmentProgress<T>>(
    storageKey,
    initialProgress
  );

  // Check if we have existing progress (different from initial)
  const hasExistingProgress =
    isLoaded &&
    progress.version === version &&
    progress.step !== '' &&
    JSON.stringify(progress.responses) !== JSON.stringify(initialResponses);

  const setResponses = useCallback(
    (responses: T) => {
      setProgress((prev) => ({
        ...prev,
        responses,
        lastUpdated: new Date().toISOString(),
      }));
    },
    [setProgress]
  );

  const setStep = useCallback(
    (step: string) => {
      setProgress((prev) => ({
        ...prev,
        step,
        lastUpdated: new Date().toISOString(),
      }));
    },
    [setProgress]
  );

  const handleClearProgress = useCallback(() => {
    clearProgress();
  }, [clearProgress]);

  const lastUpdated = progress.lastUpdated ? new Date(progress.lastUpdated) : null;

  return {
    responses: progress.responses,
    currentStep: progress.step,
    setResponses,
    setStep,
    clearProgress: handleClearProgress,
    hasExistingProgress,
    isLoaded,
    lastUpdated,
  };
}
