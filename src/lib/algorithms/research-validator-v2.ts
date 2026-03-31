/**
 * CMER v2.0 Research Validator
 *
 * Unified validation engine integrating:
 * - Dynamic Methodology Matrix (domain-aware scoring)
 * - S-Value (Surprisal) for evidence strength
 * - Citation Kinematics (velocity, acceleration, disruption)
 * - Legal-aware reproducibility (GDPR/HIPAA decision trees)
 * - Kill switches for critical failures
 *
 * Based on: "Project CMER v2.0: A Comprehensive Framework for Automated Research Validation"
 */

import type {
  ResearchArtifact,
  ValidationResult,
  ValidationFlag,
  ValidationWeights,
} from './research-validator';
import { validateResearch } from './research-validator';
import {
  classifyDomain,
  getDomainWeights,
  assessDomainSpecificQuality,
  calculateSValueScore,
  assessDataWithholding,
  calculateFAIRScore,
  checkKillSwitches,
  calculateCredibilityScore2,
  calculateCitationVelocity,
  type ResearchDomain,
  type DomainQualityIndicators,
  type StatisticalEvidence,
  type DataWithholdingReason,
  type KillSwitchResult,
} from './cmer-v2-extensions';
import {
  extractDomainIndicators,
  extractStatisticalEvidence,
  detectCodeAvailability as _detectCodeAvailability,
} from './text-extractors';
import { quickCartelCheck, analyzeCIDRE, buildGraph } from './cidre-algorithm';

// =============================================================================
// TYPES
// =============================================================================

export interface ResearchArtifactV2 extends ResearchArtifact {
  /** Full text content for domain classification and extraction */
  fullText?: string;
  /** Pre-classified domain (optional, will be auto-detected if not provided) */
  domain?: ResearchDomain;
  /** Citation data for kinematics (optional) */
  citationKinematics?: {
    velocity?: number;
    acceleration?: number;
    disruptionIndex?: number;
  };
  /** Data withholding reason for reproducibility assessment */
  dataWithholdingReason?: DataWithholdingReason;
  /** FAIR compliance indicators */
  fairIndicators?: {
    hasPersistentId: boolean;
    isOpenAccess: boolean;
    usesStandardFormats: boolean;
    hasLicense: boolean;
    hasMetadata: boolean;
  };
  /** Plagiarism detection result (if available) */
  plagiarismPercent?: number;
  /** Citation cartel centrality (if available from network analysis) */
  cartelCentrality?: number;
  /** Citation network data for auto-calculating cartel centrality */
  citationNetwork?: Array<{
    /** Source entity (citing paper/author DOI or ID) */
    source: string;
    /** Target entity (cited paper/author DOI or ID) */
    target: string;
    /** Optional year of citation */
    year?: number;
  }>;
}

export interface ValidationResultV2 extends ValidationResult {
  /** Version identifier */
  version: '2.0';
  /** Detected or specified domain */
  domain: ResearchDomain;
  /** Domain detection confidence */
  domainConfidence: number;
  /** Enhanced dimension scores with v2.0 metrics */
  v2Scores: {
    /** S-Value based evidence score */
    sValueScore: number;
    /** Domain-specific quality score */
    domainSpecificScore: number;
    /** Credibility 2.0 (kinematics-based) */
    credibility2: number;
    /** FAIR-based reproducibility */
    fairScore: number;
  };
  /** Kill switch status */
  killSwitch: KillSwitchResult;
  /** Extracted domain indicators */
  domainIndicators: DomainQualityIndicators;
  /** Extracted statistical evidence */
  statisticalEvidence: StatisticalEvidence[];
  /** CIDRE cartel analysis results (if citation network provided) */
  cartelAnalysis?: {
    /** Calculated cartel centrality score */
    cartelCentrality: number;
    /** Whether the citation pattern is suspicious */
    isSuspicious: boolean;
    /** Reason for suspicion (if any) */
    suspicionReason?: string;
    /** Graph reciprocity metric */
    graphReciprocity?: number;
    /** Graph clustering metric */
    graphClustering?: number;
  };
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const V2_WEIGHTS: Record<ResearchDomain, ValidationWeights> = {
  medicine: {
    credibility: 0.20,
    methodology: 0.35,
    evidence: 0.25,
    reproducibility: 0.20,
  },
  cs_ml: {
    credibility: 0.15,
    methodology: 0.25,
    evidence: 0.30,
    reproducibility: 0.30,
  },
  social_science: {
    credibility: 0.20,
    methodology: 0.35,
    evidence: 0.25,
    reproducibility: 0.20,
  },
  physics: {
    credibility: 0.15,
    methodology: 0.30,
    evidence: 0.35,
    reproducibility: 0.20,
  },
  general: {
    credibility: 0.25,
    methodology: 0.30,
    evidence: 0.25,
    reproducibility: 0.20,
  },
};

// =============================================================================
// MAIN VALIDATOR
// =============================================================================

/**
 * Validate research using CMER v2.0 framework
 *
 * @param research - Research artifact with optional v2.0 extensions
 * @returns Enhanced validation result with domain-aware scoring
 */
export function validateResearchV2(research: ResearchArtifactV2): ValidationResultV2 {
  // Step 1: Domain Classification
  const domainResult = research.domain
    ? { domain: research.domain, confidence: 1.0, scores: {} as Record<ResearchDomain, number> }
    : classifyDomain(research.fullText || buildTextFromArtifact(research));

  const domain = domainResult.domain;
  const domainConfidence = domainResult.confidence;

  // Step 2: Extract Domain Indicators from Text
  const textContent = research.fullText || buildTextFromArtifact(research);
  const domainIndicators = extractDomainIndicators(textContent, domain);

  // Step 3: Extract Statistical Evidence
  const statisticalEvidence = extractStatisticalEvidence(textContent);

  // Step 3.5: Calculate Cartel Centrality from Citation Network (if provided)
  let cartelCentrality = research.cartelCentrality;
  let cartelAnalysis: ValidationResultV2['cartelAnalysis'];

  if (research.citationNetwork && research.citationNetwork.length >= 3) {
    const cartelResult = quickCartelCheck(research.citationNetwork);
    cartelCentrality = cartelCentrality ?? cartelResult.score;

    // For deeper analysis, build full graph
    const graph = buildGraph(research.citationNetwork);
    const cidreResult = analyzeCIDRE(graph);

    cartelAnalysis = {
      cartelCentrality: cartelResult.score,
      isSuspicious: cartelResult.suspicious,
      suspicionReason: cartelResult.reason,
      graphReciprocity: cidreResult.graphMetrics.globalReciprocity,
      graphClustering: cidreResult.graphMetrics.globalClustering,
    };
  }

  // Step 4: Check Kill Switches
  const killSwitch = checkKillSwitches(
    domain,
    domainIndicators,
    research.plagiarismPercent,
    cartelCentrality
  );

  // If kill switch triggered, return early with zero score
  if (killSwitch.triggered && killSwitch.severity === 'fatal') {
    return createFailedResult(research, domain, domainConfidence, killSwitch, domainIndicators);
  }

  // Step 5: Run Base v1.0 Validation with Domain-Specific Weights
  const domainWeights = V2_WEIGHTS[domain];
  const baseResult = validateResearch(research, domainWeights);

  // Step 6: Calculate v2.0 Enhanced Scores
  const v2Scores = calculateV2Scores(
    research,
    domain,
    domainIndicators,
    statisticalEvidence,
    cartelCentrality
  );

  // Step 7: Blend v1.0 and v2.0 Scores
  const blendedScores = blendScores(baseResult, v2Scores, domain);

  // Step 8: Merge and Enhance Flags
  const enhancedFlags = enhanceFlags(baseResult.flags, domain, domainIndicators, killSwitch);

  // Step 9: Generate Enhanced Recommendations
  const recommendations = generateV2Recommendations(
    blendedScores,
    enhancedFlags,
    domain,
    domainIndicators
  );

  // Step 10: Calculate Final Score
  const finalScore = calculateFinalScore(blendedScores, killSwitch);
  const grade = scoreToGrade(finalScore);

  return {
    ...baseResult,
    version: '2.0',
    overallScore: finalScore,
    grade,
    domain,
    domainConfidence,
    dimensionScores: blendedScores.dimensions,
    v2Scores: {
      sValueScore: v2Scores.sValue,
      domainSpecificScore: v2Scores.domainSpecific,
      credibility2: v2Scores.credibility2,
      fairScore: v2Scores.fair,
    },
    killSwitch,
    domainIndicators,
    statisticalEvidence,
    cartelAnalysis,
    flags: enhancedFlags,
    recommendations,
    summary: generateSummary(finalScore, grade, domain, enhancedFlags, killSwitch),
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function buildTextFromArtifact(research: ResearchArtifact): string {
  const parts: string[] = [
    research.metadata.title,
    research.methodology.description,
    ...research.claims.map((c) => c.statement),
    ...research.dataPoints.map((d) => d.description),
    ...research.citations.map((c) => c.title),
  ];
  return parts.join(' ');
}

function calculateV2Scores(
  research: ResearchArtifactV2,
  domain: ResearchDomain,
  indicators: DomainQualityIndicators,
  evidence: StatisticalEvidence[],
  calculatedCartelCentrality?: number
): {
  sValue: number;
  domainSpecific: number;
  credibility2: number;
  fair: number;
} {
  // S-Value score from statistical evidence
  const sValue = calculateSValueScore(evidence);

  // Domain-specific quality
  const domainResult = assessDomainSpecificQuality(domain, indicators);
  const domainSpecific = domainResult.score;

  // Credibility 2.0 (kinematics)
  const velocity = research.citationKinematics?.velocity
    ?? calculateCitationVelocity(
      research.citations.reduce((sum, c) => sum + (c.citationCount || 0), 0),
      new Date().getFullYear() - research.metadata.publicationYear
    );
  const acceleration = research.citationKinematics?.acceleration ?? 0;
  const disruption = research.citationKinematics?.disruptionIndex ?? 0;
  // Use calculated cartel centrality (from CIDRE) if available, otherwise fallback to research input
  const cartelPenalty = calculatedCartelCentrality ?? research.cartelCentrality ?? 0;

  const credibility2 = calculateCredibilityScore2(velocity, acceleration, disruption, cartelPenalty);

  // FAIR score
  let fair = 0;
  if (research.fairIndicators) {
    fair = calculateFAIRScore(
      research.fairIndicators.hasPersistentId,
      research.fairIndicators.isOpenAccess,
      research.fairIndicators.usesStandardFormats,
      research.fairIndicators.hasLicense,
      research.fairIndicators.hasMetadata
    );
  } else {
    // Estimate from available data
    fair = research.dataAvailable ? 0.6 : 0.2;
    if (research.metadata.doi) fair += 0.2;
    if (research.methodsAvailable) fair += 0.1;
  }

  // Data withholding assessment
  if (research.dataWithholdingReason && !research.dataAvailable) {
    const withholding = assessDataWithholding(
      research.dataWithholdingReason,
      false, // synthetic data - would need to detect
      research.methodsAvailable
    );
    fair = withholding.score;
  }

  return { sValue, domainSpecific, credibility2, fair };
}

function blendScores(
  baseResult: ValidationResult,
  v2Scores: { sValue: number; domainSpecific: number; credibility2: number; fair: number },
  domain: ResearchDomain
): {
  dimensions: ValidationResult['dimensionScores'];
  overall: number;
} {
  const weights = getDomainWeights(domain);

  // Blend credibility: 60% v1, 40% v2
  const credibility = 0.6 * baseResult.dimensionScores.credibility + 0.4 * v2Scores.credibility2;

  // Blend methodology: base + domain-specific boost
  const methodology =
    (1 - weights.domainSpecific) * baseResult.dimensionScores.methodology +
    weights.domainSpecific * v2Scores.domainSpecific;

  // Blend evidence: 50% v1, 50% s-value
  const evidence = 0.5 * baseResult.dimensionScores.evidence + 0.5 * v2Scores.sValue;

  // Blend reproducibility: 60% v1, 40% FAIR
  const reproducibility = 0.6 * baseResult.dimensionScores.reproducibility + 0.4 * v2Scores.fair;

  const domainWeights = V2_WEIGHTS[domain];
  const overall =
    domainWeights.credibility * credibility +
    domainWeights.methodology * methodology +
    domainWeights.evidence * evidence +
    domainWeights.reproducibility * reproducibility;

  return {
    dimensions: { credibility, methodology, evidence, reproducibility },
    overall: Math.max(0, Math.min(1, overall)),
  };
}

function enhanceFlags(
  baseFlags: ValidationFlag[],
  domain: ResearchDomain,
  indicators: DomainQualityIndicators,
  killSwitch: KillSwitchResult
): ValidationFlag[] {
  const flags = [...baseFlags];

  // Add kill switch flag if triggered
  if (killSwitch.triggered) {
    flags.unshift({
      code: 'KILL_SWITCH_TRIGGERED',
      severity: killSwitch.severity === 'fatal' ? 'critical' : 'warning',
      message: killSwitch.reason || 'Critical validation failure',
      dimension: 'methodology',
    });
  }

  // Add domain-specific flags
  const domainResult = assessDomainSpecificQuality(domain, indicators);
  for (const flag of domainResult.flags) {
    flags.push({
      code: flag,
      severity: flag.includes('MISSING') || flag.includes('NOT_') ? 'warning' : 'info',
      message: formatFlagMessage(flag, domain),
      dimension: getDimensionForFlag(flag),
    });
  }

  // Sort by severity
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  flags.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return flags;
}

function formatFlagMessage(flag: string, _domain: ResearchDomain): string {
  const messages: Record<string, string> = {
    MISSING_ABLATION_STUDY: 'No ablation study detected - consider adding component analysis',
    CODE_NOT_AVAILABLE: 'Code/implementation not publicly available',
    ICR_NOT_REPORTED: 'Inter-coder reliability not reported',
    LOW_INTER_CODER_RELIABILITY: 'Inter-coder reliability below acceptable threshold (κ < 0.6)',
    ICR_BELOW_THRESHOLD: 'Inter-coder reliability below ideal threshold (0.667 < α < 0.8)',
    NO_SATURATION_STATEMENT: 'Theoretical saturation not discussed',
    MISSING_ERROR_BARS: 'Error bars/uncertainty not presented',
    NO_ERROR_PROPAGATION: 'Error propagation analysis not discussed',
    VV_STANDARDS_NOT_MET: 'V&V standards (ASME/NASA) not referenced',
    NOT_PREREGISTERED: 'Study not pre-registered',
    CARLISLE_CHECK_FAILED: 'Statistical patterns suggest potential data issues',
  };

  return messages[flag] || flag.replace(/_/g, ' ').toLowerCase();
}

function getDimensionForFlag(flag: string): ValidationFlag['dimension'] {
  if (flag.includes('ICR') || flag.includes('ABLATION') || flag.includes('ERROR') || flag.includes('VV')) {
    return 'methodology';
  }
  if (flag.includes('CODE') || flag.includes('SATURATION') || flag.includes('PREREGISTERED')) {
    return 'reproducibility';
  }
  if (flag.includes('CARLISLE')) {
    return 'evidence';
  }
  return 'methodology';
}

function generateV2Recommendations(
  scores: { dimensions: ValidationResult['dimensionScores']; overall: number },
  flags: ValidationFlag[],
  domain: ResearchDomain,
  indicators: DomainQualityIndicators
): string[] {
  const recommendations: string[] = [];

  // Critical flags first
  const criticalFlags = flags.filter((f) => f.severity === 'critical');
  for (const flag of criticalFlags.slice(0, 2)) {
    recommendations.push(`🔴 CRITICAL: ${flag.message}`);
  }

  // Domain-specific recommendations
  switch (domain) {
    case 'cs_ml':
      if (!indicators.hasAblationStudy) {
        recommendations.push('📊 Add ablation study to demonstrate component contributions');
      }
      if (!indicators.hasCodeAvailable) {
        recommendations.push('💻 Publish code to a persistent repository (GitHub/Zenodo)');
      }
      break;

    case 'social_science':
      if (!indicators.interCoderReliability) {
        recommendations.push('📋 Report inter-coder reliability (Krippendorff\'s α or Cohen\'s κ)');
      }
      if (!indicators.hasSaturationStatement) {
        recommendations.push('📝 Document theoretical saturation methodology');
      }
      break;

    case 'physics':
      if (!indicators.hasErrorPropagation) {
        recommendations.push('📐 Include error propagation analysis');
      }
      if (!indicators.meetsVVStandards) {
        recommendations.push('✓ Reference V&V standards (ASME V&V 20, NASA-STD-7009)');
      }
      break;

    case 'medicine':
      if (!indicators.isPreregistered) {
        recommendations.push('📋 Pre-register study protocol (ClinicalTrials.gov)');
      }
      if (!indicators.meetsSTROBE) {
        recommendations.push('📝 Map reporting to STROBE/CONSORT checklist');
      }
      break;
  }

  // Dimension-based recommendations
  if (scores.dimensions.evidence < 0.6) {
    recommendations.push('📈 Strengthen evidence with S-value > 7 bits (p < 0.005)');
  }
  if (scores.dimensions.reproducibility < 0.6) {
    recommendations.push('🔄 Improve reproducibility: share data, code, and detailed methods');
  }

  return recommendations.slice(0, 7);
}

function calculateFinalScore(
  scores: { dimensions: ValidationResult['dimensionScores']; overall: number },
  killSwitch: KillSwitchResult
): number {
  if (killSwitch.triggered && killSwitch.severity === 'fatal') {
    return 0;
  }

  let finalScore = scores.overall;

  // Critical kill switch reduces score significantly
  if (killSwitch.triggered && killSwitch.severity === 'critical') {
    finalScore *= 0.5;
  }

  return Math.max(0, Math.min(1, finalScore));
}

function scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 0.9) return 'A';
  if (score >= 0.8) return 'B';
  if (score >= 0.7) return 'C';
  if (score >= 0.6) return 'D';
  return 'F';
}

function generateSummary(
  score: number,
  grade: string,
  domain: ResearchDomain,
  flags: ValidationFlag[],
  killSwitch: KillSwitchResult
): string {
  const criticalCount = flags.filter((f) => f.severity === 'critical').length;
  const warningCount = flags.filter((f) => f.severity === 'warning').length;

  let summary = `CMER v2.0 Validation: Grade ${grade} (${(score * 100).toFixed(0)}%) | Domain: ${domain}`;

  if (killSwitch.triggered) {
    summary += ` | ⚠️ Kill Switch: ${killSwitch.reason}`;
  }

  if (criticalCount > 0) {
    summary += ` | ${criticalCount} critical issue(s)`;
  }
  if (warningCount > 0) {
    summary += ` | ${warningCount} warning(s)`;
  }

  return summary;
}

function createFailedResult(
  research: ResearchArtifactV2,
  domain: ResearchDomain,
  domainConfidence: number,
  killSwitch: KillSwitchResult,
  domainIndicators: DomainQualityIndicators
): ValidationResultV2 {
  return {
    version: '2.0',
    overallScore: 0,
    grade: 'F',
    domain,
    domainConfidence,
    dimensionScores: {
      credibility: 0,
      methodology: 0,
      evidence: 0,
      reproducibility: 0,
    },
    v2Scores: {
      sValueScore: 0,
      domainSpecificScore: 0,
      credibility2: 0,
      fairScore: 0,
    },
    killSwitch,
    domainIndicators,
    statisticalEvidence: [],
    flags: [
      {
        code: 'KILL_SWITCH_FATAL',
        severity: 'critical',
        message: killSwitch.reason || 'Fatal validation failure - research cannot be validated',
        dimension: 'methodology',
      },
    ],
    confidence: 1.0,
    recommendations: [
      `🔴 FATAL: ${killSwitch.reason}`,
      'This research cannot be validated until the critical issue is resolved.',
    ],
    summary: `CMER v2.0: FAILED | Kill Switch Triggered: ${killSwitch.reason}`,
  };
}

// =============================================================================
// QUICK VALIDATION V2
// =============================================================================

export interface QuickValidationV2Input {
  title: string;
  abstract: string;
  domain?: ResearchDomain;
  isPeerReviewed: boolean;
  hasBenchmarks?: boolean;
  hasAblation?: boolean;
  hasCode?: boolean;
  icrValue?: number;
  hasPreregistration?: boolean;
  hasErrorBars?: boolean;
}

/**
 * Quick validation for text-only input
 */
export function quickValidateV2(input: QuickValidationV2Input): {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  domain: ResearchDomain;
  summary: string;
  flags: string[];
} {
  const text = `${input.title} ${input.abstract}`;
  const domainResult = input.domain
    ? { domain: input.domain, confidence: 1, scores: {} as Record<ResearchDomain, number> }
    : classifyDomain(text);

  const domain = domainResult.domain;
  const flags: string[] = [];
  let score = 0.5; // Base score

  // Peer review
  if (input.isPeerReviewed) {
    score += 0.15;
  } else {
    flags.push('NOT_PEER_REVIEWED');
  }

  // Domain-specific bonuses
  switch (domain) {
    case 'cs_ml':
      if (input.hasAblation) score += 0.15;
      else flags.push('MISSING_ABLATION_STUDY');
      if (input.hasCode) score += 0.1;
      else flags.push('CODE_NOT_AVAILABLE');
      if (input.hasBenchmarks) score += 0.1;
      break;

    case 'social_science':
      if (input.icrValue !== undefined) {
        if (input.icrValue >= 0.8) score += 0.2;
        else if (input.icrValue >= 0.667) score += 0.1;
        else flags.push('LOW_ICR');
      } else {
        flags.push('ICR_NOT_REPORTED');
      }
      break;

    case 'physics':
      if (input.hasErrorBars) score += 0.15;
      else flags.push('MISSING_ERROR_BARS');
      break;

    case 'medicine':
      if (input.hasPreregistration) score += 0.2;
      else flags.push('NOT_PREREGISTERED');
      break;
  }

  // Extract evidence from abstract
  const evidence = extractStatisticalEvidence(input.abstract);
  const sValueScore = calculateSValueScore(evidence);
  score += 0.1 * sValueScore;

  score = Math.max(0, Math.min(1, score));
  const grade = scoreToGrade(score);

  return {
    score,
    grade,
    domain,
    summary: `Quick v2.0: Grade ${grade} (${(score * 100).toFixed(0)}%) | Domain: ${domain}`,
    flags,
  };
}
