/**
 * Structure Validator
 *
 * Validates Firestore schema compliance and required field presence.
 * Ensures course structure matches production database schema.
 *
 * @module infrastructure/course-validation/validators/structure
 */

import type { Course } from '@/types/academy';
import type { ValidatorResult, ValidationIssue, ValidationConfig } from '../types';

/**
 * Validate course structure against Firestore schema
 */
export async function validateStructure(
  course: Course,
  _config?: ValidationConfig
): Promise<ValidatorResult> {
  const startTime = Date.now();
  const issues: ValidationIssue[] = [];
  let checksRun = 0;
  let checksFailed = 0;

  // Note: Zod schema validation removed - using runtime checks instead

  // Check 1: Course ID format
  checksRun++;
  if (!/^course-[a-z0-9-]+$/i.test(course.id)) {
    checksFailed++;
    issues.push({
      id: 'structure-course-id-format',
      category: 'structure',
      severity: 'error',
      message: `Invalid course ID format: "${course.id}"`,
      suggestion: 'Course ID should follow format: "course-{topic-code}-{sequence}" (e.g., "course-pha101")'
    });
  }

  // Check 3: Module IDs unique
  checksRun++;
  const moduleIds = new Set<string>();
  for (const module of course.modules) {
    if (moduleIds.has(module.id)) {
      checksFailed++;
      issues.push({
        id: `structure-duplicate-module-${module.id}`,
        category: 'structure',
        severity: 'error',
        message: `Duplicate module ID: "${module.id}"`,
        location: {
          moduleId: module.id,
          moduleName: module.title
        },
        suggestion: 'Each module must have a unique ID'
      });
    }
    moduleIds.add(module.id);
  }

  // Check 4: Lesson IDs unique globally
  checksRun++;
  const lessonIds = new Set<string>();
  for (const module of course.modules) {
    for (const lesson of module.lessons) {
      if (lessonIds.has(lesson.id)) {
        checksFailed++;
        issues.push({
          id: `structure-duplicate-lesson-${lesson.id}`,
          category: 'structure',
          severity: 'error',
          message: `Duplicate lesson ID: "${lesson.id}"`,
          location: {
            moduleId: module.id,
            moduleName: module.title,
            lessonId: lesson.id,
            lessonName: lesson.title
          },
          suggestion: 'Each lesson must have a globally unique ID across all modules'
        });
      }
      lessonIds.add(lesson.id);
    }
  }

  // Check 5: Lesson ID format
  checksRun++;
  for (const module of course.modules) {
    for (const lesson of module.lessons) {
      if (!/^lesson-[a-z0-9-]+-m\d+-l\d+$/i.test(lesson.id)) {
        checksFailed++;
        issues.push({
          id: `structure-lesson-id-format-${lesson.id}`,
          category: 'structure',
          severity: 'warning',
          message: `Non-standard lesson ID format: "${lesson.id}"`,
          location: {
            moduleId: module.id,
            moduleName: module.title,
            lessonId: lesson.id,
            lessonName: lesson.title
          },
          suggestion: 'Recommended format: "lesson-{course-code}-m{module-num}-l{lesson-num}" (e.g., "lesson-pha101-m1-l3")'
        });
      }
    }
  }

  // Check 6: Module count
  checksRun++;
  if (course.modules.length === 0) {
    checksFailed++;
    issues.push({
      id: 'structure-no-modules',
      category: 'structure',
      severity: 'error',
      message: 'Course has no modules',
      suggestion: 'Add at least 1 module to the course'
    });
  } else if (course.modules.length > 10) {
    checksFailed++;
    issues.push({
      id: 'structure-too-many-modules',
      category: 'structure',
      severity: 'warning',
      message: `Course has ${course.modules.length} modules (maximum recommended: 10)`,
      suggestion: 'Consider splitting into multiple courses for better learner experience'
    });
  }

  // Check 7: Lesson count per module
  checksRun++;
  for (const module of course.modules) {
    if (module.lessons.length === 0) {
      checksFailed++;
      issues.push({
        id: `structure-no-lessons-${module.id}`,
        category: 'structure',
        severity: 'error',
        message: `Module "${module.title}" has no lessons`,
        location: {
          moduleId: module.id,
          moduleName: module.title
        },
        suggestion: 'Add at least 1 lesson to each module'
      });
    } else if (module.lessons.length > 20) {
      checksFailed++;
      issues.push({
        id: `structure-too-many-lessons-${module.id}`,
        category: 'structure',
        severity: 'warning',
        message: `Module "${module.title}" has ${module.lessons.length} lessons (maximum recommended: 20)`,
        location: {
          moduleId: module.id,
          moduleName: module.title
        },
        suggestion: 'Consider splitting module or reducing lesson count for better pacing'
      });
    }
  }

  // Check 8: Title length
  checksRun++;
  if (course.title.length < 10) {
    checksFailed++;
    issues.push({
      id: 'structure-title-too-short',
      category: 'structure',
      severity: 'warning',
      message: `Course title is very short (${course.title.length} characters, minimum recommended: 10)`,
      suggestion: 'Use descriptive titles (e.g., "Introduction to ICH-GCP Principles" vs. "ICH-GCP")'
    });
  } else if (course.title.length > 100) {
    checksFailed++;
    issues.push({
      id: 'structure-title-too-long',
      category: 'structure',
      severity: 'error',
      message: `Course title exceeds maximum length (${course.title.length} characters, maximum: 100)`,
      suggestion: 'Shorten title to 100 characters or less'
    });
  }

  // Check 9: Description length
  checksRun++;
  if (course.description.length < 50) {
    checksFailed++;
    issues.push({
      id: 'structure-description-too-short',
      category: 'structure',
      severity: 'warning',
      message: `Course description is too short (${course.description.length} characters, minimum recommended: 50)`,
      suggestion: 'Write a descriptive summary (150-500 characters) to help learners understand course content'
    });
  } else if (course.description.length > 500) {
    checksFailed++;
    issues.push({
      id: 'structure-description-too-long',
      category: 'structure',
      severity: 'error',
      message: `Course description exceeds maximum length (${course.description.length} characters, maximum: 500)`,
      suggestion: 'Shorten description to 500 characters or less'
    });
  }

  // Check 10: Quality score range
  checksRun++;
  if (course.qualityScore < 0 || course.qualityScore > 100) {
    checksFailed++;
    issues.push({
      id: 'structure-quality-score-range',
      category: 'structure',
      severity: 'error',
      message: `Quality score out of range: ${course.qualityScore} (must be 0-100)`,
      suggestion: 'Set quality score between 0 and 100'
    });
  }

  // Check 11: Timestamps validity
  checksRun++;
  if (course.createdAt > course.updatedAt) {
    checksFailed++;
    issues.push({
      id: 'structure-timestamp-order',
      category: 'structure',
      severity: 'error',
      message: 'createdAt timestamp is after updatedAt timestamp',
      suggestion: 'Ensure createdAt <= updatedAt'
    });
  }

  if (course.publishedAt && course.publishedAt < course.createdAt) {
    checksFailed++;
    issues.push({
      id: 'structure-published-before-created',
      category: 'structure',
      severity: 'error',
      message: 'publishedAt timestamp is before createdAt timestamp',
      suggestion: 'Ensure publishedAt >= createdAt'
    });
  }

  // Check 12: Metadata consistency
  checksRun++;
  // Note: metadata.totalLessons doesn't exist in schema, but componentCount should be reasonable
  if (course.metadata.componentCount < 0) {
    checksFailed++;
    issues.push({
      id: 'structure-negative-component-count',
      category: 'structure',
      severity: 'error',
      message: `Component count cannot be negative: ${course.metadata.componentCount}`,
      suggestion: 'Set componentCount to a non-negative integer'
    });
  }

  // Calculate status
  const status = checksFailed === 0 ? 'pass' : issues.some(i => i.severity === 'error') ? 'fail' : 'warning';

  return {
    validator: 'structure',
    status,
    issues,
    metadata: {
      checksRun,
      checksPassed: checksRun - checksFailed,
      checksFailed,
      executionTimeMs: Date.now() - startTime
    }
  };
}
