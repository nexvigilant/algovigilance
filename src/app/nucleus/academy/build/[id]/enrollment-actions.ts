'use server';

import { adminDb, adminTimestamp, adminFieldValue } from '@/lib/firebase-admin';
import type { Timestamp as ClientTimestamp } from 'firebase/firestore';
import type { Enrollment, EnrollmentSerialized } from '@/types/academy';
import { serializeTimestamp } from '@/types/academy';
import { checkMilestone, getMilestoneInfo, type Milestone, type MilestoneInfo } from '@/lib/academy/progress-milestones';

import { logger } from '@/lib/logger';
const log = logger.scope('learn/enrollment-actions');

export type { Milestone, MilestoneInfo };

// Cast Admin SDK Timestamp to client Timestamp type (compatible at runtime)
const now = () => adminTimestamp.now() as unknown as ClientTimestamp;

/**
 * Create a new enrollment for a user in a course.
 * Returns serialized enrollment data safe for client-server communication.
 */
export async function createEnrollment(
  userId: string,
  courseId: string
): Promise<EnrollmentSerialized | null> {
  try {
    log.debug(`[createEnrollment] Starting enrollment for user: ${userId}, course: ${courseId}`);

    // DEVELOPMENT BYPASS: Create mock enrollment in dev mode
    if (process.env.NODE_ENV === 'development') {
      log.debug('[DEV MODE] Creating mock enrollment for testing');
      const timestamp = now();
      const serializedNow = serializeTimestamp(timestamp);
      if (!serializedNow) {
        throw new Error('Failed to serialize timestamp for dev mock enrollment');
      }
      return {
        id: 'dev-mock-enrollment-' + Date.now(),
        userId,
        courseId,
        status: 'in-progress',
        progress: 0,
        currentModuleIndex: 0,
        currentLessonIndex: 0,
        completedLessons: [],
        enrolledAt: serializedNow,
        lastAccessedAt: serializedNow,
        quizScores: []
      };
    }

    // Check if enrollment already exists
    log.debug(`[createEnrollment] Checking for existing enrollment...`);
    const existingEnrollment = await adminDb
      .collection('enrollments')
      .where('userId', '==', userId)
      .where('courseId', '==', courseId)
      .get();

    if (!existingEnrollment.empty) {
      // Return existing enrollment
      log.debug(`[createEnrollment] Found existing enrollment`);
      const existingDoc = existingEnrollment.docs[0];
      const data = existingDoc.data();
      const fallbackTs = serializeTimestamp(now());
      if (!fallbackTs) {
        throw new Error('Failed to serialize timestamp for existing enrollment');
      }

      return {
        id: existingDoc.id,
        userId: data.userId,
        courseId: data.courseId,
        status: data.status || 'in-progress',
        progress: data.progress || 0,
        currentModuleIndex: data.currentModuleIndex || 0,
        currentLessonIndex: data.currentLessonIndex || 0,
        completedLessons: data.completedLessons || [],
        enrolledAt: serializeTimestamp(data.enrolledAt) ?? fallbackTs,
        lastAccessedAt: serializeTimestamp(data.lastAccessedAt) ?? fallbackTs,
        startedAt: serializeTimestamp(data.startedAt),
        completedAt: serializeTimestamp(data.completedAt),
        quizScores: data.quizScores || [],
      };
    }

    // Create new enrollment
    log.debug(`[createEnrollment] Creating new enrollment...`);
    const timestamp = now();
    const enrollmentData = {
      userId,
      courseId,
      status: 'in-progress' as const,
      progress: 0,
      currentModuleIndex: 0,
      currentLessonIndex: 0,
      completedLessons: [] as string[],
      enrolledAt: timestamp,
      lastAccessedAt: timestamp,
      quizScores: [] as Array<{ lessonId: string; score: number; maxScore: number; attemptDate: unknown }>
    };

    log.debug(`[createEnrollment] Writing to Firestore...`);
    const docRef = await adminDb.collection('enrollments').add(enrollmentData);
    log.debug(`[createEnrollment] Enrollment created successfully: ${docRef.id}`);

    // Return serialized enrollment
    const serializedNow = serializeTimestamp(timestamp);
    if (!serializedNow) {
      throw new Error('Failed to serialize timestamp for new enrollment');
    }
    return {
      id: docRef.id,
      userId,
      courseId,
      status: 'in-progress',
      progress: 0,
      currentModuleIndex: 0,
      currentLessonIndex: 0,
      completedLessons: [],
      enrolledAt: serializedNow,
      lastAccessedAt: serializedNow,
      quizScores: [],
    };
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    log.error(`[createEnrollment] Error creating enrollment:`, error);
    log.error(`[createEnrollment] Error code: ${err?.code}`);
    log.error(`[createEnrollment] Error message: ${err?.message}`);
    return null;
  }
}

/**
 * Result of completing a lesson, including milestone info if one was crossed
 */
export interface CompleteLessonResult {
  success: boolean;
  newProgress: number;
  milestone: MilestoneInfo | null;
  isCourseCompleted: boolean;
}

/**
 * Update enrollment progress when a lesson is completed
 * Uses Firestore transaction to prevent race conditions with updateCurrentPosition
 * Returns milestone info if a milestone was crossed (25%, 50%, 75%, 100%)
 */
export async function completeLesson(
  enrollmentId: string,
  lessonId: string,
  totalLessons: number,
  userId: string,
  courseId?: string
): Promise<CompleteLessonResult> {
  try {
    log.debug(`[completeLesson] Starting for enrollment: ${enrollmentId}, lesson: ${lessonId}`);

    // DEVELOPMENT BYPASS: Skip database write for mock enrollment
    if (process.env.NODE_ENV === 'development' && enrollmentId.startsWith('dev-mock-enrollment')) {
      log.debug('[DEV MODE] Bypassing completion write for mock enrollment');
      return { success: true, newProgress: 0, milestone: null, isCourseCompleted: false };
    }

    const enrollmentRef = adminDb.collection('enrollments').doc(enrollmentId);
    let isCourseCompleted = false;
    let previousProgress = 0;
    let newProgress = 0;

    // Use transaction to prevent race conditions
    await adminDb.runTransaction(async (transaction) => {
      // Read current enrollment state
      const enrollmentDoc = await transaction.get(enrollmentRef);

      if (!enrollmentDoc.exists) {
        throw new Error('Enrollment not found');
      }

      const enrollment = enrollmentDoc.data() as Enrollment;

      // Verify ownership
      if (enrollment.userId !== userId) {
        throw new Error('Unauthorized: User does not own this enrollment');
      }

      const completedLessons = enrollment.completedLessons || [];
      previousProgress = enrollment.progress || 0;

      // Check if lesson already completed
      if (completedLessons.includes(lessonId)) {
        log.debug('[completeLesson] Lesson already completed');
        newProgress = previousProgress;
        return; // Already completed, nothing to update
      }

      // Calculate new progress - protect against division by zero
      const newCompletedCount = completedLessons.length + 1;
      newProgress = totalLessons > 0
        ? (newCompletedCount / totalLessons) * 100
        : 0;
      isCourseCompleted = newProgress >= 100;

      log.debug(`[completeLesson] Updating progress: ${previousProgress}% -> ${newProgress}%`);

      // Build update data
      const updateData: Record<string, unknown> = {
        completedLessons: adminFieldValue.arrayUnion(lessonId),
        progress: newProgress,
        lastAccessedAt: now(),
      };

      if (isCourseCompleted) {
        updateData.status = 'completed';
        updateData.completedAt = now();
      }

      // Atomic update within transaction
      transaction.update(enrollmentRef, updateData);
    });

    log.debug('[completeLesson] Enrollment updated successfully');

    // Check for milestone crossing
    const milestoneCrossed = checkMilestone(previousProgress, newProgress);
    const milestoneInfo = milestoneCrossed ? getMilestoneInfo(milestoneCrossed) : null;

    if (milestoneInfo) {
      log.debug(`[completeLesson] Milestone crossed: ${milestoneInfo.milestone}%`);
    }

    // Generate certificate if course is completed
    // This happens outside the transaction to avoid blocking
    if (isCourseCompleted && userId && courseId) {
      try {
        const { generateCertificate } = await import('../../verifications/actions');
        await generateCertificate(userId, courseId);
      } catch (certError) {
        // Log error but don't fail lesson completion if certificate generation fails
        log.error('Certificate generation failed, will retry later:', certError);
        // Lesson completion still succeeds - certificate can be generated later
      }
    }

    return {
      success: true,
      newProgress,
      milestone: milestoneInfo,
      isCourseCompleted,
    };
  } catch (error) {
    log.error('[completeLesson] Error completing lesson:', error);
    return { success: false, newProgress: 0, milestone: null, isCourseCompleted: false };
  }
}

/**
 * Update current position in course
 * Uses Firestore transaction to prevent race conditions with completeLesson
 */
export async function updateCurrentPosition(
  enrollmentId: string,
  moduleIndex: number,
  lessonIndex: number,
  userId: string
): Promise<boolean> {
  try {
    // DEVELOPMENT BYPASS: Skip database write for mock enrollment
    if (process.env.NODE_ENV === 'development' && enrollmentId.startsWith('dev-mock-enrollment')) {
      log.debug('[DEV MODE] Bypassing position update for mock enrollment');
      return true;
    }

    const enrollmentRef = adminDb.collection('enrollments').doc(enrollmentId);

    // Use transaction to prevent race conditions
    await adminDb.runTransaction(async (transaction) => {
      // Read current enrollment state
      const enrollmentDoc = await transaction.get(enrollmentRef);

      if (!enrollmentDoc.exists) {
        throw new Error('Enrollment not found');
      }

      const enrollment = enrollmentDoc.data() as Enrollment;

      // Verify ownership
      if (enrollment.userId !== userId) {
        throw new Error('Unauthorized: User does not own this enrollment');
      }

      // Atomic update within transaction
      transaction.update(enrollmentRef, {
        currentModuleIndex: moduleIndex,
        currentLessonIndex: lessonIndex,
        lastAccessedAt: now()
      });
    });

    return true;
  } catch (error) {
    log.error('Error updating position:', error);
    return false;
  }
}
