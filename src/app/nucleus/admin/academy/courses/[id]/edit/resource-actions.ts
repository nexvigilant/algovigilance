'use server';

import { requireAdmin } from '@/lib/admin-auth';
import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import type { Timestamp as ClientTimestamp } from 'firebase/firestore';
import type { Course, LessonResource } from '@/types/academy';

import { logger } from '@/lib/logger';
const log = logger.scope('edit/resource-actions');

/**
 * Add a resource to a lesson (admin only)
 * Note: File upload to Firebase Storage happens client-side
 * This action just adds the metadata to the lesson
 */
export async function addResourceToLesson(
  courseId: string,
  moduleIndex: number,
  lessonIndex: number,
  resource: Omit<LessonResource, 'uploadedAt'> & { uploadedAt?: ClientTimestamp }
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await requireAdmin();
  } catch (error) {
    log.error('[addResourceToLesson] Unauthorized');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    const courseRef = adminDb.collection('courses').doc(courseId);
    const courseDoc = await courseRef.get();

    if (!courseDoc.exists) {
      return { success: false, error: 'Course not found' };
    }

    const courseData = courseDoc.data() as Course;

    if (!courseData.modules[moduleIndex]) {
      return { success: false, error: 'Module not found' };
    }

    if (!courseData.modules[moduleIndex].lessons[lessonIndex]) {
      return { success: false, error: 'Lesson not found' };
    }

    // Get the lesson
    const lesson = courseData.modules[moduleIndex].lessons[lessonIndex];

    // Create mutable copies for update
    const updatedModules = [...courseData.modules];
    const updatedLessons = [...updatedModules[moduleIndex].lessons];

    // Update the lesson
    updatedLessons[lessonIndex] = {
      ...lesson,
      resources: [
        ...(lesson.resources || []),
        {
          ...resource,
          uploadedAt: resource.uploadedAt || (adminTimestamp.now() as unknown as ClientTimestamp),
        },
      ],
    };

    // Update the module
    updatedModules[moduleIndex] = {
      ...updatedModules[moduleIndex],
      lessons: updatedLessons,
    };

    await courseRef.update({
      modules: updatedModules,
      updatedAt: adminTimestamp.now(),
    });

    return { success: true };
  } catch (error) {
    log.error('[addResourceToLesson] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add resource',
    };
  }
}

/**
 * Delete a resource from a lesson (admin only)
 * Note: This only removes the metadata. File deletion from Storage happens client-side.
 */
export async function deleteResourceFromLesson(
  courseId: string,
  moduleIndex: number,
  lessonIndex: number,
  resourceId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await requireAdmin();
  } catch (error) {
    log.error('[deleteResourceFromLesson] Unauthorized');
    return { success: false, error: 'Unauthorized: Admin access required' };
  }

  try {
    const courseRef = adminDb.collection('courses').doc(courseId);
    const courseDoc = await courseRef.get();

    if (!courseDoc.exists) {
      return { success: false, error: 'Course not found' };
    }

    const courseData = courseDoc.data() as Course;

    if (!courseData.modules[moduleIndex]) {
      return { success: false, error: 'Module not found' };
    }

    if (!courseData.modules[moduleIndex].lessons[lessonIndex]) {
      return { success: false, error: 'Lesson not found' };
    }

    // Get the lesson
    const lesson = courseData.modules[moduleIndex].lessons[lessonIndex];

    // Remove resource
    const updatedResources = (lesson.resources || []).filter(r => r.id !== resourceId);

    // Create mutable copies for update
    const updatedModules = [...courseData.modules];
    const updatedLessons = [...updatedModules[moduleIndex].lessons];

    // Update the lesson
    updatedLessons[lessonIndex] = {
      ...lesson,
      resources: updatedResources,
    };

    // Update the module
    updatedModules[moduleIndex] = {
      ...updatedModules[moduleIndex],
      lessons: updatedLessons,
    };

    await courseRef.update({
      modules: updatedModules,
      updatedAt: adminTimestamp.now(),
    });

    return { success: true };
  } catch (error) {
    log.error('[deleteResourceFromLesson] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete resource',
    };
  }
}
