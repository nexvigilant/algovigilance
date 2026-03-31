'use server';

import type { Course } from '@/types/academy';
import { requireAdmin } from '@/lib/admin-auth';
import { adminDb as db, adminFieldValue } from '@/lib/firebase-admin';

import { logger } from '@/lib/logger';
const log = logger.scope('academy/admin-actions');

/**
 * Delete a course using Admin SDK (bypasses security rules)
 * This is safe because the admin check happens client-side in the protected route
 */
export async function deleteCourseAdmin(
  courseId: string
): Promise<{ success: boolean; error?: string; enrollmentCount?: number }> {
  try {
    await requireAdmin();
    log.debug(`[deleteCourseAdmin] Attempting to delete course: ${courseId}`);

    // Check for active enrollments first
    const enrollmentsSnapshot = await db
      .collection('enrollments')
      .where('courseId', '==', courseId)
      .get();

    const enrollmentCount = enrollmentsSnapshot.size;

    if (enrollmentCount > 0) {
      return {
        success: false,
        error: `Cannot delete course with ${enrollmentCount} active enrollment(s). Archive instead.`,
        enrollmentCount,
      };
    }

    // Delete the course using Admin SDK (bypasses security rules)
    await db.collection('courses').doc(courseId).delete();

    log.debug(`[deleteCourseAdmin] Course ${courseId} deleted successfully`);
    return { success: true };
  } catch (error) {
    log.error('[deleteCourseAdmin] Error deleting course:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete course. Please check server logs.'
    };
  }
}

/**
 * Update course status using Admin SDK
 */
export async function updateCourseStatusAdmin(
  courseId: string,
  newStatus: 'draft' | 'published' | 'archived'
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const updateData: Record<string, unknown> = {
      status: newStatus,
      updatedAt: adminFieldValue.serverTimestamp(),
    };

    // Set publishedAt timestamp when publishing
    if (newStatus === 'published') {
      updateData.publishedAt = adminFieldValue.serverTimestamp();
      updateData.isPublished = true; // Legacy field compatibility
    } else if (newStatus === 'draft' || newStatus === 'archived') {
      updateData.isPublished = false;
    }

    await db.collection('courses').doc(courseId).update(updateData);

    log.debug(`[updateCourseStatusAdmin] Course ${courseId} status updated to ${newStatus}`);
    return { success: true };
  } catch (error) {
    log.error('[updateCourseStatusAdmin] Error updating course status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update course status'
    };
  }
}

/**
 * Get all courses using Admin SDK
 */
export async function getAllCoursesAdmin(): Promise<Course[]> {
  try {
    await requireAdmin();
    const coursesSnapshot = await db.collection('courses').get();

    const courses = coursesSnapshot.docs.map(doc => {
      const data = doc.data();
      // Convert Firestore Timestamps to plain objects for serialization
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? {
          seconds: data.createdAt.seconds || data.createdAt._seconds,
          nanoseconds: data.createdAt.nanoseconds || data.createdAt._nanoseconds,
          toMillis: () => (data.createdAt.seconds || data.createdAt._seconds || 0) * 1000
        } : null,
        updatedAt: data.updatedAt ? {
          seconds: data.updatedAt.seconds || data.updatedAt._seconds,
          nanoseconds: data.updatedAt.nanoseconds || data.updatedAt._nanoseconds,
          toMillis: () => (data.updatedAt.seconds || data.updatedAt._seconds || 0) * 1000
        } : null,
        publishedAt: data.publishedAt ? {
          seconds: data.publishedAt.seconds || data.publishedAt._seconds,
          nanoseconds: data.publishedAt.nanoseconds || data.publishedAt._nanoseconds,
          toMillis: () => (data.publishedAt.seconds || data.publishedAt._seconds || 0) * 1000
        } : null,
      };
    }) as Course[];

    // Sort by creation date (newest first)
    courses.sort((a, b) => {
      const aTime = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0;
      const bTime = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0;
      return bTime - aTime;
    });

    // Return serializable plain objects
    return JSON.parse(JSON.stringify(courses));
  } catch (error) {
    log.error('[getAllCoursesAdmin] Error fetching courses:', error);
    return [];
  }
}
