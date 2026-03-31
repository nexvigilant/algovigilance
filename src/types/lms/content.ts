// ============================================================================
// LMS CONTENT TYPES: TipTap, Quiz Blocks, Scenario, Flipcard, Code Playground
// ============================================================================

import { type Timestamp } from 'firebase/firestore';

// ============================================================================
// TIPTAP CONTENT MODELS
// ============================================================================

/**
 * TipTap document structure for rich content editing.
 * Used in lessons, ALOs, and activity prompts.
 */
export interface TipTapDocument {
  type: 'doc';
  content: TipTapNode[];
}

export interface TipTapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  marks?: TipTapMark[];
  text?: string;
}

export interface TipTapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

/**
 * Custom TipTap block types for Academy content.
 */
export type TipTapBlockType =
  | 'paragraph'
  | 'heading'
  | 'bulletList'
  | 'orderedList'
  | 'blockquote'
  | 'codeBlock'
  | 'horizontalRule'
  | 'image'
  | 'video'
  | 'quizBlock'       // Custom: Inline quiz
  | 'scenarioBlock'   // Custom: Branching scenario
  | 'flipcardBlock'   // Custom: Spaced repetition card
  | 'codePlayground'  // Custom: livecodes embed
  | 'callout'         // Custom: Info/warning/tip boxes
  | 'pdfEmbed';       // Custom: PDF viewer

// ============================================================================
// QUIZ BLOCK (from learnhouse patterns)
// ============================================================================

export interface QuizBlockConfig {
  id: string;
  questions: QuizBlockQuestion[];
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showFeedback: boolean;
  allowRetry: boolean;
  passingScore: number; // 0-100
}

export interface QuizBlockQuestion {
  id: string;
  type: 'single-choice' | 'multiple-choice' | 'true-false' | 'short-answer';
  question: string;
  options?: QuizBlockOption[];
  correctAnswer: string | string[]; // For short-answer, accept multiple correct answers
  explanation?: string;
  points: number;
  hint?: string;
}

export interface QuizBlockOption {
  id: string;
  label: string;
  isCorrect: boolean;
}

// ============================================================================
// SCENARIO BLOCK (from learnhouse + heyform patterns)
// ============================================================================

export interface ScenarioBlockConfig {
  id: string;
  title: string;
  description?: string;
  startNodeId: string;
  nodes: ScenarioNode[];
  scoring: ScenarioScoringConfig;
}

export interface ScenarioNode {
  id: string;
  type: 'content' | 'decision' | 'outcome' | 'feedback';
  content: string; // TipTap JSON stringified or markdown
  options?: ScenarioOption[];
  outcome?: ScenarioOutcome;
}

export interface ScenarioOption {
  id: string;
  label: string;
  nextNodeId: string;
  score?: number;        // Points for this choice
  isOptimal?: boolean;   // Best path indicator
  consequence?: string;  // Brief outcome description
}

export interface ScenarioOutcome {
  type: 'success' | 'partial' | 'failure';
  message: string;
  score: number;
  feedback?: string;
}

export interface ScenarioScoringConfig {
  maxScore: number;
  passingScore: number;
  timeBonus: boolean;      // Extra points for speed (ClassQuiz pattern)
  timeLimitSeconds?: number;
}

// ============================================================================
// FLIPCARD BLOCK (Spaced Repetition)
// ============================================================================

export interface FlipcardBlockConfig {
  id: string;
  cards: Flipcard[];
  enableFSRS: boolean;     // Track with FSRS algorithm
  shuffleCards: boolean;
}

export interface Flipcard {
  id: string;
  front: string;           // Question/prompt (TipTap JSON or markdown)
  back: string;            // Answer/explanation
  hints?: string[];
  tags?: string[];
  ksbId?: string;          // Link to KSB for FSRS tracking
}

// ============================================================================
// CODE PLAYGROUND BLOCK (from livecodes)
// ============================================================================

export interface CodePlaygroundConfig {
  id: string;
  language: CodeLanguage;
  starterCode: string;
  testCases?: CodeTestCase[];
  instructions: string;
  hints?: string[];
  solution?: string;       // Instructor reference solution
  runnable: boolean;       // Allow execution
  testable: boolean;       // Show test results
  maxExecutionTime: number; // Milliseconds
}

export type CodeLanguage =
  | 'python'
  | 'javascript'
  | 'typescript'
  | 'sql'
  | 'r'
  | 'html'
  | 'css';

export interface CodeTestCase {
  id: string;
  name: string;
  input?: string;
  expectedOutput: string;
  hidden: boolean;         // Don't show to learner
  points: number;
}

export interface CodeSubmission {
  id: string;
  userId: string;
  playgroundId: string;
  code: string;
  language: CodeLanguage;
  testResults: CodeTestResult[];
  score: number;           // 0-100
  submittedAt: Timestamp;
  executionTimeMs: number;
}

export interface CodeTestResult {
  testCaseId: string;
  passed: boolean;
  actualOutput?: string;
  error?: string;
  executionTimeMs: number;
}
