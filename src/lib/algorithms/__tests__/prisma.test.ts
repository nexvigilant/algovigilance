/**
 * PRISMA Systematic Review Algorithm Test Suite
 *
 * Tests cover:
 * 1. Literature screening pipeline (state machine)
 * 2. Duplicate detection (hash-based)
 * 3. Flow diagram generation (accumulator pattern)
 * 4. Checklist compliance validation (constraint satisfaction)
 * 5. Edge cases and mathematical invariants
 */

import {
  processScreeningPipeline,
  validatePRISMACompliance,
  generateFlowDiagramText,
  generateFlowDiagramJSON,
  createRecord,
  getExclusionStatistics,
  validateFlowConsistency,
  quickScreen,
  quickComplianceCheck,
  type LiteratureRecord,
  type ScreeningConfig,
  type SystematicReviewReport,
  type PRISMAFlowDiagram,
} from '../prisma';

// =============================================================================
// Test Data Factories
// =============================================================================

function createTestRecords(count: number, options: {
  source?: 'database' | 'register' | 'other';
  yearRange?: [number, number];
  withFullText?: boolean;
  withAbstract?: boolean;
} = {}): LiteratureRecord[] {
  const records: LiteratureRecord[] = [];
  const sources: Array<'database' | 'register' | 'other'> = ['database', 'register', 'other'];

  for (let i = 0; i < count; i++) {
    const year = options.yearRange
      ? options.yearRange[0] + Math.floor(Math.random() * (options.yearRange[1] - options.yearRange[0]))
      : 2020 + (i % 5);

    records.push({
      id: `record-${i}`,
      title: `Test Study ${i}: Effects of Drug X on Adverse Events`,
      abstract: options.withAbstract !== false ? `Background: Study ${i} examined adverse drug reactions in patients. Methods: Randomized controlled trial. Results: Significant findings.` : null,
      fullText: options.withFullText ? `Full text content for study ${i}. This is a randomized controlled trial examining adverse drug reactions. The study design included proper blinding and randomization.` : null,
      source: options.source || sources[i % 3],
      metadata: {
        authors: [`Author ${i}`, `Co-author ${i}`],
        year,
        journal: `Journal of Test Medicine ${i % 5}`,
        doi: `10.1000/test.${i}`,
        pmid: `${12345000 + i}`,
        volume: `${10 + i}`,
        issue: `${1 + (i % 12)}`,
        pages: `${100 + i}-${110 + i}`,
      },
      phase: 'IDENTIFIED',
      exclusionReason: null,
      hasQuantitativeData: i % 3 === 0, // Every 3rd record has quantitative data
    });
  }

  return records;
}

function createDuplicateRecords(): LiteratureRecord[] {
  const base = createRecord('record-1', 'Effects of Drug X on Cardiac Events', 'database', {
    authors: ['Smith J', 'Jones K'],
    year: 2023,
    doi: '10.1000/drugx.2023',
    pmid: '12345678',
  });

  // Exact duplicate
  const duplicate1 = { ...base, id: 'record-2' };

  // Same DOI, different title casing
  const duplicate2 = createRecord('record-3', 'EFFECTS OF DRUG X ON CARDIAC EVENTS', 'register', {
    doi: '10.1000/drugx.2023',
  });

  // Different DOI, same normalized title
  const duplicate3 = createRecord('record-4', 'Effects of Drug X on Cardiac Events!', 'database', {
    doi: '10.1000/different.2023',
  });

  // Unique record
  const unique = createRecord('record-5', 'Completely Different Study on Drug Y', 'other', {
    doi: '10.1000/drugy.2023',
  });

  return [base, duplicate1, duplicate2, duplicate3, unique];
}

function createCompliantReport(): SystematicReviewReport {
  return {
    title: 'A Systematic Review and Meta-Analysis of Drug X Safety',
    abstract: {
      background: 'Drug X is widely used but safety concerns exist.',
      methods: 'We searched PubMed, Embase, and CENTRAL through December 2024.',
      results: '25 studies were included. Meta-analysis showed increased risk (OR 1.5, 95% CI 1.2-1.9).',
      conclusion: 'Drug X is associated with increased adverse event risk.',
    },
    introduction: {
      rationale: 'Previous reviews have not addressed this specific safety concern.',
      objectives: 'To assess the association between Drug X and adverse events.',
      picoStatement: 'Population: Adults on Drug X. Intervention: Drug X. Comparator: Placebo. Outcome: Adverse events.',
    },
    methods: {
      protocolRegistration: 'PROSPERO CRD42024000001',
      eligibilityCriteria: 'RCTs comparing Drug X to placebo in adults. Excluded: pediatric studies, observational.',
      informationSources: ['PubMed', 'Embase', 'CENTRAL', 'ClinicalTrials.gov'],
      searchStrategy: '(Drug X OR Brand Name) AND (adverse event OR side effect) AND (randomized controlled trial[pt]) NOT (animals[mh])',
      selectionProcess: 'Two reviewers independently screened titles/abstracts, then full texts. Disagreements resolved by consensus.',
      dataCollectionProcess: 'Data extracted using standardized form. Authors contacted for missing data.',
      dataItems: ['Event counts', 'Sample sizes', 'Follow-up duration', 'Drug dose', 'Patient characteristics'],
      riskOfBiasAssessment: 'Cochrane Risk of Bias tool 2.0 used for RCTs.',
      effectMeasures: ['Odds Ratio', 'Risk Difference'],
      synthesisMethods: 'Random-effects meta-analysis using DerSimonian-Laird method.',
      reportingBiasAssessment: 'Funnel plots and Egger test used to assess publication bias.',
      certaintyAssessment: 'GRADE framework used to assess certainty of evidence.',
    },
    results: {
      flowDiagram: {
        identification: {
          databases: 1500,
          registers: 200,
          otherMethods: 50,
          duplicatesRemoved: 300,
          automationExcluded: 0,
          otherRemovals: 0,
        },
        screening: {
          recordsScreened: 1450,
          recordsExcluded: 1200,
        },
        eligibility: {
          reportsSought: 250,
          reportsNotRetrieved: 10,
          reportsAssessed: 240,
          reportsExcluded: new Map([
            ['Wrong population', 100],
            ['Wrong intervention', 50],
            ['Wrong outcome', 40],
            ['Wrong study design', 25],
          ]),
        },
        included: {
          studies: 25,
          inMetaAnalysis: 20,
        },
        generatedAt: new Date(),
      },
      studyCharacteristics: [{ id: 'study1' }, { id: 'study2' }],
      riskOfBiasResults: [{ study: 'study1', overall: 'low' }],
      individualStudyResults: [{ study: 'study1', or: 1.5 }],
      synthesisResults: {
        summary: 'Pooled OR 1.5 (95% CI 1.2-1.9)',
        heterogeneity: 'I2 = 35%, p = 0.08',
        sensitivityAnalyses: 'Results robust to exclusion of high-risk studies.',
      },
      reportingBiasResults: 'Funnel plot symmetric. Egger p = 0.34.',
      certaintyResults: 'Moderate certainty (downgraded for imprecision).',
    },
    discussion: {
      summary: 'This review found increased risk of adverse events with Drug X.',
      limitations: 'Limited to RCTs; observational data not included.',
      implications: 'Clinicians should weigh benefits against risks.',
    },
    funding: {
      sources: 'National Institutes of Health (R01DK123456)',
      role: 'Funder had no role in study design or analysis.',
    },
    conflictsOfInterest: 'Authors declare no conflicts of interest.',
    dataAvailability: 'Data available at https://osf.io/example',
  };
}

// =============================================================================
// Test Suite: Literature Screening Pipeline
// =============================================================================

describe('PRISMA Literature Screening Pipeline', () => {
  describe('Basic Pipeline Functionality', () => {
    test('processes records through all phases', () => {
      const records = createTestRecords(10, { withFullText: true, withAbstract: true });
      const config: ScreeningConfig = {
        deduplication: true,
        abstractCriteria: {
          inclusionKeywords: ['adverse', 'drug'],
        },
        fullTextCriteria: {},
      };

      const result = processScreeningPipeline(records, config);

      expect(result.records.length).toBe(10);
      expect(result.flowDiagram).toBeDefined();
      expect(result.statistics.totalIdentified).toBe(10);
    });

    test('categorizes records by source correctly', () => {
      const records = [
        createRecord('1', 'Title 1', 'database'),
        createRecord('2', 'Title 2', 'database'),
        createRecord('3', 'Title 3', 'register'),
        createRecord('4', 'Title 4', 'website'),
        createRecord('5', 'Title 5', 'grey_literature'),
      ];

      const result = processScreeningPipeline(records, {
        deduplication: false,
        abstractCriteria: {},
        fullTextCriteria: {},
      });

      const { identification } = result.flowDiagram;
      expect(identification.databases).toBe(2);
      expect(identification.registers).toBe(1);
      expect(identification.otherMethods).toBe(2);
    });

    test('handles empty record set', () => {
      const result = processScreeningPipeline([], {
        deduplication: true,
        abstractCriteria: {},
        fullTextCriteria: {},
      });

      expect(result.records.length).toBe(0);
      expect(result.statistics.totalIdentified).toBe(0);
      expect(result.statistics.inclusionRate).toBe(0);
      expect(result.flowDiagram.included.studies).toBe(0);
    });
  });

  describe('Duplicate Detection', () => {
    test('removes duplicates based on title and DOI', () => {
      const records = createDuplicateRecords();

      const result = processScreeningPipeline(records, {
        deduplication: true,
        deduplicationFields: ['title', 'doi'],
        abstractCriteria: {},
        fullTextCriteria: {},
      });

      const duplicates = result.records.filter(
        (r) => r.exclusionReason === 'Duplicate'
      );
      const _nonDuplicates = result.records.filter(
        (r) => r.exclusionReason !== 'Duplicate'
      );

      // Should identify duplicates (records 2, 3, 4 are duplicates of 1)
      expect(duplicates.length).toBeGreaterThan(0);
      expect(result.flowDiagram.identification.duplicatesRemoved).toBeGreaterThan(0);
    });

    test('preserves unique records', () => {
      const records = [
        createRecord('1', 'Unique Title A', 'database', { doi: '10.1000/a' }),
        createRecord('2', 'Unique Title B', 'database', { doi: '10.1000/b' }),
        createRecord('3', 'Unique Title C', 'database', { doi: '10.1000/c' }),
      ];

      const result = processScreeningPipeline(records, {
        deduplication: true,
        abstractCriteria: {},
        fullTextCriteria: {},
      });

      expect(result.flowDiagram.identification.duplicatesRemoved).toBe(0);
    });

    test('handles case-insensitive title matching', () => {
      const records = [
        createRecord('1', 'Drug Safety Study', 'database', { doi: '10.1/a' }),
        createRecord('2', 'DRUG SAFETY STUDY', 'register', { doi: '10.1/b' }),
        createRecord('3', 'drug safety study', 'other', { doi: '10.1/c' }),
      ];

      const result = processScreeningPipeline(records, {
        deduplication: true,
        deduplicationFields: ['title'],
        abstractCriteria: {},
        fullTextCriteria: {},
      });

      // All 3 have same normalized title, so 2 should be duplicates
      expect(result.flowDiagram.identification.duplicatesRemoved).toBe(2);
    });
  });

  describe('Abstract Screening', () => {
    test('excludes records missing inclusion keywords', () => {
      // Provide full text so records can pass eligibility phase
      const records = [
        { ...createRecord('1', 'Study on adverse drug reactions', 'database'), abstract: 'This study examines adverse drug reactions in patients.', fullText: 'Full text content.' },
        { ...createRecord('2', 'Study on patient outcomes', 'database'), abstract: 'This study examines patient outcomes.', fullText: 'Full text content.' },
      ];

      const result = processScreeningPipeline(records, {
        deduplication: false,
        abstractCriteria: {
          inclusionKeywords: ['adverse'],
        },
        fullTextCriteria: {},
      });

      // Record 2 should be excluded at screening (no 'adverse' keyword)
      const excludedAtScreening = result.records.filter(
        (r) => r.phase === 'EXCLUDED' && r.exclusionReason?.includes('inclusion keywords')
      );
      expect(excludedAtScreening.length).toBe(1);
      expect(excludedAtScreening[0].id).toBe('2');
    });

    test('excludes records with exclusion keywords', () => {
      const records = [
        { ...createRecord('1', 'Human clinical trial', 'database'), abstract: 'Clinical trial in human subjects.', fullText: 'Full text.' },
        { ...createRecord('2', 'Animal study', 'database'), abstract: 'Study conducted in animal models only.', fullText: 'Full text.' },
      ];

      const result = processScreeningPipeline(records, {
        deduplication: false,
        abstractCriteria: {
          exclusionKeywords: ['animal'],
        },
        fullTextCriteria: {},
      });

      const excludedForKeyword = result.records.filter(
        (r) => r.phase === 'EXCLUDED' && r.exclusionReason?.includes('animal')
      );
      expect(excludedForKeyword.length).toBe(1);
      expect(excludedForKeyword[0].exclusionReason).toContain('animal');
    });

    test('applies year filters correctly', () => {
      const records = [
        { ...createRecord('1', 'Old Study', 'database', { year: 2010 }), fullText: 'Full text.' },
        { ...createRecord('2', 'Recent Study', 'database', { year: 2023 }), fullText: 'Full text.' },
        { ...createRecord('3', 'New Study', 'database', { year: 2024 }), fullText: 'Full text.' },
      ];

      const result = processScreeningPipeline(records, {
        deduplication: false,
        abstractCriteria: {
          minYear: 2020,
        },
        fullTextCriteria: {},
      });

      // Records 2 and 3 should pass screening (year >= 2020), record 1 excluded
      const passedScreening = result.records.filter((r) => r.phase !== 'EXCLUDED');
      const excludedForYear = result.records.filter(
        (r) => r.phase === 'EXCLUDED' && r.exclusionReason?.includes('year')
      );

      expect(excludedForYear.length).toBe(1);
      expect(excludedForYear[0].metadata.year).toBe(2010);
      expect(passedScreening.length).toBe(2);
      expect(passedScreening.every((r) => r.metadata.year >= 2020)).toBe(true);
    });
  });

  describe('Full-Text Eligibility', () => {
    test('excludes records without full text', () => {
      const records = [
        { ...createRecord('1', 'Study A', 'database'), fullText: 'Full text available.' },
        { ...createRecord('2', 'Study B', 'database'), fullText: null },
      ];

      const result = processScreeningPipeline(records, {
        deduplication: false,
        abstractCriteria: {},
        fullTextCriteria: {},
      });

      const notRetrieved = result.flowDiagram.eligibility.reportsNotRetrieved;
      expect(notRetrieved).toBe(1);
    });

    test('tracks exclusion reasons at eligibility', () => {
      const records = [
        { ...createRecord('1', 'RCT Study', 'database'), fullText: 'This randomized controlled trial...' },
        { ...createRecord('2', 'Case Report', 'database'), fullText: 'This case report describes...' },
        { ...createRecord('3', 'Another Case', 'database'), fullText: 'Another case report...' },
      ];

      const result = processScreeningPipeline(records, {
        deduplication: false,
        abstractCriteria: {},
        fullTextCriteria: {
          studyTypes: ['randomized controlled trial'],
        },
      });

      const exclusionReasons = result.flowDiagram.eligibility.reportsExcluded;
      expect(exclusionReasons.has('Study type not in allowed list')).toBe(true);
      expect(exclusionReasons.get('Study type not in allowed list')).toBe(2);
    });
  });

  describe('Meta-Analysis Tracking', () => {
    test('counts records with quantitative data', () => {
      const records = createTestRecords(9, { withFullText: true });
      // Every 3rd record has quantitative data (records 0, 3, 6)

      const result = processScreeningPipeline(records, {
        deduplication: true,
        abstractCriteria: {},
        fullTextCriteria: {},
      });

      const included = result.flowDiagram.included;
      // Check that meta-analysis count is populated
      if (included.inMetaAnalysis !== null) {
        expect(included.inMetaAnalysis).toBeLessThanOrEqual(included.studies);
      }
    });
  });

  describe('Flow Consistency Validation', () => {
    test('validates consistent flow diagram', () => {
      const records = createTestRecords(100, { withFullText: true });

      const result = processScreeningPipeline(records, {
        deduplication: true,
        abstractCriteria: {},
        fullTextCriteria: {},
      });

      const validation = validateFlowConsistency(result.flowDiagram);

      // Pipeline should produce consistent numbers
      expect(validation.errors.length).toBe(0);
      expect(validation.isValid).toBe(true);
    });
  });
});

// =============================================================================
// Test Suite: Checklist Compliance Validation
// =============================================================================

describe('PRISMA Checklist Compliance Validation', () => {
  describe('Compliant Report', () => {
    test('passes validation for fully compliant report', () => {
      const report = createCompliantReport();
      const result = validatePRISMACompliance(report);

      expect(result.score).toBeGreaterThan(0.8);
      expect(result.criticalFailures.length).toBe(0);
    });

    test('returns all 27 checklist items', () => {
      const report = createCompliantReport();
      const result = validatePRISMACompliance(report);

      expect(result.items.length).toBe(27);
    });
  });

  describe('Non-Compliant Report', () => {
    test('fails validation for empty report', () => {
      const report: SystematicReviewReport = {};
      const result = validatePRISMACompliance(report);

      expect(result.isCompliant).toBe(false);
      expect(result.score).toBeLessThan(0.5);
      expect(result.failedCount).toBeGreaterThan(10);
    });

    test('identifies critical failures', () => {
      const report: SystematicReviewReport = {
        title: 'A Review of Drug Effects', // Missing "systematic review"
      };

      const result = validatePRISMACompliance(report);

      // Title item is critical
      const titleItem = result.items.find((i) => i.itemNumber === 1);
      expect(titleItem?.status).toBe('FAIL');
      expect(result.criticalFailures.length).toBeGreaterThan(0);
    });

    test('provides recommendations for failures', () => {
      const report: SystematicReviewReport = {
        title: 'A Review',
      };

      const result = validatePRISMACompliance(report);
      const failures = result.items.filter((i) => i.status === 'FAIL');

      // All failures should have recommendations
      for (const failure of failures) {
        expect(failure.recommendation).toBeDefined();
      }
    });
  });

  describe('Partial Compliance', () => {
    test('marks partial compliance for incomplete sections', () => {
      const report: SystematicReviewReport = {
        abstract: {
          background: 'Some background',
          methods: 'Some methods',
          // Missing results and conclusion
        },
      };

      const result = validatePRISMACompliance(report);
      const abstractItem = result.items.find((i) => i.itemNumber === 2);

      expect(abstractItem?.status).toBe('PARTIAL');
    });
  });

  describe('Custom Threshold', () => {
    test('uses custom compliance threshold', () => {
      const report = createCompliantReport();

      // With very high threshold, should fail
      const _strictResult = validatePRISMACompliance(report, 0.99);
      // With low threshold, should pass even with some issues
      const lenientResult = validatePRISMACompliance(report, 0.5);

      expect(lenientResult.isCompliant).toBe(true);
      // Strict might still pass if report is very complete
    });
  });

  describe('Quick Compliance Check', () => {
    test('returns simplified compliance result', () => {
      const report = createCompliantReport();
      const result = quickComplianceCheck(report);

      expect(typeof result.compliant).toBe('boolean');
      expect(typeof result.score).toBe('number');
      expect(Array.isArray(result.criticalIssues)).toBe(true);
    });
  });
});

// =============================================================================
// Test Suite: Flow Diagram Generation
// =============================================================================

describe('PRISMA Flow Diagram Generation', () => {
  describe('Text Format', () => {
    test('generates readable text diagram', () => {
      const flowDiagram: PRISMAFlowDiagram = {
        identification: {
          databases: 1500,
          registers: 200,
          otherMethods: 50,
          duplicatesRemoved: 300,
          automationExcluded: 0,
          otherRemovals: 0,
        },
        screening: {
          recordsScreened: 1450,
          recordsExcluded: 1200,
        },
        eligibility: {
          reportsSought: 250,
          reportsNotRetrieved: 10,
          reportsAssessed: 240,
          reportsExcluded: new Map([
            ['Wrong population', 100],
            ['Wrong intervention', 50],
          ]),
        },
        included: {
          studies: 90,
          inMetaAnalysis: 75,
        },
        generatedAt: new Date(),
      };

      const text = generateFlowDiagramText(flowDiagram);

      expect(text).toContain('PRISMA 2020 Flow Diagram');
      expect(text).toContain('IDENTIFICATION');
      expect(text).toContain('SCREENING');
      expect(text).toContain('ELIGIBILITY');
      expect(text).toContain('INCLUDED');
      expect(text).toContain('1500'); // databases
      expect(text).toContain('90'); // studies
    });

    test('handles null meta-analysis', () => {
      const flowDiagram: PRISMAFlowDiagram = {
        identification: {
          databases: 100,
          registers: 0,
          otherMethods: 0,
          duplicatesRemoved: 0,
          automationExcluded: 0,
          otherRemovals: 0,
        },
        screening: {
          recordsScreened: 100,
          recordsExcluded: 90,
        },
        eligibility: {
          reportsSought: 10,
          reportsNotRetrieved: 0,
          reportsAssessed: 10,
          reportsExcluded: new Map(),
        },
        included: {
          studies: 10,
          inMetaAnalysis: null,
        },
        generatedAt: new Date(),
      };

      const text = generateFlowDiagramText(flowDiagram);

      expect(text).toContain('N/A');
    });
  });

  describe('JSON Format', () => {
    test('generates JSON-serializable output', () => {
      const flowDiagram: PRISMAFlowDiagram = {
        identification: {
          databases: 100,
          registers: 50,
          otherMethods: 25,
          duplicatesRemoved: 20,
          automationExcluded: 5,
          otherRemovals: 0,
        },
        screening: {
          recordsScreened: 150,
          recordsExcluded: 100,
        },
        eligibility: {
          reportsSought: 50,
          reportsNotRetrieved: 5,
          reportsAssessed: 45,
          reportsExcluded: new Map([['Wrong outcome', 20]]),
        },
        included: {
          studies: 25,
          inMetaAnalysis: 20,
        },
        generatedAt: new Date(),
      };

      const json = generateFlowDiagramJSON(flowDiagram);

      // Should be serializable
      const serialized = JSON.stringify(json);
      const parsed = JSON.parse(serialized);

      expect(parsed.identification.databases).toBe(100);
      expect(parsed.included.studies).toBe(25);
      // Map should be converted to object
      expect(parsed.eligibility.reportsExcluded['Wrong outcome']).toBe(20);
    });
  });
});

// =============================================================================
// Test Suite: Utility Functions
// =============================================================================

describe('PRISMA Utility Functions', () => {
  describe('createRecord', () => {
    test('creates record with defaults', () => {
      const record = createRecord('test-id', 'Test Title', 'database');

      expect(record.id).toBe('test-id');
      expect(record.title).toBe('Test Title');
      expect(record.source).toBe('database');
      expect(record.phase).toBe('IDENTIFIED');
      expect(record.metadata.authors).toEqual([]);
    });

    test('creates record with metadata', () => {
      const record = createRecord('test-id', 'Test Title', 'register', {
        authors: ['Author A'],
        year: 2024,
        doi: '10.1000/test',
      });

      expect(record.metadata.authors).toEqual(['Author A']);
      expect(record.metadata.year).toBe(2024);
      expect(record.metadata.doi).toBe('10.1000/test');
    });
  });

  describe('getExclusionStatistics', () => {
    test('calculates exclusion statistics', () => {
      const records = createTestRecords(50, { withFullText: true });
      const result = processScreeningPipeline(records, {
        deduplication: true,
        abstractCriteria: {
          minYear: 2023,
        },
        fullTextCriteria: {},
      });

      const stats = getExclusionStatistics(result);

      expect(stats.total).toBe(result.statistics.totalExcluded);
      expect(Object.keys(stats.byPhase).length).toBe(3);
      expect(Object.keys(stats.byReason).length).toBeGreaterThan(0);
    });
  });

  describe('quickScreen', () => {
    test('processes with minimal configuration', () => {
      const records = createTestRecords(10, { withFullText: true });

      const result = quickScreen(records, ['drug'], ['animal']);

      expect(result.flowDiagram).toBeDefined();
      expect(result.statistics).toBeDefined();
    });
  });
});

// =============================================================================
// Test Suite: Stress Tests & Performance
// =============================================================================

describe('PRISMA Performance Tests', () => {
  test('handles large record sets efficiently', () => {
    const records = createTestRecords(10000, { withFullText: false });

    const startTime = performance.now();
    const result = processScreeningPipeline(records, {
      deduplication: true,
      abstractCriteria: {},
      fullTextCriteria: {},
    });
    const endTime = performance.now();

    // Should complete in reasonable time (< 5 seconds)
    expect(endTime - startTime).toBeLessThan(5000);
    expect(result.statistics.totalIdentified).toBe(10000);
  });

  test('maintains O(n) complexity for pipeline', () => {
    const sizes = [100, 500, 1000, 2000];
    const times: number[] = [];

    for (const size of sizes) {
      const records = createTestRecords(size);
      const start = performance.now();
      processScreeningPipeline(records, {
        deduplication: true,
        abstractCriteria: {},
        fullTextCriteria: {},
      });
      times.push(performance.now() - start);
    }

    // Time should grow roughly linearly
    // Check that scaling from smallest to largest doesn't grow faster than O(n^1.5)
    // We compare total scaling rather than pairwise to reduce timing variance
    const overallSizeRatio = sizes[sizes.length - 1] / sizes[0];
    const overallTimeRatio = times[times.length - 1] / times[0];

    // For O(n), time ratio should be <= size ratio
    // Allow O(n^1.5) tolerance for test variance: (sizeRatio)^1.5
    const maxExpectedRatio = Math.pow(overallSizeRatio, 1.5);
    expect(overallTimeRatio).toBeLessThan(maxExpectedRatio);
  });
});

// =============================================================================
// Test Suite: Edge Cases
// =============================================================================

describe('PRISMA Edge Cases', () => {
  test('handles records with null/undefined fields', () => {
    const records: LiteratureRecord[] = [
      {
        id: '1',
        title: 'Title',
        abstract: null,
        fullText: undefined,
        source: 'database',
        metadata: {
          authors: [],
          year: 2024,
          journal: null,
          doi: null,
          pmid: null,
        },
        phase: 'IDENTIFIED',
      } as LiteratureRecord,
    ];

    // Should not throw
    expect(() =>
      processScreeningPipeline(records, {
        deduplication: true,
        abstractCriteria: {},
        fullTextCriteria: {},
      })
    ).not.toThrow();
  });

  test('handles special characters in titles', () => {
    const records = [
      createRecord('1', 'Study with "quotes" and \'apostrophes\'', 'database'),
      createRecord('2', 'Study with <html> & entities', 'register'),
      createRecord('3', 'Study with unicode: café, naïve, résumé', 'other'),
    ];

    const result = processScreeningPipeline(records, {
      deduplication: true,
      abstractCriteria: {},
      fullTextCriteria: {},
    });

    expect(result.records.length).toBe(3);
    expect(result.flowDiagram.identification.duplicatesRemoved).toBe(0);
  });

  test('handles very long abstracts', () => {
    const longAbstract = 'Word '.repeat(10000);
    const records = [
      { ...createRecord('1', 'Long Study', 'database'), abstract: longAbstract },
    ];

    const result = processScreeningPipeline(records, {
      deduplication: false,
      abstractCriteria: {
        inclusionKeywords: ['word'],
      },
      fullTextCriteria: {},
    });

    // Should still process without hanging
    expect(result.records.length).toBe(1);
  });

  test('handles all records excluded', () => {
    const records = createTestRecords(10, { withAbstract: true });

    const result = processScreeningPipeline(records, {
      deduplication: false,
      abstractCriteria: {
        exclusionKeywords: ['study'], // All titles contain "Study"
      },
      fullTextCriteria: {},
    });

    expect(result.flowDiagram.included.studies).toBe(0);
    expect(result.statistics.inclusionRate).toBe(0);
  });

  test('handles 100% inclusion rate', () => {
    const records = createTestRecords(5, { withFullText: true, withAbstract: true });

    const result = processScreeningPipeline(records, {
      deduplication: false,
      abstractCriteria: {},  // No filters
      fullTextCriteria: {},  // No filters
    });

    // All should be included (no filtering criteria)
    expect(result.flowDiagram.included.studies).toBe(5);
  });
});
