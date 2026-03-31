// ============================================================================
// LMS SESSIONS: Live Sessions, Pathway Builder, ALO, Portfolio, Cohorts
// ============================================================================

import { type Timestamp } from 'firebase/firestore';

import type { TipTapDocument } from './content';
import type { ActivityConfig, ActivityEngineType } from './activity-engines';

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
