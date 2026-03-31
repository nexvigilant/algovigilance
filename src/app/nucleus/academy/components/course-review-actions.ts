'use server';

import { logger } from '@/lib/logger';
const log = logger.scope('components/course-review-actions');
import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import type { SerializedTimestamp } from '@/types/academy';

interface SerializedCourseReview {
  id: string;
  courseId: string;
  userId: string;
  userDisplayName: string;
  rating: number;
  comment?: string | null;
  createdAt: SerializedTimestamp;
  updatedAt?: SerializedTimestamp;
  helpfulCount?: number;
}

/**
 * Helper to cast admin Timestamp to serializable format for client compatibility.
 */
interface AdminTimestampLike {
  _seconds?: number;
  seconds?: number;
  _nanoseconds?: number;
  nanoseconds?: number;
}

function serializeAdminTimestamp(ts: AdminTimestampLike): SerializedTimestamp {
  return {
    seconds: ts._seconds ?? ts.seconds ?? 0,
    nanoseconds: ts._nanoseconds ?? ts.nanoseconds ?? 0,
  };
}

/**
 * Get the current user's ID from session cookie.
 * Returns null if not authenticated.
 */
async function getCurrentUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie?.value) {
      return null;
    }

    const parts = sessionCookie.value.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload.user_id || payload.sub || null;
  } catch (error) {
    log.error('[getCurrentUserId] Error parsing session:', error);
    return null;
  }
}

/**
 * Get display name for a user.
 */
async function getUserDisplayName(userId: string): Promise<string> {
  try {
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const data = userDoc.data();
      return data?.displayName || data?.name || 'Anonymous Member';
    }
    return 'Anonymous Member';
  } catch (error) {
    return 'Anonymous Member';
  }
}

/**
 * Fetch reviews for a specific course.
 */
export async function getCourseReviews(courseId: string): Promise<SerializedCourseReview[]> {
  try {
    const reviewsRef = adminDb.collection('course_reviews');
    const q = reviewsRef
      .where('courseId', '==', courseId)
      .orderBy('createdAt', 'desc');

    const snapshot = await q.get();
    const reviews: SerializedCourseReview[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        courseId: data.courseId as string,
        userId: data.userId as string,
        userDisplayName: data.userDisplayName as string,
        rating: data.rating as number,
        comment: data.comment as string | null | undefined,
        helpfulCount: data.helpfulCount as number | undefined,
        createdAt: serializeAdminTimestamp(data.createdAt as AdminTimestampLike),
        updatedAt: data.updatedAt ? serializeAdminTimestamp(data.updatedAt as AdminTimestampLike) : undefined,
      };
    });

    return reviews;
  } catch (error) {
    log.error('[getCourseReviews] Error fetching reviews:', error);
    return [];
  }
}

/**
 * Submit a new course review.
 */
export async function submitCourseReview(params: {
  courseId: string;
  rating: number;
  comment?: string;
}): Promise<SerializedCourseReview | null> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      log.error('[submitCourseReview] No authenticated user');
      return null;
    }

    const userDisplayName = await getUserDisplayName(userId);
    const { courseId, rating, comment } = params;

    const reviewData = {
      userId,
      userDisplayName,
      courseId,
      rating,
      comment: comment?.trim() || null,
      createdAt: adminTimestamp.now(),
      updatedAt: adminTimestamp.now(),
      helpfulCount: 0
    };

    const reviewsRef = adminDb.collection('course_reviews');
    
    // Check if user already reviewed this course
    const existingQ = await reviewsRef
      .where('userId', '==', userId)
      .where('courseId', '==', courseId)
      .get();
      
    if (!existingQ.empty) {
      const docId = existingQ.docs[0].id;
      await reviewsRef.doc(docId).update({
        rating,
        comment: comment?.trim() || null,
        updatedAt: adminTimestamp.now()
      });
      
      const updated = await reviewsRef.doc(docId).get();
      const updatedData = updated.data() ?? {};
      return {
        id: docId,
        courseId: updatedData.courseId as string,
        userId: updatedData.userId as string,
        userDisplayName: updatedData.userDisplayName as string,
        rating: updatedData.rating as number,
        comment: updatedData.comment as string | null | undefined,
        helpfulCount: updatedData.helpfulCount as number | undefined,
        createdAt: serializeAdminTimestamp(updatedData.createdAt as AdminTimestampLike),
        updatedAt: serializeAdminTimestamp(updatedData.updatedAt as AdminTimestampLike),
      };
    }

    const docRef = await reviewsRef.add(reviewData);

    return {
      id: docRef.id,
      courseId: reviewData.courseId,
      userId: reviewData.userId,
      userDisplayName: reviewData.userDisplayName,
      rating: reviewData.rating,
      comment: reviewData.comment,
      helpfulCount: reviewData.helpfulCount,
      createdAt: serializeAdminTimestamp(reviewData.createdAt as AdminTimestampLike),
      updatedAt: serializeAdminTimestamp(reviewData.updatedAt as AdminTimestampLike),
    };
  } catch (error) {
    log.error('[submitCourseReview] Error submitting review:', error);
    return null;
  }
}
