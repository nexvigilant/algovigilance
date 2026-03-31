// ============================================================================
// LMS ACTIVITY ENGINES: RedPen, Triage, Synthesis
// ============================================================================

import { type Timestamp } from 'firebase/firestore';

import type { QuizBlockConfig, ScenarioBlockConfig, CodePlaygroundConfig } from './content';

/**
 * Activity engine types for the 3 core ALO activity patterns:
 * - Red Pen: Error detection
 * - Triage: Decision making under pressure
 * - Synthesis: Work product creation
 */
export type ActivityEngineType = 'red-pen' | 'triage' | 'synthesis' | 'code' | 'quiz' | 'scenario';

// ============================================================================
// RED PEN ENGINE (Error Detection)
// ============================================================================

export interface RedPenConfig {
  id: string;
  title: string;
  instructions: string;
  document: string;             // Document with embedded errors (HTML/markdown)
  errors: RedPenError[];
  maxTimeSeconds?: number;
  partialCredit: boolean;
  falsPositivePenalty: number;  // Points deducted per false positive
}

export interface RedPenError {
  id: string;
  type: 'typo' | 'factual' | 'regulatory' | 'formatting' | 'omission' | 'contradiction';
  location: {
    startOffset: number;
    endOffset: number;
    selector?: string;          // CSS selector for DOM-based highlighting
  };
  severity: 'minor' | 'major' | 'critical';
  incorrectText: string;
  correctText?: string;
  explanation: string;
  points: number;
  hint?: string;
}

export interface RedPenSubmission {
  id: string;
  userId: string;
  activityId: string;
  identifiedErrors: RedPenIdentifiedError[];
  score: number;
  maxScore: number;
  timeSpentSeconds: number;
  submittedAt: Timestamp;
}

export interface RedPenIdentifiedError {
  errorId?: string;           // Matches a real error
  location: {
    startOffset: number;
    endOffset: number;
  };
  userExplanation?: string;
  isCorrect: boolean;         // True if matches a real error
  pointsAwarded: number;
}

// ============================================================================
// TRIAGE ENGINE (Decision Making)
// ============================================================================

export interface TriageConfig {
  id: string;
  title: string;
  scenario: string;             // Case description (TipTap JSON or markdown)
  questions: TriageQuestion[];
  maxTimeSeconds: number;       // Time pressure
  scoreBySpeed: boolean;        // ClassQuiz-style timing bonus
  passingScore: number;
}

export interface TriageQuestion {
  id: string;
  prompt: string;
  options: TriageOption[];
  logic?: TriageLogic[];        // Branching logic (heyform pattern)
  timeLimit?: number;           // Per-question time limit
}

export interface TriageOption {
  id: string;
  label: string;
  isOptimal: boolean;
  partialCredit?: number;       // 0-100 if not optimal but acceptable
  consequence?: string;         // What happens if chosen
  nextQuestionId?: string;      // For branching
  feedback?: string;            // Shown after selection
}

export interface TriageLogic {
  condition: TriageCondition;
  action: TriageAction;
}

export interface TriageCondition {
  type: 'selected' | 'not_selected' | 'score_above' | 'score_below' | 'time_remaining';
  value: string | number;
}

export interface TriageAction {
  type: 'navigate' | 'add_score' | 'subtract_score' | 'show_feedback' | 'end';
  target?: string;              // Question ID or feedback message
  value?: number;               // Score adjustment
}

export interface TriageSubmission {
  id: string;
  userId: string;
  activityId: string;
  answers: TriageAnswer[];
  totalScore: number;
  maxScore: number;
  timeBonus: number;
  timeSpentSeconds: number;
  submittedAt: Timestamp;
}

export interface TriageAnswer {
  questionId: string;
  selectedOptionId: string;
  isOptimal: boolean;
  pointsAwarded: number;
  timeSpentSeconds: number;
}

// ============================================================================
// SYNTHESIS ENGINE (Work Product Creation)
// ============================================================================

export interface SynthesisConfig {
  id: string;
  title: string;
  prompt: string;               // What to create (TipTap JSON or markdown)
  artifactType: 'document' | 'report' | 'presentation' | 'analysis' | 'code' | 'other';
  rubric: RubricItem[];
  aiAssisted: boolean;          // Allow AI drafting help
  maxLength?: number;           // Character/word limit
  templateId?: string;          // Starting template
  requiredElements?: string[];  // Must-include items
  dueDate?: Timestamp;
}

export interface RubricItem {
  id: string;
  criterion: string;
  description: string;
  weight: number;               // 0-100, all should sum to 100
  levels: RubricLevel[];
}

export interface RubricLevel {
  score: number;                // 0-4 (Novice to Expert)
  label: string;                // e.g., "Novice", "Developing", "Proficient", "Expert"
  description: string;
  indicators: string[];         // Observable behaviors for this level
  aiPrompt?: string;            // For AI-assisted evaluation
}

export interface SynthesisSubmission {
  id: string;
  userId: string;
  activityId: string;
  content: string;              // User's work product (markdown/HTML)
  attachments?: SynthesisAttachment[];
  rubricScores: RubricScore[];
  totalScore: number;
  feedback?: string;            // Instructor or AI feedback
  status: 'draft' | 'submitted' | 'graded' | 'returned';
  submittedAt?: Timestamp;
  gradedAt?: Timestamp;
  gradedBy?: string;            // User ID or 'ai'
}

export interface SynthesisAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export interface RubricScore {
  rubricItemId: string;
  level: number;                // 0-4
  feedback?: string;
}

// ============================================================================
// UNIFIED ACTIVITY CONFIG
// ============================================================================

export interface ActivityConfig {
  engine: ActivityEngineType;
  config: RedPenConfig | TriageConfig | SynthesisConfig | CodePlaygroundConfig | QuizBlockConfig | ScenarioBlockConfig;
}
