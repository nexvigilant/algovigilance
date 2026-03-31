/**
 * Member Onboarding Journey Types
 *
 * Defines the 5-step activation journey for new community members:
 * 1. Profile - Complete professional profile
 * 2. Discovery - Interest/goals quiz
 * 3. Circle - Join first Circle
 * 4. Introduce - Create first post
 * 5. Connect - First connection/message
 *
 * @module types/onboarding-journey
 */

import type { Timestamp } from 'firebase/firestore';

/**
 * Onboarding step identifiers
 */
export type OnboardingStepId =
  | 'profile'
  | 'discovery'
  | 'circle'
  | 'introduce'
  | 'connect';

/**
 * Status of an individual onboarding step
 */
export type OnboardingStepStatus =
  | 'locked' // Cannot access yet (requires previous step)
  | 'available' // Can start
  | 'in_progress' // Started but not completed
  | 'completed' // Successfully completed
  | 'skipped'; // User chose to skip (if allowed)

/**
 * Individual onboarding step definition
 */
export interface OnboardingStep {
  id: OnboardingStepId;
  order: number;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  estimatedMinutes: number;
  isRequired: boolean;
  canSkip: boolean;
}

/**
 * User's progress on a specific step
 */
export interface OnboardingStepProgress {
  stepId: OnboardingStepId;
  status: OnboardingStepStatus;
  startedAt?: Timestamp | Date | string | null;
  completedAt?: Timestamp | Date | string | null;
  skippedAt?: Timestamp | Date | string | null;
  metadata?: Record<string, unknown>; // Step-specific data (e.g., circleId joined)
}

/**
 * Complete onboarding journey state for a user
 * Stored at: users/{userId}/onboarding/journey
 */
export interface OnboardingJourney {
  userId: string;
  currentStep: OnboardingStepId;
  steps: Record<OnboardingStepId, OnboardingStepProgress>;
  isComplete: boolean;
  completedAt?: Timestamp | Date | string | null;
  startedAt: Timestamp | Date | string;
  updatedAt: Timestamp | Date | string;

  // Progress metrics
  completedSteps: number;
  totalSteps: number;
  progressPercent: number;

  // Engagement data captured during journey
  capturedData: {
    profileCompleted?: boolean;
    quizCompleted?: boolean;
    firstCircleId?: string;
    firstCircleName?: string;
    firstPostId?: string;
    firstConnectionId?: string;
    firstConnectionName?: string;
  };
}

/**
 * Step definitions - static configuration
 */
export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'profile',
    order: 1,
    title: 'Complete Your Profile',
    description: 'Add your professional details so the community can find you',
    icon: 'User',
    estimatedMinutes: 2,
    isRequired: true,
    canSkip: false,
  },
  {
    id: 'discovery',
    order: 2,
    title: 'Share Your Interests',
    description: 'Tell us your goals and interests for personalized recommendations',
    icon: 'Compass',
    estimatedMinutes: 3,
    isRequired: true,
    canSkip: false,
  },
  {
    id: 'circle',
    order: 3,
    title: 'Join Your First Circle',
    description: 'Find a community of professionals who share your interests',
    icon: 'Users',
    estimatedMinutes: 2,
    isRequired: true,
    canSkip: false,
  },
  {
    id: 'introduce',
    order: 4,
    title: 'Introduce Yourself',
    description: 'Share a brief introduction with the community',
    icon: 'MessageSquare',
    estimatedMinutes: 3,
    isRequired: false,
    canSkip: true,
  },
  {
    id: 'connect',
    order: 5,
    title: 'Make a Connection',
    description: 'Reach out to someone or follow a topic expert',
    icon: 'UserPlus',
    estimatedMinutes: 2,
    isRequired: false,
    canSkip: true,
  },
];

/**
 * Get step definition by ID
 */
export function getStepDefinition(stepId: OnboardingStepId): OnboardingStep | undefined {
  return ONBOARDING_STEPS.find((s) => s.id === stepId);
}

/**
 * Get next step ID after a given step
 */
export function getNextStepId(currentStepId: OnboardingStepId): OnboardingStepId | null {
  const currentStep = getStepDefinition(currentStepId);
  if (!currentStep) return null;

  const nextStep = ONBOARDING_STEPS.find((s) => s.order === currentStep.order + 1);
  return nextStep?.id ?? null;
}

/**
 * Get previous step ID
 */
export function getPreviousStepId(currentStepId: OnboardingStepId): OnboardingStepId | null {
  const currentStep = getStepDefinition(currentStepId);
  if (!currentStep) return null;

  const prevStep = ONBOARDING_STEPS.find((s) => s.order === currentStep.order - 1);
  return prevStep?.id ?? null;
}

/**
 * Check if all required steps are complete
 */
export function areRequiredStepsComplete(
  journey: OnboardingJourney
): boolean {
  return ONBOARDING_STEPS.filter((s) => s.isRequired).every(
    (step) =>
      journey.steps[step.id]?.status === 'completed' ||
      journey.steps[step.id]?.status === 'skipped'
  );
}

/**
 * Calculate journey progress percentage
 */
export function calculateProgress(journey: OnboardingJourney): number {
  const completedCount = Object.values(journey.steps).filter(
    (s) => s.status === 'completed' || s.status === 'skipped'
  ).length;
  return Math.round((completedCount / ONBOARDING_STEPS.length) * 100);
}

/**
 * Create initial journey state for a new user
 */
export function createInitialJourney(userId: string): Omit<OnboardingJourney, 'startedAt' | 'updatedAt'> {
  const steps: Record<OnboardingStepId, OnboardingStepProgress> = {
    profile: { stepId: 'profile', status: 'available' },
    discovery: { stepId: 'discovery', status: 'locked' },
    circle: { stepId: 'circle', status: 'locked' },
    introduce: { stepId: 'introduce', status: 'locked' },
    connect: { stepId: 'connect', status: 'locked' },
  };

  return {
    userId,
    currentStep: 'profile',
    steps,
    isComplete: false,
    completedSteps: 0,
    totalSteps: ONBOARDING_STEPS.length,
    progressPercent: 0,
    capturedData: {},
  };
}
