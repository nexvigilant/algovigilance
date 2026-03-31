'use server';

import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import type { firestore } from 'firebase-admin';

import { logger } from '@/lib/logger';
const log = logger.scope('learn/video-progress-actions');

/**
 * F047: Video progress tracking
 * Store user's video watch progress (0-100%)
 */

interface VideoProgress {
  userId: string;
  courseId: string;
  lessonId: string;
  progressPercent: number; // 0-100
  watchedSeconds: number;
  totalSeconds?: number;
  lastUpdated: firestore.Timestamp;
  completedAt?: firestore.Timestamp;
}

/**
 * Save video progress for a lesson
 */
export async function saveVideoProgress(
  userId: string,
  courseId: string,
  lessonId: string,
  progressPercent: number,
  watchedSeconds: number,
  totalSeconds?: number
): Promise<boolean> {
  try {
    // Create document ID from lesson info
    const docId = `${userId}_${courseId}_${lessonId}`;

    // Determine if video is completed (>90% watched)
    const isCompleted = progressPercent >= 90;

    const videoProgress: VideoProgress = {
      userId,
      courseId,
      lessonId,
      progressPercent,
      watchedSeconds,
      totalSeconds,
      lastUpdated: adminTimestamp.now(),
      ...(isCompleted && { completedAt: adminTimestamp.now() })
    };

    // Save to Firestore
    const progressRef = adminDb.collection('video_progress').doc(docId);
    await progressRef.set(videoProgress, { merge: true });

    return true;
  } catch (error) {
    log.error('[saveVideoProgress] Error saving progress:', error);
    return false;
  }
}

/**
 * Get video progress for a lesson
 */
export async function getVideoProgress(
  userId: string,
  courseId: string,
  lessonId: string
): Promise<VideoProgress | null> {
  try {
    const docId = `${userId}_${courseId}_${lessonId}`;
    const docSnap = await adminDb.collection('video_progress').doc(docId).get();

    if (docSnap.exists) {
      return docSnap.data() as VideoProgress;
    }

    return null;
  } catch (error) {
    log.error('[getVideoProgress] Error fetching progress:', error);
    return null;
  }
}

/**
 * Mark video as completed
 */
export async function markVideoCompleted(
  userId: string,
  courseId: string,
  lessonId: string
): Promise<boolean> {
  try {
    const docId = `${userId}_${courseId}_${lessonId}`;

    await adminDb.collection('video_progress').doc(docId).set(
      {
        userId,
        courseId,
        lessonId,
        progressPercent: 100,
        lastUpdated: adminTimestamp.now(),
        completedAt: adminTimestamp.now()
      },
      { merge: true }
    );

    return true;
  } catch (error) {
    log.error('[markVideoCompleted] Error marking video complete:', error);
    return false;
  }
}
