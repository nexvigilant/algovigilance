/**
 * Text Extractors for CMER v2.0
 *
 * Domain-specific signal detection from research text:
 * - CS/ML: Ablation studies, benchmarks, code availability
 * - Social Science: Inter-coder reliability (ICR) coefficients
 * - Physics: Error bars, V&V standards, uncertainty
 * - Medicine: Pre-registration, STROBE compliance
 */

import type { DomainQualityIndicators, StatisticalEvidence, ResearchDomain } from './cmer-v2-extensions';
import { pValueToSValue, classifyEvidenceStrength } from './cmer-v2-extensions';

// =============================================================================
// CS/ML EXTRACTORS
// =============================================================================

/**
 * Detect presence of ablation study in text
 *
 * Searches for section headers and phrases indicating ablation analysis
 */
export function detectAblationStudy(text: string): boolean {
  const lowerText = text.toLowerCase();

  // Section header patterns
  const headerPatterns = [
    /ablation\s+stud/i,
    /ablation\s+experiment/i,
    /ablation\s+analysis/i,
    /component\s+analysis/i,
    /component\s+ablation/i,
    /baseline\s+comparison/i,
    /module\s+analysis/i,
  ];

  for (const pattern of headerPatterns) {
    if (pattern.test(text)) {
      return true;
    }
  }

  // Content patterns (more specific phrases)
  const contentPatterns = [
    'we ablate',
    'ablating the',
    'removing the',
    'without the',
    'contribution of each',
    'marginal contribution',
    'isolate the effect',
    'removing this component',
  ];

  for (const phrase of contentPatterns) {
    if (lowerText.includes(phrase)) {
      return true;
    }
  }

  return false;
}

/**
 * Detect benchmark comparisons
 */
export function detectBenchmarkComparison(text: string): boolean {
  const lowerText = text.toLowerCase();

  const patterns = [
    'state-of-the-art',
    'sota',
    'benchmark',
    'baseline',
    'compared to',
    'outperforms',
    'achieves',
    'accuracy of',
    'f1 score',
    'auc',
    'bleu score',
    'perplexity',
    'imagenet',
    'mnist',
    'cifar',
    'glue',
    'squad',
  ];

  let matchCount = 0;
  for (const pattern of patterns) {
    if (lowerText.includes(pattern)) {
      matchCount++;
    }
  }

  // Need at least 2 benchmark-related terms
  return matchCount >= 2;
}

/**
 * Detect code availability indicators
 */
export function detectCodeAvailability(text: string): { available: boolean; url?: string } {
  const lowerText = text.toLowerCase();

  // Check for explicit statements
  const availabilityPatterns = [
    /code\s+(?:is\s+)?available\s+at/i,
    /source\s+code\s+(?:is\s+)?available/i,
    /code\s+(?:is\s+)?publicly\s+available/i,
    /implementation\s+(?:is\s+)?available/i,
    /open[\s-]?source/i,
  ];

  for (const pattern of availabilityPatterns) {
    if (pattern.test(text)) {
      // Try to extract URL
      const urlMatch = text.match(/https?:\/\/(?:github|gitlab|bitbucket|zenodo)[^\s<>"]+/i);
      return { available: true, url: urlMatch?.[0] };
    }
  }

  // Check for repository URLs
  const repoPatterns = [
    /github\.com\/[\w-]+\/[\w-]+/i,
    /gitlab\.com\/[\w-]+\/[\w-]+/i,
    /bitbucket\.org\/[\w-]+\/[\w-]+/i,
    /zenodo\.org\/record\/\d+/i,
    /huggingface\.co\/[\w-]+/i,
  ];

  for (const pattern of repoPatterns) {
    const match = text.match(pattern);
    if (match) {
      return { available: true, url: match[0] };
    }
  }

  // Check for negative indicators
  const unavailablePatterns = [
    'code will be released',
    'code upon request',
    'available upon request',
    'proprietary',
  ];

  for (const pattern of unavailablePatterns) {
    if (lowerText.includes(pattern)) {
      return { available: false };
    }
  }

  return { available: false };
}

/**
 * Detect reproducibility checklist adherence
 */
export function detectReproducibilityChecklist(text: string): boolean {
  const lowerText = text.toLowerCase();

  const patterns = [
    'reproducibility checklist',
    'neurips checklist',
    'ml reproducibility',
    'computing infrastructure',
    'gpu hours',
    'carbon footprint',
    'random seed',
    'hyperparameter search',
  ];

  let matchCount = 0;
  for (const pattern of patterns) {
    if (lowerText.includes(pattern)) {
      matchCount++;
    }
  }

  return matchCount >= 2;
}

// =============================================================================
// SOCIAL SCIENCE EXTRACTORS
// =============================================================================

/**
 * Extract Inter-Coder Reliability (ICR) coefficients
 *
 * Looks for Krippendorff's Alpha, Cohen's Kappa, and related metrics
 */
export function extractICRCoefficients(text: string): { coefficient: string; value: number }[] {
  const results: { coefficient: string; value: number }[] = [];

  // Krippendorff's Alpha patterns
  const alphaPatterns = [
    /krippendorff['']?s?\s+alpha\s*[=:]\s*(0?\.\d+)/gi,
    /α\s*[=:]\s*(0?\.\d+)/g,
    /alpha\s*[=:]\s*(0?\.\d+)/gi,
  ];

  for (const pattern of alphaPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const value = parseFloat(match[1]);
      if (value > 0 && value <= 1) {
        results.push({ coefficient: 'krippendorff_alpha', value });
      }
    }
  }

  // Cohen's Kappa patterns
  const kappaPatterns = [
    /cohen['']?s?\s+kappa\s*[=:]\s*(0?\.\d+)/gi,
    /κ\s*[=:]\s*(0?\.\d+)/g,
    /kappa\s*[=:]\s*(0?\.\d+)/gi,
    /inter-?rater\s+(?:reliability|agreement)\s*[=:]\s*(0?\.\d+)/gi,
  ];

  for (const pattern of kappaPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const value = parseFloat(match[1]);
      if (value > 0 && value <= 1) {
        results.push({ coefficient: 'cohen_kappa', value });
      }
    }
  }

  // Fleiss' Kappa
  const fleissPatterns = [/fleiss['']?s?\s+kappa\s*[=:]\s*(0?\.\d+)/gi];

  for (const pattern of fleissPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const value = parseFloat(match[1]);
      if (value > 0 && value <= 1) {
        results.push({ coefficient: 'fleiss_kappa', value });
      }
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  return results.filter((r) => {
    const key = `${r.coefficient}:${r.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Detect saturation statement in qualitative research
 */
export function detectSaturationStatement(text: string): boolean {
  const lowerText = text.toLowerCase();

  const patterns = [
    'theoretical saturation',
    'data saturation',
    'saturation was reached',
    'saturation point',
    'no new themes',
    'no new categories',
    'sampling until saturation',
    'saturation in qualitative',
  ];

  for (const pattern of patterns) {
    if (lowerText.includes(pattern)) {
      return true;
    }
  }

  return false;
}

/**
 * Detect construct validity discussion
 */
export function detectConstructValidity(text: string): boolean {
  const lowerText = text.toLowerCase();

  const patterns = [
    'construct validity',
    'factor analysis',
    'confirmatory factor',
    'exploratory factor',
    'cfa',
    'efa',
    'convergent validity',
    'discriminant validity',
    'criterion validity',
    'cronbach',
    'internal consistency',
  ];

  let matchCount = 0;
  for (const pattern of patterns) {
    if (lowerText.includes(pattern)) {
      matchCount++;
    }
  }

  return matchCount >= 2;
}

/**
 * Detect WEIRD bias acknowledgment
 */
export function detectWEIRDBiasAcknowledgment(text: string): boolean {
  const lowerText = text.toLowerCase();

  const patterns = [
    'weird',
    'western, educated',
    'generalizability',
    'external validity',
    'cultural context',
    'cross-cultural',
    'predominantly',
    'limited to',
    'sample was drawn from',
  ];

  // Need explicit limitation discussion
  const limitationPatterns = ['limitation', 'caveat', 'acknowledge', 'note that'];

  let hasLimitationContext = false;
  for (const pattern of limitationPatterns) {
    if (lowerText.includes(pattern)) {
      hasLimitationContext = true;
      break;
    }
  }

  if (!hasLimitationContext) return false;

  for (const pattern of patterns) {
    if (lowerText.includes(pattern)) {
      return true;
    }
  }

  return false;
}

// =============================================================================
// PHYSICS EXTRACTORS
// =============================================================================

/**
 * Detect error propagation analysis
 */
export function detectErrorPropagation(text: string): boolean {
  const lowerText = text.toLowerCase();

  const patterns = [
    'error propagation',
    'uncertainty propagation',
    'propagated error',
    'systematic uncertainty',
    'statistical uncertainty',
    'combined uncertainty',
    'error analysis',
    'uncertainty analysis',
    '±',
    'plus or minus',
  ];

  let matchCount = 0;
  for (const pattern of patterns) {
    if (lowerText.includes(pattern)) {
      matchCount++;
    }
  }

  return matchCount >= 2;
}

/**
 * Detect V&V (Verification & Validation) standards compliance
 */
export function detectVVStandards(text: string): boolean {
  const lowerText = text.toLowerCase();

  const patterns = [
    'verification and validation',
    'v&v',
    'asme v&v',
    'nasa-std-7009',
    'grid convergence',
    'grid independence',
    'mesh independence',
    'gci',
    'grid convergence index',
    'richardson extrapolation',
    'code verification',
    'solution verification',
  ];

  for (const pattern of patterns) {
    if (lowerText.includes(pattern)) {
      return true;
    }
  }

  return false;
}

/**
 * Detect error bars in data presentation
 *
 * Note: This is a heuristic - true detection requires figure analysis
 */
export function detectErrorBarsDiscussion(text: string): boolean {
  const lowerText = text.toLowerCase();

  const patterns = [
    'error bar',
    'uncertainty bar',
    'confidence interval',
    'standard deviation',
    'standard error',
    'shaded region',
    '95% ci',
    '99% ci',
    'error estimate',
  ];

  for (const pattern of patterns) {
    if (lowerText.includes(pattern)) {
      return true;
    }
  }

  return false;
}

// =============================================================================
// MEDICINE EXTRACTORS
// =============================================================================

/**
 * Detect pre-registration information
 */
export function detectPreregistration(text: string): { isPreregistered: boolean; registryId?: string } {
  // Registry patterns
  const registryPatterns = [
    /clinicaltrials\.gov[:\s]+(?:NCT)?(\d+)/i,
    /NCT\s*(\d{8})/i,
    /ISRCTN\s*(\d+)/i,
    /pre-?registered?\s+(?:at|with|on)/i,
    /prospero[:\s]+(?:CRD)?(\d+)/i,
    /osf\.io\/[\w]+/i,
    /aspredicted\.org/i,
  ];

  for (const pattern of registryPatterns) {
    const match = text.match(pattern);
    if (match) {
      return { isPreregistered: true, registryId: match[0] };
    }
  }

  // Check for explicit statements
  const lowerText = text.toLowerCase();
  if (
    lowerText.includes('pre-registered') ||
    lowerText.includes('preregistered') ||
    lowerText.includes('registered protocol') ||
    lowerText.includes('trial registration')
  ) {
    return { isPreregistered: true };
  }

  return { isPreregistered: false };
}

/**
 * Detect STROBE compliance
 */
export function detectSTROBECompliance(text: string): boolean {
  const lowerText = text.toLowerCase();

  const patterns = [
    'strobe',
    'strengthening the reporting of observational',
    'consort',
    'prisma',
    'reporting guideline',
    'checklist',
  ];

  for (const pattern of patterns) {
    if (lowerText.includes(pattern)) {
      return true;
    }
  }

  return false;
}

/**
 * Extract all p-values from text with context
 */
export function extractStatisticalEvidence(text: string): StatisticalEvidence[] {
  const results: StatisticalEvidence[] = [];

  // P-value patterns
  const pValuePatterns = [
    /p\s*[=<>≤≥]\s*(0?\.\d+(?:e[+-]?\d+)?)/gi,
    /p-value\s*(?:of|:)?\s*(0?\.\d+(?:e[+-]?\d+)?)/gi,
    /significance\s*(?:level)?\s*(?:of|:)?\s*(0?\.\d+)/gi,
  ];

  for (const pattern of pValuePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      let pValue = parseFloat(match[1]);

      // Handle scientific notation
      if (match[1].includes('e')) {
        pValue = parseFloat(match[1]);
      }

      if (pValue > 0 && pValue <= 1) {
        const sValue = pValueToSValue(pValue);
        results.push({
          pValue,
          sValue,
          evidenceStrength: classifyEvidenceStrength(sValue),
          precisionScore: 0.5,
        });
      }
    }
  }

  // Confidence interval patterns
  const ciPattern = /(\d+)%\s*(?:CI|confidence interval)[:\s]*\[?\s*([-\d.]+)\s*[,to-]\s*([-\d.]+)\s*\]?/gi;
  let ciMatch;
  while ((ciMatch = ciPattern.exec(text)) !== null) {
    const lower = parseFloat(ciMatch[2]);
    const upper = parseFloat(ciMatch[3]);
    if (!isNaN(lower) && !isNaN(upper)) {
      // Find or create a StatisticalEvidence entry to add CI to
      const width = upper - lower;
      const precision = Math.max(0, 1 - width / 10); // Narrower = better
      if (results.length > 0) {
        results[results.length - 1].confidenceInterval = [lower, upper];
        results[results.length - 1].precisionScore = precision;
      }
    }
  }

  // Effect size patterns
  const effectPatterns = [
    { pattern: /cohen['']?s?\s+d\s*[=:]\s*([-\d.]+)/gi, type: 'cohens_d' as const },
    { pattern: /odds\s+ratio\s*[=:]\s*([-\d.]+)/gi, type: 'odds_ratio' as const },
    { pattern: /r\s*[²2]\s*[=:]\s*(0?\.\d+)/gi, type: 'r_squared' as const },
    { pattern: /η\s*[²2]\s*[=:]\s*(0?\.\d+)/gi, type: 'eta_squared' as const },
  ];

  for (const { pattern, type } of effectPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const value = parseFloat(match[1]);
      if (!isNaN(value)) {
        // Find the most recent result to attach this to, or create new
        if (results.length > 0) {
          results[results.length - 1].effectSize = value;
          results[results.length - 1].effectSizeType = type;
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

// =============================================================================
// UNIFIED EXTRACTOR
// =============================================================================

/**
 * Extract all domain quality indicators from text
 */
export function extractDomainIndicators(text: string, domain: ResearchDomain): DomainQualityIndicators {
  const indicators: DomainQualityIndicators = { domain };

  switch (domain) {
    case 'cs_ml': {
      indicators.hasAblationStudy = detectAblationStudy(text);
      indicators.hasBenchmarkComparison = detectBenchmarkComparison(text);
      const codeInfo = detectCodeAvailability(text);
      indicators.hasCodeAvailable = codeInfo.available;
      indicators.hasReproducibilityChecklist = detectReproducibilityChecklist(text);
      break;
    }

    case 'social_science': {
      const icrCoeffs = extractICRCoefficients(text);
      if (icrCoeffs.length > 0) {
        // Use the highest coefficient value
        indicators.interCoderReliability = Math.max(...icrCoeffs.map((c) => c.value));
      }
      indicators.hasConstructValidity = detectConstructValidity(text);
      indicators.hasSaturationStatement = detectSaturationStatement(text);
      indicators.acknowledgesWEIRDBias = detectWEIRDBiasAcknowledgment(text);
      break;
    }

    case 'physics': {
      indicators.hasErrorPropagation = detectErrorPropagation(text);
      indicators.meetsVVStandards = detectVVStandards(text);
      indicators.hasErrorBars = detectErrorBarsDiscussion(text);
      break;
    }

    case 'medicine': {
      const preregInfo = detectPreregistration(text);
      indicators.isPreregistered = preregInfo.isPreregistered;
      indicators.meetsSTROBE = detectSTROBECompliance(text);
      // Carlisle check requires actual data analysis, not text extraction
      break;
    }
  }

  return indicators;
}
