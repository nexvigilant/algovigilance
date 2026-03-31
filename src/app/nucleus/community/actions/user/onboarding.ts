'use server';

import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { updateUserGoals } from './goals';

import { logger } from '@/lib/logger';
const log = logger.scope('user/onboarding');

/**
 * Helper to get authenticated user from session cookie
 */
async function getAuthenticatedUser() {
  const token = (await cookies()).get('nucleus_id_token')?.value;
  if (!token) return null;
  try {
    return await adminAuth.verifyIdToken(token, true);
  } catch (error) {
    return null;
  }
}

/**
 * Onboarding Quiz Response Schema
 */
const OnboardingQuizSchema = z.object({
  currentRole: z.string().optional(),
  targetRole: z.string().optional(),
  experience: z
    .enum(['practitioner', 'transitioning', 'early-career', 'mid-career', 'senior'])
    .optional(),
  interests: z.array(z.string()).min(1, 'Please select at least one interest'),
  goals: z.array(z.enum(['networking', 'learning', 'job-seeking', 'mentoring', 'sharing-knowledge'])).min(1, 'Please select at least one goal'),
  preferredTopics: z.array(z.string()),
  learningStyle: z
    .enum(['visual', 'reading', 'hands-on', 'discussion'])
    .optional(),
});

export type OnboardingQuizData = z.infer<typeof OnboardingQuizSchema>;
export type ExperienceLevel = NonNullable<OnboardingQuizData['experience']>;
export type LearningStyle = NonNullable<OnboardingQuizData['learningStyle']>;

/**
 * Save onboarding quiz response and initialize user's interest profile
 */
export async function saveOnboardingQuiz(data: OnboardingQuizData): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Validate input
    const validated = OnboardingQuizSchema.parse(data);

    // Save quiz response
    const quizRef = adminDb.doc(`users/${user.uid}/onboarding/quiz`);
    await quizRef.set({
      userId: user.uid,
      responses: validated,
      completedAt: FieldValue.serverTimestamp(),
      processed: false, // Will be processed by AI later
    });

    // Initialize interest profile with explicit interests
    const profileRef = adminDb.doc(`users/${user.uid}/profile/interests`);
    const existingProfile = await profileRef.get();

    if (!existingProfile.exists) {
      // Create initial profile based on quiz
      await profileRef.set({
        userId: user.uid,
        interests: validated.interests.map((topic) => ({
          topic,
          confidence: 1.0, // High confidence for explicit selections
          engagementCount: 0,
          firstEngaged: Timestamp.now(),
          lastEngaged: Timestamp.now(),
        })),
        expertise: [],
        careerStage: validated.experience || 'transitioning',
        goals: validated.goals,
        topicsEngagedWith: [
          ...validated.interests,
          ...validated.preferredTopics,
        ],
        preferredCategories: [],
        activityPattern: {
          mostActiveTimeOfDay: 'afternoon',
          mostActiveDays: [],
          avgEngagementPerWeek: 0,
        },
        lastAnalyzed: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } else {
      // Update goals if profile exists
      await updateUserGoals(user.uid, validated.goals);
    }

    return { success: true };
  } catch (error) {
    log.error('Error saving onboarding quiz:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save quiz',
    };
  }
}

/**
 * Check if user has completed onboarding
 */
export async function hasCompletedOnboarding(): Promise<{
  completed: boolean;
  error?: string;
}> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { completed: false, error: 'Not authenticated' };
    }

    const quizRef = adminDb.doc(`users/${user.uid}/onboarding/quiz`);
    const quizDoc = await quizRef.get();

    return { completed: quizDoc.exists };
  } catch (error) {
    log.error('Error checking onboarding status:', error);
    return { completed: false, error: 'Failed to check status' };
  }
}

/**
 * Get user's onboarding quiz responses
 */
export async function getOnboardingQuiz(): Promise<{
  success: boolean;
  quiz?: {
    responses: OnboardingQuizData;
    completedAt: Timestamp;
  };
  error?: string;
}> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const quizRef = adminDb.doc(`users/${user.uid}/onboarding/quiz`);
    const quizDoc = await quizRef.get();

    if (!quizDoc.exists) {
      return { success: false, error: 'Quiz not found' };
    }

    const data = quizDoc.data();
    return {
      success: true,
      quiz: {
        responses: data?.responses,
        completedAt: data?.completedAt,
      },
    };
  } catch (error) {
    log.error('Error fetching onboarding quiz:', error);
    return { success: false, error: 'Failed to fetch quiz' };
  }
}
