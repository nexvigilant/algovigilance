/**
 * Regulatory Validation Unit Tests
 */

import { referentialIntegrityValidator } from '../../../scripts/regulatory/validation/referential-integrity';
import { completenessValidator } from '../../../scripts/regulatory/validation/completeness';
import { businessRulesValidator } from '../../../scripts/regulatory/validation/business-rules';
import { crossReferenceValidator } from '../../../scripts/regulatory/validation/cross-reference';

import {
  createMinimalValidData,
  createDataWithDuplicateRegId,
  createDataWithMissingFields,
  createDataWithInvalidJurisdiction,
  createDataWithInvalidDomainId,
  createDataWithInvalidMapping,
  createEmptyData,
} from './fixtures';

// =============================================================================
// REFERENTIAL INTEGRITY VALIDATOR
// =============================================================================

describe('Referential Integrity Validator', () => {
  it('should have correct name and layer', () => {
    expect(referentialIntegrityValidator.name).toBe('Referential Integrity');
    expect(referentialIntegrityValidator.layer).toBe('referential-integrity');
  });

  it('should pass with valid data', async () => {
    const data = createMinimalValidData();
    const result = await referentialIntegrityValidator.validate(data);

    expect(result.passed).toBe(true);
    expect(result.issues.filter((i) => i.severity === 'error')).toHaveLength(0);
  });

  it('should detect duplicate regulation IDs', async () => {
    const data = createDataWithDuplicateRegId();
    const result = await referentialIntegrityValidator.validate(data);

    const duplicateIssues = result.issues.filter(
      (i) => i.code === 'REG_REF_DUPLICATE_REGID'
    );
    expect(duplicateIssues.length).toBeGreaterThan(0);
    expect(duplicateIssues[0].severity).toBe('error');
  });

  it('should detect invalid mapping references', async () => {
    const data = createDataWithInvalidMapping();
    const result = await referentialIntegrityValidator.validate(data);

    const invalidRefIssues = result.issues.filter(
      (i) => i.code === 'REG_REF_INVALID_REGID'
    );
    expect(invalidRefIssues.length).toBeGreaterThan(0);
  });

  it('should return valid LayerResult structure', async () => {
    const data = createMinimalValidData();
    const result = await referentialIntegrityValidator.validate(data);

    expect(result).toHaveProperty('layer', 'referential-integrity');
    expect(result).toHaveProperty('passed');
    expect(result).toHaveProperty('checksRun');
    expect(result).toHaveProperty('checksPassed');
    expect(result).toHaveProperty('duration');
    expect(result).toHaveProperty('issues');
    expect(Array.isArray(result.issues)).toBe(true);
  });
});

// =============================================================================
// COMPLETENESS VALIDATOR
// =============================================================================

describe('Completeness Validator', () => {
  it('should have correct name and layer', () => {
    expect(completenessValidator.name).toBe('Completeness');
    expect(completenessValidator.layer).toBe('completeness');
  });

  it('should pass with valid data', async () => {
    const data = createMinimalValidData();
    const result = await completenessValidator.validate(data);

    expect(result.passed).toBe(true);
  });

  it('should detect missing required fields', async () => {
    const data = createDataWithMissingFields();
    const result = await completenessValidator.validate(data);

    const missingFieldIssues = result.issues.filter(
      (i) => i.code === 'REG_MISSING_REQUIRED_FIELD'
    );
    expect(missingFieldIssues.length).toBeGreaterThan(0);
    expect(result.passed).toBe(false);
  });

  it('should detect empty collections', async () => {
    const data = createEmptyData();
    const result = await completenessValidator.validate(data);

    const emptyCollectionIssues = result.issues.filter(
      (i) => i.code === 'REG_EMPTY_COLLECTION'
    );
    expect(emptyCollectionIssues.length).toBeGreaterThan(0);
  });

  it('should validate metadata completeness', async () => {
    const data = createMinimalValidData();
    data.metadata.version = '';
    const result = await completenessValidator.validate(data);

    const metadataIssues = result.issues.filter(
      (i) => i.code === 'REG_MISSING_METADATA'
    );
    expect(metadataIssues.length).toBeGreaterThan(0);
  });

  it('should check timeline required fields', async () => {
    const data = createMinimalValidData();
    data.reportingTimelines.timelines[0].eventReportType = '';
    const result = await completenessValidator.validate(data);

    const timelineIssues = result.issues.filter(
      (i) => i.entity === 'ReportingTimeline'
    );
    expect(timelineIssues.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// BUSINESS RULES VALIDATOR
// =============================================================================

describe('Business Rules Validator', () => {
  it('should have correct name and layer', () => {
    expect(businessRulesValidator.name).toBe('Business Rules');
    expect(businessRulesValidator.layer).toBe('business-rules');
  });

  it('should pass with valid data', async () => {
    const data = createMinimalValidData();
    const result = await businessRulesValidator.validate(data);

    // May have info/warnings but should pass (no errors)
    expect(result.passed).toBe(true);
  });

  it('should detect invalid jurisdiction', async () => {
    const data = createDataWithInvalidJurisdiction();
    const result = await businessRulesValidator.validate(data);

    const jurisdictionIssues = result.issues.filter(
      (i) => i.code === 'REG_INVALID_JURISDICTION'
    );
    expect(jurisdictionIssues.length).toBeGreaterThan(0);
    expect(result.passed).toBe(false);
  });

  it('should validate gap priorities', async () => {
    const data = createMinimalValidData();
    (data.gapAnalysis.gaps[0] as Record<string, unknown>).priority = 'INVALID_PRIORITY';
    const result = await businessRulesValidator.validate(data);

    const priorityIssues = result.issues.filter(
      (i) => i.code === 'REG_INVALID_PRIORITY'
    );
    expect(priorityIssues.length).toBeGreaterThan(0);
  });

  it('should validate harmonization levels', async () => {
    const data = createMinimalValidData();
    (data.crossReferenceMatrix.crossReferences[0] as Record<string, unknown>).harmonizationLevel = 'INVALID';
    const result = await businessRulesValidator.validate(data);

    const harmIssues = result.issues.filter(
      (i) => i.code === 'REG_INVALID_HARMONIZATION'
    );
    expect(harmIssues.length).toBeGreaterThan(0);
  });

  it('should validate lifecycle stages', async () => {
    const data = createMinimalValidData();
    (data.masterDirectory.regulations[0] as Record<string, unknown>).lifecycleStage = 'INVALID';
    const result = await businessRulesValidator.validate(data);

    const lifecycleIssues = result.issues.filter(
      (i) => i.code === 'REG_INVALID_LIFECYCLE'
    );
    expect(lifecycleIssues.length).toBeGreaterThan(0);
  });

  it('should check gap summary accuracy', async () => {
    const data = createMinimalValidData();
    data.gapAnalysis.summary.critical = 10; // Mismatch
    const result = await businessRulesValidator.validate(data);

    const summaryIssues = result.issues.filter(
      (i) => i.code === 'REG_SUMMARY_MISMATCH'
    );
    expect(summaryIssues.length).toBeGreaterThan(0);
  });

  it('should warn about missing applicability', async () => {
    const data = createMinimalValidData();
    // Set all applicability to false
    data.masterDirectory.regulations[0].applicability = {
      rxDrugs: false,
      otc: false,
      biologics: false,
      vaccines: false,
      bloodProducts: false,
      biosimilars: false,
      generics: false,
      combinationProducts: false,
      atmp: false,
    };
    const result = await businessRulesValidator.validate(data);

    const applicabilityIssues = result.issues.filter(
      (i) => i.code === 'REG_NO_PRODUCT_APPLICABILITY'
    );
    expect(applicabilityIssues.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// CROSS-REFERENCE VALIDATOR
// =============================================================================

describe('Cross-Reference Validator', () => {
  it('should have correct name and layer', () => {
    expect(crossReferenceValidator.name).toBe('Cross-Reference Validator');
    expect(crossReferenceValidator.layer).toBe('cross-reference');
  });

  it('should pass with valid data', async () => {
    const data = createMinimalValidData();
    const result = await crossReferenceValidator.validate(data);

    // Should pass (no errors)
    expect(result.passed).toBe(true);
  });

  it('should detect invalid domain IDs', async () => {
    const data = createDataWithInvalidDomainId();
    const result = await crossReferenceValidator.validate(data);

    const domainIssues = result.issues.filter(
      (i) => i.code === 'REG_XREF_INVALID_DOMAIN'
    );
    expect(domainIssues.length).toBeGreaterThan(0);
    expect(result.passed).toBe(false);
  });

  it('should warn about KSB count mismatches', async () => {
    const data = createMinimalValidData();
    data.ksbRegulationMappings.mappings[0].relatedKsbCount = 5;
    data.ksbRegulationMappings.mappings[0].relatedKsbIds = [];
    const result = await crossReferenceValidator.validate(data);

    const countIssues = result.issues.filter(
      (i) => i.code === 'REG_XREF_KSB_COUNT_MISMATCH'
    );
    expect(countIssues.length).toBeGreaterThan(0);
  });

  it('should validate relevance types', async () => {
    const data = createMinimalValidData();
    (data.ksbRegulationMappings.mappings[0] as Record<string, unknown>).relevanceType = 'INVALID';
    const result = await crossReferenceValidator.validate(data);

    const relevanceIssues = result.issues.filter(
      (i) => i.code === 'REG_XREF_INVALID_RELEVANCE'
    );
    expect(relevanceIssues.length).toBeGreaterThan(0);
  });

  it('should info about regulations without mappings', async () => {
    const data = createMinimalValidData();
    // Add regulation without mapping
    data.masterDirectory.regulations.push({
      ...data.masterDirectory.regulations[0],
      regId: 'UNMAPPED-001',
    });
    const result = await crossReferenceValidator.validate(data);

    const noMappingIssues = result.issues.filter(
      (i) => i.code === 'REG_XREF_NO_MAPPING'
    );
    expect(noMappingIssues.length).toBeGreaterThan(0);
    expect(noMappingIssues[0].severity).toBe('info');
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe('Validator Integration', () => {
  it('should all validators complete within reasonable time', async () => {
    const data = createMinimalValidData();
    const validators = [
      referentialIntegrityValidator,
      completenessValidator,
      businessRulesValidator,
      crossReferenceValidator,
    ];

    for (const validator of validators) {
      const result = await validator.validate(data);
      expect(result.duration).toBeLessThan(1000);
    }
  });

  it('should all validators run at least one check', async () => {
    const data = createMinimalValidData();
    const validators = [
      referentialIntegrityValidator,
      completenessValidator,
      businessRulesValidator,
      crossReferenceValidator,
    ];

    for (const validator of validators) {
      const result = await validator.validate(data);
      expect(result.checksRun).toBeGreaterThan(0);
    }
  });

  it('should all return consistent LayerResult structure', async () => {
    const data = createMinimalValidData();
    const validators = [
      referentialIntegrityValidator,
      completenessValidator,
      businessRulesValidator,
      crossReferenceValidator,
    ];

    for (const validator of validators) {
      const result = await validator.validate(data);
      
      expect(typeof result.layer).toBe('string');
      expect(typeof result.passed).toBe('boolean');
      expect(typeof result.checksRun).toBe('number');
      expect(typeof result.checksPassed).toBe('number');
      expect(typeof result.duration).toBe('number');
      expect(Array.isArray(result.issues)).toBe(true);

      for (const issue of result.issues) {
        expect(issue).toHaveProperty('layer');
        expect(issue).toHaveProperty('severity');
        expect(issue).toHaveProperty('code');
        expect(issue).toHaveProperty('message');
        expect(['error', 'warning', 'info']).toContain(issue.severity);
      }
    }
  });
});
