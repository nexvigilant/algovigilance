'use server';

import { adminDb } from '@/lib/firebase-admin';
import type { Course, Enrollment, Certificate } from '@/types/academy';
import { serializeTimestamp } from '@/types/academy';

import { logger } from '@/lib/logger';
const log = logger.scope('academy/actions');

/**
 * Fetch all published courses
 *
 * NOTE: Queries both 'status' and 'academyStatus' fields for backward compatibility
 * Course Builder should use 'status' field (not 'academyStatus') to match documented schema
 */
export async function getPublishedCourses(): Promise<Course[]> {
  try {
    log.debug('🔍 [getPublishedCourses] Starting query...');

    // Simple query without orderBy to avoid index requirements
    // Get all courses and filter/sort in-memory
    try {
      log.debug('📋 [getPublishedCourses] Fetching all courses (no index required)...');
      const coursesSnapshot = await adminDb.collection('courses').get();
      log.debug(`📊 [getPublishedCourses] Query returned ${coursesSnapshot.size} total documents`);

      const allCourses = coursesSnapshot.docs.map(doc => {
        const data = doc.data();

        return {
          id: doc.id,
          ...data,
          // Serialize Firestore Timestamps to plain objects for Client Components
          createdAt: serializeTimestamp(data.createdAt),
          updatedAt: serializeTimestamp(data.updatedAt),
          publishedAt: serializeTimestamp(data.publishedAt),
        };
      }) as Course[];

      // Filter for published courses with correct visibility
      const publishedCourses = allCourses.filter(course => {
        const isPublished = course.isPublished === true ||
                          course.status === 'published' ||
                          course.academyStatus === 'published';
        const hasVisibility = course.visibility === 'public' || course.visibility === 'internal';

        log.debug(`📄 [getPublishedCourses] ${course.id}: isPublished=${isPublished}, visibility=${course.visibility}`);

        return isPublished && hasVisibility;
      });

      // Sort by createdAt in-memory
      publishedCourses.sort((a, b) => {
        // Handle both Timestamp objects and serialized timestamps
        const aTime = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0;
        const bTime = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0;
        return bTime - aTime; // Descending order
      });

      log.debug(`✅ [getPublishedCourses] Returning ${publishedCourses.length} published courses`);
      return publishedCourses;
    } catch (e) {
      log.debug('❌ [getPublishedCourses] Query failed:', e);
      return [];
    }
  } catch (error) {
    log.error('Error fetching courses:', error);
    return [];
  }
}

/**
 * Fetch a single course by ID
 */
export async function getCourseById(courseId: string): Promise<Course | null> {
  try {
    const courseDoc = await adminDb.collection('courses').doc(courseId).get();

    if (!courseDoc.exists) {
      return null;
    }

    const data = courseDoc.data();

    // Defensive check: ensure data exists
    if (!data) {
      log.error('[getCourseById] Course document exists but has no data');
      return null;
    }

    return {
      id: courseDoc.id,
      ...data,
      createdAt: serializeTimestamp(data.createdAt),
      updatedAt: serializeTimestamp(data.updatedAt),
      publishedAt: serializeTimestamp(data.publishedAt),
    } as Course;
  } catch (error) {
    // Defensive error logging - handle cases where error object has unexpected structure
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error('[getCourseById] Error fetching course:', errorMessage);
    return null;
  }
}

/**
 * Get user's enrollment for a specific course
 */
export async function getUserEnrollment(
  userId: string,
  courseId: string
): Promise<Enrollment | null> {
  try {
    const snapshot = await adminDb
      .collection('enrollments')
      .where('userId', '==', userId)
      .where('courseId', '==', courseId)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const enrollmentDoc = snapshot.docs[0];
    const data = enrollmentDoc.data();

    // Defensive check: ensure data exists
    if (!data) {
      log.error('[getUserEnrollment] Enrollment document exists but has no data');
      return null;
    }

    return {
      id: enrollmentDoc.id,
      ...data,
      enrolledAt: serializeTimestamp(data.enrolledAt),
      lastAccessedAt: serializeTimestamp(data.lastAccessedAt),
      completedAt: serializeTimestamp(data.completedAt),
    } as Enrollment;
  } catch (error) {
    // Defensive error logging - handle cases where error object has unexpected structure
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error('[getUserEnrollment] Error fetching enrollment:', errorMessage);
    // Return null instead of throwing - page will handle gracefully
    return null;
  }
}

/**
 * Get all enrollments for a user
 */
export async function getUserEnrollments(userId: string): Promise<Enrollment[]> {
  try {
    const snapshot = await adminDb
      .collection('enrollments')
      .where('userId', '==', userId)
      .orderBy('lastAccessedAt', 'desc')
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        enrolledAt: serializeTimestamp(data.enrolledAt),
        lastAccessedAt: serializeTimestamp(data.lastAccessedAt),
        completedAt: serializeTimestamp(data.completedAt),
      };
    }) as Enrollment[];
  } catch (error) {
    log.error('Error fetching enrollments:', error);
    return [];
  }
}

/**
 * Get all certificates for a user
 */
export async function getCertificates(userId: string): Promise<Certificate[]> {
  try {
    const snapshot = await adminDb
      .collection('certificates')
      .where('userId', '==', userId)
      .where('isRevoked', '==', false)
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        issuedAt: serializeTimestamp(data.issuedAt),
        expiresAt: serializeTimestamp(data.expiresAt),
      } as Certificate;
    });
  } catch (error) {
    log.error('Error fetching certificates:', error);
    return [];
  }
}

/**
 * Fetch user info by userId for instructor display (F011)
 * Returns name, avatar, and bio from user profile
 * Uses Admin SDK for server-side access (Server Actions don't have client auth)
 */
export async function getUserInfo(userId: string): Promise<{
  name?: string;
  avatar?: string;
  email?: string;
} | null> {
  try {
    const userDoc = await adminDb.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      log.debug(`[getUserInfo] User ${userId} not found`);
      return null;
    }

    const data = userDoc.data();
    if (!data) {
      log.error('[getUserInfo] User document exists but has no data');
      return null;
    }

    return {
      name: data.displayName || data.name || undefined,
      avatar: data.photoURL || data.avatar || undefined,
      email: data.email || undefined,
    };
  } catch (error) {
    // Defensive error logging
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error(`[getUserInfo] Error fetching user ${userId}:`, errorMessage);
    return null;
  }
}
