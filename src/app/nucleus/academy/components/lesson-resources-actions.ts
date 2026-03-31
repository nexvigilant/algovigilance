'use server';

import { adminDb, adminFieldValue } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

import { logger } from '@/lib/logger';
const log = logger.scope('components/lesson-resources-actions');

/**
 * Increment download count for a lesson resource
 *
 * Uses a separate 'resource_downloads' collection to track download counts
 * This allows regular users to increment counts without needing admin permissions
 *
 * @param courseId - ID of the course containing the lesson
 * @param lessonId - ID of the lesson containing the resource
 * @param resourceId - ID of the resource to increment
 * @returns Updated download count or null if failed
 */
export async function incrementResourceDownloadCount(
  courseId: string,
  lessonId: string,
  resourceId: string
): Promise<number | null> {
  try {
    // Get current user from session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      log.error('[incrementResourceDownloadCount] No session found');
      return null;
    }

    // Create a composite ID for the download tracking document
    const downloadDocId = `${courseId}_${lessonId}_${resourceId}`;
    const downloadRef = adminDb.collection('resource_downloads').doc(downloadDocId);

    // Use a transaction to safely increment the counter
    const newCount = await adminDb.runTransaction(async (transaction) => {
      const downloadDoc = await transaction.get(downloadRef);

      if (!downloadDoc.exists) {
        // Create new download tracking document
        transaction.set(downloadRef, {
          courseId,
          lessonId,
          resourceId,
          downloadCount: 1,
          firstDownload: new Date(),
          lastDownload: new Date(),
        });
        return 1;
      } else {
        // Increment existing counter
        const currentCount = downloadDoc.data()?.downloadCount || 0;
        const newCount = currentCount + 1;

        transaction.update(downloadRef, {
          downloadCount: adminFieldValue.increment(1),
          lastDownload: new Date(),
        });

        return newCount;
      }
    });

    log.debug('✅ [incrementResourceDownloadCount] Download count incremented:', {
      courseId,
      lessonId,
      resourceId,
      newCount
    });

    return newCount;
  } catch (error) {
    log.error('[incrementResourceDownloadCount] Error:', error);
    // Return null to indicate failure, but don't block the download
    return null;
  }
}

/**
 * Get download count for a resource
 *
 * @param courseId - ID of the course
 * @param lessonId - ID of the lesson
 * @param resourceId - ID of the resource
 * @returns Current download count or 0
 */
export async function getResourceDownloadCount(
  courseId: string,
  lessonId: string,
  resourceId: string
): Promise<number> {
  try {
    const downloadDocId = `${courseId}_${lessonId}_${resourceId}`;
    const downloadRef = adminDb.collection('resource_downloads').doc(downloadDocId);
    const downloadDoc = await downloadRef.get();

    if (!downloadDoc.exists) {
      return 0;
    }

    return downloadDoc.data()?.downloadCount || 0;
  } catch (error) {
    log.error('[getResourceDownloadCount] Error:', error);
    return 0;
  }
}