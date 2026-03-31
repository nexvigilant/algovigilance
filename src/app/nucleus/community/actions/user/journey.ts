'use server';

/**
 * Member Onboarding Journey Server Actions
 *
 * Manages the 5-step activation journey for new community members.
 * Tracks progress, step completions, and captured engagement data.
 *
 * Firestore path: users/{userId}/onboarding/journey
 *
 * @module actions/user/journey
 */

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getAuthenticatedUser, withTiming } from '../utils';
import { logger } from '@/lib/logger';
import {
  type OnboardingJourney,
  type OnboardingStepId,
  type OnboardingStepProgress,
  ONBOARDING_STEPS,
  createInitialJourney,
  getNextStepId,
} from '@/types/onboarding-journey';
import { checkAndAwardBadges } from '../social/badges';

const log = logger.scope('actions/user/journey');

/**
 * Get or create the user's onboarding journey
 */
export async function getOnboardingJourney(): Promise<{
  success: boolean;
  journey?: OnboardingJourney;
  error?: string;
}> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const journeyRef = adminDb.doc(`users/${user.uid}/onboarding/journey`);
    const journeyDoc = await journeyRef.get();

    if (journeyDoc.exists) {
      return {
        success: true,
        journey: journeyDoc.data() as OnboardingJourney,
      };
    }

    // Create initial journey if doesn't exist
    // Use Date instead of firebase-admin Timestamp for type compatibility with OnboardingJourney
    const now = new Date();
    const initialJourney: OnboardingJourney = {
      ...createInitialJourney(user.uid),
      startedAt: now,
      updatedAt: now,
    };

    await journeyRef.set(initialJourney);
    log.info('Created new onboarding journey', { userId: user.uid });

    return { success: true, journey: initialJourney };
  } catch (error) {
    log.error('Error getting onboarding journey:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get journey',
    };
  }
}

/**
 * Mark a step as started (in_progress)
 */
export async function startJourneyStep(stepId: OnboardingStepId): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const journeyRef = adminDb.doc(`users/${user.uid}/onboarding/journey`);
    const journeyDoc = await journeyRef.get();

    if (!journeyDoc.exists) {
      return { success: false, error: 'Journey not found' };
    }

    const journey = journeyDoc.data() as OnboardingJourney;
    const stepProgress = journey.steps[stepId];

    // Only start if available or already in progress
    if (stepProgress.status !== 'available' && stepProgress.status !== 'in_progress') {
      return { success: false, error: 'Step not available' };
    }

    const update: Partial<OnboardingStepProgress> = {
      status: 'in_progress',
      startedAt: new Date(),
    };

    await journeyRef.update({
      [`steps.${stepId}`]: { ...stepProgress, ...update },
      currentStep: stepId,
      updatedAt: FieldValue.serverTimestamp(),
    });

    log.debug('Started journey step', { userId: user.uid, stepId });
    return { success: true };
  } catch (error) {
    log.error('Error starting journey step:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start step',
    };
  }
}

/**
 * Complete a step and unlock the next one
 */
export async function completeJourneyStep(
  stepId: OnboardingStepId,
  metadata?: Record<string, unknown>
): Promise<{
  success: boolean;
  nextStep?: OnboardingStepId | null;
  isJourneyComplete?: boolean;
  error?: string;
}> {
  return withTiming('completeJourneyStep', async () => {
    try {
      const user = await getAuthenticatedUser();
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      const journeyRef = adminDb.doc(`users/${user.uid}/onboarding/journey`);
      const journeyDoc = await journeyRef.get();

      if (!journeyDoc.exists) {
        return { success: false, error: 'Journey not found' };
      }

      const journey = journeyDoc.data() as OnboardingJourney;
      const now = new Date();

      // Update current step to completed
      const updatedSteps = { ...journey.steps };
      updatedSteps[stepId] = {
        ...updatedSteps[stepId],
        status: 'completed',
        completedAt: now,
        metadata: metadata ?? updatedSteps[stepId].metadata,
      };

      // Unlock next step if available
      const nextStepId = getNextStepId(stepId);
      if (nextStepId && updatedSteps[nextStepId].status === 'locked') {
        updatedSteps[nextStepId] = {
          ...updatedSteps[nextStepId],
          status: 'available',
        };
      }

      // Calculate progress
      const completedCount = Object.values(updatedSteps).filter(
        (s) => s.status === 'completed' || s.status === 'skipped'
      ).length;
      const progressPercent = Math.round((completedCount / ONBOARDING_STEPS.length) * 100);
      const isComplete = completedCount === ONBOARDING_STEPS.length;

      // Update captured data based on step
      const capturedData = { ...journey.capturedData };
      if (stepId === 'profile') capturedData.profileCompleted = true;
      if (stepId === 'discovery') capturedData.quizCompleted = true;
      if (stepId === 'circle' && metadata?.circleId) {
        capturedData.firstCircleId = metadata.circleId as string;
        capturedData.firstCircleName = metadata.circleName as string;
      }
      if (stepId === 'introduce' && metadata?.postId) {
        capturedData.firstPostId = metadata.postId as string;
      }
      if (stepId === 'connect' && metadata?.connectionId) {
        capturedData.firstConnectionId = metadata.connectionId as string;
        capturedData.firstConnectionName = metadata.connectionName as string;
      }

      const updateData: Partial<OnboardingJourney> & { updatedAt: Date; completedAt?: Date } = {
        steps: updatedSteps,
        currentStep: nextStepId ?? stepId,
        completedSteps: completedCount,
        progressPercent,
        isComplete,
        capturedData,
        updatedAt: now,
      };

      if (isComplete) {
        updateData.completedAt = now;
      }

      await journeyRef.update(updateData);

      // Also update the main user profile onboardingComplete flag and award badge in parallel
      if (isComplete) {
        const [, { newBadges }] = await Promise.all([
          adminDb.doc(`users/${user.uid}`).update({
            onboardingComplete: true,
            updatedAt: FieldValue.serverTimestamp(),
          }),
          checkAndAwardBadges(user.uid),
        ]);
        if (newBadges.includes('journey-complete')) {
          log.info('Awarded journey-complete badge', { userId: user.uid });
        }
      }

      log.info('Completed journey step', {
        userId: user.uid,
        stepId,
        nextStepId,
        isComplete,
        progressPercent,
      });

      return {
        success: true,
        nextStep: nextStepId,
        isJourneyComplete: isComplete,
      };
    } catch (error) {
      log.error('Error completing journey step:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete step',
      };
    }
  }, { stepId });
}

/**
 * Skip a skippable step
 */
export async function skipJourneyStep(stepId: OnboardingStepId): Promise<{
  success: boolean;
  nextStep?: OnboardingStepId | null;
  error?: string;
}> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Check if step is skippable
    const stepDef = ONBOARDING_STEPS.find((s) => s.id === stepId);
    if (!stepDef?.canSkip) {
      return { success: false, error: 'This step cannot be skipped' };
    }

    const journeyRef = adminDb.doc(`users/${user.uid}/onboarding/journey`);
    const journeyDoc = await journeyRef.get();

    if (!journeyDoc.exists) {
      return { success: false, error: 'Journey not found' };
    }

    const journey = journeyDoc.data() as OnboardingJourney;
    const now = new Date();

    // Update current step to skipped
    const updatedSteps = { ...journey.steps };
    updatedSteps[stepId] = {
      ...updatedSteps[stepId],
      status: 'skipped',
      skippedAt: now,
    };

    // Unlock next step
    const nextStepId = getNextStepId(stepId);
    if (nextStepId && updatedSteps[nextStepId].status === 'locked') {
      updatedSteps[nextStepId] = {
        ...updatedSteps[nextStepId],
        status: 'available',
      };
    }

    // Calculate progress
    const completedCount = Object.values(updatedSteps).filter(
      (s) => s.status === 'completed' || s.status === 'skipped'
    ).length;
    const progressPercent = Math.round((completedCount / ONBOARDING_STEPS.length) * 100);
    const isComplete = completedCount === ONBOARDING_STEPS.length;

    await journeyRef.update({
      steps: updatedSteps,
      currentStep: nextStepId ?? stepId,
      completedSteps: completedCount,
      progressPercent,
      isComplete,
      completedAt: isComplete ? now : null,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Award badge if journey complete (even via skip)
    if (isComplete) {
      const [, { newBadges }] = await Promise.all([
        adminDb.doc(`users/${user.uid}`).update({
          onboardingComplete: true,
          updatedAt: FieldValue.serverTimestamp(),
        }),
        checkAndAwardBadges(user.uid),
      ]);
      if (newBadges.includes('journey-complete')) {
        log.info('Awarded journey-complete badge', { userId: user.uid });
      }
    }

    log.info('Skipped journey step', { userId: user.uid, stepId, nextStepId });

    return { success: true, nextStep: nextStepId };
  } catch (error) {
    log.error('Error skipping journey step:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to skip step',
    };
  }
}

/**
 * Check if user has completed onboarding journey
 */
export async function hasCompletedJourney(): Promise<{
  completed: boolean;
  progressPercent?: number;
  currentStep?: OnboardingStepId;
  error?: string;
}> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { completed: false, error: 'Not authenticated' };
    }

    const journeyRef = adminDb.doc(`users/${user.uid}/onboarding/journey`);
    const journeyDoc = await journeyRef.get();

    if (!journeyDoc.exists) {
      return { completed: false, progressPercent: 0, currentStep: 'profile' };
    }

    const journey = journeyDoc.data() as OnboardingJourney;
    return {
      completed: journey.isComplete,
      progressPercent: journey.progressPercent,
      currentStep: journey.currentStep,
    };
  } catch (error) {
    log.error('Error checking journey completion:', error);
    return { completed: false, error: 'Failed to check status' };
  }
}

/**
 * Reset journey (admin/testing only)
 */
export async function resetJourney(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return { success: false, error: 'Only available in development' };
    }

    const journeyRef = adminDb.doc(`users/${user.uid}/onboarding/journey`);
    const now = new Date();
    const initialJourney: OnboardingJourney = {
      ...createInitialJourney(user.uid),
      startedAt: now,
      updatedAt: now,
    };

    // Reset journey doc and user profile flag in parallel
    await Promise.all([
      journeyRef.set(initialJourney),
      adminDb.doc(`users/${user.uid}`).update({
        onboardingComplete: false,
        updatedAt: FieldValue.serverTimestamp(),
      }),
    ]);

    log.info('Reset onboarding journey', { userId: user.uid });
    return { success: true };
  } catch (error) {
    log.error('Error resetting journey:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reset',
    };
  }
}
