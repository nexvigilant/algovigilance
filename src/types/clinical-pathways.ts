/**
 * Clinical Pathways Types
 *
 * Type definitions for the user-friendly PV workflow system designed for
 * non-technical healthcare professionals (pharmacists, nurses, physicians).
 *
 * Design Principles:
 * 1. Clinical language, not regulatory jargon
 * 2. Progressive disclosure (one question per screen)
 * 3. Smart defaults from patterns
 * 4. Prevent errors > catch errors
 * 5. ALCOA+ compliant audit trail
 *
 * @see docs/technical/CLINICAL-PATHWAYS-SPEC.md for implementation details
 */

import { Timestamp } from 'firebase/firestore';

// =============================================================================
// Branded ID Types
// =============================================================================

/** Branded string type for HCP User IDs */
export type HCPUserId = string & { readonly __brand: 'HCPUserId' };

/** Branded string type for Pathway IDs */
export type PathwayId = string & { readonly __brand: 'PathwayId' };

/** Branded string type for Pathway State IDs */
export type PathwayStateId = string & { readonly __brand: 'PathwayStateId' };

/** Branded string type for Case IDs */
export type CaseId = string & { readonly __brand: 'CaseId' };

/** Branded string type for Facility IDs */
export type FacilityId = string & { readonly __brand: 'FacilityId' };

// =============================================================================
// Serialization Types
// =============================================================================

/**
 * Serialized representation of a Firestore Timestamp.
 */
export interface SerializedTimestamp {
  readonly seconds: number;
  readonly nanoseconds: number;
}

// =============================================================================
// User Types
// =============================================================================

/**
 * Clinical domain/profession of the user.
 */
export type ClinicalDomain =
  | 'pharmacist'
  | 'nurse'
  | 'physician'
  | 'qa_specialist'
  | 'regulatory_affairs'
  | 'medical_writer';

/**
 * All valid clinical domains.
 */
export const CLINICAL_DOMAINS: readonly ClinicalDomain[] = [
  'pharmacist', 'nurse', 'physician', 'qa_specialist', 'regulatory_affairs', 'medical_writer'
] as const;

/**
 * Type guard for ClinicalDomain.
 */
export function isClinicalDomain(value: string): value is ClinicalDomain {
  return CLINICAL_DOMAINS.includes(value as ClinicalDomain);
}

/**
 * Healthcare professional user profile.
 * Captures clinical expertise and tech proficiency for adaptive guidance.
 */
export interface HCPUser {
  /** Unique user identifier */
  readonly id: HCPUserId;
  /** Primary clinical domain */
  readonly domain: ClinicalDomain;
  /** Clinical expertise level (0-1, higher = more experienced) */
  readonly expertiseLevel: number;
  /** Technology proficiency (0-1, typically 0.2-0.4 for target users) */
  readonly techProficiency: number;
  /** Facility/organization ID */
  readonly facilityId: FacilityId;
  /** Recent case IDs for smart defaults */
  readonly recentCases: readonly CaseId[];
  /** Preferred language code */
  readonly preferredLanguage?: string;
}

/**
 * Guidance level based on user profile.
 * - high: Step-by-step with extensive help (techProficiency < 0.3)
 * - medium: Guided with available help (0.3 <= techProficiency < 0.6)
 * - low: Streamlined for experienced users (techProficiency >= 0.6)
 */
export type GuidanceLevel = 'high' | 'medium' | 'low';

/**
 * All valid guidance levels.
 */
export const GUIDANCE_LEVELS: readonly GuidanceLevel[] = ['high', 'medium', 'low'] as const;

/**
 * Type guard for GuidanceLevel.
 */
export function isGuidanceLevel(value: string): value is GuidanceLevel {
  return GUIDANCE_LEVELS.includes(value as GuidanceLevel);
}

// =============================================================================
// Pathway Types
// =============================================================================

/**
 * Types of PV tasks that can be navigated.
 */
export type PVTaskType =
  | 'icsr_submission'        // Individual Case Safety Report
  | 'icsr_followup'          // Follow-up to existing case
  | 'literature_review'      // Literature case processing
  | 'signal_triage'          // Signal detection triage
  | 'quality_review'         // QC review of submissions
  | 'expedited_report'       // 15-day expedited reporting
  | 'periodic_report';       // PSUR/PBRER contribution

/** All valid PV task types. */
export const PV_TASK_TYPES: readonly PVTaskType[] = [
  'icsr_submission', 'icsr_followup', 'literature_review', 'signal_triage',
  'quality_review', 'expedited_report', 'periodic_report'
] as const;

/** Type guard for PVTaskType. */
export function isPVTaskType(value: string): value is PVTaskType {
  return PV_TASK_TYPES.includes(value as PVTaskType);
}

/**
 * State types within a pathway.
 */
export type PathwayStateType =
  | 'question'      // Single question with options
  | 'data_entry'    // Form field input
  | 'multi_field'   // Multiple related fields
  | 'confirmation'  // Review before action
  | 'terminal';     // End state (success/escalation)

/** All valid pathway state types. */
export const PATHWAY_STATE_TYPES: readonly PathwayStateType[] = [
  'question', 'data_entry', 'multi_field', 'confirmation', 'terminal'
] as const;

/** Type guard for PathwayStateType. */
export function isPathwayStateType(value: string): value is PathwayStateType {
  return PATHWAY_STATE_TYPES.includes(value as PathwayStateType);
}

/**
 * Regulatory classification of a case.
 */
export type SeriousnessClassification =
  | 'non_serious'
  | 'serious_hospitalization'
  | 'serious_life_threatening'
  | 'serious_disability'
  | 'serious_congenital'
  | 'serious_death'
  | 'serious_other';

/** All valid seriousness classifications. */
export const SERIOUSNESS_CLASSIFICATIONS: readonly SeriousnessClassification[] = [
  'non_serious', 'serious_hospitalization', 'serious_life_threatening',
  'serious_disability', 'serious_congenital', 'serious_death', 'serious_other'
] as const;

/** Type guard for SeriousnessClassification. */
export function isSeriousnessClassification(value: string): value is SeriousnessClassification {
  return SERIOUSNESS_CLASSIFICATIONS.includes(value as SeriousnessClassification);
}

/**
 * Causality assessment outcome.
 */
export type CausalityAssessment =
  | 'certain'
  | 'probable'
  | 'possible'
  | 'unlikely'
  | 'conditional'
  | 'unassessable';

/** All valid causality assessments. */
export const CAUSALITY_ASSESSMENTS: readonly CausalityAssessment[] = [
  'certain', 'probable', 'possible', 'unlikely', 'conditional', 'unassessable'
] as const;

/** Type guard for CausalityAssessment. */
export function isCausalityAssessment(value: string): value is CausalityAssessment {
  return CAUSALITY_ASSESSMENTS.includes(value as CausalityAssessment);
}

// =============================================================================
// Pathway State & Navigation
// =============================================================================

/**
 * Help content for a pathway state.
 */
export interface PathwayHelpContent {
  /** Main explanation in clinical terms */
  readonly explanation: string;
  /** Clinical analogy mapped by domain */
  readonly clinicalAnalogies: Partial<Record<ClinicalDomain, string>>;
  /** Common mistakes to avoid */
  readonly commonMistakes: readonly string[];
  /** Regulatory reference (collapsible) */
  readonly regulatoryReference?: string;
  /** Link to detailed help */
  readonly helpLink?: string;
}

/**
 * A single option within a question state.
 */
export interface PathwayOption {
  /** Unique option identifier */
  readonly id: string;
  /** Display label */
  readonly label: string;
  /** Clinical description explaining the choice */
  readonly clinicalDescription: string;
  /** Next state ID if this option is selected */
  readonly nextStateId: PathwayStateId;
  /** Condition for auto-selection (smart default) */
  readonly autoSelectCondition?: string;
  /** Tags for downstream processing */
  readonly tags?: readonly string[];
}

/** Validation rule types. */
export type ValidationRuleType = 'required' | 'format' | 'range' | 'date' | 'clinical_plausibility' | 'cross_field';

/**
 * Validation rule for a field.
 */
export interface ValidationRule {
  /** Rule type */
  readonly type: ValidationRuleType;
  /** Error message if validation fails */
  readonly message: string;
  /** Rule parameters (type-specific) */
  readonly params?: Readonly<Record<string, unknown>>;
  /** Severity: error blocks, warning informs */
  readonly severity: 'error' | 'warning';
}

/** Field input types. */
export type PathwayFieldType = 'text' | 'textarea' | 'date' | 'select' | 'multiselect' | 'number' | 'checkbox';

/** Select option for dropdown fields. */
export interface SelectOption {
  readonly value: string;
  readonly label: string;
}

/**
 * Field definition for data entry states.
 */
export interface PathwayField {
  /** Field identifier */
  readonly id: string;
  /** Field type */
  readonly type: PathwayFieldType;
  /** Display label */
  readonly label: string;
  /** Placeholder text */
  readonly placeholder?: string;
  /** Help text shown below field */
  readonly helpText?: string;
  /** Validation rules */
  readonly validators: readonly ValidationRule[];
  /** Options for select/multiselect */
  readonly options?: readonly SelectOption[];
  /** Whether smart defaults should be applied */
  readonly enableSmartDefaults?: boolean;
  /** Default value */
  readonly defaultValue?: unknown;
  /** Regulatory field mapping (for E2B) */
  readonly e2bMapping?: string;
}

/**
 * A single state in the pathway.
 */
export interface PathwayState {
  /** Unique state identifier */
  readonly id: PathwayStateId;
  /** State type */
  readonly type: PathwayStateType;
  /** Clinical prompt by domain (falls back to 'default') */
  readonly clinicalPrompt: Partial<Record<ClinicalDomain | 'default', string>>;
  /** Options for question states */
  readonly options?: readonly PathwayOption[];
  /** Fields for data entry states */
  readonly fields?: readonly PathwayField[];
  /** Validation rules for the entire state */
  readonly validators?: readonly ValidationRule[];
  /** Help content */
  readonly helpContent: PathwayHelpContent;
  /** Estimated time in seconds */
  readonly estimatedTimeSeconds: number;
  /** Phase name for progress display */
  readonly phaseName: string;
  /** Whether this state is on the critical path */
  readonly isCritical?: boolean;
  /** Condition for showing this state */
  readonly showCondition?: string;
}

/**
 * Complete pathway definition.
 */
export interface Pathway {
  /** Pathway identifier */
  readonly id: PathwayId;
  /** Task type this pathway handles */
  readonly taskType: PVTaskType;
  /** Display name */
  readonly name: string;
  /** Description */
  readonly description: string;
  /** Guidance level */
  readonly guidanceLevel: GuidanceLevel;
  /** Initial state ID */
  readonly initialStateId: PathwayStateId;
  /** All states in the pathway */
  readonly states: Readonly<Record<string, PathwayState>>;
  /** Estimated total steps (for progress) */
  readonly estimatedSteps: number;
  /** Phase names in order */
  readonly phases: readonly string[];
  /** Version for change tracking */
  readonly version: string;
  /** Last updated */
  readonly updatedAt: Timestamp;
}

/**
 * Serialized Pathway for server action returns.
 */
export interface PathwaySerialized extends Omit<Pathway, 'updatedAt'> {
  readonly updatedAt: SerializedTimestamp;
}

// =============================================================================
// Runtime Context & State
// =============================================================================

/** Audit action types. */
export type AuditActionType = 'state_enter' | 'input_submitted' | 'validation_failed' | 'help_accessed' | 'back_navigation';

/** All valid audit action types. */
export const AUDIT_ACTION_TYPES: readonly AuditActionType[] = [
  'state_enter', 'input_submitted', 'validation_failed', 'help_accessed', 'back_navigation'
] as const;

/** Client metadata for audit entries. */
export interface AuditClientMetadata {
  readonly userAgent: string;
  readonly ipHash: string;
  readonly sessionId: string;
}

/**
 * Audit trail entry (ALCOA+ compliant).
 */
export interface AuditEntry {
  /** Entry timestamp */
  readonly timestamp: Timestamp;
  /** User who performed the action */
  readonly userId: HCPUserId;
  /** State ID where action occurred */
  readonly stateId: PathwayStateId;
  /** Action type */
  readonly action: AuditActionType;
  /** Value submitted (for input actions) */
  readonly value?: unknown;
  /** Context snapshot for reproducibility */
  readonly contextSnapshot: Readonly<Record<string, unknown>>;
  /** Client metadata */
  readonly clientMetadata?: AuditClientMetadata;
}

/**
 * Serialized AuditEntry for server action returns.
 */
export interface AuditEntrySerialized extends Omit<AuditEntry, 'timestamp'> {
  readonly timestamp: SerializedTimestamp;
}

/** Validation warning types. */
export type ValidationWarningType = 'clinical_plausibility' | 'consistency' | 'completeness';

/** Validation warning severity levels. */
export type WarningSeverity = 'low' | 'medium' | 'high';

/**
 * Validation warning (doesn't block, but informs).
 */
export interface ValidationWarning {
  /** Field that triggered the warning */
  readonly field: string;
  /** Warning type */
  readonly type: ValidationWarningType;
  /** User-friendly message */
  readonly message: string;
  /** Suggestion for correction */
  readonly suggestion?: string;
  /** Severity level */
  readonly severity: WarningSeverity;
}

/**
 * Validation error (blocks progression).
 */
export interface ValidationError {
  /** Error code for programmatic handling */
  readonly code: string;
  /** Field that triggered the error */
  readonly field: string;
  /** User-friendly error message */
  readonly message: string;
  /** Example of valid input */
  readonly example?: string;
  /** Regulation requiring this field */
  readonly regulation?: string;
}

/**
 * Validation result.
 */
export interface ValidationResult {
  /** Whether input is valid (no errors) */
  readonly isValid: boolean;
  /** Blocking errors */
  readonly errors: readonly ValidationError[];
  /** Non-blocking warnings */
  readonly warnings: readonly ValidationWarning[];
  /** Whether user can proceed */
  readonly canProceed: boolean;
}

/** Smart suggestion sources. */
export type SuggestionSource = 'recent_cases' | 'facility_defaults' | 'regulatory_defaults' | 'statistical_mode';

/**
 * Smart default suggestion.
 */
export interface SmartSuggestion {
  /** Suggested value */
  readonly value: unknown;
  /** Confidence score (0-1) */
  readonly confidence: number;
  /** Source of suggestion */
  readonly source: SuggestionSource;
  /** Whether user can edit */
  readonly isEditable: true;
  /** Explanation for user */
  readonly reason?: string;
}

/**
 * Progress information.
 */
export interface ProgressInfo {
  /** Percentage complete */
  readonly percentage: number;
  /** Number of completed steps */
  readonly completedSteps: number;
  /** Estimated total steps */
  readonly estimatedTotal: number;
  /** Current phase index */
  readonly currentPhase: number;
  /** Current phase name */
  readonly phaseName: string;
  /** Estimated time remaining (seconds) */
  readonly estimatedTimeRemaining?: number;
}

/**
 * Runtime context during pathway navigation.
 */
export interface PathwayContext {
  /** Current user */
  readonly user: HCPUser;
  /** Active pathway */
  readonly pathway: Pathway;
  /** Current state ID */
  readonly currentStateId: PathwayStateId;
  /** Collected case data */
  readonly caseData: Readonly<Record<string, unknown>>;
  /** Audit trail */
  readonly auditTrail: readonly AuditEntry[];
  /** Active warnings */
  readonly warnings: readonly ValidationWarning[];
  /** Navigation history (state IDs) */
  readonly navigationHistory: readonly PathwayStateId[];
  /** Session start time */
  readonly startTime: Timestamp;
  /** Last activity time */
  readonly lastActivityTime: Timestamp;
}

/**
 * Serialized PathwayContext for server action returns.
 */
export interface PathwayContextSerialized extends Omit<PathwayContext, 'startTime' | 'lastActivityTime' | 'auditTrail' | 'pathway'> {
  readonly startTime: SerializedTimestamp;
  readonly lastActivityTime: SerializedTimestamp;
  readonly auditTrail: readonly AuditEntrySerialized[];
  readonly pathway: PathwaySerialized;
}

// =============================================================================
// User Input & Response Types
// =============================================================================

/**
 * User input submission.
 */
export interface UserInput {
  /** Field identifier */
  readonly field: string;
  /** Submitted value */
  readonly value: unknown;
  /** Whether user accepted a smart default */
  readonly acceptedSuggestion?: boolean;
  /** Time spent on this input (ms) */
  readonly timeSpentMs?: number;
}

/**
 * Step display information for UI.
 */
export interface StepDisplay {
  /** Clinical prompt for current domain */
  readonly prompt: string;
  /** Available options (for question states) */
  readonly options?: readonly PathwayOption[];
  /** Fields to display (for data entry states) */
  readonly fields?: readonly PathwayField[];
  /** Smart suggestions by field ID */
  readonly suggestions?: Readonly<Record<string, SmartSuggestion>>;
  /** Progress information */
  readonly progress: ProgressInfo;
  /** Whether help is available */
  readonly helpAvailable: boolean;
  /** Estimated time remaining */
  readonly estimatedTimeRemaining?: number;
  /** Whether back navigation is allowed */
  readonly canGoBack: boolean;
  /** Current step number */
  readonly currentStepNumber: number;
  /** Total estimated steps */
  readonly totalSteps: number;
  /** Current phase name */
  readonly phaseName: string;
}

/** Error fix suggestion. */
export interface ErrorFixSuggestion {
  readonly forError: string;
  readonly suggestion: string;
  readonly example?: string;
}

/**
 * Result of processing user input.
 */
export interface ProcessResult {
  /** Whether processing succeeded */
  readonly success: boolean;
  /** Validation errors (if failed) */
  readonly errors?: readonly ValidationError[];
  /** Suggestions for fixing errors */
  readonly suggestions?: readonly ErrorFixSuggestion[];
  /** Whether confirmation is required before proceeding */
  readonly requiresConfirmation?: boolean;
  /** Confirmation message */
  readonly confirmationMessage?: string;
  /** Pending transition (if confirmation required) */
  readonly pendingTransition?: PathwayStateId;
  /** Whether workflow is complete */
  readonly isComplete?: boolean;
  /** Next step display (if not complete) */
  readonly nextStep?: StepDisplay;
  /** Warnings encountered */
  readonly warnings?: readonly ValidationWarning[];
}

// =============================================================================
// Completion Types
// =============================================================================

/**
 * Summary key fact.
 */
export interface KeyFact {
  /** Display label */
  readonly label: string;
  /** Value */
  readonly value: string;
  /** Whether this is critical */
  readonly isCritical?: boolean;
}

/**
 * Human-readable summary for review.
 */
export interface CompletionSummary {
  /** Narrative summary in plain language */
  readonly narrative: string;
  /** Key facts highlighted */
  readonly keyFacts: readonly KeyFact[];
  /** What happens next */
  readonly nextSteps: readonly string[];
  /** Estimated processing time */
  readonly estimatedProcessingTime: string;
  /** Case reference number (if generated) */
  readonly caseReference?: CaseId;
}

/**
 * Final submission result.
 */
export interface CompletionResult {
  /** Whether completion succeeded */
  readonly success: boolean;
  /** Validation errors (if failed) */
  readonly errors?: readonly ValidationError[];
  /** State to return to (if errors) */
  readonly returnToState?: PathwayStateId;
  /** Compiled submission data */
  readonly submission?: Readonly<Record<string, unknown>>;
  /** Human-readable summary */
  readonly summary?: CompletionSummary;
  /** Complete audit trail */
  readonly auditTrail?: readonly AuditEntry[];
  /** Total completion time (ms) */
  readonly completionTimeMs?: number;
  /** E2B XML (if applicable) */
  readonly e2bXml?: string;
}

/**
 * Serialized CompletionResult for server action returns.
 */
export interface CompletionResultSerialized extends Omit<CompletionResult, 'auditTrail'> {
  readonly auditTrail?: readonly AuditEntrySerialized[];
}

// =============================================================================
// Clinical Language Translation
// =============================================================================

/**
 * Translation entry for PV term to clinical language.
 */
export interface ClinicalTranslation {
  /** Original PV/regulatory term */
  readonly pvTerm: string;
  /** Translations by domain */
  readonly translations: Readonly<Record<ClinicalDomain | 'default', string>>;
}

/**
 * Clinical analogy for a PV concept.
 */
export interface ClinicalAnalogy {
  /** Concept identifier */
  readonly conceptId: string;
  /** Analogies by domain */
  readonly analogies: Readonly<Record<ClinicalDomain | 'default', string>>;
}

// =============================================================================
// State Management
// =============================================================================

/**
 * Navigator action types
 */
export type NavigatorAction =
  | { type: 'INITIALIZE'; pathway: Pathway; user: HCPUser }
  | { type: 'SUBMIT_INPUT'; input: UserInput }
  | { type: 'CONFIRM_TRANSITION' }
  | { type: 'CANCEL_TRANSITION' }
  | { type: 'GO_BACK' }
  | { type: 'ACCESS_HELP' }
  | { type: 'ACCEPT_SUGGESTION'; field: string }
  | { type: 'COMPLETE' }
  | { type: 'RESET' };

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Mutable version of PathwayContext for runtime state management.
 */
export interface PathwayContextMutable {
  user: HCPUser;
  pathway: Pathway;
  currentStateId: PathwayStateId;
  caseData: Record<string, unknown>;
  auditTrail: AuditEntry[];
  warnings: ValidationWarning[];
  navigationHistory: PathwayStateId[];
  startTime: Timestamp;
  lastActivityTime: Timestamp;
}

/**
 * Create initial pathway context.
 *
 * @param user - The HCP user navigating the pathway
 * @param pathway - The pathway definition
 * @param now - Current timestamp (for testability)
 * @returns Initial mutable context
 */
export function createInitialContext(
  user: HCPUser,
  pathway: Pathway,
  now: Timestamp = Timestamp.now()
): PathwayContextMutable {
  return {
    user,
    pathway,
    currentStateId: pathway.initialStateId,
    caseData: {},
    auditTrail: [],
    warnings: [],
    navigationHistory: [pathway.initialStateId],
    startTime: now,
    lastActivityTime: now,
  };
}

/**
 * Calculate guidance level from user profile.
 *
 * @param user - The HCP user
 * @returns Appropriate guidance level based on tech proficiency
 */
export function calculateGuidanceLevel(user: HCPUser): GuidanceLevel {
  if (user.techProficiency < 0.3) return 'high';
  if (user.techProficiency < 0.6) return 'medium';
  return 'low';
}

/**
 * Get clinical prompt for user's domain.
 *
 * @param state - The pathway state
 * @param domain - The user's clinical domain
 * @returns Domain-specific or default prompt
 */
export function getClinicalPrompt(
  state: PathwayState,
  domain: ClinicalDomain
): string {
  return state.clinicalPrompt[domain] ?? state.clinicalPrompt.default ?? '';
}
