/**
 * Modular Engine Architecture
 * Plugin-based activity engine system
 */

// ============================================================================
// ENGINE CLASSIFICATION
// ============================================================================

/**
 * Engine category for classification and filtering
 */
export type EngineCategory =
  | 'error_detection'    // Finding mistakes (Red Pen)
  | 'decision_making'    // Choosing options (Triage)
  | 'creation'           // Producing content (Synthesis)
  | 'recall'             // Remembering facts (Matching, Flashcards)
  | 'sequencing'         // Ordering steps (Drag & Drop)
  | 'analysis'           // Breaking down problems
  | 'evaluation';        // Judging quality

/**
 * Engine difficulty level
 */
export type EngineDifficulty = 'foundational' | 'intermediate' | 'advanced';

// ============================================================================
// JSON SCHEMA FOR DYNAMIC CONFIG
// ============================================================================

/**
 * JSON Schema subset for config validation
 * Used for dynamic form generation in builder
 */
export interface JSONSchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  title?: string;
  description?: string;
  default?: unknown;
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  required?: boolean;
  items?: JSONSchemaProperty;
  properties?: Record<string, JSONSchemaProperty>;
}

/**
 * JSON Schema for engine config validation
 */
export interface EngineConfigSchema {
  type: 'object';
  title: string;
  description?: string;
  required: string[];
  properties: Record<string, JSONSchemaProperty>;
}

// ============================================================================
// ENGINE CAPABILITIES & REQUIREMENTS
// ============================================================================

/**
 * Engine capabilities - what features the engine supports
 */
export interface EngineCapabilities {
  supportsTimePressure: boolean;      // Can be timed
  supportsPartialCredit: boolean;     // Partial scoring
  supportsAIEvaluation: boolean;      // AI can evaluate responses
  supportsFeedback: boolean;          // Provides feedback
  supportsHints: boolean;             // Can give hints
  supportsRetry: boolean;             // Can retry without reset
  supportsProgress: boolean;          // Shows progress indicator
  supportsSave: boolean;              // Can save and resume
}

/**
 * Engine requirements - constraints for valid configuration
 */
export interface EngineRequirements {
  minItems?: number;                  // Minimum scenarios/errors/etc.
  maxItems?: number;                  // Maximum items
  requiredFields: string[];           // Required config fields
  optionalFields?: string[];          // Optional config fields
  validationRules?: {
    field: string;
    rule: string;                     // Rule description
  }[];
}

/**
 * Builder UI configuration for the engine
 */
export interface EngineBuilderConfig {
  icon: string;                       // Lucide icon name
  color: string;                      // Tailwind color class
  configSchema: EngineConfigSchema;   // For dynamic form generation
  previewComponent?: string;          // Component name for preview
  helpUrl?: string;                   // Documentation link
  exampleConfigs?: {
    name: string;
    description: string;
    config: Record<string, unknown>;
  }[];
}

// ============================================================================
// ENGINE DEFINITION & REGISTRY
// ============================================================================

/**
 * Activity Engine Definition - Complete engine registration
 *
 * This is the metadata that describes an activity engine.
 * Used for registration, UI generation, and validation.
 */
export interface ActivityEngineDefinition {
  // Identity
  id: string;                         // "red_pen", "triage", "matching"
  name: string;                       // "Red Pen Review"
  description: string;                // What this engine does
  version: string;                    // Semantic version "1.0.0"

  // Classification
  category: EngineCategory;
  difficulty: EngineDifficulty;
  tags?: string[];                    // Additional categorization

  // Capabilities
  capabilities: EngineCapabilities;

  // Requirements
  requirements: EngineRequirements;

  // UI configuration
  builderConfig: EngineBuilderConfig;

  // Scoring defaults
  defaultScoringWeights?: Record<string, number>;
  defaultPassingThreshold?: number;

  // Learner-facing
  learnerInstructions?: string;       // Default instructions
  estimatedMinutes?: number;          // Typical completion time

  // Metadata
  author?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deprecated?: boolean;
  deprecationMessage?: string;
}

/**
 * Engine Registry - Central registration of all available engines
 */
export interface EngineRegistry {
  engines: Record<string, ActivityEngineDefinition>;
  defaultEngineId?: string;
  lastUpdated?: Date;
}

// ============================================================================
// MODULAR ACTIVITY CONFIGURATION
// ============================================================================

/**
 * Scoring configuration for an activity
 */
export interface ActivityScoring {
  weights: Record<string, number>;    // Weight per criterion
  passingThreshold: number;           // 0-100
  partialCreditEnabled: boolean;
  bonusPoints?: {
    criterion: string;
    points: number;
    condition: string;
  }[];
  penalties?: {
    criterion: string;
    points: number;
    condition: string;
  }[];
}

/**
 * Accessibility configuration for an activity
 */
export interface ActivityAccessibility {
  screenReaderInstructions?: string;
  keyboardShortcuts?: Record<string, string>;
  colorBlindMode?: boolean;
  highContrastMode?: boolean;
  fontSize?: 'normal' | 'large' | 'extra-large';
  reducedMotion?: boolean;
}

/**
 * KSB Activity (Modular) - Plugin-based activity configuration
 *
 * This is the new modular version of KSBActivity that supports
 * any registered engine without type changes.
 *
 * To add a new engine:
 * 1. Create ActivityEngineDefinition
 * 2. Register in EngineRegistry
 * 3. Create builder/player components
 * No changes to this interface required!
 */
export interface KSBActivityModular {
  // Engine reference (string allows new engines without type changes)
  engineId: string;

  // Common fields
  instructions: string;
  timeLimitMinutes?: number;

  // Engine-specific configuration
  // Validated at runtime against engine's configSchema
  config: Record<string, unknown>;

  // Scoring configuration
  scoring?: ActivityScoring;

  // Accessibility
  accessibility?: ActivityAccessibility;

  // Adaptive behavior
  adaptive?: {
    difficultyAdjustment: boolean;    // Adjust based on performance
    hintProgression: boolean;         // Progressive hints
    skipOnMastery: boolean;           // Skip if already mastered
  };

  // Analytics
  analytics?: {
    trackDetailedInteractions: boolean;
    trackTimePerItem: boolean;
    trackHintUsage: boolean;
  };
}

/**
 * Activity Result - Outcome of completing an activity
 */
export interface ActivityResult {
  engineId: string;
  score: number;                      // 0-100
  passed: boolean;
  timeSpent: number;                  // seconds

  // Detailed scoring
  criteriaScores?: Record<string, number>;

  // Item-level results
  itemResults?: {
    itemId: string;
    correct: boolean;
    score: number;
    timeSpent: number;
    attempts: number;
    hintsUsed: number;
    response?: unknown;
  }[];

  // Feedback
  feedback?: {
    overall: string;
    strengths: string[];
    improvements: string[];
  };

  // AI evaluation (for Synthesis)
  aiEvaluation?: {
    overallScore: number;
    criteriaScores: Record<string, number>;
    feedback: string;
    modelUsed: string;
    evaluatedAt: Date;
  };

  // Metadata
  completedAt: Date;
  attemptNumber: number;
}
