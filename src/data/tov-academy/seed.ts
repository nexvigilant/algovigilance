/**
 * Theory of Vigilance Academy — Firestore Seed Data
 *
 * Converts the ToV pathway into the format expected by the seed page.
 * Import this in the admin seed page to add ToV to Firestore.
 *
 * @example
 * ```tsx
 * import { tovSeedData } from '@/data/tov-academy/seed';
 * // Use with setDoc(doc(db, 'courses', tovSeedData.documentId), tovSeedData.data)
 * ```
 */

import { tovPathway } from './index';

/**
 * Convert the ToV pathway to the seed format expected by the admin seed page.
 * This matches the SampleCourse shape from sample-courses.json.
 */
export function getTovSeedDocument() {
  return {
    documentId: tovPathway.id,
    data: {
      id: tovPathway.id,
      title: tovPathway.title,
      description: tovPathway.description,
      topic: tovPathway.topic,
      status: tovPathway.status,
      visibility: tovPathway.visibility,
      qualityScore: tovPathway.qualityScore,
      domain: tovPathway.domain,
      targetAudience: tovPathway.targetAudience,
      difficulty: tovPathway.difficulty,
      metadata: tovPathway.metadata,
      instructor: tovPathway.instructor,
      version: tovPathway.version,
      modules: tovPathway.modules.map((stage) => ({
        id: stage.id,
        title: stage.title,
        description: stage.description,
        lessons: stage.lessons.map((activity) => ({
          id: activity.id,
          title: activity.title,
          description: activity.description,
          content: activity.content,
          estimatedDuration: activity.estimatedDuration,
          assessment: activity.assessment
            ? {
                type: activity.assessment.type,
                passingScore: activity.assessment.passingScore,
                questions: activity.assessment.questions.map((q) => ({
                  id: q.id,
                  type: q.type,
                  question: q.question,
                  ...(q.type === 'multiple-choice' || q.type === 'multiple-select'
                    ? { options: [...q.options] }
                    : {}),
                  correctAnswer: q.correctAnswer,
                  explanation: q.explanation,
                  points: q.points,
                })),
              }
            : undefined,
        })),
      })),
      publishedAt: '{{TIMESTAMP}}',
      createdAt: '{{TIMESTAMP}}',
      updatedAt: '{{TIMESTAMP}}',
    },
  };
}

export const tovSeedData = getTovSeedDocument();
