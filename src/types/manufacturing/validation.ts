/**
 * Result of a content validation check
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number; // 0-100 quality score
  suggestions: string[];
}

/**
 * Validation error details
 */
export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  severity: 'error' | 'critical';
}

/**
 * Validation warning details
 */
export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
}

/**
 * Rules for content validation
 */
export interface ValidationRules {
  hook: {
    minWords: number;
    maxWords: number;
    requiresEngagementElement: boolean;
  };
  concept: {
    minKeyPoints: number;
    maxKeyPoints: number;
    requiresExample: boolean;
  };
  activity: {
    minItems: number;
    maxItems: number;
    requiresFeedback: boolean;
    requiresPassingThreshold: boolean;
  };
  reflection: {
    requiresPortfolioPrompt: boolean;
    requiresCompetencyTags: boolean;
  };
}

/**
 * Result of a regulatory accuracy check
 */
export interface ComplianceResult {
  compliant: boolean;
  standard: 'ICH' | 'FDA' | 'EMA';
  violations: string[];
  recommendations: string[];
}

/**
 * Outdated regulatory reference
 */
export interface OutdatedReference {
  original: string;
  suggested: string;
  reason: string;
}

/**
 * Result of Bloom's Taxonomy validation
 */
export interface BloomValidationResult {
  declaredLevel: number;
  detectedLevel: number;
  alignment: boolean;
  actionVerbs: string[];
  confidence: number;
  suggestions: string[];
}
