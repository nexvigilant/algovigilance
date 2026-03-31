/**
 * Service Discovery Wizard Types
 *
 * Type definitions for the adaptive service discovery wizard that guides
 * enterprise clients through a consultative journey to identify their needs.
 */

// =============================================================================
// Core Types
// =============================================================================

/**
 * The five consulting service categories offered by AlgoVigilance
 */
export type ServiceCategory = 'strategic' | 'innovation' | 'tactical' | 'talent' | 'technology' | 'maturity';

/**
 * Branch paths in the adaptive decision tree
 */
export type WizardBranch = 'challenge' | 'opportunity' | 'exploration' | null;

/**
 * Current screen/step in the wizard flow
 */
export type WizardScreen =
  | 'welcome'
  | 'question'
  | 'processing'
  | 'results'
  | 'booking';

// =============================================================================
// Question & Option Types
// =============================================================================

/**
 * Score weights for a single answer option
 * Partial because not every option affects all services
 */
export type ServiceScores = Partial<Record<ServiceCategory, number>>;

/**
 * An individual answer option within a question
 */
export interface WizardOption {
  /** Unique identifier for this option */
  id: string;
  /** Display text for the option */
  label: string;
  /** Optional description/subtext */
  description?: string;
  /** Score weights applied when this option is selected */
  scores: ServiceScores;
  /** ID of the next question to show (for branching) */
  nextQuestion?: string;
  /** Tags for outcome personalization */
  tags?: string[];
}

/**
 * A single question in the wizard flow
 */
export interface WizardQuestion {
  /** Unique identifier for this question */
  id: string;
  /** Main question text */
  text: string;
  /** Optional subtext/context helper */
  subtext?: string;
  /** Available answer options */
  options: WizardOption[];
  /** Which branch this question belongs to (for organization) */
  branch?: WizardBranch;
  /**
   * Condition function to determine if this question should be shown
   * Returns true if the question should appear in the flow
   */
  condition?: (state: WizardState) => boolean;
}

// =============================================================================
// State Types
// =============================================================================

/**
 * Complete wizard state at any point in the flow
 */
export interface WizardState {
  /** Current screen being displayed */
  screen: WizardScreen;
  /** Index of current question (within the resolved question flow) */
  questionIndex: number;
  /** Map of questionId -> selected optionId */
  answers: Record<string, string>;
  /** Accumulated scores for each service category */
  scores: Record<ServiceCategory, number>;
  /** Accumulated tags for outcome personalization */
  tags: string[];
  /** Current branch path (set after Q1) */
  branch: WizardBranch;
  /** Questions in the current flow (resolved based on branching) */
  questionFlow: string[];
  /** Loading/animation state */
  isProcessing: boolean;
}

/**
 * Initial state factory
 */
export const createInitialWizardState = (): WizardState => ({
  screen: 'welcome',
  questionIndex: 0,
  answers: {},
  scores: {
    strategic: 0,
    innovation: 0,
    tactical: 0,
    talent: 0,
    technology: 0,
    maturity: 0,
  },
  tags: [],
  branch: null,
  questionFlow: [],
  isProcessing: false,
});

// =============================================================================
// Recommendation Types
// =============================================================================

/**
 * A single service recommendation
 */
export interface ServiceRecommendation {
  /** Service category */
  category: ServiceCategory;
  /** Calculated score */
  score: number;
  /** Whether this is the primary (top) recommendation */
  isPrimary: boolean;
  /** Personalized outcomes based on user's answers */
  outcomes: string[];
  /** Headline for this recommendation */
  headline: string;
}

/**
 * Complete set of recommendations after wizard completion
 */
export interface WizardRecommendations {
  /** Primary recommendation (highest score) */
  primary: ServiceRecommendation;
  /** Secondary recommendations (above threshold) */
  secondary: ServiceRecommendation[];
  /** Personalized message based on branch and tags */
  personalizedMessage: string;
  /** Summary of what the user shared */
  situationSummary: string;
}

// =============================================================================
// Service Info Types
// =============================================================================

/**
 * Complete information about a service category for display
 */
export interface ServiceInfo {
  /** Display title */
  title: string;
  /** Short tagline */
  tagline: string;
  /** Icon name (lucide-react) */
  icon: string;
  /** Key outcomes/value propositions */
  outcomes: string[];
  /** Key deliverables */
  deliverables: string[];
  /** Color theme */
  color: 'cyan' | 'gold' | 'emerald' | 'purple' | 'blue';
  /** Link to detailed page (if available) */
  detailLink?: string;
}

// =============================================================================
// Action Types (for state management)
// =============================================================================

export type WizardAction =
  | { type: 'START_WIZARD' }
  | { type: 'SELECT_OPTION'; questionId: string; option: WizardOption }
  | { type: 'GO_BACK' }
  | { type: 'START_PROCESSING' }
  | { type: 'SHOW_RESULTS' }
  | { type: 'GO_TO_BOOKING' }
  | { type: 'RESET' };

// =============================================================================
// Scoring Configuration
// =============================================================================

/**
 * Threshold for including a service in secondary recommendations
 * Services with score >= (maxScore * threshold) are included
 */
export const RECOMMENDATION_THRESHOLD = 0.4;

/**
 * Minimum score difference for a service to be "clearly" the primary choice
 * If the gap is smaller, we may suggest multiple equally-weighted options
 */
export const CLEAR_PRIMARY_THRESHOLD = 2;
