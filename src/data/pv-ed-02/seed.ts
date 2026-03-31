/**
 * PV-ED-02 — Firestore Seed Data
 *
 * Converts the pathway into the format expected by the admin seed page.
 */

import { pathway } from './index';

export function getSeedDocument() {
  return {
    documentId: pathway.id,
    data: {
      id: pathway.id,
      title: pathway.title,
      description: pathway.description,
      topic: pathway.topic,
      status: pathway.status,
      visibility: pathway.visibility,
      qualityScore: pathway.qualityScore,
      domain: pathway.domain,
      targetAudience: pathway.targetAudience,
      difficulty: pathway.difficulty,
      metadata: pathway.metadata,
      instructor: pathway.instructor,
      version: pathway.version,
      modules: pathway.modules.map((stage) => ({
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

export const seedData = getSeedDocument();
