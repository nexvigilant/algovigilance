'use client';

/**
 * Onboarding Journey Context Provider
 *
 * Provides journey state and actions to all onboarding components.
 * Handles loading, progress tracking, and step navigation.
 *
 * @module onboarding/context
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import {
  getOnboardingJourney,
  startJourneyStep,
  completeJourneyStep,
  skipJourneyStep,
  resetJourney,
} from '../actions/user/journey';
import { orchestrateActivity } from '../actions/utils';
import {
  type OnboardingJourney,
  type OnboardingStepId,
  ONBOARDING_STEPS,
  getStepDefinition,
} from '@/types/onboarding-journey';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { trackEvent } from '@/lib/analytics';

const log = logger.scope('onboarding/context');

interface OnboardingContextValue {
  // State
  journey: OnboardingJourney | null;
  isLoading: boolean;
  error: string | null;
  currentStepId: OnboardingStepId;

  // Computed
  progressPercent: number;
  isComplete: boolean;
  currentStepIndex: number;
  totalSteps: number;

  // Actions
  startStep: (stepId: OnboardingStepId) => Promise<void>;
  completeStep: (stepId: OnboardingStepId, metadata?: Record<string, unknown>) => Promise<OnboardingStepId | null>;
  skipStep: (stepId: OnboardingStepId) => Promise<OnboardingStepId | null>;
  goToStep: (stepId: OnboardingStepId) => void;
  refresh: () => Promise<void>;
  reset: () => Promise<void>;

  // Helpers
  isStepAccessible: (stepId: OnboardingStepId) => boolean;
  isStepComplete: (stepId: OnboardingStepId) => boolean;
  getStepStatus: (stepId: OnboardingStepId) => string;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}

interface OnboardingProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const { toast } = useToast();
  const [journey, setJourney] = useState<OnboardingJourney | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStepId, setActiveStepId] = useState<OnboardingStepId>('profile');

  // Track if this is the first load (for onboarding_started event)
  const [hasTrackedStart, setHasTrackedStart] = useState(false);

  // Load journey on mount
  const loadJourney = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getOnboardingJourney();

      if (result.success && result.journey) {
        setJourney(result.journey);
        setActiveStepId(result.journey.currentStep);

        // Track onboarding started (only once per session)
        if (!hasTrackedStart && result.journey.progressPercent === 0) {
          trackEvent('onboarding_started', {
            currentStep: result.journey.currentStep,
          });
          setHasTrackedStart(true);
        }
      } else {
        setError(result.error ?? 'Failed to load journey');
      }
    } catch (err) {
      log.error('Failed to load journey:', err);
      setError('Failed to load onboarding');
    } finally {
      setIsLoading(false);
    }
  }, [hasTrackedStart]);

  useEffect(() => {
    loadJourney();
  }, [loadJourney]);

  // Start a step
  const startStep = useCallback(async (stepId: OnboardingStepId) => {
    const result = await startJourneyStep(stepId);
    if (result.success) {
      const stepDef = getStepDefinition(stepId);
      trackEvent('onboarding_step_started', {
        stepId,
        stepTitle: stepDef?.title,
        stepIndex: ONBOARDING_STEPS.findIndex((s) => s.id === stepId) + 1,
      });
      await loadJourney();
    } else {
      toast({
        title: 'Error',
        description: result.error ?? 'Failed to start step',
        variant: 'destructive',
      });
    }
  }, [loadJourney, toast]);

  // Complete a step and return the next step ID
  const completeStep = useCallback(async (
    stepId: OnboardingStepId,
    metadata?: Record<string, unknown>
  ): Promise<OnboardingStepId | null> => {
    const result = await completeJourneyStep(stepId, metadata);

    if (result.success) {
      const stepDef = getStepDefinition(stepId);
      const stepIndex = ONBOARDING_STEPS.findIndex((s) => s.id === stepId) + 1;

      // Track step completion and orchestrate activity in parallel
      await Promise.all([
        // Analytics tracking (Async)
        Promise.resolve(trackEvent('onboarding_step_completed', {
          stepId,
          stepTitle: stepDef?.title,
          stepIndex,
          ...metadata,
        })),
        // Unified Activity Orchestration (Backend transactional)
        orchestrateActivity({
          type: 'onboarding_milestone',
          metadata: {
            milestone: `step_completed_${stepId}`,
            stepId,
            ...metadata,
          }
        })
      ]);

      // Track specific actions
      if (stepId === 'circle' && metadata?.circleId) {
        trackEvent('circle_joined', {
          circleId: metadata.circleId as string,
          circleName: metadata.circleName as string,
          source: 'onboarding',
        });
      }
      if (stepId === 'connect' && metadata?.connectionId) {
        trackEvent('connection_made', {
          connectionId: metadata.connectionId as string,
          source: 'onboarding',
        });
      }

      await loadJourney(); // Must happen after to reflect state

      toast({
        title: '🎉 Step Complete!',
        description: `You've completed: ${stepDef?.title}`,
      });

      if (result.isJourneyComplete) {
        trackEvent('onboarding_completed', {
          totalSteps: ONBOARDING_STEPS.length,
        });
        toast({
          title: '🚀 Welcome to the Community!',
          description: 'You\'ve completed your onboarding journey.',
        });
      }

      return result.nextStep ?? null;
    } else {
      toast({
        title: 'Error',
        description: result.error ?? 'Failed to complete step',
        variant: 'destructive',
      });
      return null;
    }
  }, [loadJourney, toast]);

  // Skip a step
  const skipStep = useCallback(async (stepId: OnboardingStepId): Promise<OnboardingStepId | null> => {
    const result = await skipJourneyStep(stepId);

    if (result.success) {
      const stepDef = getStepDefinition(stepId);
      trackEvent('onboarding_step_skipped', {
        stepId,
        stepTitle: stepDef?.title,
        stepIndex: ONBOARDING_STEPS.findIndex((s) => s.id === stepId) + 1,
      });
      await loadJourney();
      return result.nextStep ?? null;
    } else {
      toast({
        title: 'Error',
        description: result.error ?? 'Failed to skip step',
        variant: 'destructive',
      });
      return null;
    }
  }, [loadJourney, toast]);

  // Navigate to a specific step
  const goToStep = useCallback((stepId: OnboardingStepId) => {
    if (journey?.steps[stepId].status !== 'locked') {
      setActiveStepId(stepId);
    }
  }, [journey]);

  // Reset journey (dev only)
  const reset = useCallback(async () => {
    const result = await resetJourney();
    if (result.success) {
      await loadJourney();
      toast({
        title: 'Journey Reset',
        description: 'Onboarding journey has been reset.',
      });
    }
  }, [loadJourney, toast]);

  // Helpers
  const isStepAccessible = useCallback((stepId: OnboardingStepId): boolean => {
    if (!journey) return false;
    const status = journey.steps[stepId]?.status;
    return status !== 'locked';
  }, [journey]);

  const isStepComplete = useCallback((stepId: OnboardingStepId): boolean => {
    if (!journey) return false;
    const status = journey.steps[stepId]?.status;
    return status === 'completed' || status === 'skipped';
  }, [journey]);

  const getStepStatus = useCallback((stepId: OnboardingStepId): string => {
    if (!journey) return 'locked';
    return journey.steps[stepId]?.status ?? 'locked';
  }, [journey]);

  // Computed values
  const currentStepIndex = ONBOARDING_STEPS.findIndex((s) => s.id === activeStepId);
  const progressPercent = journey?.progressPercent ?? 0;
  const isComplete = journey?.isComplete ?? false;

  const value: OnboardingContextValue = {
    journey,
    isLoading,
    error,
    currentStepId: activeStepId,
    progressPercent,
    isComplete,
    currentStepIndex,
    totalSteps: ONBOARDING_STEPS.length,
    startStep,
    completeStep,
    skipStep,
    goToStep,
    refresh: loadJourney,
    reset,
    isStepAccessible,
    isStepComplete,
    getStepStatus,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}
