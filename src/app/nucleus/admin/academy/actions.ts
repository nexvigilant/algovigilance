'use server';

import { toDate } from '@/lib/utils';
import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import type { DashboardStats, CourseAnalytics, Course, SerializedTimestamp } from '@/types/academy';
import { requireAdmin } from '@/lib/admin-auth';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('academy/actions');

/** Firestore document shape for courses (subset used in dashboard stats) */
interface CourseDoc {
  id: string;
  status?: 'draft' | 'published' | 'archived';
}

/** Firestore document shape for enrollments (subset used in dashboard stats) */
interface EnrollmentDoc {
  id: string;
  userId?: string;
  courseId?: string;
  status?: string;
  progress?: number;
  enrolledAt?: { toDate?: () => Date };
  completedAt?: { toDate?: () => Date };
  lastAccessedAt?: { toDate?: () => Date };
  quizScores?: Array<{ score: number; attempts: number }>;
}

/** Plain timestamp from a Date — safe for server-to-client serialization. */
function toPlainTimestamp(date: Date): SerializedTimestamp {
  return { seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 };
}

/** Current time as a plain serializable timestamp. */
function nowPlainTimestamp(): SerializedTimestamp {
  return toPlainTimestamp(new Date());
}

/**
 * Log admin action to audit trail
 */
async function logAdminAction(
  action: {
    actionType: string;
    targetType: 'course';
    targetId: string;
    details?: Record<string, unknown>;
  },
  adminId: string
): Promise<void> {
  try {
    await adminDb.collection('admin_actions').add({
      ...action,
      performedBy: adminId,
      createdAt: adminTimestamp.now(),
    });
  } catch (error) {
    log.error('[logAdminAction] Failed to log admin action:', error);
    // Don't throw - audit logging failure shouldn't break the operation
  }
}


/**
 * Get dashboard statistics for admin overview
 * SECURITY: Requires admin role
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  // SECURITY: Verify admin role
  try {
    await requireAdmin();
  } catch {
    log.debug('[getDashboardStats] No authenticated admin, returning default stats');
    return {
      totalCourses: 0,
      publishedCourses: 0,
      draftCourses: 0,
      archivedCourses: 0,
      totalStudents: 0,
      activeStudents: 0,
      totalEnrollments: 0,
      certificatesIssued: 0,
      averageCompletionRate: 0,
      enrollmentsLast7Days: 0,
      completionsLast7Days: 0,
      topCourses: [],
      topStudents: [],
      calculatedAt: nowPlainTimestamp(),
    };
  }

  try {
    // Fetch all courses, enrollments, and certificates in parallel
    const [coursesSnapshot, enrollmentsSnapshot, certificatesSnapshot] = await Promise.all([
      adminDb.collection('courses').get(),
      adminDb.collection('enrollments').get(),
      adminDb.collection('certificates').get(),
    ]);

    const courses: CourseDoc[] = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CourseDoc));

    // Count by status
    const totalCourses = courses.length;
    const publishedCourses = courses.filter(c => c.status === 'published').length;
    const draftCourses = courses.filter(c => c.status === 'draft').length;
    const archivedCourses = courses.filter(c => c.status === 'archived').length;

    const enrollments: EnrollmentDoc[] = enrollmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EnrollmentDoc));

    const totalEnrollments = enrollments.length;

    // Count unique students
    const uniqueStudents = new Set(enrollments.map(e => e.userId));
    const totalStudents = uniqueStudents.size;

    // Calculate active students (accessed in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeStudents = enrollments.filter(e => {
      const lastAccessed = toDateFromSerialized(e.lastAccessedAt) || new Date(0);
      return lastAccessed > thirtyDaysAgo;
    }).map(e => e.userId);

    const uniqueActiveStudents = new Set(activeStudents).size;

    // Calculate recent enrollments (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const enrollmentsLast7Days = enrollments.filter(e => {
      const enrolledAt = toDateFromSerialized(e.enrolledAt) || new Date(0);
      return enrolledAt > sevenDaysAgo;
    }).length;

    // Calculate completions last 7 days
    const completionsLast7Days = enrollments.filter(e => {
      const completedAt = toDateFromSerialized(e.completedAt);
      return completedAt && completedAt > sevenDaysAgo;
    }).length;

    const certificatesIssued = certificatesSnapshot.size;

    // Calculate average completion rate
    const completedEnrollments = enrollments.filter(e => e.status === 'completed').length;
    const averageCompletionRate = totalEnrollments > 0
      ? (completedEnrollments / totalEnrollments) * 100
      : 0;

    // Calculate top courses by enrollment count
    const courseEnrollmentCounts = new Map<string, number>();
    enrollments.forEach(e => {
      const courseId = e.courseId || '';
      const count = courseEnrollmentCounts.get(courseId) || 0;
      courseEnrollmentCounts.set(courseId, count + 1);
    });

    const topCourses = Array.from(courseEnrollmentCounts.entries())
      .map(([courseId, enrollmentCount]) => ({ courseId, enrollments: enrollmentCount }))
      .sort((a, b) => b.enrollments - a.enrollments)
      .slice(0, 10);

    // Calculate top students by courses completed
    const studentCompletionCounts = new Map<string, number>();
    enrollments.filter(e => e.status === 'completed').forEach(e => {
      const userId = e.userId || '';
      const count = studentCompletionCounts.get(userId) || 0;
      studentCompletionCounts.set(userId, count + 1);
    });

    const topStudents = Array.from(studentCompletionCounts.entries())
      .map(([userId, coursesCompleted]) => ({ userId, coursesCompleted }))
      .sort((a, b) => b.coursesCompleted - a.coursesCompleted)
      .slice(0, 10);

    return {
      totalCourses,
      publishedCourses,
      draftCourses,
      archivedCourses,

      totalStudents,
      activeStudents: uniqueActiveStudents,
      totalEnrollments,

      certificatesIssued,
      averageCompletionRate,

      enrollmentsLast7Days,
      completionsLast7Days,

      topCourses,
      topStudents,

      calculatedAt: nowPlainTimestamp(),
    };
  } catch (error) {
    log.error('[getDashboardStats] Error calculating dashboard stats:', error);

    // Return default stats on error
    return {
      totalCourses: 0,
      publishedCourses: 0,
      draftCourses: 0,
      archivedCourses: 0,
      totalStudents: 0,
      activeStudents: 0,
      totalEnrollments: 0,
      certificatesIssued: 0,
      averageCompletionRate: 0,
      enrollmentsLast7Days: 0,
      completionsLast7Days: 0,
      topCourses: [],
      topStudents: [],
      calculatedAt: nowPlainTimestamp(),
    };
  }
}

/**
 * Get detailed course analytics
 * SECURITY: Requires admin role
 */
export async function getCourseAnalytics(
  courseId: string,
  periodDays: number = 30
): Promise<{ success: boolean; analytics?: CourseAnalytics; error?: string }> {
  // SECURITY: Verify admin role
  try {
    await requireAdmin();
  } catch {
    log.error('[getCourseAnalytics] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - periodDays);

    // Fetch all enrollments for this course
    const enrollmentsSnapshot = await adminDb
      .collection('enrollments')
      .where('courseId', '==', courseId)
      .get();
    const enrollments: EnrollmentDoc[] = enrollmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EnrollmentDoc));

    const totalEnrollments = enrollments.length;

    // Active students (accessed in period)
    const activeStudents = enrollments.filter(e => {
      const lastAccessed = toDateFromSerialized(e.lastAccessedAt) || new Date(0);
      return lastAccessed > periodStart;
    }).length;

    // New enrollments in period
    const newEnrollments = enrollments.filter(e => {
      const enrolledAt = toDateFromSerialized(e.enrolledAt) || new Date(0);
      return enrolledAt > periodStart;
    }).length;

    // Completions in period
    const completions = enrollments.filter(e => {
      const completedAt = toDateFromSerialized(e.completedAt);
      return completedAt && completedAt > periodStart;
    }).length;

    // Dropouts (no access in last 60 days, progress < 100%)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const dropouts = enrollments.filter(e => {
      const lastAccessed = toDateFromSerialized(e.lastAccessedAt) || new Date(0);
      return lastAccessed < sixtyDaysAgo && (e.progress || 0) < 100;
    }).length;

    // Completion rate
    const completionRate = totalEnrollments > 0
      ? (enrollments.filter(e => e.status === 'completed').length / totalEnrollments) * 100
      : 0;

    // Average completion time (days)
    const completedEnrollments = enrollments.filter(e => e.status === 'completed');
    const completionTimes = completedEnrollments.map(e => {
      const enrolled = toDate(e.enrolledAt);
      const completed = toDate(e.completedAt);
      return (completed.getTime() - enrolled.getTime()) / (1000 * 60 * 60 * 24); // days
    });
    const averageCompletionTime = completionTimes.length > 0
      ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
      : 0;

    // Average progress
    const averageProgress = totalEnrollments > 0
      ? enrollments.reduce((sum: number, e) => sum + (e.progress || 0), 0) / totalEnrollments
      : 0;

    // Calculate quiz metrics
    let totalQuizScores = 0;
    let totalQuizAttempts = 0;
    let passedQuizzes = 0;
    let retriedQuizzes = 0;

    enrollments.forEach(e => {
      if (e.quizScores && Array.isArray(e.quizScores)) {
        e.quizScores.forEach(quiz => {
          totalQuizScores += quiz.score || 0;
          totalQuizAttempts++;
          if (quiz.score >= 70) passedQuizzes++;
          if (quiz.attempts > 1) retriedQuizzes++;
        });
      }
    });

    const averageQuizScore = totalQuizAttempts > 0 ? totalQuizScores / totalQuizAttempts : 0;
    const quizPassRate = totalQuizAttempts > 0 ? (passedQuizzes / totalQuizAttempts) * 100 : 0;
    const quizRetakeRate = totalQuizAttempts > 0 ? (retriedQuizzes / totalQuizAttempts) * 100 : 0;

    const analytics: CourseAnalytics = {
      courseId,
      periodStart: toPlainTimestamp(periodStart),
      periodEnd: nowPlainTimestamp(),

      totalEnrollments,
      activeStudents,
      newEnrollments,
      completions,
      dropouts,

      completionRate,
      averageCompletionTime,
      averageProgress,

      totalTimeSpent: 0, // BACKLOG: Time tracking requires client-side telemetry hooks (see lesson-player, video-player components)
      averageTimePerStudent: 0,
      averageLessonsCompleted: 0,

      averageQuizScore,
      quizPassRate,
      quizRetakeRate,

      videoCompletionRate: 0, // BACKLOG: Video tracking requires client-side telemetry hooks (see video-player component)
      averageVideoWatchPercentage: 0,

      certificatesIssued: completions, // Assumes 1:1 completion to certificate

      mostViewedLessons: [],
      highestRatedLessons: [],

      calculatedAt: nowPlainTimestamp(),
    };

    return { success: true, analytics };
  } catch (error) {
    log.error('[getCourseAnalytics] Error calculating course analytics:', error);
    return { success: false, error: 'Failed to calculate analytics' };
  }
}

/**
 * Get ALL courses for admin (includes drafts, published, archived)
 * SECURITY: Requires admin role
 */
export async function getAllCoursesForAdmin(): Promise<Course[]> {
  // SECURITY: Verify admin role (handles auth check internally)
  try {
    await requireAdmin();
  } catch {
    log.error('[getAllCoursesForAdmin] Unauthorized access attempt');
    // Return empty array instead of throwing - better UX for client
    return [];
  }

  try {
    const coursesSnapshot = await adminDb.collection('courses').get();

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
    log.error('[getAllCoursesForAdmin] Error fetching courses:', error);
    return [];
  }
}

/**
 * Update course status (draft → published, published → archived, etc.)
 * SECURITY: Requires admin role
 */
export async function updateCourseStatus(
  courseId: string,
  newStatus: 'draft' | 'published' | 'archived'
): Promise<{ success: boolean; error?: string }> {
  // SECURITY: Verify admin role server-side
  let adminId: string;
  try {
    const admin = await requireAdmin();
    adminId = admin.uid;
  } catch {
    log.error('[updateCourseStatus] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    const courseRef = adminDb.collection('courses').doc(courseId);
    const updateData: Record<string, unknown> = {
      status: newStatus,
      updatedAt: adminTimestamp.now(),
    };

    // Set publishedAt timestamp when publishing
    if (newStatus === 'published') {
      updateData.publishedAt = adminTimestamp.now();
      updateData.isPublished = true; // Legacy field compatibility
    } else if (newStatus === 'draft' || newStatus === 'archived') {
      updateData.isPublished = false;
    }

    await courseRef.update(updateData);

    // Audit log
    await logAdminAction({
      actionType: 'course_status_change',
      targetType: 'course',
      targetId: courseId,
      details: { newStatus, previousStatus: 'unknown' },
    }, adminId);

    log.debug(`[updateCourseStatus] Course ${courseId} status updated to ${newStatus}`);
    return { success: true };
  } catch (error) {
    log.error('[updateCourseStatus] Error updating course status:', error);

    // Check if it's a permission error
    const fbError = error as { code?: string; message?: string };
    if (fbError.code === 'permission-denied') {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    return { success: false, error: fbError.message || 'Failed to update course status' };
  }
}

/**
 * Update course metadata (title, description, etc.)
 * SECURITY: Requires admin role
 */
export async function updateCourse(
  courseId: string,
  updates: Partial<Course>
): Promise<{ success: boolean; error?: string }> {
  // SECURITY: Verify admin role server-side
  let adminId: string;
  try {
    const admin = await requireAdmin();
    adminId = admin.uid;
  } catch {
    log.error('[updateCourse] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    const courseRef = adminDb.collection('courses').doc(courseId);

    // Get current course to increment version
    const courseDoc = await courseRef.get();
    if (!courseDoc.exists) {
      return { success: false, error: 'Course not found' };
    }

    const currentData = courseDoc.data();
    if (!currentData) return { success: false, error: 'Course data is empty' };
    const currentVersion = currentData.version || 1;

    // Prepare update data
    const updateData: Record<string, unknown> = {
      ...updates,
      updatedAt: adminTimestamp.now(),
      version: currentVersion + 1, // Increment version on every update
    };

    // Don't allow updating these protected fields
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.creatorId;

    await courseRef.update(updateData);

    // Audit log
    await logAdminAction({
      actionType: 'course_update',
      targetType: 'course',
      targetId: courseId,
      details: { version: currentVersion + 1, fields: Object.keys(updates) },
    }, adminId);

    log.debug(`[updateCourse] Course ${courseId} updated (v${currentVersion + 1})`);
    return { success: true };
  } catch (error) {
    log.error('[updateCourse] Error updating course:', error);

    // Check if it's a permission error
    const fbError = error as { code?: string; message?: string };
    if (fbError.code === 'permission-denied') {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    return { success: false, error: fbError.message || 'Failed to update course' };
  }
}

/**
 * Archive a course (sets status to 'archived')
 * SECURITY: Requires admin role
 */
export async function archiveCourse(
  courseId: string
): Promise<{ success: boolean; error?: string }> {
  return updateCourseStatus(courseId, 'archived');
}

/**
 * Delete a course permanently
 * SECURITY: Requires admin role, checks for active enrollments
 */
export async function deleteCourse(
  courseId: string
): Promise<{ success: boolean; error?: string; enrollmentCount?: number }> {
  // SECURITY: Verify admin role server-side
  let adminId: string;
  try {
    const admin = await requireAdmin();
    adminId = admin.uid;
  } catch {
    log.error('[deleteCourse] Unauthorized access attempt');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    // Check for active enrollments first
    const enrollmentsSnapshot = await adminDb
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

    // Delete the course
    const courseRef = adminDb.collection('courses').doc(courseId);
    await courseRef.delete();

    // Audit log
    await logAdminAction({
      actionType: 'course_delete',
      targetType: 'course',
      targetId: courseId,
      details: { permanent: true },
    }, adminId);

    log.debug(`[deleteCourse] Course ${courseId} deleted permanently`);
    return { success: true };
  } catch (error) {
    log.error('[deleteCourse] Error deleting course:', error);

    // Check if it's a permission error
    const fbError = error as { code?: string; message?: string };
    if (fbError.code === 'permission-denied') {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    return { success: false, error: fbError.message || 'Failed to delete course' };
  }
}
