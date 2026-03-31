'use server';

import { adminDb } from '@/lib/firebase-admin';
import { calculateSkillGaps } from './calculate-skill-gaps';
import type { UserSkill, CareerPath, SkillGap } from './calculate-skill-gaps';
import type { Course } from '@/types/academy';

import { logger } from '@/lib/logger';
const log = logger.scope('skills/get-skill-recommendations');

/**
 * Enhanced skill gap recommendation with actual course data (F025)
 * Returns skill gaps with full course objects instead of just titles
 */
export interface SkillGapWithCourses extends SkillGap {
  recommendedCourseObjects: Course[];
}

/**
 * Fetch skill recommendations with full course data from Firestore (F025)
 * This enriches the calculateSkillGaps output with actual course details
 * Uses Admin SDK for server-side access (Server Actions don't have client auth)
 */
export async function getSkillRecommendations(
  userSkills: UserSkill[],
  careerPath: CareerPath
): Promise<SkillGapWithCourses[]> {
  try {
    // Fetch all published courses from Firestore using Admin SDK
    const coursesSnapshot = await adminDb
      .collection('courses')
      .where('status', '==', 'published')
      .get();
    const courses = coursesSnapshot.docs.map(doc => {
      const data = doc.data() as Course;
      return data;
    });

    // Calculate skill gaps
    const gaps = calculateSkillGaps(userSkills, careerPath, courses);

    // Enrich each gap with actual course objects
    const enrichedGaps: SkillGapWithCourses[] = gaps.map(gap => {
      // Find courses that match the course titles in the gap
      const recommendedCourseObjects = courses.filter(course =>
        gap.recommendedCourses.some(courseName =>
          course.title.toLowerCase().includes(courseName.toLowerCase()) ||
          courseName.toLowerCase().includes(course.title.toLowerCase())
        )
      );

      return {
        ...gap,
        recommendedCourseObjects,
      };
    });

    return enrichedGaps;
  } catch (error) {
    log.error('[getSkillRecommendations] Error fetching recommendations:', error);
    // Fall back to gaps without course objects
    const courses: Course[] = [];
    const gaps = calculateSkillGaps(userSkills, careerPath, courses);
    return gaps.map(gap => ({
      ...gap,
      recommendedCourseObjects: [],
    }));
  }
}
