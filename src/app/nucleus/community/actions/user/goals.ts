'use server';

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

import { logger } from '@/lib/logger';
const log = logger.scope('user/goals');

/**
 * Valid goal types for user profiles
 */
export type UserGoal = 'networking' | 'learning' | 'job-seeking' | 'mentoring' | 'sharing-knowledge';

/**
 * Update user goals (set manually or from onboarding)
 */
export async function updateUserGoals(
  userId: string,
  goals: UserGoal[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const profileRef = adminDb.doc(`users/${userId}/profile/interests`);
    await profileRef.update({
      goals,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    log.error('Error updating user goals:', error);
    return { success: false, error: 'Failed to update goals' };
  }
}
