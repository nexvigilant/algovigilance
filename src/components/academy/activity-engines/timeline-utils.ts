// ============================================================================
// TIMELINE ENGINE — SHARED TYPES, HELPERS & GRADING LOGIC
// ============================================================================
// Not a client component — pure utility module with no React dependencies.

import type {
  TimelineConfig,
  TimelineResult,
  TimelineTaskResult,
} from '@/types/pv-curriculum/activity-engines/timeline';

export type EngineState = 'intro' | 'timeline' | 'review' | 'results';

export interface TaskAnswer {
  taskId: string;
  selectedDate?: string;
  selectedOrder?: string[];
  isCorrect?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse a YYYY-MM-DD string as a local date (not UTC)
 * Avoids timezone shifting issues when converting back
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format a date string for display (uses local time consistently)
 */
export function formatDate(dateStr: string): string {
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Add days to a date string, returning YYYY-MM-DD format
 * Uses local time throughout to avoid UTC shifting issues
 */
export function addDays(dateStr: string, days: number): string {
  const date = parseLocalDate(dateStr);
  date.setDate(date.getDate() + days);
  // Format as YYYY-MM-DD using local time (not toISOString which uses UTC)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate days between two date strings
 * Uses local time parsing to match addDays behavior
 */
export function daysBetween(date1: string, date2: string): number {
  const d1 = parseLocalDate(date1);
  const d2 = parseLocalDate(date2);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

// ============================================================================
// GRADING LOGIC
// ============================================================================

/**
 * Grade all task answers against correct answers and build a TimelineResult.
 * Shared between handleSubmit and handleAutoSubmit to avoid duplication.
 */
export function gradeAnswers(
  config: TimelineConfig,
  answers: TaskAnswer[],
  timeSpentSeconds: number
): TimelineResult {
  const taskResults: TimelineTaskResult[] = config.tasks.map((task) => {
    const answer = answers.find((a) => a.taskId === task.id);
    let isCorrect = false;
    let userAnswer: string | string[] | undefined;
    let correctAnswer: string | string[] = task.correctAnswer || '';

    if (task.taskType === 'calculate_deadline') {
      userAnswer = answer?.selectedDate;
      correctAnswer = task.correctAnswer as string;
      if (userAnswer && correctAnswer) {
        const daysDiff = Math.abs(daysBetween(userAnswer, correctAnswer));
        isCorrect = daysDiff <= (task.toleranceDays || 0);
      }
    } else if (task.taskType === 'order_events') {
      userAnswer = answer?.selectedOrder;
      correctAnswer = task.correctAnswer as string[];
      if (userAnswer && correctAnswer) {
        isCorrect = JSON.stringify(userAnswer) === JSON.stringify(correctAnswer);
      }
    } else if (task.taskType === 'identify_day0') {
      userAnswer = answer?.selectedDate;
      correctAnswer = task.correctAnswer as string;
      isCorrect = userAnswer === correctAnswer;
    }

    return { taskId: task.id, isCorrect, userAnswer, correctAnswer };
  });

  const correctAnswers = taskResults.filter((r) => r.isCorrect).length;
  const score = Math.round((correctAnswers / config.tasks.length) * 100);

  return {
    score,
    totalTasks: config.tasks.length,
    correctAnswers,
    taskResults,
    timeSpentSeconds,
    completedAt: new Date(),
  };
}
