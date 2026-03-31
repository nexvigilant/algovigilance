/**
 * Quality Metrics Types
 * Content quality tracking and coverage assessment
 */

// ============================================================================
// QUALITY METRICS TYPES
// ============================================================================

/**
 * Quality Metrics - Post-generation content quality tracking
 */
export interface QualityMetrics {
  // Readability
  readabilityScore?: number;          // Flesch-Kincaid or similar (0-100)
  readabilityGrade?: string;          // Grade level

  // Accuracy validation
  accuracyValidation?: {
    validatedBy: string;              // User ID
    validatedAt: Date;
    issuesFound: number;
    correctionsMade: number;
    validationMethod: 'manual' | 'automated' | 'sme_review';
    notes?: string;
  };

  // SME review
  smeReview?: {
    reviewerId: string;
    reviewerCredentials?: string;     // "PharmD", "MD", "BCPS"
    rating: number;                   // 1-5
    feedback: string;
    reviewedAt: Date;
    areasReviewed: string[];          // ['accuracy', 'completeness', 'clarity']
  };

  // Learner feedback aggregation
  learnerFeedback?: {
    avgRating: number;                // 1-5
    totalRatings: number;
    helpfulnessScore: number;         // 0-100
    applicabilityScore: number;       // 0-100 "I can apply immediately"
    commonIssues: string[];
    lastUpdated: Date;
  };

  // Overall quality score
  overallQualityScore?: number;       // Weighted composite (0-100)
  qualityTier?: 'gold' | 'silver' | 'bronze' | 'draft';
}

/**
 * Coverage Score - Structured assessment of content completeness
 */
export interface CoverageScore {
  // Component-level scores (0-100)
  scores: {
    definition: number;               // Is the core concept clearly defined?
    context: number;                  // Is the "why this matters" explained?
    regulations: number;              // Are regulatory requirements covered?
    bestPractices: number;            // Are industry standards included?
    examples: number;                 // Are real-world examples provided?
    commonErrors: number;             // Are pitfalls/mistakes covered?
    assessmentCriteria: number;       // Is competency evaluation defined?
  };

  // Aggregate score
  overall: number;                    // Weighted average of component scores

  // Blocking issues
  blockers: CoverageBlocker[];

  // Audit trail
  lastAuditedAt: Date;
  auditedBy?: string;
  auditNotes?: string;
}

/**
 * Coverage Blocker - Issue preventing production readiness
 */
export interface CoverageBlocker {
  type:
    | 'missing_research'      // No research data for this aspect
    | 'outdated'              // Information is stale
    | 'pending_review'        // Needs SME or peer review
    | 'regional_gap'          // Missing coverage for a region
    | 'low_confidence'        // AI confidence too low
    | 'validation_failed';    // Failed accuracy check
  description: string;
  severity: 'critical' | 'major' | 'minor';
  resolution?: string;                // How to resolve
  resolvedAt?: Date;
  resolvedBy?: string;
}
