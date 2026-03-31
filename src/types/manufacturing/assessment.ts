/**
 * Configuration for a behavioral exam
 */
export interface BehavioralExamConfig {
  proficiencyLevel: 1 | 2 | 3 | 4 | 5;
  observableBehaviors: string[];
  passingCriteria: {
    minScore: number;
    requiredBehaviors: string[];
  };
  scenarioComplexity: 'simple' | 'moderate' | 'complex';
}

/**
 * A complete behavioral exam
 */
export interface BehavioralExam {
  id: string;
  ksbIds: string[];
  scenarios: BehavioralScenario[];
  rubric: BehavioralRubric;
  timeLimit: number; // minutes
  attempts: number;
}

/**
 * A scenario within a behavioral exam
 */
export interface BehavioralScenario {
  id: string;
  narrative: string;
  decision_points: DecisionPoint[];
  expected_behaviors: string[];
  scoring: ScenarioScoring;
}

export interface DecisionPoint {
  id: string;
  question: string;
  options: DecisionOption[];
}

export interface DecisionOption {
  id: string;
  text: string;
  score: number;
  feedback: string;
  mappedBehaviors: string[];
}

export interface BehavioralRubric {
  criteria: {
    id: string;
    description: string;
    weight: number;
    levels: Record<number, string>; // level -> description
  }[];
}

export interface ScenarioScoring {
  maxScore: number;
  passingScore: number;
}

/**
 * Practical assessment for skill verification
 */
export interface PracticalAssessment {
  id: string;
  title: string;
  ksbIds: string[];
  type: 'case_analysis' | 'document_creation' | 'signal_detection' | 'report_generation';
  materials: {
    id: string;
    title: string;
    type: 'pdf' | 'csv' | 'json' | 'text';
    url?: string;
    content?: string;
  }[];
  deliverables: {
    id: string;
    title: string;
    type: 'document' | 'analysis' | 'presentation';
    requirements: string[];
  }[];
  evaluationCriteria: {
    id: string;
    title: string;
    description: string;
    points: number;
  }[];
  timeLimit: number;
}

/**
 * Capability verification status
 */
export interface CapabilityVerification {
  ksbId: string;
  userId: string;
  requiredEvidence: {
    aloCompletions: number;
    activityScore: number;
    examPassed: boolean;
    practicalPassed: boolean;
    portfolioArtifacts: number;
  };
  verificationStatus: 'not_started' | 'in_progress' | 'verified' | 'expired';
  verifiedAt?: Date;
  expiresAt?: Date;
}
