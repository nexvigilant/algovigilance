'use server';

import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-auth';
import type { CourseData } from '@/lib/course-builder-api';

import { logger } from '@/lib/logger';
const log = logger.scope('generate/actions');

/**
 * Import a generated course to the Academy
 *
 * Takes the course data from the Course Builder API and writes it to
 * the Firestore courses collection, making it available in the Academy.
 */
export async function importCourseToAcademy(
  courseId: string,
  courseData: CourseData
): Promise<{ success: boolean; error?: string; courseId?: string }> {
  try {
    // 1. Verify user is admin and get their context
    const adminContext = await requireAdmin();

    // 2. Extract Academy course data
    const academyData = courseData.academy_course;

    if (!academyData || !academyData.modules) {
      return { success: false, error: 'Invalid course data structure' };
    }

    // 3. Transform to Academy format (ensure all required fields)
    const courseRecord = {
      id: courseId,
      title: academyData.title,
      description: academyData.description,
      topic: academyData.topic || 'General',
      domain: academyData.domain || 'Healthcare',
      targetAudience: academyData.targetAudience || 'Healthcare Professionals',

      // Module structure
      modules: academyData.modules,

      // Publishing status
      status: 'draft', // Start as draft so admin can review
      visibility: 'internal',
      publishedAt: null,

      // Quality metrics
      qualityScore: courseData.quality_score || 0,

      // Metadata
      metadata: {
        estimatedDuration: academyData.metadata?.estimatedDuration || 0,
        componentCount: academyData.modules.length,
        totalLessons: academyData.metadata?.totalLessons || 0,
        source: 'course-builder-api',
        generatedAt: courseData.generated_at || new Date().toISOString(),
      },

      // Tracking
      userId: adminContext.uid,
      createdAt: adminTimestamp.now(),
      updatedAt: adminTimestamp.now(),
      version: 1,
    };

    // 4. Write to Firestore courses collection
    await adminDb.collection('courses').doc(courseId).set(courseRecord);

    // 5. Log import event for audit trail
    await adminDb.collection('course_imports').add({
      courseId,
      importedBy: adminContext.uid,
      importedByEmail: adminContext.email,
      importedAt: adminTimestamp.now(),
      source: 'course-builder-api',
      originalData: {
        topic: courseData.topic,
        domain: courseData.domain,
        target_audience: courseData.target_audience,
      },
    });

    log.debug(`[importCourseToAcademy] Successfully imported course: ${courseId}`);

    return { success: true, courseId };
  } catch (error) {
    log.error('[importCourseToAcademy] Error importing course:', error);

    // Check if it's an authentication error
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import course to Academy',
    };
  }
}

