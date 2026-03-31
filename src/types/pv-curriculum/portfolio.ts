/**
 * Portfolio Types
 * User artifacts and progress tracking
 */

import type { ProficiencyLevel } from './core';

// ============================================================================
// PORTFOLIO TYPES
// ============================================================================

/**
 * Portfolio Artifact - User's saved work from KSB activities
 */
export interface PortfolioArtifact {
  id: string;
  userId: string;
  ksbId: string;
  domainId: string;

  // Artifact content
  artifactType: 'completion' | 'creation' | 'analysis' | 'decision_log';
  title: string;
  content: string; // JSON or markdown depending on type

  // Competency mapping
  competencyTags: string[]; // EPA IDs, CPA IDs
  proficiencyLevel: ProficiencyLevel;

  // Activity results
  activityResults?: {
    engineType: 'red_pen' | 'triage' | 'synthesis' | 'calculator' | 'timeline' | 'code_playground';
    score: number;
    timeSpent: number; // seconds
    feedback?: string;
    aiEvaluation?: AIEvaluation;
    // Calculator-specific results
    calculationsCorrect?: number;
    calculationsTotal?: number;
    // Timeline-specific results
    deadlinesCorrect?: number;
    deadlinesTotal?: number;
  };

  // Reflection
  reflectionResponse?: string;

  // Metadata
  status: 'draft' | 'submitted' | 'verified';
  createdAt: Date;
  updatedAt: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
}

/**
 * AI Evaluation Result - For Synthesis activities
 */
export interface AIEvaluation {
  overallScore: number;
  criteriaScores: {
    criterion: string;
    score: number;
    feedback: string;
  }[];
  strengths: string[];
  improvements: string[];
  modelUsed: string;
  evaluatedAt: Date;
}

/**
 * KSB Progress - User's progress through a KSB
 */
export interface KSBProgress {
  id: string;
  userId: string;
  ksbId: string;
  domainId: string;

  // Section completion
  sectionsCompleted: {
    hook: boolean;
    concept: boolean;
    activity: boolean;
    reflection: boolean;
  };

  // Activity attempts
  attempts: number;
  bestScore?: number;
  lastAttemptAt?: Date;

  // Overall status
  status: 'not_started' | 'in_progress' | 'completed' | 'mastered';
  completedAt?: Date;

  // Time tracking
  totalTimeSpent: number; // seconds

  createdAt: Date;
  updatedAt: Date;
}
