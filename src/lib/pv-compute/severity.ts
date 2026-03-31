/**
 * Client-side severity tier classification.
 *
 * Mirrors: severity-tier.yaml
 *   CRITICAL >= 90, HIGH >= 70, MEDIUM >= 40, LOW < 40
 *
 * Reference: ICH E2A (severity as dimension independent of seriousness),
 *            NCI CTCAE grading scale
 *
 * T1 primitives: κ(Comparison) + ∂(Boundary) + N(Quantity)
 */

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export type SeverityTier = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface SeverityResult {
  tier: SeverityTier;
  escalate: boolean;
  priority: number;
}

/* ------------------------------------------------------------------ */
/*  classifySeverity — mirrors severity-tier.yaml                      */
/* ------------------------------------------------------------------ */

/**
 * Classify a numeric severity score (0–100+) into a tier.
 *
 * Thresholds match severity-tier.yaml exactly:
 *   CRITICAL: score >= 90  (escalate, priority 1)
 *   HIGH:     score >= 70  (escalate, priority 2)
 *   MEDIUM:   score >= 40  (no escalate, priority 3)
 *   LOW:      score <  40  (no escalate, priority 4)
 *
 * Scores above 100 are valid (treated as CRITICAL).
 * Negative scores resolve to LOW.
 */
export function classifySeverity(grade: number): SeverityResult {
  if (grade >= 90) {
    return { tier: "CRITICAL", escalate: true, priority: 1 };
  }
  if (grade >= 70) {
    return { tier: "HIGH", escalate: true, priority: 2 };
  }
  if (grade >= 40) {
    return { tier: "MEDIUM", escalate: false, priority: 3 };
  }
  return { tier: "LOW", escalate: false, priority: 4 };
}

/* ------------------------------------------------------------------ */
/*  CTCAE ↔ severity-tier bridge                                       */
/* ------------------------------------------------------------------ */

/**
 * Map a NCI CTCAE grade (1–5) to a numeric severity score
 * for use with classifySeverity().
 *
 * Mapping rationale (midpoint of each tier band):
 *   Grade 1 (mild)            →  25  → LOW
 *   Grade 2 (moderate)        →  55  → MEDIUM
 *   Grade 3 (severe)          →  80  → HIGH
 *   Grade 4 (life-threatening)→  95  → CRITICAL
 *   Grade 5 (death)           → 100  → CRITICAL
 */
export function ctcaeGradeToScore(ctcaeGrade: number): number {
  if (ctcaeGrade >= 5) return 100;
  if (ctcaeGrade >= 4) return 95;
  if (ctcaeGrade >= 3) return 80;
  if (ctcaeGrade >= 2) return 55;
  return 25;
}
