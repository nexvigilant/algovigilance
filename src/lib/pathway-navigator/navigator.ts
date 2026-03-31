/**
 * Clinical Pathway Navigator
 *
 * The core orchestration engine for guided PV workflows.
 * Manages state transitions, context, audit trails, and
 * coordinates between language service, validation, and defaults.
 *
 * Design Principles:
 * 1. State machine with clear transitions
 * 2. Full audit trail for ALCOA+ compliance
 * 3. Progressive disclosure - one step at a time
 * 4. Clinical language throughout
 */

import type {
  Pathway,
  PathwayState,
  PathwayContext,
  PathwayContextMutable,
  PathwayHelpContent,
  HCPUser,
  PVTaskType,
  UserInput,
  StepDisplay,
  ProcessResult,
  CompletionResult,
  CompletionSummary,
  ProgressInfo,
  AuditEntry,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  SmartSuggestion,
  CaseId,
} from '@/types/clinical-pathways';
import {
  createInitialContext,
  calculateGuidanceLevel,
  getClinicalPrompt,
} from '@/types/clinical-pathways';
import { Timestamp } from 'firebase/firestore';
import { clinicalLanguageService } from '@/lib/clinical-language';
import { pathwayRegistry } from '@/data/pathways';

// =============================================================================
// Navigator Dependencies Interface
// =============================================================================

/**
 * External dependencies for the navigator
 * Allows for dependency injection and testing
 */
export interface NavigatorDependencies {
  /** Get current timestamp (injectable for testing) */
  now?: () => Date;
  /** Generate unique IDs */
  generateId?: () => string;
  /** Custom validation engine (optional) */
  validationEngine?: ValidationEngine;
  /** Custom defaults engine (optional) */
  defaultsEngine?: SmartDefaultsEngine;
}

/**
 * Validation engine interface
 */
export interface ValidationEngine {
  validateInput(
    input: UserInput,
    state: PathwayState,
    context: PathwayContext
  ): Promise<ValidationResult>;
}

/**
 * Smart defaults engine interface
 */
export interface SmartDefaultsEngine {
  getSuggestions(
    state: PathwayState,
    context: PathwayContext
  ): Promise<Record<string, SmartSuggestion>>;
}

// =============================================================================
// Default Implementations
// =============================================================================

/**
 * Simple UUID generator
 */
function generateSimpleId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Basic validation engine (format checking only)
 * Full implementation would include clinical plausibility checks
 */
const defaultValidationEngine: ValidationEngine = {
  async validateInput(
    input: UserInput,
    state: PathwayState,
    _context: PathwayContext
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Find field definition
    const field = state.fields?.find((f) => f.id === input.field);

    if (field) {
      // Check required
      const requiredRule = field.validators?.find((v) => v.type === 'required');
      if (requiredRule && (input.value === null || input.value === undefined || input.value === '')) {
        errors.push({
          code: 'REQUIRED',
          field: input.field,
          message: requiredRule.message,
        });
      }

      // Check date not in future
      const dateRule = field.validators?.find((v) => v.type === 'date');
      if (dateRule && input.value instanceof Date && input.value > new Date()) {
        errors.push({
          code: 'FUTURE_DATE',
          field: input.field,
          message: dateRule.message,
        });
      }

      // Check range
      const rangeRule = field.validators?.find((v) => v.type === 'range');
      if (rangeRule && typeof input.value === 'number') {
        const { min, max } = rangeRule.params as { min: number; max: number };
        if (input.value < min || input.value > max) {
          if (rangeRule.severity === 'error') {
            errors.push({
              code: 'OUT_OF_RANGE',
              field: input.field,
              message: rangeRule.message,
            });
          } else {
            warnings.push({
              field: input.field,
              type: 'clinical_plausibility',
              message: rangeRule.message,
              severity: 'medium',
            });
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      canProceed: errors.length === 0,
    };
  },
};

/**
 * Basic defaults engine (no suggestions by default)
 * Full implementation would analyze recent cases
 */
const defaultDefaultsEngine: SmartDefaultsEngine = {
  async getSuggestions(
    _state: PathwayState,
    _context: PathwayContext
  ): Promise<Record<string, SmartSuggestion>> {
    // No suggestions by default
    return {};
  },
};

// =============================================================================
// Clinical Pathway Navigator Class
// =============================================================================

/**
 * ClinicalPathwayNavigator
 *
 * Main orchestration class for guided PV workflows.
 * Manages state, validates input, records audit trail,
 * and provides clinical language throughout.
 */
export class ClinicalPathwayNavigator {
  private context: PathwayContextMutable;
  private sessionId: string;
  private validationEngine: ValidationEngine;
  private defaultsEngine: SmartDefaultsEngine;
  private now: () => Date;
  private generateId: () => string;
  private pendingTransition: PathwayState | null = null;

  constructor(
    user: HCPUser,
    taskType: PVTaskType,
    deps: NavigatorDependencies = {}
  ) {
    // Set up dependencies
    this.now = deps.now ?? (() => new Date());
    this.generateId = deps.generateId ?? generateSimpleId;
    this.validationEngine = deps.validationEngine ?? defaultValidationEngine;
    this.defaultsEngine = deps.defaultsEngine ?? defaultDefaultsEngine;

    // Get appropriate pathway for user
    const guidanceLevel = calculateGuidanceLevel(user);
    const pathway = pathwayRegistry.getWithFallback(taskType, guidanceLevel);

    if (!pathway) {
      throw new Error(`No pathway found for task type: ${taskType}`);
    }

    // Initialize context
    this.sessionId = this.generateId();
    this.context = createInitialContext(user, pathway);
    this.context.startTime = Timestamp.fromDate(this.now());
    this.context.lastActivityTime = Timestamp.fromDate(this.now());

    // Record session start
    this.recordAuditEntry('state_enter', null, { initialState: pathway.initialStateId });
  }

  // ===========================================================================
  // Public API
  // ===========================================================================

  /**
   * Get current step for display
   */
  getCurrentStep(): StepDisplay {
    const state = this.getCurrentState();
    const domain = this.context.user.domain;

    // Transform prompt to clinical language
    const rawPrompt = getClinicalPrompt(state, domain);
    const prompt = clinicalLanguageService.transformPrompt(rawPrompt, domain);

    // Prepare options with clinical descriptions
    const options = state.options?.map((opt) => ({
      ...opt,
      clinicalDescription: clinicalLanguageService.transformPrompt(
        opt.clinicalDescription,
        domain
      ),
    }));

    return {
      prompt,
      options,
      fields: state.fields,
      suggestions: {}, // Will be populated by async call
      progress: this.calculateProgress(),
      helpAvailable: true,
      estimatedTimeRemaining: this.estimateTimeRemaining(),
      canGoBack: this.context.navigationHistory.length > 1,
      currentStepNumber: this.context.navigationHistory.length,
      totalSteps: this.context.pathway.estimatedSteps,
      phaseName: state.phaseName,
    };
  }

  /**
   * Get current step with async suggestions
   */
  async getCurrentStepWithSuggestions(): Promise<StepDisplay> {
    const step = this.getCurrentStep();
    const state = this.getCurrentState();

    // Get smart suggestions and return new step with suggestions
    const suggestions = await this.defaultsEngine.getSuggestions(state, this.context);

    return { ...step, suggestions };
  }

  /**
   * Process user input
   */
  async processInput(input: UserInput): Promise<ProcessResult> {
    const state = this.getCurrentState();
    this.context.lastActivityTime = Timestamp.fromDate(this.now());

    // Validate input
    const validation = await this.validationEngine.validateInput(
      input,
      state,
      this.context
    );

    if (!validation.isValid) {
      // Record validation failure
      this.recordAuditEntry('validation_failed', input.value, {
        field: input.field,
        errors: validation.errors,
      });

      return {
        success: false,
        errors: [...validation.errors],
        suggestions: this.generateErrorSuggestions([...validation.errors]),
      };
    }

    // Record successful input
    this.recordAuditEntry('input_submitted', input.value, {
      field: input.field,
      acceptedSuggestion: input.acceptedSuggestion,
    });

    // Store warnings
    if (validation.warnings.length > 0) {
      this.context.warnings.push(...validation.warnings);
    }

    // Update case data
    this.updateCaseData(input);

    // Determine next state
    const nextState = this.determineNextState(input);

    // Check if confirmation needed (e.g., before destructive actions)
    if (this.requiresConfirmation(state, nextState)) {
      this.pendingTransition = nextState;
      return {
        success: true,
        requiresConfirmation: true,
        confirmationMessage: this.buildConfirmationMessage(state),
        pendingTransition: nextState.id,
      };
    }

    // Transition to next state
    return this.transitionTo(nextState, [...validation.warnings]);
  }

  /**
   * Confirm pending transition
   */
  confirmTransition(): ProcessResult {
    if (!this.pendingTransition) {
      return {
        success: false,
        errors: [{
          code: 'NO_PENDING_TRANSITION',
          field: '',
          message: 'No transition pending confirmation',
        }],
      };
    }

    const nextState = this.pendingTransition;
    this.pendingTransition = null;

    return this.transitionTo(nextState, []);
  }

  /**
   * Cancel pending transition
   */
  cancelTransition(): void {
    this.pendingTransition = null;
  }

  /**
   * Navigate back to previous state
   */
  goBack(): StepDisplay | null {
    if (this.context.navigationHistory.length <= 1) {
      return null;
    }

    // Record back navigation
    this.recordAuditEntry('back_navigation', null, {
      fromState: this.context.currentStateId,
    });

    // Pop current state
    this.context.navigationHistory.pop();
    this.context.currentStateId =
      this.context.navigationHistory[this.context.navigationHistory.length - 1];

    return this.getCurrentStep();
  }

  /**
   * Get help for current step
   */
  getHelp(): PathwayHelpContent {
    const state = this.getCurrentState();
    const domain = this.context.user.domain;

    // Record help access
    this.recordAuditEntry('help_accessed', null, { stateId: state.id });

    // Transform help content to clinical language
    return {
      explanation: clinicalLanguageService.transformPrompt(
        state.helpContent.explanation,
        domain
      ),
      clinicalAnalogies: state.helpContent.clinicalAnalogies,
      commonMistakes: state.helpContent.commonMistakes,
      regulatoryReference: state.helpContent.regulatoryReference,
      helpLink: state.helpContent.helpLink,
    };
  }

  /**
   * Get clinical analogy for current step
   */
  getClinicalAnalogy(): string {
    const state = this.getCurrentState();
    return clinicalLanguageService.getAnalogy(state.id, this.context.user.domain);
  }

  /**
   * Complete the workflow
   */
  async complete(): Promise<CompletionResult> {
    const state = this.getCurrentState();

    if (state.type !== 'terminal') {
      return {
        success: false,
        errors: [{
          code: 'NOT_COMPLETE',
          field: '',
          message: 'Workflow not yet complete',
        }],
        returnToState: this.context.currentStateId,
      };
    }

    // Compile submission data
    const submission = this.compileSubmission();

    // Generate summary
    const summary = this.generateSummary(submission);

    // Record completion
    this.recordAuditEntry('input_submitted', null, {
      action: 'workflow_complete',
      submissionKeys: Object.keys(submission),
    });

    return {
      success: true,
      submission,
      summary,
      auditTrail: [...this.context.auditTrail],
      completionTimeMs: this.now().getTime() - this.context.startTime.toMillis(),
    };
  }

  // ===========================================================================
  // Getters
  // ===========================================================================

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get current context (read-only copy)
   */
  getContext(): Readonly<PathwayContext> {
    return { ...this.context };
  }

  /**
   * Get pathway
   */
  getPathway(): Readonly<Pathway> {
    return this.context.pathway;
  }

  /**
   * Check if workflow is complete
   */
  isComplete(): boolean {
    return this.getCurrentState().type === 'terminal';
  }

  /**
   * Get collected case data
   */
  getCaseData(): Record<string, unknown> {
    return { ...this.context.caseData };
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  /**
   * Get current state object
   */
  private getCurrentState(): PathwayState {
    const state = this.context.pathway.states[this.context.currentStateId];
    if (!state) {
      throw new Error(`Invalid state ID: ${this.context.currentStateId}`);
    }
    return state;
  }

  /**
   * Record audit entry
   */
  private recordAuditEntry(
    action: AuditEntry['action'],
    value: unknown,
    additionalContext: Record<string, unknown> = {}
  ): void {
    const entry: AuditEntry = {
      timestamp: Timestamp.fromDate(this.now()),
      userId: this.context.user.id,
      stateId: this.context.currentStateId,
      action,
      value,
      contextSnapshot: {
        ...additionalContext,
        navigationHistoryLength: this.context.navigationHistory.length,
        caseDataKeys: Object.keys(this.context.caseData),
      },
    };

    this.context.auditTrail.push(entry);
  }

  /**
   * Update case data with input
   */
  private updateCaseData(input: UserInput): void {
    this.context.caseData[input.field] = input.value;
  }

  /**
   * Determine next state based on input
   */
  private determineNextState(input: UserInput): PathwayState {
    const currentState = this.getCurrentState();

    // For question states, option determines next state
    if (currentState.type === 'question') {
      const selectedOption = currentState.options?.find((o) => o.id === input.value);
      if (selectedOption?.nextStateId) {
        const nextState = this.context.pathway.states[selectedOption.nextStateId];
        if (nextState) {
          return nextState;
        }
      }
    }

    // For other states, find next state in sequence
    return this.findNextStateInSequence(currentState);
  }

  /**
   * Find next state in sequence (skipping conditional states that don't apply)
   */
  private findNextStateInSequence(currentState: PathwayState): PathwayState {
    const stateIds = Object.keys(this.context.pathway.states);
    const currentIndex = stateIds.indexOf(currentState.id);

    // Look for next valid state
    for (let i = currentIndex + 1; i < stateIds.length; i++) {
      const candidateId = stateIds[i];
      const candidate = this.context.pathway.states[candidateId];

      // Check show condition (if present)
      if (candidate.showCondition) {
        if (!this.evaluateCondition(candidate.showCondition)) {
          continue; // Skip this state
        }
      }

      return candidate;
    }

    // If no next state, this should be terminal
    // Return current state if it's terminal, otherwise error
    if (currentState.type === 'terminal') {
      return currentState;
    }

    throw new Error('No valid next state found');
  }

  /**
   * Evaluate a condition against current context
   */
  private evaluateCondition(condition: string): boolean {
    // Simple condition evaluation
    // In production, this would be more sophisticated
    switch (condition) {
      case 'outcome_is_fatal':
        return this.context.caseData.reaction_outcome === 'fatal';
      case 'dose_dependent_reaction':
        return this.context.caseData.event_type === 'dose_related';
      default:
        return true; // Unknown conditions default to true
    }
  }

  /**
   * Check if transition requires confirmation
   */
  private requiresConfirmation(
    _currentState: PathwayState,
    nextState: PathwayState
  ): boolean {
    // Require confirmation before terminal states (submission)
    return nextState.type === 'terminal';
  }

  /**
   * Build confirmation message
   */
  private buildConfirmationMessage(_state: PathwayState): string {
    return 'Are you ready to submit this report? Please review all information before confirming.';
  }

  /**
   * Transition to next state
   */
  private transitionTo(
    nextState: PathwayState,
    warnings: ValidationWarning[]
  ): ProcessResult {
    // Update current state
    this.context.currentStateId = nextState.id;
    this.context.navigationHistory.push(nextState.id);

    // Record state entry
    this.recordAuditEntry('state_enter', null, { stateId: nextState.id });

    const isComplete = nextState.type === 'terminal';

    return {
      success: true,
      isComplete,
      nextStep: !isComplete ? this.getCurrentStep() : undefined,
      warnings,
    };
  }

  /**
   * Calculate progress
   */
  private calculateProgress(): ProgressInfo {
    const completedSteps = this.context.navigationHistory.length;
    const estimatedTotal = this.context.pathway.estimatedSteps;

    // Don't show 100% until actually complete
    const adjustedTotal = Math.max(estimatedTotal, completedSteps + 1);
    const percentage = this.isComplete()
      ? 100
      : Math.min(95, Math.round((completedSteps / adjustedTotal) * 100));

    // Determine current phase
    const currentState = this.getCurrentState();
    const phaseIndex = this.context.pathway.phases.indexOf(currentState.phaseName);

    return {
      percentage,
      completedSteps,
      estimatedTotal: adjustedTotal,
      currentPhase: phaseIndex >= 0 ? phaseIndex : 0,
      phaseName: currentState.phaseName,
      estimatedTimeRemaining: this.estimateTimeRemaining(),
    };
  }

  /**
   * Estimate time remaining
   */
  private estimateTimeRemaining(): number {
    const completedSteps = this.context.navigationHistory.length;
    if (completedSteps < 2) {
      // Not enough data to estimate
      return this.context.pathway.estimatedSteps * 30; // Default 30s per step
    }

    const elapsedMs = this.now().getTime() - this.context.startTime.toMillis();
    const msPerStep = elapsedMs / completedSteps;
    const remainingSteps = this.context.pathway.estimatedSteps - completedSteps;

    return Math.ceil((msPerStep * Math.max(0, remainingSteps)) / 1000);
  }

  /**
   * Generate suggestions for validation errors
   */
  private generateErrorSuggestions(
    errors: ValidationError[]
  ): Array<{ forError: string; suggestion: string; example?: string }> {
    return errors.map((error) => {
      let suggestion = 'Please correct this field';
      let example: string | undefined;

      switch (error.code) {
        case 'REQUIRED':
          suggestion = 'This field is required';
          break;
        case 'FUTURE_DATE':
          suggestion = 'Please enter a date that has already occurred';
          example = new Date().toLocaleDateString();
          break;
        case 'OUT_OF_RANGE':
          suggestion = 'Please enter a value within the valid range';
          break;
      }

      return { forError: error.code, suggestion, example };
    });
  }

  /**
   * Compile submission data
   */
  private compileSubmission(): Record<string, unknown> {
    return {
      ...this.context.caseData,
      _metadata: {
        sessionId: this.sessionId,
        userId: this.context.user.id,
        userDomain: this.context.user.domain,
        pathwayId: this.context.pathway.id,
        pathwayVersion: this.context.pathway.version,
        completedAt: this.now().toISOString(),
        durationMs: this.now().getTime() - this.context.startTime.toMillis(),
      },
    };
  }

  /**
   * Generate human-readable summary
   */
  private generateSummary(submission: Record<string, unknown>): CompletionSummary {
    const keyFacts = [];

    // Extract key facts from case data
    if (submission.patient_initials) {
      keyFacts.push({ label: 'Patient', value: String(submission.patient_initials) });
    }
    if (submission.drug_name) {
      keyFacts.push({ label: 'Drug', value: String(submission.drug_name) });
    }
    if (submission.reaction_description) {
      const desc = String(submission.reaction_description);
      keyFacts.push({
        label: 'Reaction',
        value: desc.length > 50 ? desc.substring(0, 50) + '...' : desc,
      });
    }
    if (submission.reaction_outcome) {
      keyFacts.push({ label: 'Outcome', value: String(submission.reaction_outcome) });
    }
    if (submission.causality) {
      keyFacts.push({ label: 'Causality', value: String(submission.causality) });
    }

    // Build narrative
    const narrativeParts = [];
    if (submission.drug_name) {
      narrativeParts.push(`Report for ${submission.drug_name}`);
    }
    if (submission.patient_initials && submission.patient_age) {
      narrativeParts.push(`in patient ${submission.patient_initials} (age ${submission.patient_age})`);
    }
    if (submission.reaction_description) {
      narrativeParts.push(`for ${submission.reaction_description}`);
    }

    return {
      narrative: narrativeParts.join(' ') || 'Report submitted successfully',
      keyFacts,
      nextSteps: [
        'Your report will be reviewed by our safety team',
        'You may receive follow-up questions if additional information is needed',
        'A confirmation email will be sent to your registered email address',
      ],
      estimatedProcessingTime: '24-48 hours',
      caseReference: this.sessionId as CaseId,
    };
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a new navigator instance
 */
export function createNavigator(
  user: HCPUser,
  taskType: PVTaskType,
  deps?: NavigatorDependencies
): ClinicalPathwayNavigator {
  return new ClinicalPathwayNavigator(user, taskType, deps);
}

/**
 * Resume a navigator from saved context
 * (For session persistence)
 */
export async function resumeNavigator(
  _user: HCPUser,
  _sessionId: string,
  _deps?: NavigatorDependencies
): Promise<ClinicalPathwayNavigator> {
  // TODO: Load context from Firestore
  throw new Error('Session resumption not yet implemented');
}
