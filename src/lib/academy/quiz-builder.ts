/**
 * Quiz Builder Utility
 *
 * Programmatic quiz creation with fluent API and automatic validation.
 * Ensures total points = 100, minimum 3 questions, and valid question structure.
 *
 * Migrated from infrastructure/course-components/quiz-builder.ts
 *
 * @module lib/academy/quiz-builder
 *
 * @example
 * ```typescript
 * import { QuizBuilder } from '@/lib/academy/quiz-builder';
 *
 * const quiz = new QuizBuilder()
 *   .setPassingScore(70)
 *   .setMaxAttempts(3)
 *   .randomizeQuestions()
 *   .addMultipleChoice({
 *     question: "What does AE stand for?",
 *     options: ["Adverse Event", "Adverse Effect", "Adverse Experience", "None"],
 *     correctAnswer: 0,
 *     explanation: "AE = Adverse Event per ICH definitions",
 *     points: 25
 *   })
 *   .addTrueFalse({
 *     question: "SAEs must be reported within 24 hours",
 *     correctAnswer: true,
 *     explanation: "Regulatory requirement",
 *     points: 25
 *   })
 *   .build();
 * ```
 */

import type { Lesson } from '@/types/academy';

import { logger } from '@/lib/logger';
const log = logger.scope('academy/quiz-builder');

// Extract Assessment type from Lesson
type Assessment = NonNullable<Lesson['assessment']>;
type QuizQuestion = Assessment['questions'][number];

// ============================================================================
// INPUT TYPES (Simplified for builder API)
// ============================================================================

/**
 * Input for multiple choice question (simplified)
 */
export interface MultipleChoiceInput {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  points: number;
}

/**
 * Input for true/false question (simplified with boolean)
 */
export interface TrueFalseInput {
  question: string;
  correctAnswer: boolean;
  explanation: string;
  points: number;
}

/**
 * Input for multiple select question (simplified)
 */
export interface MultipleSelectInput {
  question: string;
  options: string[];
  correctAnswer: number[];
  explanation: string;
  points: number;
}

// ============================================================================
// QUIZ BUILDER CLASS
// ============================================================================

/**
 * Quiz Builder with fluent API
 *
 * Creates validated quiz assessments with automatic ID generation,
 * point validation, and structure checking.
 */
export class QuizBuilder {
  private passingScore: number = 70;
  private maxAttempts: number = 3;
  private _randomizeQuestions: boolean = false;
  private _randomizeOptions: boolean = false;
  private questions: QuizQuestion[] = [];
  private questionIdCounter: number = 1;

  /**
   * Set passing score percentage
   * @param score - Passing score (0-100)
   * @returns this (for chaining)
   */
  setPassingScore(score: number): this {
    if (score < 0 || score > 100) {
      throw new Error('Passing score must be between 0 and 100');
    }
    if (score < 60 || score > 80) {
      log.warn('Passing score should typically be between 60-80%');
    }
    this.passingScore = score;
    return this;
  }

  /**
   * Set maximum attempts allowed
   * @param attempts - Max attempts (0 = unlimited)
   * @returns this (for chaining)
   */
  setMaxAttempts(attempts: number): this {
    if (attempts < 0) {
      throw new Error('Max attempts cannot be negative');
    }
    this.maxAttempts = attempts;
    return this;
  }

  /**
   * Enable question randomization
   * @returns this (for chaining)
   */
  randomizeQuestions(): this {
    this._randomizeQuestions = true;
    return this;
  }

  /**
   * Enable answer option randomization
   * @returns this (for chaining)
   */
  randomizeOptions(): this {
    this._randomizeOptions = true;
    return this;
  }

  /**
   * Add a multiple choice question
   * @param input - Question data
   * @returns this (for chaining)
   */
  addMultipleChoice(input: MultipleChoiceInput): this {
    this.validateMultipleChoiceInput(input);

    const question: QuizQuestion = {
      id: `q${this.questionIdCounter++}`,
      type: 'multiple-choice',
      question: input.question,
      options: input.options,
      correctAnswer: input.correctAnswer,
      explanation: input.explanation,
      points: input.points
    };

    this.questions.push(question);
    return this;
  }

  /**
   * Add a true/false question
   * @param input - Question data (boolean correctAnswer)
   * @returns this (for chaining)
   */
  addTrueFalse(input: TrueFalseInput): this {
    this.validateTrueFalseInput(input);

    const question: QuizQuestion = {
      id: `q${this.questionIdCounter++}`,
      type: 'true-false',
      question: input.question,
      correctAnswer: input.correctAnswer ? 1 : 0,
      explanation: input.explanation,
      points: input.points
    };

    this.questions.push(question);
    return this;
  }

  /**
   * Add a multiple select question
   * @param input - Question data
   * @returns this (for chaining)
   */
  addMultipleSelect(input: MultipleSelectInput): this {
    this.validateMultipleSelectInput(input);

    const question: QuizQuestion = {
      id: `q${this.questionIdCounter++}`,
      type: 'multiple-select',
      question: input.question,
      options: input.options,
      correctAnswer: input.correctAnswer,
      explanation: input.explanation,
      points: input.points
    };

    this.questions.push(question);
    return this;
  }

  /**
   * Build the final Assessment object
   * @returns Validated Assessment
   * @throws Error if validation fails
   */
  build(): Assessment {
    // Validate question count
    if (this.questions.length < 3) {
      throw new Error('Assessment must have at least 3 questions');
    }

    if (this.questions.length > 20) {
      throw new Error('Assessment cannot have more than 20 questions');
    }

    // Validate total points
    const totalPoints = this.questions.reduce((sum, q) => sum + q.points, 0);
    if (totalPoints !== 100) {
      throw new Error(
        `Total points must equal 100 (current: ${totalPoints}). Adjust question points to sum to 100.`
      );
    }

    return {
      type: 'quiz',
      passingScore: this.passingScore,
      maxAttempts: this.maxAttempts,
      randomizeQuestions: this._randomizeQuestions,
      randomizeOptions: this._randomizeOptions,
      questions: this.questions
    };
  }

  /**
   * Get current total points (for debugging)
   * @returns Current total points
   */
  getTotalPoints(): number {
    return this.questions.reduce((sum, q) => sum + q.points, 0);
  }

  /**
   * Get current question count
   * @returns Number of questions
   */
  getQuestionCount(): number {
    return this.questions.length;
  }

  /**
   * Clear all questions (reset builder)
   * @returns this (for chaining)
   */
  clearQuestions(): this {
    this.questions = [];
    this.questionIdCounter = 1;
    return this;
  }

  // ============================================================================
  // PRIVATE VALIDATION METHODS
  // ============================================================================

  private validateMultipleChoiceInput(input: MultipleChoiceInput): void {
    if (!input.question || input.question.length < 10) {
      throw new Error('Question must be at least 10 characters');
    }

    if (!input.options || input.options.length < 2) {
      throw new Error('Multiple choice must have at least 2 options');
    }

    if (input.options.length > 6) {
      throw new Error('Multiple choice cannot have more than 6 options');
    }

    if (input.correctAnswer < 0 || input.correctAnswer >= input.options.length) {
      throw new Error(`correctAnswer must be between 0 and ${input.options.length - 1}`);
    }

    if (!input.explanation || input.explanation.length < 10) {
      throw new Error('Explanation must be at least 10 characters');
    }

    if (input.points <= 0) {
      throw new Error('Points must be positive');
    }
  }

  private validateTrueFalseInput(input: TrueFalseInput): void {
    if (!input.question || input.question.length < 10) {
      throw new Error('Question must be at least 10 characters');
    }

    if (typeof input.correctAnswer !== 'boolean') {
      throw new Error('correctAnswer must be a boolean (true or false)');
    }

    if (!input.explanation || input.explanation.length < 10) {
      throw new Error('Explanation must be at least 10 characters');
    }

    if (input.points <= 0) {
      throw new Error('Points must be positive');
    }
  }

  private validateMultipleSelectInput(input: MultipleSelectInput): void {
    if (!input.question || input.question.length < 10) {
      throw new Error('Question must be at least 10 characters');
    }

    if (!input.options || input.options.length < 2) {
      throw new Error('Multiple select must have at least 2 options');
    }

    if (input.options.length > 6) {
      throw new Error('Multiple select cannot have more than 6 options');
    }

    if (!input.correctAnswer || input.correctAnswer.length === 0) {
      throw new Error('Multiple select must have at least 1 correct answer');
    }

    for (const idx of input.correctAnswer) {
      if (idx < 0 || idx >= input.options.length) {
        throw new Error(`All correctAnswer indices must be between 0 and ${input.options.length - 1}`);
      }
    }

    if (!input.explanation || input.explanation.length < 10) {
      throw new Error('Explanation must be at least 10 characters');
    }

    if (input.points <= 0) {
      throw new Error('Points must be positive');
    }
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Create a quiz with evenly distributed points
 * @param questionCount - Number of questions to create
 * @returns QuizBuilder configured for even distribution
 *
 * @example
 * ```typescript
 * const builder = createEvenQuiz(4); // 4 questions x 25 points
 * const builder = createEvenQuiz(5); // 5 questions x 20 points
 * const builder = createEvenQuiz(10); // 10 questions x 10 points
 * ```
 */
export function createEvenQuiz(questionCount: number): QuizBuilder {
  if (questionCount < 3) {
    throw new Error('Must have at least 3 questions');
  }

  if (100 % questionCount !== 0) {
    log.warn(
      `${questionCount} questions will not divide evenly into 100 points. ` +
      `Consider using ${Math.floor(100 / questionCount)} or ${Math.ceil(100 / questionCount)} questions instead.`
    );
  }

  return new QuizBuilder();
}

/**
 * Calculate even point distribution for quiz
 * @param questionCount - Number of questions
 * @returns Points per question
 *
 * @example
 * ```typescript
 * calculateEvenPoints(4);  // 25
 * calculateEvenPoints(5);  // 20
 * calculateEvenPoints(10); // 10
 * ```
 */
export function calculateEvenPoints(questionCount: number): number {
  return Math.floor(100 / questionCount);
}

/**
 * Validate quiz meets AlgoVigilance standards
 * @param assessment - Assessment to validate
 * @returns Validation result with detailed errors
 */
export function validateQuizStandards(assessment: Assessment): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check question count
  if (assessment.questions.length < 3) {
    errors.push('Quiz must have at least 3 questions');
  }

  if (assessment.questions.length > 20) {
    errors.push('Quiz should not exceed 20 questions');
  }

  if (assessment.questions.length > 10) {
    warnings.push('Quizzes with more than 10 questions may reduce completion rates');
  }

  // Check total points
  const totalPoints = assessment.questions.reduce((sum, q) => sum + q.points, 0);
  if (totalPoints !== 100) {
    errors.push(`Total points must equal 100 (current: ${totalPoints})`);
  }

  // Check passing score
  if (assessment.passingScore && (assessment.passingScore < 60 || assessment.passingScore > 80)) {
    warnings.push('Passing score should typically be between 60-80%');
  }

  // Check explanations
  for (const [idx, question] of assessment.questions.entries()) {
    if (!question.explanation || question.explanation.length < 10) {
      errors.push(`Question ${idx + 1}: Explanation must be at least 10 characters`);
    }
  }

  // Check question type diversity
  const types = new Set(assessment.questions.map(q => q.type));
  if (types.size === 1 && assessment.questions.length > 5) {
    warnings.push('Consider mixing question types (multiple-choice, true-false, multiple-select) for variety');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// EXPORT
// ============================================================================

export default QuizBuilder;
