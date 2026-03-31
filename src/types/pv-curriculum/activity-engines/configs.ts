/**
 * Activity Engine Configurations
 * Red Pen, Triage, and Synthesis engine configs
 */

// ============================================================================
// RED PEN ENGINE
// ============================================================================

/**
 * Red Pen Activity Engine
 * Error detection in documents - find and categorize issues
 */
export interface RedPenConfig {
  documentContent: string;
  documentType: 'case_narrative' | 'safety_report' | 'regulatory_submission' | 'sop' | 'protocol';
  errors: RedPenError[];
  passingScore: number; // Percentage of errors to find
  feedbackOnMiss: boolean;
}

export interface RedPenError {
  id: string;
  location: string; // Text span or identifier
  errorType: 'factual' | 'procedural' | 'regulatory' | 'terminology' | 'completeness' | 'formatting';
  severity: 'critical' | 'major' | 'minor';
  explanation: string;
  correctVersion?: string;

  // Source traceability
  sourceCase?: string;                // Real case ID this error was based on
  frequency?: 'common' | 'occasional' | 'rare';  // How often this occurs in practice
  regulatoryImpact?: string;          // Why this matters from regulatory perspective
  industryPrevalence?: number;        // % of cases with this error type (0-100)
}

// ============================================================================
// TRIAGE ENGINE
// ============================================================================

/**
 * Triage Activity Engine
 * Rapid decision making under time pressure
 */
export interface TriageConfig {
  scenario: string;
  timeConstraint: number; // seconds per decision
  decisions: TriageDecision[];
  scoringWeights: {
    accuracy: number;
    speed: number;
    justification: number;
  };
  /** Enable branching logic - decisions can lead to different paths */
  branchingEnabled?: boolean;
  /** Starting decision ID (defaults to first in array) */
  startDecisionId?: string;
  /** Ending decision IDs that complete the triage */
  endDecisionIds?: string[];
}

export interface TriageDecision {
  id: string;
  prompt: string;
  options: TriageOption[];
  correctOptionId: string;
  rationale: string;
  followUp?: string; // Additional context after decision

  // Source traceability
  basedOnCase?: string;               // Real case ID "XYZ-2023-001"
  industryBenchmark?: string;         // What experts typically decide
  decisionFrequency?: {               // How often each option is chosen in practice
    optionId: string;
    percentage: number;
  }[];
  regulatoryBasis?: string;           // Guideline that supports correct answer
}

export interface TriageOption {
  id: string;
  label: string;
  description?: string;
  /** Next decision ID for branching (only used when branchingEnabled=true) */
  nextDecisionId?: string;
  /** Condition that must be met for this option to be shown */
  showCondition?: BranchCondition;
}

// ============================================================================
// BRANCHING LOGIC (for Triage Engine)
// ============================================================================

/**
 * Branch Condition
 * Determines visibility or flow based on previous answers
 */
export interface BranchCondition {
  /** Type of condition check */
  type: 'previous_answer' | 'score_threshold' | 'all_of' | 'any_of';
  /** For previous_answer: the decision ID to check */
  decisionId?: string;
  /** For previous_answer: the required option ID */
  requiredOptionId?: string;
  /** For score_threshold: minimum score required */
  minScore?: number;
  /** For all_of/any_of: nested conditions */
  conditions?: BranchCondition[];
}

/**
 * Logic Engine Configuration
 * Standalone logic engine for complex branching scenarios
 */
export interface LogicEngineConfig {
  /** Variables that track state during the activity */
  variables: LogicVariable[];
  /** Rules that evaluate conditions and update variables */
  rules: LogicRule[];
}

export interface LogicVariable {
  id: string;
  name: string;
  type: 'boolean' | 'number' | 'string';
  defaultValue: boolean | number | string;
}

export interface LogicRule {
  id: string;
  /** Trigger: when should this rule run */
  trigger: 'on_answer' | 'on_complete' | 'always';
  /** Condition to check */
  condition: BranchCondition;
  /** Action to take when condition is met */
  action: LogicAction;
}

export interface LogicAction {
  type: 'set_variable' | 'show_message' | 'goto_decision' | 'end_activity';
  variableId?: string;
  value?: boolean | number | string;
  message?: string;
  decisionId?: string;
}

// ============================================================================
// SYNTHESIS ENGINE
// ============================================================================

/**
 * Synthesis Activity Engine
 * Creation tasks with AI-powered evaluation
 */
export interface SynthesisConfig {
  prompt: string;
  outputFormat: 'narrative' | 'structured' | 'form' | 'analysis' | 'recommendation';
  constraints: SynthesisConstraint[];
  evaluationCriteria: SynthesisEvaluationCriterion[];
  exampleOutput?: string;
  maxLength?: number; // characters
}

export interface SynthesisConstraint {
  type: 'include' | 'exclude' | 'format' | 'length' | 'terminology';
  description: string;
  required: boolean;
}

export interface SynthesisEvaluationCriterion {
  name: string;
  description: string;
  weight: number; // 0-1
  rubric: {
    excellent: string;
    good: string;
    needsImprovement: string;
  };
}

// ============================================================================
// CODE PLAYGROUND ENGINE
// ============================================================================

/**
 * Code Playground Activity Engine
 * Interactive coding exercises with validation using LiveCodes
 * Supports Python, SQL, JavaScript for PV data analysis tasks
 */
export interface CodePlaygroundConfig {
  /** Exercise title */
  title: string;
  /** Detailed instructions for the practitioner */
  instructions: string;
  /** Programming language for the exercise */
  language: 'python' | 'sql' | 'javascript' | 'typescript';
  /** Starter code provided to the practitioner */
  starterCode: string;
  /** Solution code (shown after completion or on hint) */
  solutionCode: string;
  /** Test cases for validation */
  testCases: CodeTestCase[];
  /** Expected output for result validation */
  expectedOutput?: string;
  /** Hints available to the practitioner */
  hints?: CodeHint[];
  /** Time limit in minutes (optional) */
  timeLimitMinutes?: number;
  /** Minimum passing score (0-100) */
  passingScore: number;
  /** Context for PV-specific exercises */
  pvContext?: {
    /** Sample data to work with */
    sampleData?: string;
    /** Real-world scenario description */
    scenario?: string;
    /** Related regulatory requirements */
    regulatoryBasis?: string;
  };
}

export interface CodeTestCase {
  id: string;
  description: string;
  /** Input to pass to the code (for function testing) */
  input?: string;
  /** Expected output or return value */
  expectedOutput: string;
  /** Weight for scoring (0-1) */
  weight: number;
  /** Whether this test is hidden until submission */
  hidden?: boolean;
}

export interface CodeHint {
  id: string;
  /** When to show this hint (after N failed attempts) */
  showAfterAttempts: number;
  /** Hint content */
  content: string;
  /** Score penalty for using this hint (0-1) */
  scorePenalty: number;
}
