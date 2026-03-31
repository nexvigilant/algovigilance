/**
 * Systematic Literature Review Integration Tests
 *
 * Tests the integration between Deep Research Agent and PRISMA pipeline.
 * Uses mocking to avoid actual API calls.
 *
 * Test Coverage:
 * 1. Reference extraction from research reports
 * 2. PICO framework prompt generation
 * 3. Conversion to LiteratureRecord format
 * 4. End-to-end review workflow (mocked)
 * 5. Quick search functionality
 * 6. Compliance validation
 */

// Mock the client before importing the module
jest.mock('../client', () => ({
  getDeepResearchClient: jest.fn(() => ({
    research: jest.fn(),
  })),
  createDeepResearchClient: jest.fn(),
  DeepResearchClient: jest.fn(),
}));

import {
  conductSystematicReview,
  quickLiteratureSearch,
  validateReviewCompliance,
  type SystematicReviewConfig,
  type PICOFramework,
  type _ExtractedReference,
} from '../systematic-review';
import { getDeepResearchClient } from '../client';
import type { ResearchResult } from '../types';

// =============================================================================
// Test Data
// =============================================================================

const mockResearchReport = `
# Systematic Literature Search: GLP-1 Agonist Cardiovascular Safety

## Search Strategy
Databases searched: PubMed, Embase, Cochrane Library
Date range: 2020-2025
Search terms: GLP-1 agonist, cardiovascular, MACE, diabetes

## Studies Identified

### Study 1
- **Title:** Cardiovascular Outcomes with GLP-1 Receptor Agonists: A Meta-Analysis
- **Authors:** Smith J, Johnson K, Williams M
- **Year:** 2023
- **Journal:** Journal of Diabetes Research
- **PMID:** 38451234
- **DOI:** 10.1000/jdr.2023.001
- **Study Type:** Meta-analysis
- **Abstract Summary:** Pooled analysis of 8 RCTs showing 14% reduction in MACE with GLP-1 agonists.
- **Relevance:** Directly addresses cardiovascular outcomes with class-level analysis.

### Study 2
- **Title:** SUSTAIN-6: Long-term Cardiovascular Safety of Semaglutide
- **Authors:** Marso SP, Bain SC, Consoli A
- **Year:** 2022
- **Journal:** New England Journal of Medicine
- **PMID:** 37654321
- **DOI:** 10.1056/NEJMoa2022571
- **Study Type:** Randomized controlled trial
- **Abstract Summary:** Semaglutide significantly reduced MACE vs placebo (HR 0.74, 95% CI 0.58-0.95).
- **Relevance:** Landmark RCT for semaglutide cardiovascular safety.

### Study 3
- **Title:** Real-World Evidence for GLP-1 Agonist Cardiac Effects
- **Authors:** Chen L, Garcia R
- **Year:** 2024
- **Journal:** Diabetes Care
- **PMID:** 39876543
- **DOI:** 10.2337/dc23-1234
- **Study Type:** Cohort study
- **Abstract Summary:** Retrospective analysis of 50,000 patients confirming cardiovascular benefits.
- **Relevance:** Real-world validation of trial findings.

### Study 4
- **Title:** GLP-1 and Heart Failure Outcomes
- **Authors:** Brown T, Davis K, Miller S
- **Year:** 2021
- **Journal:** Heart Failure Journal
- **PMID:** 35678901
- **DOI:** 10.1016/j.hfj.2021.05.003
- **Study Type:** Systematic review
- **Abstract Summary:** Neutral effect on heart failure hospitalization; potential benefit in HFpEF.
- **Relevance:** Addresses heart failure, a key cardiovascular outcome.

### Study 5
- **Title:** Pediatric Considerations for GLP-1 Therapy
- **Authors:** Anderson P
- **Year:** 2020
- **Journal:** Pediatric Diabetes
- **PMID:** 34567890
- **DOI:** 10.1111/pedi.2020.001
- **Study Type:** Review
- **Abstract Summary:** Limited data in pediatric populations; further study needed.
- **Relevance:** Not directly relevant - pediatric population differs from adult T2DM.

## Search Summary
- Total records identified: 5
- Databases: PubMed (3), Embase (2)
- Grey literature: 0
`;

const mockResearchResult: ResearchResult = {
  interactionId: 'test-interaction-123',
  status: 'completed',
  report: mockResearchReport,
  thoughtSummaries: ['Planning search strategy...', 'Searching databases...', 'Synthesizing results...'],
  startedAt: new Date('2025-01-01T10:00:00Z'),
  completedAt: new Date('2025-01-01T10:15:00Z'),
};

// =============================================================================
// Test Suites
// =============================================================================

describe('Systematic Literature Review Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getDeepResearchClient as jest.Mock).mockReturnValue({
      research: jest.fn().mockResolvedValue(mockResearchResult),
    });
  });

  describe('conductSystematicReview', () => {
    it('should conduct a full systematic review with PICO framework', async () => {
      const config: SystematicReviewConfig = {
        topic: 'GLP-1 agonist cardiovascular safety in type 2 diabetes',
        picoFramework: {
          population: 'Adults with type 2 diabetes',
          intervention: 'GLP-1 receptor agonists',
          comparator: 'Placebo or other antidiabetics',
          outcome: 'Major adverse cardiovascular events (MACE)',
        },
        dateRange: { from: 2020, to: 2025 },
        databases: ['pubmed', 'embase', 'cochrane'],
        studyTypes: ['randomized_controlled_trial', 'cohort_study', 'meta_analysis'],
      };

      const result = await conductSystematicReview(config);

      // Verify structure
      expect(result).toHaveProperty('reviewId');
      expect(result.reviewId).toMatch(/^SR-[A-Z0-9]+-[A-Z0-9]+$/);
      expect(result).toHaveProperty('config', config);
      expect(result).toHaveProperty('researchResult');
      expect(result).toHaveProperty('extractedReferences');
      expect(result).toHaveProperty('pipelineResult');
      expect(result).toHaveProperty('flowDiagramText');
      expect(result).toHaveProperty('flowDiagramJSON');
      expect(result).toHaveProperty('includedStudies');
      expect(result).toHaveProperty('excludedStudies');
      expect(result).toHaveProperty('timing');

      // Verify references were extracted
      expect(result.extractedReferences.length).toBeGreaterThan(0);
      expect(result.extractedReferences[0]).toHaveProperty('title');
      expect(result.extractedReferences[0]).toHaveProperty('authors');
      expect(result.extractedReferences[0]).toHaveProperty('year');

      // Verify PRISMA flow diagram was generated
      expect(result.flowDiagramText).toContain('IDENTIFICATION');
      expect(result.flowDiagramText).toContain('SCREENING');

      // Verify timing info
      expect(result.timing.startedAt).toBeInstanceOf(Date);
      expect(result.timing.totalDurationMs).toBeGreaterThan(0);
    });

    it('should work with minimal configuration', async () => {
      const config: SystematicReviewConfig = {
        topic: 'Drug safety signals',
      };

      const result = await conductSystematicReview(config);

      expect(result.reviewId).toBeDefined();
      expect(result.extractedReferences).toBeDefined();
      expect(result.flowDiagramText).toBeDefined();
    });

    it('should handle failed research gracefully', async () => {
      const failedResult: ResearchResult = {
        ...mockResearchResult,
        status: 'failed',
        error: 'API quota exceeded',
        report: '',
      };

      (getDeepResearchClient as jest.Mock).mockReturnValue({
        research: jest.fn().mockResolvedValue(failedResult),
      });

      await expect(
        conductSystematicReview({ topic: 'Test topic' })
      ).rejects.toThrow('Deep Research failed: API quota exceeded');
    });

    it('should respect maxRecords limit', async () => {
      const config: SystematicReviewConfig = {
        topic: 'Test topic',
        maxRecords: 3,
      };

      const result = await conductSystematicReview(config);

      // Even if more references extracted, should be limited
      expect(result.pipelineResult.records.length).toBeLessThanOrEqual(3);
    });

    it('should include custom screening when provided', async () => {
      const config: SystematicReviewConfig = {
        topic: 'GLP-1 agonist cardiovascular safety',
        customScreening: (record) => {
          // Only include studies from 2022 or later
          return record.metadata.year >= 2022;
        },
      };

      const result = await conductSystematicReview(config);

      // Verify custom screening was applied
      expect(result.includedStudies.every((s) => s.metadata.year >= 2022)).toBe(true);
    });
  });

  describe('Reference Extraction', () => {
    it('should extract structured study blocks correctly', async () => {
      const result = await conductSystematicReview({ topic: 'Test' });

      // Check first reference matches expected data
      const firstRef = result.extractedReferences[0];
      expect(firstRef.title).toContain('Cardiovascular Outcomes');
      expect(firstRef.authors).toContain('Smith J');
      expect(firstRef.year).toBe(2023);
      expect(firstRef.pmid).toBe('38451234');
      expect(firstRef.doi).toBe('10.1000/jdr.2023.001');
    });

    it('should handle missing fields gracefully', async () => {
      const sparseReport = `
### Study 1
- **Title:** Study with Minimal Data
- **Year:** 2024
`;

      (getDeepResearchClient as jest.Mock).mockReturnValue({
        research: jest.fn().mockResolvedValue({
          ...mockResearchResult,
          report: sparseReport,
        }),
      });

      const result = await conductSystematicReview({ topic: 'Test' });

      expect(result.extractedReferences.length).toBe(1);
      expect(result.extractedReferences[0].title).toBe('Study with Minimal Data');
      expect(result.extractedReferences[0].year).toBe(2024);
      expect(result.extractedReferences[0].authors).toEqual([]);
    });

    it('should deduplicate similar titles', async () => {
      const duplicateReport = `
### Study 1
- **Title:** Effects of Drug X on Outcomes
- **Year:** 2023

### Study 2
- **Title:** Effects of Drug X on Outcomes
- **Year:** 2023
`;

      (getDeepResearchClient as jest.Mock).mockReturnValue({
        research: jest.fn().mockResolvedValue({
          ...mockResearchResult,
          report: duplicateReport,
        }),
      });

      const result = await conductSystematicReview({ topic: 'Test' });

      // Should deduplicate to 1 reference
      expect(result.extractedReferences.length).toBe(1);
    });
  });

  describe('quickLiteratureSearch', () => {
    it('should return references without PRISMA processing', async () => {
      const result = await quickLiteratureSearch('Drug safety signals');

      expect(result.researchResult).toBeDefined();
      expect(result.references).toBeDefined();
      expect(result.references.length).toBeGreaterThan(0);

      // Should not have PRISMA-specific fields
      expect(result).not.toHaveProperty('flowDiagramText');
      expect(result).not.toHaveProperty('pipelineResult');
    });

    it('should respect maxResults limit', async () => {
      const result = await quickLiteratureSearch('Drug safety signals', {
        maxResults: 2,
      });

      expect(result.references.length).toBeLessThanOrEqual(2);
    });

    it('should include date range in search', async () => {
      const client = getDeepResearchClient();
      await quickLiteratureSearch('Test topic', {
        dateRange: { from: 2022, to: 2024 },
      });

      expect(client.research).toHaveBeenCalled();
      const callArg = (client.research as jest.Mock).mock.calls[0][0];
      expect(callArg).toContain('2022');
      expect(callArg).toContain('2024');
    });
  });

  describe('validateReviewCompliance', () => {
    it('should validate a complete systematic review report', () => {
      const report = {
        title: 'Systematic Review of GLP-1 Safety',
        abstract: {
          background: 'GLP-1 agonists are...',
          methods: 'We searched PubMed...',
          results: 'We identified 50 studies...',
          conclusion: 'GLP-1 agonists show...',
        },
        introduction: {
          rationale: 'Cardiovascular safety is critical...',
          objectives: 'To assess cardiovascular outcomes...',
          picoStatement: 'P: Adults with T2DM, I: GLP-1 agonists...',
        },
        methods: {
          protocolRegistration: 'PROSPERO CRD42023456789',
          eligibilityCriteria: 'RCTs and cohort studies...',
          informationSources: ['PubMed', 'Embase', 'Cochrane'],
          searchStrategy: '(GLP-1 OR semaglutide) AND cardiovascular...',
          selectionProcess: 'Two reviewers independently...',
          dataCollectionProcess: 'Standardized extraction form...',
          dataItems: ['Study design', 'Population', 'Outcomes'],
          riskOfBiasAssessment: 'Cochrane RoB 2.0',
          effectMeasures: ['Hazard ratio', 'Risk ratio'],
          synthesisMethods: 'Random effects meta-analysis',
          certaintyAssessment: 'GRADE approach',
        },
        results: {
          studySelection: '5000 screened, 50 included',
          studyCharacteristics: '30 RCTs, 20 cohort studies',
          riskOfBiasResults: 'Low risk in 80% of RCTs',
          individuaStudyResults: 'See Table 2',
          synthesisResults: 'Pooled HR 0.86 (95% CI 0.79-0.93)',
          heterogeneityResults: 'I2 = 45%',
        },
        discussion: {
          summaryOfEvidence: 'Strong evidence for CV benefit...',
          limitations: 'Limited long-term data...',
          interpretation: 'GLP-1 agonists reduce MACE...',
        },
        other: {
          registration: 'PROSPERO CRD42023456789',
          funding: 'No funding received',
          conflicts: 'None declared',
          dataAvailability: 'Available upon request',
        },
      };

      const compliance = validateReviewCompliance(report, 0.8);

      expect(compliance).toHaveProperty('items');
      expect(compliance).toHaveProperty('score');
      expect(compliance).toHaveProperty('isCompliant');
      expect(compliance.items.length).toBe(27); // PRISMA 2020 has 27 items
    });
  });

  describe('PICO Framework Integration', () => {
    it('should include PICO terms in research prompt', async () => {
      const pico: PICOFramework = {
        population: 'Adults with heart failure',
        intervention: 'SGLT2 inhibitors',
        comparator: 'Standard care',
        outcome: 'Hospitalization rates',
        timeframe: '12 months',
        setting: 'Outpatient clinics',
      };

      const config: SystematicReviewConfig = {
        topic: 'SGLT2 inhibitors in heart failure',
        picoFramework: pico,
      };

      await conductSystematicReview(config);

      const client = getDeepResearchClient();
      const prompt = (client.research as jest.Mock).mock.calls[0][0];

      // Verify PICO elements in prompt
      expect(prompt).toContain('Population');
      expect(prompt).toContain('Adults with heart failure');
      expect(prompt).toContain('Intervention');
      expect(prompt).toContain('SGLT2 inhibitors');
      expect(prompt).toContain('Comparator');
      expect(prompt).toContain('Standard care');
      expect(prompt).toContain('Outcome');
      expect(prompt).toContain('Hospitalization rates');
      expect(prompt).toContain('Timeframe');
      expect(prompt).toContain('12 months');
      expect(prompt).toContain('Setting');
      expect(prompt).toContain('Outpatient clinics');
    });

    it('should derive screening keywords from PICO when not provided', async () => {
      const config: SystematicReviewConfig = {
        topic: 'Test',
        picoFramework: {
          population: 'Diabetic patients',
          intervention: 'Metformin',
          outcome: 'Blood glucose control',
        },
        // No inclusionKeywords provided - should derive from PICO
      };

      const result = await conductSystematicReview(config);

      // Pipeline should have processed records using derived keywords
      expect(result.pipelineResult).toBeDefined();
    });
  });

  describe('Flow Diagram Generation', () => {
    it('should generate valid PRISMA flow diagram', async () => {
      const result = await conductSystematicReview({ topic: 'Test' });

      const diagram = result.flowDiagramText;

      // Verify key sections present
      expect(diagram).toContain('IDENTIFICATION');
      expect(diagram).toContain('SCREENING');
      expect(diagram).toContain('ELIGIBILITY');
      expect(diagram).toContain('INCLUDED');

      // Verify counts are present (PRISMA 2020 format uses "Records from databases")
      expect(diagram).toMatch(/Records from databases/i);
    });

    it('should generate JSON flow diagram with correct structure', async () => {
      const result = await conductSystematicReview({ topic: 'Test' });

      const json = result.flowDiagramJSON;

      expect(json).toHaveProperty('identification');
      expect(json).toHaveProperty('screening');
      expect(json).toHaveProperty('eligibility');
      expect(json).toHaveProperty('included');
      expect(json).toHaveProperty('generatedAt');
    });
  });

  describe('Source Type Classification', () => {
    it('should classify sources correctly', async () => {
      const result = await conductSystematicReview({ topic: 'Test' });

      // All converted records should have valid source types
      const validSources = ['database', 'register', 'website', 'citation_search', 'grey_literature', 'manufacturer_data', 'other'];

      result.pipelineResult.records.forEach((record) => {
        expect(validSources).toContain(record.source);
      });
    });
  });

  describe('Timing Information', () => {
    it('should track timing accurately', async () => {
      const result = await conductSystematicReview({ topic: 'Test' });

      expect(result.timing.startedAt).toBeInstanceOf(Date);
      expect(result.timing.researchCompletedAt).toBeInstanceOf(Date);
      expect(result.timing.pipelineCompletedAt).toBeInstanceOf(Date);

      // Research completion should be after start
      expect(result.timing.researchCompletedAt.getTime()).toBeGreaterThanOrEqual(
        result.timing.startedAt.getTime()
      );

      // Pipeline completion should be after research
      expect(result.timing.pipelineCompletedAt.getTime()).toBeGreaterThanOrEqual(
        result.timing.researchCompletedAt.getTime()
      );

      // Total duration should match
      const calculatedDuration =
        result.timing.pipelineCompletedAt.getTime() - result.timing.startedAt.getTime();
      expect(result.timing.totalDurationMs).toBe(calculatedDuration);
    });
  });
});

describe('Reference Extraction Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle empty report', async () => {
    (getDeepResearchClient as jest.Mock).mockReturnValue({
      research: jest.fn().mockResolvedValue({
        ...mockResearchResult,
        report: '',
      }),
    });

    const result = await conductSystematicReview({ topic: 'Test' });

    expect(result.extractedReferences).toEqual([]);
    expect(result.pipelineResult.statistics.totalIdentified).toBe(0);
  });

  it('should handle report with no structured studies', async () => {
    (getDeepResearchClient as jest.Mock).mockReturnValue({
      research: jest.fn().mockResolvedValue({
        ...mockResearchResult,
        report: 'This is a general discussion without structured study listings.',
      }),
    });

    const result = await conductSystematicReview({ topic: 'Test' });

    expect(result.extractedReferences.length).toBe(0);
  });

  it('should handle special characters in titles', async () => {
    const specialReport = `
### Study 1
- **Title:** α-Glucosidase Inhibitors & β-Cell Function: A "Meta-Analysis"
- **Year:** 2023
`;

    (getDeepResearchClient as jest.Mock).mockReturnValue({
      research: jest.fn().mockResolvedValue({
        ...mockResearchResult,
        report: specialReport,
      }),
    });

    const result = await conductSystematicReview({ topic: 'Test' });

    expect(result.extractedReferences.length).toBe(1);
    expect(result.extractedReferences[0].title).toContain('α-Glucosidase');
  });
});
