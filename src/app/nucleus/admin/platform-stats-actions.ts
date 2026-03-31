'use server';

import { adminDb, adminTimestamp } from '@/lib/firebase-admin';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('admin/platform-stats-actions');

// ============================================================================
// Platform-Wide Statistics
// ============================================================================

export interface PlatformStats {
  totalMembers: number;
  activeCourses: number;
  totalEnrollments: number;
  certificatesIssued: number;
  communityPosts: number;
  activeJobs: number;
  // Operational metrics for admin attention
  pendingConsultingLeads: number;
  criticalLeads: number;
  unreadContactSubmissions: number;
  pendingAffiliateApplications: number;
  lastUpdated: string;
}

/**
 * Fetch high-level platform statistics for the main admin dashboard.
 * Uses getCountFromServer for efficient counting without downloading documents.
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  try {
    const [
      membersCount,
      coursesCount,
      enrollmentsCount,
      certificatesCount,
      postsCount,
      jobsCount,
      pendingLeadsCount,
      criticalLeadsCount,
      unreadContactCount,
      pendingAffiliateCount,
    ] = await Promise.all([
      // Total members
      adminDb.collection('users').count().get(),
      // Published courses
      adminDb.collection('courses').where('status', '==', 'published').count().get(),
      // Total enrollments
      adminDb.collection('enrollments').count().get(),
      // Certificates issued
      adminDb.collection('certificates').count().get(),
      // Community posts
      adminDb.collection('community_posts').count().get(),
      // Active jobs
      adminDb.collection('jobs').where('isActive', '==', true).count().get(),
      // Pending consulting inquiries (need attention)
      adminDb.collection('consulting_inquiries').where('status', '==', 'new').count().get(),
      // Critical leads (high score)
      adminDb.collection('consulting_inquiries').where('leadScore', '>=', 150).count().get(),
      // Unread contact submissions (need attention)
      adminDb.collection('contact_submissions').where('status', '==', 'new').count().get(),
      // Pending affiliate applications (need attention)
      adminDb.collection('affiliate_applications').where('status', '==', 'new').count().get(),
    ]);

    return {
      totalMembers: membersCount.data().count,
      activeCourses: coursesCount.data().count,
      totalEnrollments: enrollmentsCount.data().count,
      certificatesIssued: certificatesCount.data().count,
      communityPosts: postsCount.data().count,
      activeJobs: jobsCount.data().count,
      pendingConsultingLeads: pendingLeadsCount.data().count,
      criticalLeads: criticalLeadsCount.data().count,
      unreadContactSubmissions: unreadContactCount.data().count,
      pendingAffiliateApplications: pendingAffiliateCount.data().count,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    log.error('[getPlatformStats] Error fetching stats:', error);
    return {
      totalMembers: 0,
      activeCourses: 0,
      totalEnrollments: 0,
      certificatesIssued: 0,
      communityPosts: 0,
      activeJobs: 0,
      pendingConsultingLeads: 0,
      criticalLeads: 0,
      unreadContactSubmissions: 0,
      pendingAffiliateApplications: 0,
      lastUpdated: new Date().toISOString(),
    };
  }
}

// ============================================================================
// Academy-Specific Statistics
// ============================================================================

export interface AcademyStats {
  // Courses
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;

  // Enrollments
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;

  // Certificates
  totalCertificates: number;
  certificatesThisMonth: number;

  // Learners
  activeLearners: number; // Learners with activity in last 30 days

  // Content
  totalLessons: number;
  totalNotes: number;
  totalBookmarks: number;

  lastUpdated: string;
}

/**
 * Fetch detailed academy statistics for the academy admin dashboard.
 */
export async function getAcademyStats(): Promise<AcademyStats> {
  try {
    const thirtyDaysAgo = adminTimestamp.fromDate(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
    const startOfMonth = adminTimestamp.fromDate(
      new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    );

    const [
      // Course counts
      totalCoursesCount,
      publishedCoursesCount,
      draftCoursesCount,
      // Enrollment counts
      totalEnrollmentsCount,
      activeEnrollmentsCount,
      completedEnrollmentsCount,
      // Certificate counts
      totalCertificatesCount,
      certificatesThisMonthCount,
      // Content counts
      notesCount,
      bookmarksCount,
    ] = await Promise.all([
      // Courses
      adminDb.collection('courses').count().get(),
      adminDb.collection('courses').where('status', '==', 'published').count().get(),
      adminDb.collection('courses').where('status', '==', 'draft').count().get(),
      // Enrollments
      adminDb.collection('enrollments').count().get(),
      adminDb.collection('enrollments').where('status', '==', 'active').count().get(),
      adminDb.collection('enrollments').where('status', '==', 'completed').count().get(),
      // Certificates
      adminDb.collection('certificates').count().get(),
      adminDb.collection('certificates').where('issuedAt', '>=', startOfMonth).count().get(),
      // Content
      adminDb.collection('lesson_notes').count().get(),
      adminDb.collection('lesson_bookmarks').count().get(),
    ]);

    // Get unique active learners (users with enrollment activity in last 30 days)
    const recentEnrollmentsSnap = await adminDb
      .collection('enrollments')
      .where('lastAccessedAt', '>=', thirtyDaysAgo)
      .limit(1000) // Reasonable limit for counting unique users
      .get();
    const uniqueLearners = new Set(
      recentEnrollmentsSnap.docs.map((doc) => doc.data().userId)
    );

    return {
      totalCourses: totalCoursesCount.data().count,
      publishedCourses: publishedCoursesCount.data().count,
      draftCourses: draftCoursesCount.data().count,
      totalEnrollments: totalEnrollmentsCount.data().count,
      activeEnrollments: activeEnrollmentsCount.data().count,
      completedEnrollments: completedEnrollmentsCount.data().count,
      totalCertificates: totalCertificatesCount.data().count,
      certificatesThisMonth: certificatesThisMonthCount.data().count,
      activeLearners: uniqueLearners.size,
      totalLessons: 0, // Would need to aggregate from course modules
      totalNotes: notesCount.data().count,
      totalBookmarks: bookmarksCount.data().count,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    log.error('[getAcademyStats] Error fetching stats:', error);
    return {
      totalCourses: 0,
      publishedCourses: 0,
      draftCourses: 0,
      totalEnrollments: 0,
      activeEnrollments: 0,
      completedEnrollments: 0,
      totalCertificates: 0,
      certificatesThisMonth: 0,
      activeLearners: 0,
      totalLessons: 0,
      totalNotes: 0,
      totalBookmarks: 0,
      lastUpdated: new Date().toISOString(),
    };
  }
}

// ============================================================================
// Recent Activity
// ============================================================================

export interface RecentActivity {
  type: 'enrollment' | 'certificate' | 'post' | 'signup';
  title: string;
  description: string;
  timestamp: string;
  userId?: string;
}

/**
 * Fetch recent platform activity for the activity feed.
 */
export async function getRecentActivity(limitCount: number = 10): Promise<RecentActivity[]> {
  try {
    const activities: RecentActivity[] = [];

    // Get recent enrollments
    const enrollmentsSnap = await adminDb
      .collection('enrollments')
      .orderBy('enrolledAt', 'desc')
      .limit(5)
      .get();
    enrollmentsSnap.docs.forEach((doc) => {
      const data = doc.data();
      activities.push({
        type: 'enrollment',
        title: 'New Enrollment',
        description: data.courseTitle || 'Capability Pathway',
        timestamp: toDateFromSerialized(data.enrolledAt)?.toISOString() || new Date().toISOString(),
        userId: data.userId,
      });
    });

    // Get recent certificates
    const certificatesSnap = await adminDb
      .collection('certificates')
      .orderBy('issuedAt', 'desc')
      .limit(5)
      .get();
    certificatesSnap.docs.forEach((doc) => {
      const data = doc.data();
      activities.push({
        type: 'certificate',
        title: 'Certificate Issued',
        description: data.courseTitle || 'Capability Verification',
        timestamp: toDateFromSerialized(data.issuedAt)?.toISOString() || new Date().toISOString(),
        userId: data.userId,
      });
    });

    // Get recent signups
    const usersSnap = await adminDb
      .collection('users')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    usersSnap.docs.forEach((doc) => {
      const data = doc.data();
      activities.push({
        type: 'signup',
        title: 'New Member',
        description: data.displayName || data.email?.split('@')[0] || 'New user',
        timestamp: toDateFromSerialized(data.createdAt)?.toISOString() || new Date().toISOString(),
        userId: doc.id,
      });
    });

    // Sort by timestamp and return limited results
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limitCount);
  } catch (error) {
    log.error('[getRecentActivity] Error fetching activity:', error);
    return [];
  }
}

// ============================================================================
// Growth Metrics
// ============================================================================

export interface GrowthMetrics {
  membersThisWeek: number;
  membersLastWeek: number;
  memberGrowthPercent: number;
  enrollmentsThisWeek: number;
  enrollmentsLastWeek: number;
  enrollmentGrowthPercent: number;
}

/**
 * Calculate week-over-week growth metrics.
 */
export async function getGrowthMetrics(): Promise<GrowthMetrics> {
  try {
    const now = new Date();
    const oneWeekAgo = adminTimestamp.fromDate(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
    const twoWeeksAgo = adminTimestamp.fromDate(new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000));

    const [
      membersThisWeekSnap,
      membersLastWeekSnap,
      enrollmentsThisWeekSnap,
      enrollmentsLastWeekSnap,
    ] = await Promise.all([
      adminDb.collection('users').where('createdAt', '>=', oneWeekAgo).count().get(),
      adminDb.collection('users')
        .where('createdAt', '>=', twoWeeksAgo)
        .where('createdAt', '<', oneWeekAgo)
        .count().get(),
      adminDb.collection('enrollments').where('enrolledAt', '>=', oneWeekAgo).count().get(),
      adminDb.collection('enrollments')
        .where('enrolledAt', '>=', twoWeeksAgo)
        .where('enrolledAt', '<', oneWeekAgo)
        .count().get(),
    ]);

    const membersThisWeek = membersThisWeekSnap.data().count;
    const membersLastWeek = membersLastWeekSnap.data().count;
    const enrollmentsThisWeek = enrollmentsThisWeekSnap.data().count;
    const enrollmentsLastWeek = enrollmentsLastWeekSnap.data().count;

    return {
      membersThisWeek,
      membersLastWeek,
      memberGrowthPercent: membersLastWeek > 0
        ? Math.round(((membersThisWeek - membersLastWeek) / membersLastWeek) * 100)
        : membersThisWeek > 0 ? 100 : 0,
      enrollmentsThisWeek,
      enrollmentsLastWeek,
      enrollmentGrowthPercent: enrollmentsLastWeek > 0
        ? Math.round(((enrollmentsThisWeek - enrollmentsLastWeek) / enrollmentsLastWeek) * 100)
        : enrollmentsThisWeek > 0 ? 100 : 0,
    };
  } catch (error) {
    log.error('[getGrowthMetrics] Error fetching metrics:', error);
    return {
      membersThisWeek: 0,
      membersLastWeek: 0,
      memberGrowthPercent: 0,
      enrollmentsThisWeek: 0,
      enrollmentsLastWeek: 0,
      enrollmentGrowthPercent: 0,
    };
  }
}
