/**
 * CMER v2.0 Extensions
 *
 * Enhanced modules for the Research Validation Algorithm:
 * - S-Value (Surprisal) converter for information-theoretic scoring
 * - Domain classifier for dynamic methodology matrix
 * - Citation kinematics (velocity, acceleration)
 * - Effect size normalizer (Universal Cohen's d)
 *
 * Based on: "Project CMER v2.0: A Comprehensive Framework for Automated Research Validation"
 *
 * @version 2.0
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Research domain classification for dynamic methodology matrix
 */
export type ResearchDomain = 'medicine' | 'cs_ml' | 'social_science' | 'physics' | 'general';

/**
 * S-Value evidence strength classification
 */
export type EvidenceStrength = 'very_weak' | 'weak' | 'moderate' | 'strong' | 'very_strong';

/**
 * Domain-specific quality indicators
 */
export interface DomainQualityIndicators {
  domain: ResearchDomain;
  // CS/ML specific
  hasAblationStudy?: boolean;
  hasBenchmarkComparison?: boolean;
  hasCodeAvailable?: boolean;
  hasReproducibilityChecklist?: boolean;
  // Social Science specific
  interCoderReliability?: number; // Krippendorff's Alpha or Cohen's Kappa
  hasConstructValidity?: boolean;
  hasSaturationStatement?: boolean;
  acknowledgesWEIRDBias?: boolean;
  // Physics specific
  hasErrorPropagation?: boolean;
  hasGridConvergence?: boolean;
  meetsVVStandards?: boolean;
  hasErrorBars?: boolean;
  // Medicine specific
  isPreregistered?: boolean;
  meetsSTROBE?: boolean;
  passesCarilsleCheck?: boolean;
}

/**
 * Citation with kinematic data for v2.0 bibliometrics
 */
export interface CitationKinematics {
  citationId: string;
  yearPublished: number;
  citationsByYear: Record<number, number>;
  totalCitations: number;
  velocity: number; // First derivative
  acceleration: number; // Second derivative
  disruptionIndex?: number; // -1 to +1
}

/**
 * Statistical evidence with S-value
 */
export interface StatisticalEvidence {
  pValue: number;
  sValue: number; // Surprisal in bits
  evidenceStrength: EvidenceStrength;
  effectSize?: number;
  effectSizeType?: 'cohens_d' | 'odds_ratio' | 'r_squared' | 'eta_squared' | 'other';
  normalizedEffectSize?: number; // Converted to Cohen's d
  confidenceInterval?: [number, number];
  precisionScore: number; // Based on CI width
}

/**
 * Data withholding justification for legal-aware reproducibility
 */
export type DataWithholdingReason =
  | 'gdpr_compliance'
  | 'hipaa_compliance'
  | 'proprietary'
  | 'national_security'
  | 'participant_consent'
  | 'no_reason'
  | 'data_available';

export interface ReproducibilityAssessment {
  dataAvailable: boolean;
  withholdingReason?: DataWithholdingReason;
  withholdingJustified: boolean;
  syntheticDataProvided?: boolean;
  codeAvailable: boolean;
  hasRequirementsTxt?: boolean;
  hasDockerfile?: boolean;
  fairScore?: number; // 0-1 based on FAIR principles
}

// =============================================================================
// S-VALUE (SURPRISAL) MODULE
// =============================================================================

/**
 * Convert p-value to S-value (Surprisal)
 *
 * The S-value quantifies evidence against the null hypothesis in "bits of information"
 * Formula: S = -log₂(p)
 *
 * Interpretation:
 * - S ≈ 4.3 bits (p=0.05): Weak evidence (~4 coin flips)
 * - S ≈ 7.6 bits (p=0.005): Moderate evidence (~8 coin flips)
 * - S ≈ 21 bits (p=5×10⁻⁷): Strong evidence (5-sigma, particle physics standard)
 *
 * @param pValue - The p-value to convert (0 < p ≤ 1)
 * @returns S-value in bits of information
 */
export function pValueToSValue(pValue: number): number {
  if (pValue <= 0 || pValue > 1) {
    throw new Error(`Invalid p-value: ${pValue}. Must be in range (0, 1]`);
  }

  // S = -log₂(p)
  return -Math.log2(pValue);
}

/**
 * Classify evidence strength based on S-value
 *
 * Thresholds based on CMER v2.0 framework:
 * - < 3 bits: Very weak (p > 0.125)
 * - 3-5 bits: Weak (0.03 < p ≤ 0.125)
 * - 5-8 bits: Moderate (0.004 < p ≤ 0.03)
 * - 8-15 bits: Strong (10⁻⁵ < p ≤ 0.004)
 * - > 15 bits: Very strong (p ≤ 10⁻⁵)
 */
export function classifyEvidenceStrength(sValue: number): EvidenceStrength {
  if (sValue < 3) return 'very_weak';
  if (sValue < 5) return 'weak';
  if (sValue < 8) return 'moderate';
  if (sValue < 15) return 'strong';
  return 'very_strong';
}

/**
 * Extract and convert p-values from text to S-values
 *
 * Regex patterns for common p-value formats:
 * - "p = 0.05", "p < 0.001", "p=.05", "P < .01"
 * - "p-value of 0.03", "significance level of 0.05"
 */
export function extractPValuesFromText(text: string): StatisticalEvidence[] {
  const results: StatisticalEvidence[] = [];

  // Pattern for p-value expressions
  const pValuePatterns = [
    /p\s*[=<>≤≥]\s*0?\.?\d+/gi, // p = 0.05, p < .001
    /p-value\s*(?:of|:)?\s*0?\.?\d+/gi, // p-value of 0.05
    /significance\s*(?:level)?\s*(?:of|:)?\s*0?\.?\d+/gi,
  ];

  for (const pattern of pValuePatterns) {
    const matches = text.match(pattern) || [];

    for (const match of matches) {
      // Extract numeric value
      const numMatch = match.match(/0?\.?\d+/);
      if (numMatch) {
        let pValue = parseFloat(numMatch[0]);

        // Handle cases like ".05" -> "0.05"
        if (pValue >= 1 && numMatch[0].startsWith('.')) {
          pValue = parseFloat('0' + numMatch[0]);
        }

        // Validate range
        if (pValue > 0 && pValue <= 1) {
          const sValue = pValueToSValue(pValue);
          results.push({
            pValue,
            sValue,
            evidenceStrength: classifyEvidenceStrength(sValue),
            precisionScore: 0.5, // Default, needs CI to calculate properly
          });
        }
      }
    }
  }

  // Deduplicate by p-value
  const seen = new Set<number>();
  return results.filter((r) => {
    if (seen.has(r.pValue)) return false;
    seen.add(r.pValue);
    return true;
  });
}

/**
 * Calculate aggregate S-value score for a set of statistical evidence
 *
 * Returns normalized score [0, 1] based on:
 * - Mean S-value across all evidence
 * - Weighted by effect size when available
 */
export function calculateSValueScore(evidence: StatisticalEvidence[]): number {
  if (evidence.length === 0) return 0;

  let totalScore = 0;
  let totalWeight = 0;

  for (const e of evidence) {
    // Weight by effect size if available
    const weight = e.normalizedEffectSize ? Math.abs(e.normalizedEffectSize) + 0.5 : 1;

    // Normalize S-value to [0, 1] range (cap at 21 bits = 5-sigma)
    const normalizedS = Math.min(e.sValue / 21, 1);

    totalScore += normalizedS * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? totalScore / totalWeight : 0;
}

// =============================================================================
// EFFECT SIZE NORMALIZATION MODULE
// =============================================================================

/**
 * Convert Odds Ratio to Cohen's d
 *
 * Formula: d = ln(OR) × √3 / π
 * Source: Borenstein et al., 2009
 */
export function oddsRatioToCohenD(oddsRatio: number): number {
  if (oddsRatio <= 0) {
    throw new Error('Odds ratio must be positive');
  }
  return (Math.log(oddsRatio) * Math.sqrt(3)) / Math.PI;
}

/**
 * Convert t-statistic to Cohen's d
 *
 * Formula: d = 2t / √df (assuming equal groups)
 */
export function tStatToCohenD(tStat: number, degreesOfFreedom: number): number {
  if (degreesOfFreedom <= 0) {
    throw new Error('Degrees of freedom must be positive');
  }
  return (2 * tStat) / Math.sqrt(degreesOfFreedom);
}

/**
 * Convert R² to Cohen's d
 *
 * Formula: d = 2 × √(R² / (1 - R²))
 */
export function rSquaredToCohenD(rSquared: number): number {
  if (rSquared < 0 || rSquared >= 1) {
    throw new Error('R² must be in range [0, 1)');
  }
  return 2 * Math.sqrt(rSquared / (1 - rSquared));
}

/**
 * Convert η² (eta-squared) to Cohen's d
 *
 * Formula: d = 2 × √(η² / (1 - η²))
 * Same as R² conversion
 */
export function etaSquaredToCohenD(etaSquared: number): number {
  return rSquaredToCohenD(etaSquared);
}

/**
 * Interpret Cohen's d effect size
 *
 * Conventional thresholds:
 * - Small: |d| ≈ 0.2
 * - Medium: |d| ≈ 0.5
 * - Large: |d| ≈ 0.8
 */
export function interpretCohenD(d: number): 'negligible' | 'small' | 'medium' | 'large' | 'very_large' {
  const absD = Math.abs(d);
  if (absD < 0.1) return 'negligible';
  if (absD < 0.35) return 'small';
  if (absD < 0.65) return 'medium';
  if (absD < 1.0) return 'large';
  return 'very_large';
}

// =============================================================================
// DOMAIN CLASSIFIER MODULE
// =============================================================================

/**
 * Domain-specific keyword dictionaries for classification
 */
const DOMAIN_KEYWORDS: Record<ResearchDomain, string[]> = {
  medicine: [
    'patient',
    'clinical',
    'treatment',
    'diagnosis',
    'cohort',
    'randomized',
    'placebo',
    'trial',
    'hazard ratio',
    'odds ratio',
    'mortality',
    'morbidity',
    'therapeutic',
    'dosage',
    'adverse event',
    'pharmacovigilance',
    'drug safety',
    'efficacy',
    'intention-to-treat',
    'strobe',
    'consort',
  ],
  cs_ml: [
    'algorithm',
    'neural network',
    'deep learning',
    'machine learning',
    'training',
    'epoch',
    'loss function',
    'transformer',
    'ablation',
    'hyperparameter',
    'benchmark',
    'dataset',
    'accuracy',
    'precision',
    'recall',
    'f1 score',
    'sota',
    'state-of-the-art',
    'gpu',
    'model',
    'architecture',
    'attention',
    'embedding',
    'fine-tuning',
    'inference',
  ],
  social_science: [
    'interview',
    'ethnography',
    'construct',
    'coding',
    'grounded theory',
    'qualitative',
    'thematic',
    'phenomenology',
    'discourse',
    'survey',
    'questionnaire',
    'likert',
    'factor analysis',
    'validity',
    'reliability',
    'inter-coder',
    'kappa',
    'saturation',
    'participants',
    'focus group',
  ],
  physics: [
    'hamiltonian',
    'lagrangian',
    'runge-kutta',
    'monte carlo',
    'simulation',
    'conservation',
    'energy',
    'momentum',
    'quantum',
    'thermodynamic',
    'entropy',
    'grid',
    'mesh',
    'finite element',
    'cfd',
    'verification',
    'validation',
    'uncertainty',
    'error propagation',
    'sigma',
  ],
  general: [],
};

/**
 * Classify research domain based on text content
 *
 * Uses TF-IDF-like keyword matching to detect domain
 * Returns the domain with highest confidence score
 */
export function classifyDomain(text: string): { domain: ResearchDomain; confidence: number; scores: Record<ResearchDomain, number> } {
  const lowerText = text.toLowerCase();
  const scores: Record<ResearchDomain, number> = {
    medicine: 0,
    cs_ml: 0,
    social_science: 0,
    physics: 0,
    general: 0,
  };

  // Count keyword matches for each domain
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS) as [ResearchDomain, string[]][]) {
    for (const keyword of keywords) {
      // Count occurrences (case-insensitive)
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        // Weight by keyword specificity (longer = more specific)
        const weight = 1 + keyword.split(' ').length * 0.5;
        scores[domain] += matches.length * weight;
      }
    }
  }

  // Normalize scores
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

  if (totalScore === 0) {
    return { domain: 'general', confidence: 0.5, scores };
  }

  // Find highest scoring domain
  let maxDomain: ResearchDomain = 'general';
  let maxScore = 0;

  for (const [domain, score] of Object.entries(scores) as [ResearchDomain, number][]) {
    if (score > maxScore) {
      maxScore = score;
      maxDomain = domain;
    }
  }

  // Calculate confidence (ratio of top score to total)
  const confidence = maxScore / totalScore;

  // Normalize scores to [0, 1]
  const normalizedScores = {} as Record<ResearchDomain, number>;
  for (const [domain, score] of Object.entries(scores) as [ResearchDomain, number][]) {
    normalizedScores[domain] = score / totalScore;
  }

  return {
    domain: confidence > 0.3 ? maxDomain : 'general',
    confidence,
    scores: normalizedScores,
  };
}

// =============================================================================
// DOMAIN-SPECIFIC QUALITY ASSESSMENT
// =============================================================================

/**
 * Get domain-specific methodology weights
 *
 * Each domain values different quality indicators differently
 */
export function getDomainWeights(domain: ResearchDomain): {
  studyDesign: number;
  sampleSize: number;
  biasControl: number;
  statisticalMethods: number;
  domainSpecific: number;
} {
  switch (domain) {
    case 'medicine':
      return {
        studyDesign: 0.25,
        sampleSize: 0.20,
        biasControl: 0.25,
        statisticalMethods: 0.15,
        domainSpecific: 0.15, // Pre-registration, STROBE
      };
    case 'cs_ml':
      return {
        studyDesign: 0.10,
        sampleSize: 0.10,
        biasControl: 0.15,
        statisticalMethods: 0.15,
        domainSpecific: 0.50, // Ablation, benchmarks, code
      };
    case 'social_science':
      return {
        studyDesign: 0.20,
        sampleSize: 0.10,
        biasControl: 0.15,
        statisticalMethods: 0.15,
        domainSpecific: 0.40, // ICR, construct validity
      };
    case 'physics':
      return {
        studyDesign: 0.15,
        sampleSize: 0.05,
        biasControl: 0.10,
        statisticalMethods: 0.20,
        domainSpecific: 0.50, // Error propagation, V&V
      };
    default:
      return {
        studyDesign: 0.25,
        sampleSize: 0.20,
        biasControl: 0.25,
        statisticalMethods: 0.30,
        domainSpecific: 0.00,
      };
  }
}

/**
 * Assess domain-specific quality indicators
 */
export function assessDomainSpecificQuality(
  domain: ResearchDomain,
  indicators: DomainQualityIndicators
): { score: number; flags: string[] } {
  const flags: string[] = [];
  let score = 0;

  switch (domain) {
    case 'cs_ml': {
      // Ablation study is critical
      if (indicators.hasAblationStudy) {
        score += 0.35;
      } else {
        flags.push('MISSING_ABLATION_STUDY');
      }

      // Benchmark comparison
      if (indicators.hasBenchmarkComparison) {
        score += 0.20;
      }

      // Code availability
      if (indicators.hasCodeAvailable) {
        score += 0.30;
      } else {
        flags.push('CODE_NOT_AVAILABLE');
      }

      // Reproducibility checklist
      if (indicators.hasReproducibilityChecklist) {
        score += 0.15;
      }
      break;
    }

    case 'social_science': {
      // Inter-coder reliability
      if (indicators.interCoderReliability !== undefined) {
        if (indicators.interCoderReliability >= 0.8) {
          score += 0.40;
        } else if (indicators.interCoderReliability >= 0.667) {
          score += 0.25;
          flags.push('ICR_BELOW_THRESHOLD');
        } else {
          score += 0.10;
          flags.push('LOW_INTER_CODER_RELIABILITY');
        }
      } else {
        flags.push('ICR_NOT_REPORTED');
      }

      // Construct validity
      if (indicators.hasConstructValidity) {
        score += 0.25;
      }

      // Saturation statement
      if (indicators.hasSaturationStatement) {
        score += 0.20;
      } else {
        flags.push('NO_SATURATION_STATEMENT');
      }

      // WEIRD bias acknowledgment
      if (indicators.acknowledgesWEIRDBias) {
        score += 0.15;
      }
      break;
    }

    case 'physics': {
      // Error propagation
      if (indicators.hasErrorPropagation) {
        score += 0.30;
      } else {
        flags.push('NO_ERROR_PROPAGATION');
      }

      // Error bars (critical)
      if (indicators.hasErrorBars) {
        score += 0.25;
      } else {
        flags.push('MISSING_ERROR_BARS');
      }

      // Grid convergence (for simulations)
      if (indicators.hasGridConvergence) {
        score += 0.20;
      }

      // V&V standards
      if (indicators.meetsVVStandards) {
        score += 0.25;
      } else {
        flags.push('VV_STANDARDS_NOT_MET');
      }
      break;
    }

    case 'medicine': {
      // Pre-registration is critical for RCTs
      if (indicators.isPreregistered) {
        score += 0.40;
      } else {
        flags.push('NOT_PREREGISTERED');
      }

      // STROBE compliance
      if (indicators.meetsSTROBE) {
        score += 0.35;
      }

      // Carlisle check (fraud detection)
      if (indicators.passesCarilsleCheck) {
        score += 0.25;
      } else if (indicators.passesCarilsleCheck === false) {
        flags.push('CARLISLE_CHECK_FAILED');
        score -= 0.50; // Severe penalty for potential fabrication
      }
      break;
    }

    default:
      score = 0.5; // Neutral for general domain
  }

  return { score: Math.max(0, Math.min(1, score)), flags };
}

// =============================================================================
// CITATION KINEMATICS MODULE
// =============================================================================

/**
 * Calculate citation velocity (first derivative)
 *
 * V = Total Citations / Years Since Publication
 */
export function calculateCitationVelocity(totalCitations: number, yearsSincePublication: number): number {
  if (yearsSincePublication <= 0) return totalCitations; // Published this year
  return totalCitations / yearsSincePublication;
}

/**
 * Calculate citation acceleration (second derivative)
 *
 * Uses rolling 2-year window to detect momentum changes
 */
export function calculateCitationAcceleration(citationsByYear: Record<number, number>): number {
  const years = Object.keys(citationsByYear)
    .map(Number)
    .sort((a, b) => a - b);

  if (years.length < 3) return 0;

  // Calculate velocities for each period
  const velocities: number[] = [];
  for (let i = 1; i < years.length; i++) {
    const deltaT = years[i] - years[i - 1];
    const deltaCitations = citationsByYear[years[i]] - citationsByYear[years[i - 1]];
    velocities.push(deltaCitations / deltaT);
  }

  // Average acceleration over last 2-year window
  if (velocities.length < 2) return 0;

  const recentVelocities = velocities.slice(-3);
  let totalAcceleration = 0;

  for (let i = 1; i < recentVelocities.length; i++) {
    totalAcceleration += recentVelocities[i] - recentVelocities[i - 1];
  }

  return totalAcceleration / (recentVelocities.length - 1);
}

/**
 * Calculate Disruption Index (D_i)
 *
 * Formula: D_i = (N_i - N_j) / (N_i + N_j + N_k)
 *
 * Where:
 * - N_i: Papers citing focal paper but NOT its references (disruption)
 * - N_j: Papers citing BOTH focal paper AND its references (consolidation)
 * - N_k: Papers citing references but NOT focal paper (ignored)
 *
 * Range: [-1, 1]
 * - Positive: Disruptive (eclipses prior work)
 * - Negative: Consolidating (builds on prior work)
 *
 * Note: Requires citation network data from external API
 */
export function calculateDisruptionIndex(
  citingOnlyFocal: number, // N_i
  citingBoth: number, // N_j
  citingOnlyReferences: number // N_k
): number {
  const denominator = citingOnlyFocal + citingBoth + citingOnlyReferences;

  if (denominator === 0) return 0;

  return (citingOnlyFocal - citingBoth) / denominator;
}

// =============================================================================
// LEGAL-AWARE REPRODUCIBILITY MODULE
// =============================================================================

/**
 * Assess data withholding justification
 *
 * Implements the CMER v2.0 decision tree:
 * - GDPR/HIPAA: Valid if synthetic data or code provided
 * - Proprietary/None: Invalid (red flag)
 */
export function assessDataWithholding(
  reason: DataWithholdingReason,
  syntheticDataProvided: boolean,
  codeProvided: boolean
): { justified: boolean; score: number; note: string } {
  switch (reason) {
    case 'data_available':
      return { justified: true, score: 1.0, note: 'Data is openly available' };

    case 'gdpr_compliance':
    case 'hipaa_compliance':
    case 'participant_consent':
      // Valid privacy reason - check for alternatives
      if (syntheticDataProvided || codeProvided) {
        return {
          justified: true,
          score: 0.8,
          note: 'Privacy-compliant: synthetic data or code provided',
        };
      }
      return {
        justified: true,
        score: 0.5,
        note: 'Privacy-compliant but verification limited',
      };

    case 'national_security':
      return {
        justified: true,
        score: 0.4,
        note: 'National security constraint acknowledged',
      };

    case 'proprietary':
      return {
        justified: false,
        score: 0.2,
        note: 'Proprietary data without justification',
      };

    case 'no_reason':
    default:
      return {
        justified: false,
        score: 0.1,
        note: 'No valid reason for data withholding',
      };
  }
}

/**
 * Calculate FAIR score (simplified)
 *
 * FAIR: Findable, Accessible, Interoperable, Reusable
 */
export function calculateFAIRScore(
  hasPersistentId: boolean, // DOI, etc.
  isOpenAccess: boolean,
  usesStandardFormats: boolean,
  hasLicense: boolean,
  hasMetadata: boolean
): number {
  let score = 0;

  // Findable (25%)
  if (hasPersistentId) score += 0.15;
  if (hasMetadata) score += 0.10;

  // Accessible (25%)
  if (isOpenAccess) score += 0.25;

  // Interoperable (25%)
  if (usesStandardFormats) score += 0.25;

  // Reusable (25%)
  if (hasLicense) score += 0.25;

  return score;
}

// =============================================================================
// CREDIBILITY SCORE 2.0
// =============================================================================

/**
 * Calculate Credibility Score 2.0
 *
 * Formula: C₂.₀ = (α·log(1 + Vₜ) + β·Aₜ) × (1 + |Dᵢ|) × (1 - Pcartel)
 *
 * @param velocity - Citation velocity
 * @param acceleration - Citation acceleration
 * @param disruptionIndex - Disruption index (-1 to 1)
 * @param cartelPenalty - Cartel penalty coefficient (0 to 1)
 * @param alpha - Velocity weight (default 0.6)
 * @param beta - Acceleration weight (default 0.4)
 */
export function calculateCredibilityScore2(
  velocity: number,
  acceleration: number,
  disruptionIndex: number = 0,
  cartelPenalty: number = 0,
  alpha: number = 0.6,
  beta: number = 0.4
): number {
  // Base score from kinematics
  const kinematicScore = alpha * Math.log(1 + velocity) + beta * Math.max(acceleration, 0);

  // Normalize kinematic score (log scale, cap at reasonable max)
  const normalizedKinematic = Math.min(kinematicScore / 5, 1);

  // Disruption multiplier (we value magnitude)
  const disruptionMultiplier = 1 + Math.abs(disruptionIndex);

  // Cartel penalty
  const integrityMultiplier = 1 - cartelPenalty;

  // Final score
  const finalScore = normalizedKinematic * disruptionMultiplier * integrityMultiplier;

  return Math.max(0, Math.min(1, finalScore));
}

// =============================================================================
// KILL SWITCHES
// =============================================================================

/**
 * Check for critical kill-switch conditions that auto-fail the paper
 */
export interface KillSwitchResult {
  triggered: boolean;
  reason?: string;
  severity: 'fatal' | 'critical' | 'none';
}

export function checkKillSwitches(
  domain: ResearchDomain,
  indicators: DomainQualityIndicators,
  plagiarismPercent?: number,
  cartelCentrality?: number
): KillSwitchResult {
  // Plagiarism > 20%
  if (plagiarismPercent !== undefined && plagiarismPercent > 20) {
    return {
      triggered: true,
      reason: `Plagiarism detected: ${plagiarismPercent}% text overlap`,
      severity: 'fatal',
    };
  }

  // Citation cartel centrality > 50%
  if (cartelCentrality !== undefined && cartelCentrality > 0.5) {
    return {
      triggered: true,
      reason: `Citation cartel membership: ${(cartelCentrality * 100).toFixed(0)}% circular citations`,
      severity: 'fatal',
    };
  }

  // Physics: Missing error bars
  if (domain === 'physics' && indicators.hasErrorBars === false) {
    return {
      triggered: true,
      reason: 'Experimental physics paper missing error bars',
      severity: 'critical',
    };
  }

  // Medicine: Unregistered RCT
  if (domain === 'medicine' && indicators.isPreregistered === false) {
    return {
      triggered: true,
      reason: 'Clinical trial not pre-registered',
      severity: 'critical',
    };
  }

  // Medicine: Failed Carlisle check (potential fabrication)
  if (domain === 'medicine' && indicators.passesCarilsleCheck === false) {
    return {
      triggered: true,
      reason: 'Carlisle statistical check failed - potential data fabrication',
      severity: 'fatal',
    };
  }

  return { triggered: false, severity: 'none' };
}
