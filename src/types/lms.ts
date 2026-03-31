/**
 * LMS (Learning Management System) Types
 *
 * Comprehensive type definitions for the Academy LMS platform.
 * Extends academy.ts with:
 * - TipTap content models
 * - Activity engine configurations
 * - Gamification (badges, levels, points)
 * - Real-time session types
 * - Course builder types
 *
 * Source patterns from:
 * - learnhouse (TipTap extensions)
 * - heyform (branching logic)
 * - ClassQuiz (real-time scoring)
 * - skills-service (gamification)
 * - livecodes (code playground)
 */

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

// ============================================================================
// ACTIVITY ENGINES
// ============================================================================

/**
 * Activity engine types for the 3 core ALO activity patterns:
 * - Red Pen: Error detection
 * - Triage: Decision making under pressure
 * - Synthesis: Work product creation
 */

export type ActivityEngineType = 'red-pen' | 'triage' | 'synthesis' | 'code' | 'quiz' | 'scenario';

// --- RED PEN ENGINE (Error Detection) ---

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

// --- TRIAGE ENGINE (Decision Making) ---

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

// --- SYNTHESIS ENGINE (Work Product Creation) ---

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
// GAMIFICATION (from skills-service patterns)
// ============================================================================

// --- POINTS & LEVELS ---

export interface Level {
  level: number;
  name: string;
  minPoints: number;
  maxPoints: number;            // Infinity for top level
  icon: string;                 // Emoji or icon class
  color: string;                // Tailwind color class
  benefits: string[];           // Unlocked features
}

export interface UserLevel {
  userId: string;
  currentLevel: number;
  currentPoints: number;
  pointsToNextLevel: number;
  updatedAt: Timestamp;
}

export const PV_LEVELS: Level[] = [
  { level: 1, name: 'Observer', minPoints: 0, maxPoints: 100, icon: '👁️', color: 'text-slate-400', benefits: [] },
  { level: 2, name: 'Reporter', minPoints: 101, maxPoints: 300, icon: '📝', color: 'text-blue-400', benefits: ['Basic case entry'] },
  { level: 3, name: 'Analyst', minPoints: 301, maxPoints: 600, icon: '🔍', color: 'text-cyan-400', benefits: ['Signal detection tools'] },
  { level: 4, name: 'Specialist', minPoints: 601, maxPoints: 1000, icon: '⭐', color: 'text-gold', benefits: ['Advanced analytics'] },
  { level: 5, name: 'Expert', minPoints: 1001, maxPoints: 2000, icon: '🏆', color: 'text-amber-400', benefits: ['Mentorship access'] },
  { level: 6, name: 'Master', minPoints: 2001, maxPoints: Infinity, icon: '👑', color: 'text-purple-400', benefits: ['All access', 'Content creation'] },
];

// --- BADGES ---

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;                 // Emoji or icon URL
  color: string;                // Background color class
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  requirements: BadgeRequirement[];
  isSecret: boolean;            // Hidden until earned
  createdAt: Timestamp;
}

export interface BadgeRequirement {
  type: 'activity_count' | 'accuracy' | 'streak' | 'points' | 'level' | 'domain_mastery' | 'custom';
  activityType?: ActivityEngineType;
  domainId?: string;
  threshold: number;            // Count, percentage, or level
  minCount?: number;            // For accuracy: minimum attempts
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  earnedAt: Timestamp;
  progress?: number;            // 0-100 if not yet earned
}

// --- STREAKS ---

export interface Streak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;     // YYYY-MM-DD
  streakHistory: StreakDay[];   // Last 90 days
  updatedAt: Timestamp;
}

export interface StreakDay {
  date: string;                 // YYYY-MM-DD
  activitiesCompleted: number;
  pointsEarned: number;
}

// --- LEADERBOARDS ---

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  score: number;
  rank: number;
  trend: 'up' | 'down' | 'stable';
  previousRank?: number;
}

export interface Leaderboard {
  id: string;
  type: 'global' | 'domain' | 'cohort' | 'weekly' | 'monthly';
  domainId?: string;
  cohortId?: string;
  entries: LeaderboardEntry[];
  period?: {
    start: Timestamp;
    end: Timestamp;
  };
  updatedAt: Timestamp;
}

// ============================================================================
// REAL-TIME SESSIONS (from ClassQuiz patterns)
// ============================================================================

export interface LiveSession {
  id: string;
  pin: string;                  // 6-8 digit join code
  hostId: string;
  quizId: string;
  title: string;
  status: 'lobby' | 'in_progress' | 'question' | 'results' | 'leaderboard' | 'ended';
  currentQuestionIndex: number;
  players: LivePlayer[];
  settings: LiveSessionSettings;
  createdAt: Timestamp;
  startedAt?: Timestamp;
  endedAt?: Timestamp;
}

export interface LivePlayer {
  odUserId: string;
  odUsername: string;
  avatarUrl?: string;
  score: number;
  answers: LiveAnswer[];
  rank: number;
  isConnected: boolean;
  joinedAt: Timestamp;
}

export interface LiveAnswer {
  questionIndex: number;
  answer: string | string[];
  isCorrect: boolean;
  timeMs: number;               // Time to answer
  score: number;                // Points earned (with time bonus)
}

export interface LiveSessionSettings {
  questionsCount: number;
  timePerQuestion: number;      // Seconds
  showLeaderboardAfterEach: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  allowLateJoin: boolean;
  maxPlayers: number;
}

export interface LiveQuestion {
  index: number;
  question: string;
  options: string[];
  correctAnswer: string | string[];
  timeLimit: number;
  points: number;
  imageUrl?: string;
}

// ============================================================================
// PATHWAY BUILDER TYPES (was Course Builder)
// ============================================================================

export interface PathwayBuilderDraft {
  id: string;
  authorId: string;
  title: string;
  description: string;
  status: 'draft' | 'review' | 'published' | 'archived';
  visibility: 'private' | 'unlisted' | 'public';
  modules: StageBuilderDraft[];
  metadata: PathwayMetadata;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt?: Timestamp;
  lastEditedBy: string;
}

/** @deprecated Use `PathwayBuilderDraft` instead */
export type CourseBuilderDraft = PathwayBuilderDraft;

export interface StageBuilderDraft {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: ActivityBuilderDraft[];
  isExpanded?: boolean;         // UI state
}

/** @deprecated Use `StageBuilderDraft` instead */
export type ModuleBuilderDraft = StageBuilderDraft;

export interface ActivityBuilderDraft {
  id: string;
  title: string;
  type: 'content' | 'video' | 'quiz' | 'activity' | 'assignment';
  content: TipTapDocument;
  order: number;
  duration: number;             // Minutes
  activityConfig?: ActivityConfig;
  videoConfig?: VideoConfig;
  isPublished: boolean;
}

/** @deprecated Use `ActivityBuilderDraft` instead */
export type LessonBuilderDraft = ActivityBuilderDraft;

export interface ActivityConfig {
  engine: ActivityEngineType;
  config: RedPenConfig | TriageConfig | SynthesisConfig | CodePlaygroundConfig | QuizBlockConfig | ScenarioBlockConfig;
}

export interface VideoConfig {
  url: string;
  provider: 'youtube' | 'vimeo' | 'bunny' | 'cloudflare';
  duration: number;             // Seconds
  timestamps?: VideoTimestamp[];
  transcript?: string;
}

export interface VideoTimestamp {
  id: string;
  title: string;
  description?: string;
  seconds: number;
}

export interface PathwayMetadata {
  estimatedDuration: number;    // Minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  targetAudience: string[];
  prerequisites: string[];
  learningObjectives: string[];
  skills: string[];             // Skill IDs
  domainIds: string[];          // PV domain IDs
  thumbnailUrl?: string;
  previewVideoUrl?: string;
}

/** @deprecated Use `PathwayMetadata` instead */
export type CourseMetadata = PathwayMetadata;

// ============================================================================
// ALO (Atomic Learning Object) TYPES
// ============================================================================

/**
 * ALO: 5-10 minute focused learning unit
 * Structure: Hook (30s) → Concept (2min) → Activity (5min) → Reflection (30s)
 */
export interface ALO {
  id: string;
  lessonId: string;
  order: number;
  hook: ALOHook;
  concept: ALOConcept;
  activity: ALOActivity;
  reflection: ALOReflection;
  metadata: ALOMetadata;
}

export interface ALOHook {
  type: 'question' | 'statistic' | 'scenario' | 'video';
  content: string;              // TipTap JSON or markdown
  duration: number;             // Seconds (target: 30s)
}

export interface ALOConcept {
  content: TipTapDocument;
  keyPoints: string[];
  duration: number;             // Seconds (target: 2min)
}

export interface ALOActivity {
  engine: ActivityEngineType;
  config: ActivityConfig;
  duration: number;             // Seconds (target: 5min)
  optional: boolean;
}

export interface ALOReflection {
  prompt: string;
  type: 'freeform' | 'checklist' | 'rating';
  options?: string[];           // For checklist
  portfolioPrompt?: string;     // Optional portfolio connection
  duration: number;             // Seconds (target: 30s)
}

export interface ALOMetadata {
  ksbIds: string[];             // Related KSBs
  domainId?: string;
  epaId?: string;
  estimatedDuration: number;    // Total seconds
  points: number;               // Gamification points
}

// ============================================================================
// PORTFOLIO TYPES
// ============================================================================

export interface PortfolioItem {
  id: string;
  userId: string;
  type: 'synthesis' | 'reflection' | 'code' | 'document' | 'external';
  title: string;
  description?: string;
  content?: string;             // For text-based items
  fileUrl?: string;             // For file uploads
  externalUrl?: string;         // For external work
  sourceActivity: {
    lessonId: string;
    aloId?: string;
    activityId: string;
    activityType: ActivityEngineType;
  };
  skills: string[];             // Demonstrated skills
  ksbIds: string[];             // Related KSBs
  visibility: 'private' | 'portfolio' | 'public';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Portfolio {
  userId: string;
  items: PortfolioItem[];
  summary: PortfolioSummary;
  updatedAt: Timestamp;
}

export interface PortfolioSummary {
  totalItems: number;
  byType: Record<string, number>;
  skillsCovered: string[];
  ksbsCovered: string[];
  lastActivityAt: Timestamp;
}

// ============================================================================
// COHORT & ENROLLMENT MANAGEMENT
// ============================================================================

export interface Cohort {
  id: string;
  name: string;
  description?: string;
  courseId: string;
  instructorIds: string[];
  memberIds: string[];
  status: 'upcoming' | 'active' | 'completed' | 'archived';
  startDate: Timestamp;
  endDate?: Timestamp;
  settings: CohortSettings;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CohortSettings {
  maxMembers: number;
  selfEnrollment: boolean;
  requireApproval: boolean;
  paceType: 'self-paced' | 'instructor-led' | 'cohort-paced';
  deadlines?: CohortDeadline[];
  enableDiscussion: boolean;
  enableLeaderboard: boolean;
}

export interface CohortDeadline {
  moduleId: string;
  dueDate: Timestamp;
  isHard: boolean;              // Hard deadline vs suggested
}

export interface CohortMember {
  cohortId: string;
  odUserId: string;
  role: 'practitioner' | 'ta' | 'instructor';
  enrolledAt: Timestamp;
  progress: number;             // 0-100
  lastActivityAt: Timestamp;
  status: 'active' | 'inactive' | 'completed' | 'dropped';
}

// ============================================================================
// UNIFIED PROGRESS TRACKING (integrates with FSRS)
// ============================================================================

/**
 * Unified progress document for a user's learning journey.
 * Aggregates lesson completion, FSRS data, gamification, and streaks.
 *
 * Firestore: /progress/{odUserId}_{courseId}
 */
export interface UnifiedProgress {
  id: string;                     // userId_courseId composite
  userId: string;
  courseId: string;

  // --- Lesson Completion ---
  completedLessons: LessonCompletion[];
  currentModuleId: string;
  currentLessonId: string;
  overallProgress: number;        // 0-100

  // --- Activity Scores ---
  activityScores: ActivityScore[];
  averageActivityScore: number;   // 0-100

  // --- FSRS Integration ---
  fsrs: FSRSProgressSummary;

  // --- Gamification ---
  pointsEarned: number;
  badgesEarned: string[];         // Badge IDs
  currentLevel: number;

  // --- Timing ---
  totalTimeSpent: number;         // Minutes
  startedAt: Timestamp;
  lastAccessedAt: Timestamp;
  completedAt?: Timestamp;

  // --- Streak (course-specific) ---
  streakDays: number;
  lastActivityDate: string;       // YYYY-MM-DD
}

export interface LessonCompletion {
  lessonId: string;
  moduleId: string;
  completedAt: Timestamp;
  timeSpent: number;              // Minutes
  attempts: number;
  bestScore?: number;             // For quizzes/activities
}

export interface ActivityScore {
  activityId: string;
  lessonId: string;
  activityType: ActivityEngineType;
  score: number;                  // 0-100
  maxScore: number;
  attempts: number;
  bestAttemptAt: Timestamp;
  timeSpent: number;              // Seconds
}

export interface FSRSProgressSummary {
  totalCards: number;
  cardsLearning: number;
  cardsReview: number;
  cardsRelearning: number;
  cardsDueToday: number;
  averageRetention: number;       // 0-1
  averageStability: number;       // Days
  streakDays: number;
  lastReviewAt?: Timestamp;
}

/**
 * Daily activity snapshot for streak tracking.
 * Firestore: /user_activity/{odUserId}/days/{YYYY-MM-DD}
 */
export interface DailyActivity {
  date: string;                   // YYYY-MM-DD
  userId: string;

  // Activity counts
  lessonsCompleted: number;
  activitiesCompleted: number;
  quizzesCompleted: number;
  fsrsReviewsCompleted: number;

  // Scores
  pointsEarned: number;
  averageScore: number;

  // Time
  totalTimeMinutes: number;

  // Details
  courseIds: string[];            // Courses touched
  ksbIds: string[];               // KSBs reviewed (FSRS)
}

/**
 * Aggregated user stats across all courses.
 * Firestore: /user_stats/{odUserId}
 */
export interface UserStats {
  userId: string;

  // Aggregate counts
  coursesEnrolled: number;
  coursesCompleted: number;
  lessonsCompleted: number;
  activitiesCompleted: number;
  quizzesCompleted: number;

  // Gamification
  totalPoints: number;
  currentLevel: number;
  badgesEarned: string[];

  // FSRS aggregate
  totalFSRSCards: number;
  averageRetention: number;
  totalReviews: number;

  // Streaks
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;

  // Time
  totalLearningTimeMinutes: number;
  averageDailyTimeMinutes: number;

  // Timestamps
  firstActivityAt: Timestamp;
  lastActivityAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Event types for activity logging and analytics.
 */
export type LearningEventType =
  | 'lesson_started'
  | 'lesson_completed'
  | 'activity_started'
  | 'activity_completed'
  | 'quiz_started'
  | 'quiz_completed'
  | 'fsrs_review'
  | 'badge_earned'
  | 'level_up'
  | 'course_started'
  | 'course_completed';

/**
 * Learning event for real-time tracking and analytics.
 * Can be stored in Firestore or sent to analytics pipeline.
 */
export interface LearningEvent {
  id: string;
  userId: string;
  eventType: LearningEventType;
  timestamp: Timestamp;

  // Context
  courseId?: string;
  moduleId?: string;
  lessonId?: string;
  activityId?: string;
  ksbId?: string;

  // Outcome
  score?: number;
  pointsEarned?: number;
  badgeId?: string;
  newLevel?: number;
  fsrsRating?: number;            // 1-4

  // Metadata
  timeSpentSeconds?: number;
  attempts?: number;
  deviceType?: string;
  sessionId?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Pagination parameters for list queries
 */
export interface PaginationParams {
  limit: number;
  offset?: number;
  cursor?: string;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * Standard API response wrapper
 */
export interface LMSResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
