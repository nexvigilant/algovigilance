/**
 * Assessment Validator
 *
 * Validates quiz assessments for AlgoVigilance Academy.
 * Ensures quizzes meet point requirements, question quality, and alignment standards.
 *
 * @module infrastructure/course-validation/validators/assessment
 */

import type { Course, QuizQuestion } from '@/types/academy';
import type { ValidatorResult, ValidationIssue, ValidationConfig } from '../types';

// Type narrowing helpers for quiz questions
type MultipleChoiceQuestion = QuizQuestion & { type: 'multiple-choice'; options: string[]; correctAnswer: number };
type TrueFalseQuestion = QuizQuestion & { type: 'true-false'; correctAnswer: number };
type MultipleSelectQuestion = QuizQuestion & { type: 'multiple-select'; options: string[]; correctAnswer: number[] };

/**
 * Validate course assessments (quizzes)
 */
export async function validateAssessment(
  course: Course,
  _config?: ValidationConfig
): Promise<ValidatorResult> {
  const startTime = Date.now();
  const issues: ValidationIssue[] = [];
  let checksRun = 0;
  let checksFailed = 0;

  // Process each lesson with assessment
  for (const module of course.modules) {
    for (const lesson of module.lessons) {
      if (!lesson.assessment) {
        continue; // No assessment, skip
      }

      const assessment = lesson.assessment;

      // Check 1: Quiz has minimum questions
      checksRun++;
      if (assessment.questions.length < 3) {
        checksFailed++;
        issues.push({
          id: `assessment-min-questions-${lesson.id}`,
          category: 'assessment',
          severity: 'error',
          message: `Quiz for "${lesson.title}" has only ${assessment.questions.length} questions (minimum: 3)`,
          location: {
            moduleId: module.id,
            moduleName: module.title,
            lessonId: lesson.id,
            lessonName: lesson.title
          },
          suggestion: 'Add at least 3 questions to the quiz'
        });
      }

      // Check 2: Quiz doesn't exceed maximum questions
      checksRun++;
      if (assessment.questions.length > 20) {
        checksFailed++;
        issues.push({
          id: `assessment-max-questions-${lesson.id}`,
          category: 'assessment',
          severity: 'error',
          message: `Quiz for "${lesson.title}" has ${assessment.questions.length} questions (maximum: 20)`,
          location: {
            moduleId: module.id,
            moduleName: module.title,
            lessonId: lesson.id,
            lessonName: lesson.title
          },
          suggestion: 'Reduce quiz to 20 questions or less (10 is optimal)'
        });
      }

      // Check 3: Optimal question count warning
      checksRun++;
      if (assessment.questions.length > 10) {
        checksFailed++;
        issues.push({
          id: `assessment-optimal-questions-${lesson.id}`,
          category: 'assessment',
          severity: 'info',
          message: `Quiz for "${lesson.title}" has ${assessment.questions.length} questions (optimal: 5-10)`,
          location: {
            moduleId: module.id,
            moduleName: module.title,
            lessonId: lesson.id,
            lessonName: lesson.title
          },
          suggestion: 'Consider reducing to 5-10 questions for better completion rates'
        });
      }

      // Check 4: Total points = 100
      checksRun++;
      const totalPoints = assessment.questions.reduce((sum, q) => sum + q.points, 0);
      if (totalPoints !== 100) {
        checksFailed++;
        issues.push({
          id: `assessment-total-points-${lesson.id}`,
          category: 'assessment',
          severity: 'error',
          message: `Quiz for "${lesson.title}" has ${totalPoints} total points (required: 100)`,
          location: {
            moduleId: module.id,
            moduleName: module.title,
            lessonId: lesson.id,
            lessonName: lesson.title
          },
          suggestion: `Adjust question points to sum to 100 (current: ${totalPoints})`
        });
      }

      // Check 5: Passing score range
      checksRun++;
      if (assessment.passingScore < 60 || assessment.passingScore > 80) {
        checksFailed++;
        issues.push({
          id: `assessment-passing-score-${lesson.id}`,
          category: 'assessment',
          severity: 'warning',
          message: `Quiz for "${lesson.title}" has passing score of ${assessment.passingScore}% (recommended: 60-80%)`,
          location: {
            moduleId: module.id,
            moduleName: module.title,
            lessonId: lesson.id,
            lessonName: lesson.title
          },
          suggestion: 'Set passing score between 60-80% (70% is standard)'
        });
      }

      // Check 6: Question validation
      for (const [idx, question] of assessment.questions.entries()) {
        const questionNum = idx + 1;

        // Check question text length
        checksRun++;
        if (question.question.length < 10) {
          checksFailed++;
          issues.push({
            id: `assessment-q${questionNum}-short-${lesson.id}`,
            category: 'assessment',
            severity: 'error',
            message: `Question ${questionNum} in "${lesson.title}" has very short question text (${question.question.length} characters)`,
            location: {
              moduleId: module.id,
              moduleName: module.title,
              lessonId: lesson.id,
              lessonName: lesson.title
            },
            contentPreview: question.question,
            suggestion: 'Question text should be at least 10 characters'
          });
        }

        // Check explanation
        checksRun++;
        if (!question.explanation || question.explanation.length < 10) {
          checksFailed++;
          issues.push({
            id: `assessment-q${questionNum}-no-explanation-${lesson.id}`,
            category: 'assessment',
            severity: 'error',
            message: `Question ${questionNum} in "${lesson.title}" has missing or very short explanation`,
            location: {
              moduleId: module.id,
              moduleName: module.title,
              lessonId: lesson.id,
              lessonName: lesson.title
            },
            contentPreview: question.question,
            suggestion: 'Add detailed explanation (min 10 characters) explaining why answer is correct'
          });
        }

        // Check points
        checksRun++;
        if (question.points <= 0) {
          checksFailed++;
          issues.push({
            id: `assessment-q${questionNum}-invalid-points-${lesson.id}`,
            category: 'assessment',
            severity: 'error',
            message: `Question ${questionNum} in "${lesson.title}" has invalid points: ${question.points}`,
            location: {
              moduleId: module.id,
              moduleName: module.title,
              lessonId: lesson.id,
              lessonName: lesson.title
            },
            suggestion: 'Points must be positive (typically 10-33 per question)'
          });
        }

        // Type-specific validation
        if (question.type === 'multiple-choice') {
          const mcQuestion = question as MultipleChoiceQuestion;
          checksRun++;

          // Check option count
          if (mcQuestion.options.length < 2) {
            checksFailed++;
            issues.push({
              id: `assessment-q${questionNum}-few-options-${lesson.id}`,
              category: 'assessment',
              severity: 'error',
              message: `Question ${questionNum} (multiple-choice) has only ${mcQuestion.options.length} options (minimum: 2)`,
              location: {
                moduleId: module.id,
                moduleName: module.title,
                lessonId: lesson.id,
                lessonName: lesson.title
              },
              suggestion: 'Multiple choice questions need at least 2 options (4 is standard)'
            });
          }

          if (mcQuestion.options.length > 6) {
            checksFailed++;
            issues.push({
              id: `assessment-q${questionNum}-many-options-${lesson.id}`,
              category: 'assessment',
              severity: 'warning',
              message: `Question ${questionNum} (multiple-choice) has ${mcQuestion.options.length} options (maximum recommended: 6)`,
              location: {
                moduleId: module.id,
                moduleName: module.title,
                lessonId: lesson.id,
                lessonName: lesson.title
              },
              suggestion: 'Limit to 6 options to avoid cognitive overload'
            });
          }

          // Check correctAnswer validity
          if (mcQuestion.correctAnswer < 0 || mcQuestion.correctAnswer >= mcQuestion.options.length) {
            checksFailed++;
            issues.push({
              id: `assessment-q${questionNum}-invalid-answer-${lesson.id}`,
              category: 'assessment',
              severity: 'error',
              message: `Question ${questionNum} has invalid correctAnswer: ${mcQuestion.correctAnswer} (must be 0-${mcQuestion.options.length - 1})`,
              location: {
                moduleId: module.id,
                moduleName: module.title,
                lessonId: lesson.id,
                lessonName: lesson.title
              },
              suggestion: `Set correctAnswer to valid option index (0-${mcQuestion.options.length - 1})`
            });
          }

          // Check option length uniformity (pattern detection anti-pattern)
          const lengths = mcQuestion.options.map(o => o.length);
          const allSameLength = lengths.every(l => Math.abs(l - lengths[0]) < 5);
          if (allSameLength && mcQuestion.options.length >= 3) {
            checksFailed++;
            issues.push({
              id: `assessment-q${questionNum}-pattern-${lesson.id}`,
              category: 'assessment',
              severity: 'warning',
              message: `Question ${questionNum} has all options with similar length (pattern detection risk)`,
              location: {
                moduleId: module.id,
                moduleName: module.title,
                lessonId: lesson.id,
                lessonName: lesson.title
              },
              suggestion: 'Vary option lengths to avoid test-takers guessing correct answer by length patterns'
            });
          }
        } else if (question.type === 'true-false') {
          const tfQuestion = question as TrueFalseQuestion;
          checksRun++;

          // Check correctAnswer is 0 or 1
          if (tfQuestion.correctAnswer !== 0 && tfQuestion.correctAnswer !== 1) {
            checksFailed++;
            issues.push({
              id: `assessment-q${questionNum}-invalid-tf-${lesson.id}`,
              category: 'assessment',
              severity: 'error',
              message: `Question ${questionNum} (true-false) has invalid correctAnswer: ${tfQuestion.correctAnswer} (must be 0 or 1)`,
              location: {
                moduleId: module.id,
                moduleName: module.title,
                lessonId: lesson.id,
                lessonName: lesson.title
              },
              suggestion: 'Set correctAnswer to 0 (False) or 1 (True)'
            });
          }
        } else if (question.type === 'multiple-select') {
          const msQuestion = question as MultipleSelectQuestion;
          checksRun++;

          // Check option count
          if (msQuestion.options.length < 2) {
            checksFailed++;
            issues.push({
              id: `assessment-q${questionNum}-few-ms-options-${lesson.id}`,
              category: 'assessment',
              severity: 'error',
              message: `Question ${questionNum} (multiple-select) has only ${msQuestion.options.length} options (minimum: 2)`,
              location: {
                moduleId: module.id,
                moduleName: module.title,
                lessonId: lesson.id,
                lessonName: lesson.title
              },
              suggestion: 'Multiple select questions need at least 2 options'
            });
          }

          // Check correctAnswer is array with at least 1 item
          if (!Array.isArray(msQuestion.correctAnswer) || msQuestion.correctAnswer.length === 0) {
            checksFailed++;
            issues.push({
              id: `assessment-q${questionNum}-no-ms-answers-${lesson.id}`,
              category: 'assessment',
              severity: 'error',
              message: `Question ${questionNum} (multiple-select) has no correct answers`,
              location: {
                moduleId: module.id,
                moduleName: module.title,
                lessonId: lesson.id,
                lessonName: lesson.title
              },
              suggestion: 'Set correctAnswer to array with at least 1 valid index (e.g., [0, 2])'
            });
          } else {
            // Check all indices are valid
            for (const idx of msQuestion.correctAnswer) {
              if (idx < 0 || idx >= msQuestion.options.length) {
                checksFailed++;
                issues.push({
                  id: `assessment-q${questionNum}-invalid-ms-index-${lesson.id}`,
                  category: 'assessment',
                  severity: 'error',
                  message: `Question ${questionNum} has invalid correctAnswer index: ${idx} (must be 0-${msQuestion.options.length - 1})`,
                  location: {
                    moduleId: module.id,
                    moduleName: module.title,
                    lessonId: lesson.id,
                    lessonName: lesson.title
                  },
                  suggestion: `Set all correctAnswer indices to valid range (0-${msQuestion.options.length - 1})`
                });
                break;
              }
            }
          }
        }
      }

      // Check 7: Question type diversity
      checksRun++;
      const types = new Set(assessment.questions.map(q => q.type));
      if (types.size === 1 && assessment.questions.length > 5) {
        checksFailed++;
        issues.push({
          id: `assessment-no-diversity-${lesson.id}`,
          category: 'assessment',
          severity: 'info',
          message: `Quiz for "${lesson.title}" uses only one question type (${Array.from(types)[0]})`,
          location: {
            moduleId: module.id,
            moduleName: module.title,
            lessonId: lesson.id,
            lessonName: lesson.title
          },
          suggestion: 'Mix question types (multiple-choice, true-false, multiple-select) for variety'
        });
      }

      // Check 8: Max attempts reasonable
      checksRun++;
      if (assessment.maxAttempts > 5) {
        checksFailed++;
        issues.push({
          id: `assessment-max-attempts-${lesson.id}`,
          category: 'assessment',
          severity: 'warning',
          message: `Quiz for "${lesson.title}" allows ${assessment.maxAttempts} attempts (recommended: 3)`,
          location: {
            moduleId: module.id,
            moduleName: module.title,
            lessonId: lesson.id,
            lessonName: lesson.title
          },
          suggestion: 'Set maxAttempts to 3 for optimal learning (allows learning from mistakes without unlimited retries)'
        });
      }
    }
  }

  // Calculate status
  const status = checksFailed === 0 ? 'pass' : issues.some(i => i.severity === 'error') ? 'fail' : 'warning';

  return {
    validator: 'assessment',
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
