/**
 * Research Validator Algorithm Tests
 *
 * Comprehensive test suite covering:
 * - Basic functionality
 * - Edge cases (empty, singleton, extrema)
 * - Each dimension independently
 * - Integration/aggregation
 * - Property-based invariants
 */

import {
  validateResearch,
  quickValidate,
  type ResearchArtifact,
  type Citation,
  type Claim,
  type DataPoint,
  type Methodology,
  type Author,
  type ResearchMetadata,
  type StudyType,
  type _BiasControl,
  type _ValidationResult,
} from '../research-validator';

// =============================================================================
// TEST FIXTURES
// =============================================================================

const createMockAuthor = (overrides?: Partial<Author>): Author => ({
  name: 'Dr. Jane Smith',
  affiliation: 'University Research Center',
  hIndex: 25,
  publicationCount: 50,
  ...overrides,
});

const createMockCitation = (overrides?: Partial<Citation>): Citation => ({
  id: `cit-${Math.random().toString(36).substr(2, 9)}`,
  title: 'A Study on Research Methods',
  authors: ['Smith, J.', 'Doe, J.'],
  year: 2023,
  journal: 'Journal of Research',
  doi: '10.1234/example',
  isPeerReviewed: true,
  impactFactor: 5.2,
  citationCount: 45,
  sourceType: 'journal',
  ...overrides,
});

const createMockMethodology = (overrides?: Partial<Methodology>): Methodology => ({
  studyType: 'randomized_controlled_trial',
  sampleSize: 200,
  populationDescription: 'Adults aged 18-65',
  inclusionCriteria: ['Age 18-65', 'No prior conditions'],
  exclusionCriteria: ['Pregnancy', 'Current medication use'],
  biasControls: ['randomization', 'blinding_double', 'allocation_concealment'],
  statisticalMethods: ['t-test', 'ANOVA', 'regression'],
  powerAnalysis: true,
  effectSizeReported: true,
  confidenceIntervals: true,
  pValueThreshold: 0.05,
  description: 'A comprehensive randomized controlled trial with proper controls and blinding procedures. Participants were randomly assigned to treatment or control groups using computer-generated randomization.',
  ...overrides,
});

const createMockClaim = (overrides?: Partial<Claim>): Claim => ({
  id: `claim-${Math.random().toString(36).substr(2, 9)}`,
  statement: 'Treatment X significantly improves outcome Y',
  type: 'primary',
  supportingEvidenceIds: ['dp-1', 'dp-2'],
  ...overrides,
});

const createMockDataPoint = (overrides?: Partial<DataPoint>): DataPoint => ({
  id: `dp-${Math.random().toString(36).substr(2, 9)}`,
  type: 'quantitative',
  description: 'Statistical analysis of treatment effect',
  source: 'primary',
  sampleSize: 150,
  statisticalSignificance: 0.01,
  effectSize: 0.45,
  confidenceInterval: [0.32, 0.58],
  ...overrides,
});

const createMockMetadata = (overrides?: Partial<ResearchMetadata>): ResearchMetadata => ({
  title: 'Effects of Treatment X on Outcome Y: A Randomized Controlled Trial',
  authors: [createMockAuthor()],
  publicationYear: 2024,
  journal: 'Journal of Clinical Research',
  doi: '10.1234/jcr.2024.001',
  field: 'medicine',
  isPreregistered: true,
  preregistrationUrl: 'https://clinicaltrials.gov/example',
  fundingSource: 'National Research Foundation',
  dataAvailabilityStatement: 'Data available upon reasonable request',
  ...overrides,
});

const createMockResearch = (overrides?: Partial<ResearchArtifact>): ResearchArtifact => ({
  metadata: createMockMetadata(),
  claims: [
    createMockClaim({ id: 'claim-1', supportingEvidenceIds: ['dp-1', 'dp-2'] }),
    createMockClaim({ id: 'claim-2', type: 'secondary', supportingEvidenceIds: ['dp-3'] }),
  ],
  citations: [
    createMockCitation({ id: 'cit-1' }),
    createMockCitation({ id: 'cit-2', year: 2022 }),
    createMockCitation({ id: 'cit-3', year: 2021 }),
    createMockCitation({ id: 'cit-4', year: 2020 }),
    createMockCitation({ id: 'cit-5', year: 2019 }),
  ],
  methodology: createMockMethodology(),
  dataPoints: [
    createMockDataPoint({ id: 'dp-1' }),
    createMockDataPoint({ id: 'dp-2', statisticalSignificance: 0.03 }),
    createMockDataPoint({ id: 'dp-3', type: 'qualitative', source: 'secondary' }),
  ],
  dataAvailable: true,
  methodsAvailable: true,
  codeAvailable: true,
  ...overrides,
});

// =============================================================================
// BASIC FUNCTIONALITY TESTS
// =============================================================================

describe('Research Validator - Basic Functionality', () => {
  test('validates well-formed research artifact', () => {
    const research = createMockResearch();
    const result = validateResearch(research);

    expect(result).toBeDefined();
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(1);
    expect(result.grade).toMatch(/^[A-F]$/);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  test('returns all required fields', () => {
    const research = createMockResearch();
    const result = validateResearch(research);

    expect(result).toHaveProperty('overallScore');
    expect(result).toHaveProperty('grade');
    expect(result).toHaveProperty('dimensionScores');
    expect(result).toHaveProperty('flags');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('recommendations');
    expect(result).toHaveProperty('summary');

    expect(result.dimensionScores).toHaveProperty('credibility');
    expect(result.dimensionScores).toHaveProperty('methodology');
    expect(result.dimensionScores).toHaveProperty('evidence');
    expect(result.dimensionScores).toHaveProperty('reproducibility');
  });

  test('high-quality research scores well', () => {
    const research = createMockResearch();
    const result = validateResearch(research);

    // Well-formed research should score at least B
    expect(result.overallScore).toBeGreaterThan(0.7);
    expect(['A', 'B']).toContain(result.grade);
  });

  test('generates meaningful summary', () => {
    const research = createMockResearch();
    const result = validateResearch(research);

    expect(result.summary).toContain('Grade');
    expect(result.summary).toContain('%');
    expect(result.summary).toContain('Confidence');
  });
});

// =============================================================================
// EDGE CASE TESTS
// =============================================================================

describe('Research Validator - Edge Cases', () => {
  test('throws on research with no claims', () => {
    const research = createMockResearch({ claims: [] });

    expect(() => validateResearch(research)).toThrow('at least one claim');
  });

  test('handles single claim', () => {
    const research = createMockResearch({
      claims: [createMockClaim({ supportingEvidenceIds: ['dp-1'] })],
      dataPoints: [createMockDataPoint({ id: 'dp-1' })],
    });

    const result = validateResearch(research);
    expect(result.overallScore).toBeGreaterThan(0);
  });

  test('handles no citations gracefully', () => {
    const research = createMockResearch({ citations: [] });
    const result = validateResearch(research);

    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.flags.some((f) => f.code === 'INSUFFICIENT_CITATIONS')).toBe(true);
  });

  test('handles no data points gracefully', () => {
    const research = createMockResearch({
      claims: [createMockClaim({ supportingEvidenceIds: [] })],
      dataPoints: [],
    });

    const result = validateResearch(research);
    expect(result.flags.some((f) => f.code === 'UNSUPPORTED_CLAIM')).toBe(true);
  });

  test('handles missing optional metadata', () => {
    const research = createMockResearch({
      metadata: createMockMetadata({
        doi: undefined,
        journal: undefined,
        fundingSource: undefined,
        dataAvailabilityStatement: undefined,
      }),
    });

    const result = validateResearch(research);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThan(1); // Reduced confidence
  });

  test('handles extreme sample sizes', () => {
    const smallSample = createMockResearch({
      methodology: createMockMethodology({ sampleSize: 5 }),
    });
    const largeSample = createMockResearch({
      methodology: createMockMethodology({ sampleSize: 100000 }),
    });

    const smallResult = validateResearch(smallSample);
    const largeResult = validateResearch(largeSample);

    expect(smallResult.dimensionScores.methodology).toBeLessThan(largeResult.dimensionScores.methodology);
    expect(smallResult.flags.some((f) => f.code === 'INSUFFICIENT_SAMPLE_SIZE')).toBe(true);
  });
});

// =============================================================================
// CREDIBILITY DIMENSION TESTS
// =============================================================================

describe('Research Validator - Credibility Assessment', () => {
  test('peer-reviewed sources score higher', () => {
    const peerReviewed = createMockResearch({
      citations: Array(5)
        .fill(null)
        .map(() => createMockCitation({ isPeerReviewed: true })),
    });
    const notPeerReviewed = createMockResearch({
      citations: Array(5)
        .fill(null)
        .map(() => createMockCitation({ isPeerReviewed: false })),
    });

    const prResult = validateResearch(peerReviewed);
    const nprResult = validateResearch(notPeerReviewed);

    expect(prResult.dimensionScores.credibility).toBeGreaterThan(nprResult.dimensionScores.credibility);
  });

  test('diverse sources score higher', () => {
    const diverse = createMockResearch({
      citations: [
        createMockCitation({ authors: ['A'], journal: 'J1' }),
        createMockCitation({ authors: ['B'], journal: 'J2' }),
        createMockCitation({ authors: ['C'], journal: 'J3' }),
        createMockCitation({ authors: ['D'], journal: 'J4' }),
        createMockCitation({ authors: ['E'], journal: 'J5' }),
      ],
    });
    const sameSource = createMockResearch({
      citations: Array(5)
        .fill(null)
        .map(() => createMockCitation({ authors: ['Same Author'], journal: 'Same Journal' })),
    });

    const diverseResult = validateResearch(diverse);
    const sameResult = validateResearch(sameSource);

    expect(diverseResult.dimensionScores.credibility).toBeGreaterThan(sameResult.dimensionScores.credibility);
  });

  test('recent citations score higher for fast-moving fields', () => {
    const recentAI = createMockResearch({
      metadata: createMockMetadata({ field: 'artificial intelligence' }),
      citations: Array(5)
        .fill(null)
        .map(() => createMockCitation({ year: 2024 })),
    });
    const oldAI = createMockResearch({
      metadata: createMockMetadata({ field: 'artificial intelligence' }),
      citations: Array(5)
        .fill(null)
        .map(() => createMockCitation({ year: 2015 })),
    });

    const recentResult = validateResearch(recentAI);
    const oldResult = validateResearch(oldAI);

    expect(recentResult.dimensionScores.credibility).toBeGreaterThan(oldResult.dimensionScores.credibility);
  });

  test('flags low quality citations', () => {
    const research = createMockResearch({
      citations: [
        createMockCitation({
          isPeerReviewed: false,
          sourceType: 'website',
          impactFactor: undefined,
          citationCount: 0,
        }),
      ],
    });

    const result = validateResearch(research);
    expect(result.flags.some((f) => f.code === 'LOW_QUALITY_CITATION')).toBe(true);
  });
});

// =============================================================================
// METHODOLOGY DIMENSION TESTS
// =============================================================================

describe('Research Validator - Methodology Assessment', () => {
  test('RCT scores higher than case report', () => {
    const rct = createMockResearch({
      methodology: createMockMethodology({ studyType: 'randomized_controlled_trial' }),
    });
    const caseReport = createMockResearch({
      methodology: createMockMethodology({ studyType: 'case_report' }),
    });

    const rctResult = validateResearch(rct);
    const crResult = validateResearch(caseReport);

    expect(rctResult.dimensionScores.methodology).toBeGreaterThan(crResult.dimensionScores.methodology);
  });

  test('bias controls improve score', () => {
    const withControls = createMockResearch({
      methodology: createMockMethodology({
        biasControls: ['randomization', 'blinding_double', 'allocation_concealment'],
      }),
    });
    const noControls = createMockResearch({
      methodology: createMockMethodology({ biasControls: [] }),
    });

    const wcResult = validateResearch(withControls);
    const ncResult = validateResearch(noControls);

    expect(wcResult.dimensionScores.methodology).toBeGreaterThan(ncResult.dimensionScores.methodology);
    expect(ncResult.flags.some((f) => f.code === 'NO_BIAS_CONTROLS')).toBe(true);
  });

  test('flags insufficient sample size for study type', () => {
    const research = createMockResearch({
      methodology: createMockMethodology({
        studyType: 'randomized_controlled_trial',
        sampleSize: 10, // Below minimum of 30
      }),
    });

    const result = validateResearch(research);
    expect(result.flags.some((f) => f.code === 'INSUFFICIENT_SAMPLE_SIZE')).toBe(true);
  });

  test('statistical methods documentation improves score', () => {
    const documented = createMockResearch({
      methodology: createMockMethodology({
        powerAnalysis: true,
        effectSizeReported: true,
        confidenceIntervals: true,
        statisticalMethods: ['regression', 'ANOVA'],
      }),
    });
    const undocumented = createMockResearch({
      methodology: createMockMethodology({
        powerAnalysis: false,
        effectSizeReported: false,
        confidenceIntervals: false,
        statisticalMethods: [],
      }),
    });

    const docResult = validateResearch(documented);
    const undocResult = validateResearch(undocumented);

    expect(docResult.dimensionScores.methodology).toBeGreaterThan(undocResult.dimensionScores.methodology);
  });
});

// =============================================================================
// EVIDENCE DIMENSION TESTS
// =============================================================================

describe('Research Validator - Evidence Assessment', () => {
  test('supported claims score higher', () => {
    const supported = createMockResearch({
      claims: [createMockClaim({ supportingEvidenceIds: ['dp-1', 'dp-2'] })],
      dataPoints: [createMockDataPoint({ id: 'dp-1' }), createMockDataPoint({ id: 'dp-2' })],
    });
    const unsupported = createMockResearch({
      claims: [createMockClaim({ supportingEvidenceIds: [] })],
      dataPoints: [],
    });

    const supResult = validateResearch(supported);
    const unsupResult = validateResearch(unsupported);

    expect(supResult.dimensionScores.evidence).toBeGreaterThan(unsupResult.dimensionScores.evidence);
  });

  test('quantitative data with statistics scores higher', () => {
    const quantitative = createMockResearch({
      claims: [createMockClaim({ supportingEvidenceIds: ['dp-1'] })],
      dataPoints: [
        createMockDataPoint({
          id: 'dp-1',
          type: 'quantitative',
          statisticalSignificance: 0.01,
          effectSize: 0.5,
        }),
      ],
    });
    const qualitative = createMockResearch({
      claims: [createMockClaim({ supportingEvidenceIds: ['dp-1'] })],
      dataPoints: [
        createMockDataPoint({
          id: 'dp-1',
          type: 'qualitative',
          statisticalSignificance: undefined,
          effectSize: undefined,
        }),
      ],
    });

    const quantResult = validateResearch(quantitative);
    const qualResult = validateResearch(qualitative);

    expect(quantResult.dimensionScores.evidence).toBeGreaterThan(qualResult.dimensionScores.evidence);
  });

  test('flags unsupported claims', () => {
    const research = createMockResearch({
      claims: [
        createMockClaim({ id: 'c1', supportingEvidenceIds: ['dp-1'] }),
        createMockClaim({ id: 'c2', supportingEvidenceIds: ['nonexistent'] }),
      ],
      dataPoints: [createMockDataPoint({ id: 'dp-1' })],
    });

    const result = validateResearch(research);
    expect(result.flags.some((f) => f.code === 'UNSUPPORTED_CLAIM')).toBe(true);
  });
});

// =============================================================================
// REPRODUCIBILITY DIMENSION TESTS
// =============================================================================

describe('Research Validator - Reproducibility Assessment', () => {
  test('data availability improves score', () => {
    const available = createMockResearch({ dataAvailable: true });
    const unavailable = createMockResearch({ dataAvailable: false });

    const avResult = validateResearch(available);
    const unavResult = validateResearch(unavailable);

    expect(avResult.dimensionScores.reproducibility).toBeGreaterThan(unavResult.dimensionScores.reproducibility);
    expect(unavResult.flags.some((f) => f.code === 'DATA_NOT_AVAILABLE')).toBe(true);
  });

  test('pre-registration improves score for applicable studies', () => {
    const preregistered = createMockResearch({
      metadata: createMockMetadata({ isPreregistered: true }),
    });
    const notPreregistered = createMockResearch({
      metadata: createMockMetadata({ isPreregistered: false }),
    });

    const prResult = validateResearch(preregistered);
    const nprResult = validateResearch(notPreregistered);

    expect(prResult.dimensionScores.reproducibility).toBeGreaterThan(nprResult.dimensionScores.reproducibility);
  });

  test('methods availability improves score', () => {
    const available = createMockResearch({ methodsAvailable: true });
    const unavailable = createMockResearch({ methodsAvailable: false });

    const avResult = validateResearch(available);
    const unavResult = validateResearch(unavailable);

    expect(avResult.dimensionScores.reproducibility).toBeGreaterThan(unavResult.dimensionScores.reproducibility);
  });
});

// =============================================================================
// CUSTOM WEIGHTS TESTS
// =============================================================================

describe('Research Validator - Custom Weights', () => {
  test('accepts valid custom weights', () => {
    const research = createMockResearch();
    const customWeights = {
      credibility: 0.4,
      methodology: 0.3,
      evidence: 0.2,
      reproducibility: 0.1,
    };

    const result = validateResearch(research, customWeights);
    expect(result).toBeDefined();
    expect(result.overallScore).toBeGreaterThan(0);
  });

  test('throws on weights that dont sum to 1', () => {
    const research = createMockResearch();
    const badWeights = {
      credibility: 0.5,
      methodology: 0.5,
      evidence: 0.5,
      reproducibility: 0.5,
    };

    expect(() => validateResearch(research, badWeights)).toThrow('must sum to 1.0');
  });

  test('custom weights affect final score', () => {
    // Create research with high credibility but low methodology
    const research = createMockResearch({
      citations: Array(10)
        .fill(null)
        .map(() =>
          createMockCitation({
            isPeerReviewed: true,
            impactFactor: 10,
            citationCount: 200,
          })
        ),
      methodology: createMockMethodology({
        studyType: 'case_report',
        biasControls: [],
        sampleSize: 1,
      }),
    });

    const credibilityHeavy = validateResearch(research, {
      credibility: 0.7,
      methodology: 0.1,
      evidence: 0.1,
      reproducibility: 0.1,
    });

    const methodologyHeavy = validateResearch(research, {
      credibility: 0.1,
      methodology: 0.7,
      evidence: 0.1,
      reproducibility: 0.1,
    });

    expect(credibilityHeavy.overallScore).toBeGreaterThan(methodologyHeavy.overallScore);
  });
});

// =============================================================================
// QUICK VALIDATE TESTS
// =============================================================================

describe('Research Validator - Quick Validate', () => {
  test('provides basic validation with limited input', () => {
    const result = quickValidate({
      title: 'Test Study',
      authors: ['Smith, J.'],
      year: 2024,
      studyType: 'randomized_controlled_trial',
      sampleSize: 100,
      citationCount: 10,
      isPeerReviewed: true,
      hasBiasControls: true,
      dataAvailable: true,
      claimCount: 3,
      supportedClaimPercentage: 0.9,
    });

    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(1);
    expect(result.grade).toMatch(/^[A-F]$/);
    expect(result.summary).toContain('Quick validation');
  });

  test('scores peer-reviewed higher', () => {
    const base = {
      title: 'Test',
      authors: ['A'],
      year: 2024,
      studyType: 'cohort_study' as StudyType,
      citationCount: 5,
      hasBiasControls: true,
      dataAvailable: true,
      claimCount: 1,
      supportedClaimPercentage: 1,
    };

    const prResult = quickValidate({ ...base, isPeerReviewed: true });
    const nprResult = quickValidate({ ...base, isPeerReviewed: false });

    expect(prResult.score).toBeGreaterThan(nprResult.score);
  });
});

// =============================================================================
// PROPERTY-BASED INVARIANT TESTS
// =============================================================================

describe('Research Validator - Invariants', () => {
  test('scores are always between 0 and 1', () => {
    const testCases = [
      createMockResearch(), // Normal case
      createMockResearch({ citations: [] }), // No citations
      createMockResearch({ dataPoints: [] }), // No data
      createMockResearch({
        methodology: createMockMethodology({ biasControls: [] }),
      }), // No bias controls
    ];

    for (const research of testCases) {
      // Ensure at least one claim with supporting evidence for valid research
      if (research.claims[0]?.supportingEvidenceIds.length > 0 && research.dataPoints.length === 0) {
        research.claims[0].supportingEvidenceIds = [];
      }

      const result = validateResearch(research);

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(1);
      expect(result.dimensionScores.credibility).toBeGreaterThanOrEqual(0);
      expect(result.dimensionScores.credibility).toBeLessThanOrEqual(1);
      expect(result.dimensionScores.methodology).toBeGreaterThanOrEqual(0);
      expect(result.dimensionScores.methodology).toBeLessThanOrEqual(1);
      expect(result.dimensionScores.evidence).toBeGreaterThanOrEqual(0);
      expect(result.dimensionScores.evidence).toBeLessThanOrEqual(1);
      expect(result.dimensionScores.reproducibility).toBeGreaterThanOrEqual(0);
      expect(result.dimensionScores.reproducibility).toBeLessThanOrEqual(1);
    }
  });

  test('weighted sum equals overall score', () => {
    const research = createMockResearch();
    const result = validateResearch(research);

    const expectedScore =
      0.25 * result.dimensionScores.credibility +
      0.3 * result.dimensionScores.methodology +
      0.25 * result.dimensionScores.evidence +
      0.2 * result.dimensionScores.reproducibility;

    expect(result.overallScore).toBeCloseTo(expectedScore, 5);
  });

  test('grade corresponds to score range', () => {
    const gradeRanges: Record<string, [number, number]> = {
      A: [0.9, 1.0],
      B: [0.8, 0.9],
      C: [0.7, 0.8],
      D: [0.6, 0.7],
      F: [0, 0.6],
    };

    const research = createMockResearch();
    const result = validateResearch(research);

    const [min, max] = gradeRanges[result.grade];
    expect(result.overallScore).toBeGreaterThanOrEqual(min);
    expect(result.overallScore).toBeLessThan(max + 0.001); // Small epsilon for floating point
  });

  test('flags have valid structure', () => {
    const research = createMockResearch({
      citations: [],
      methodology: createMockMethodology({ biasControls: [] }),
    });

    const result = validateResearch(research);

    for (const flag of result.flags) {
      expect(flag).toHaveProperty('code');
      expect(flag).toHaveProperty('severity');
      expect(flag).toHaveProperty('message');
      expect(flag).toHaveProperty('dimension');
      expect(['critical', 'warning', 'info']).toContain(flag.severity);
      expect(['credibility', 'methodology', 'evidence', 'reproducibility']).toContain(flag.dimension);
    }
  });

  test('recommendations are generated for low scores', () => {
    const poorResearch = createMockResearch({
      citations: [],
      methodology: createMockMethodology({
        studyType: 'case_report',
        biasControls: [],
        sampleSize: 1,
      }),
      dataPoints: [],
      claims: [createMockClaim({ supportingEvidenceIds: [] })],
      dataAvailable: false,
      methodsAvailable: false,
    });

    const result = validateResearch(poorResearch);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// PERFORMANCE TESTS
// =============================================================================

describe('Research Validator - Performance', () => {
  test('handles large number of citations efficiently', () => {
    const largeCitations = Array(100)
      .fill(null)
      .map((_, i) =>
        createMockCitation({
          id: `cit-${i}`,
          authors: [`Author${i}`],
          journal: `Journal${i % 10}`,
        })
      );

    const research = createMockResearch({ citations: largeCitations });

    const start = performance.now();
    const result = validateResearch(research);
    const duration = performance.now() - start;

    expect(result.overallScore).toBeGreaterThan(0);
    expect(duration).toBeLessThan(1000); // Should complete in under 1 second
  });

  test('handles large number of claims efficiently', () => {
    const dataPoints = Array(50)
      .fill(null)
      .map((_, i) => createMockDataPoint({ id: `dp-${i}` }));

    const largeClaims = Array(50)
      .fill(null)
      .map((_, i) =>
        createMockClaim({
          id: `claim-${i}`,
          supportingEvidenceIds: [`dp-${i}`],
        })
      );

    const research = createMockResearch({
      claims: largeClaims,
      dataPoints: dataPoints,
    });

    const start = performance.now();
    const result = validateResearch(research);
    const duration = performance.now() - start;

    expect(result.overallScore).toBeGreaterThan(0);
    expect(duration).toBeLessThan(1000);
  });
});
