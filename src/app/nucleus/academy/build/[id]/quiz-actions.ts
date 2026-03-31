'use server';

import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import type { Timestamp as ClientTimestamp } from 'firebase/firestore';
import type { QuizAttempt, QuizScore, QuizQuestion } from '@/types/academy';

import { logger } from '@/lib/logger';
const log = logger.scope('[id]/quiz-actions');

// Cast Admin SDK Timestamp to client Timestamp type (compatible at runtime)
const now = () => adminTimestamp.now() as unknown as ClientTimestamp;

/**
 * Validate quiz answers server-side and calculate score
 * Prevents client-side score manipulation
 */
export async function validateQuizAnswers(
  enrollmentId: string,
  courseId: string,
  lessonId: string,
  answers: (number | number[])[],
  startTime: number,
  userId: string
): Promise<Omit<QuizAttempt, 'completedAt'> | null> {
  try {
    // Verify user owns this enrollment
    const enrollmentDoc = await adminDb.collection('enrollments').doc(enrollmentId).get();
    if (!enrollmentDoc.exists) {
      log.error('Enrollment not found');
      return null;
    }

    const enrollment = enrollmentDoc.data();
    if (!enrollment) return null;
    if (enrollment.userId !== userId) {
      log.error('Unauthorized: User does not own this enrollment');
      return null;
    }

    // Load course data to get quiz questions with correct answers
    const courseDoc = await adminDb.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      log.error('Course not found');
      return null;
    }

    const courseData = courseDoc.data();
    if (!courseData) {
      log.error('Course data is empty');
      return null;
    }

    // Find the lesson and its quiz
    let quizQuestions: QuizQuestion[] | undefined;
    let passingScore = 70;

    for (const module of courseData.modules || []) {
      const lesson = module.lessons?.find((l: { id: string }) => l.id === lessonId);
      if (lesson?.assessment) {
        quizQuestions = lesson.assessment.questions;
        passingScore = lesson.assessment.passingScore || 70;
        break;
      }
    }

    if (!quizQuestions || quizQuestions.length === 0) {
      log.error('Quiz questions not found');
      return null;
    }

    // Get previous attempts to calculate attempt number
    const quizScores: QuizScore[] = enrollment.quizScores || [];
    const lessonScore = quizScores.find(qs => qs.lessonId === lessonId);
    const attemptNumber = (lessonScore?.attempts || 0) + 1;

    // Validate answers and calculate score server-side
    let pointsEarned = 0;
    const pointsPossible = quizQuestions.reduce((sum, q) => {
      const validPoints = typeof q.points === 'number' && q.points >= 0 ? q.points : 0;
      return sum + validPoints;
    }, 0);

    quizQuestions.forEach((question, index) => {
      const validPoints = typeof question.points === 'number' && question.points >= 0
        ? question.points
        : 0;
      const userAnswer = answers[index];
      const isCorrect = checkAnswer(question, userAnswer);

      if (isCorrect) {
        pointsEarned += validPoints;
      }
    });

    // Calculate score percentage with division by zero protection
    const scorePercentage = pointsPossible > 0
      ? (pointsEarned / pointsPossible) * 100
      : 0;

    const passed = scorePercentage >= passingScore;
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    // Return validated attempt result
    return {
      attemptNumber,
      answers,
      score: scorePercentage,
      pointsEarned,
      pointsPossible,
      passed,
      timeSpent
    };
  } catch (error) {
    log.error('Error validating quiz answers:', error);
    return null;
  }
}

/**
 * Check if an answer is correct (server-side validation)
 */
function checkAnswer(question: QuizQuestion, userAnswer: number | number[]): boolean {
  if (userAnswer === null || userAnswer === undefined) return false;

  if (question.type === 'multiple-select') {
    const correctAnswers = question.correctAnswer as number[];
    const userAnswers = userAnswer as number[];

    if (userAnswers.length !== correctAnswers.length) return false;

    return correctAnswers.every(answer => userAnswers.includes(answer)) &&
           userAnswers.every(answer => correctAnswers.includes(answer));
  }

  return userAnswer === question.correctAnswer;
}

/**
 * Submit quiz attempt and update enrollment
 */
export async function submitQuizAttempt(
  enrollmentId: string,
  lessonId: string,
  attempt: Omit<QuizAttempt, 'completedAt'>,
  userId: string
): Promise<boolean> {
  try {
    const enrollmentRef = adminDb.collection('enrollments').doc(enrollmentId);

    // Create complete attempt with timestamp
    const completeAttempt: QuizAttempt = {
      ...attempt,
      completedAt: now()
    };

    // Get existing quiz scores
    const enrollmentDoc = await enrollmentRef.get();

    if (!enrollmentDoc.exists) {
      log.error('Enrollment not found');
      return false;
    }

    const enrollment = enrollmentDoc.data();
    if (!enrollment) return false;

    // Verify ownership
    if (enrollment.userId !== userId) {
      log.error('Unauthorized: User does not own this enrollment');
      return false;
    }

    // Create mutable copy to avoid mutating readonly Enrollment data
    const quizScores: QuizScore[] = [...(enrollment.quizScores || [])];

    // Find or create quiz score for this lesson
    const existingScoreIndex = quizScores.findIndex(qs => qs.lessonId === lessonId);

    if (existingScoreIndex >= 0) {
      // Update existing score
      const existingScore = quizScores[existingScoreIndex];
      const allAttempts = [...existingScore.allAttempts, completeAttempt];
      const bestAttempt = allAttempts.reduce((best, current) =>
        current.score > best.score ? current : best
      );

      quizScores[existingScoreIndex] = {
        lessonId,
        score: bestAttempt.score,
        attempts: existingScore.attempts + 1,
        completedAt: now(),
        allAttempts,
        bestAttempt
      };
    } else {
      // Create new score
      quizScores.push({
        lessonId,
        score: completeAttempt.score,
        attempts: 1,
        completedAt: now(),
        allAttempts: [completeAttempt],
        bestAttempt: completeAttempt
      });
    }

    // Update enrollment with new quiz scores
    await enrollmentRef.update({
      quizScores,
      lastAccessedAt: now()
    });

    return true;
  } catch (error) {
    log.error('Error submitting quiz attempt:', error);
    return false;
  }
}

/**
 * Get quiz attempts for a specific lesson
 */
export async function getQuizAttempts(
  enrollmentId: string,
  lessonId: string,
  userId: string
): Promise<QuizAttempt[]> {
  try {
    const enrollmentDoc = await adminDb.collection('enrollments').doc(enrollmentId).get();

    if (!enrollmentDoc.exists) {
      return [];
    }

    const enrollment = enrollmentDoc.data();
    if (!enrollment) return [];

    // Verify ownership
    if (enrollment.userId !== userId) {
      log.error('Unauthorized: User does not own this enrollment');
      return [];
    }

    const quizScores: QuizScore[] = enrollment.quizScores || [];
    const lessonScore = quizScores.find(qs => qs.lessonId === lessonId);

    return (lessonScore?.allAttempts || []) as QuizAttempt[];
  } catch (error) {
    log.error('Error fetching quiz attempts:', error);
    return [];
  }
}
