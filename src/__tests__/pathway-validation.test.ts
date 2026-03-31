/**
 * Pathway Validation Tests
 *
 * Tests for clinical validation rules and the validation engine.
 */

import {
  createValidationEngine,
  CLINICAL_RULES,
  getRulesForField,
  runClinicalRules,
} from '@/lib/pathway-validation';
import type { PathwayContext, PathwayState } from '@/types/clinical-pathways';

// =============================================================================
// Test Fixtures
// =============================================================================

const createMockContext = (caseData: Record<string, unknown> = {}): PathwayContext => ({
  sessionId: 'test-session',
  userId: 'test-user',
  domain: 'pharmacist',
  startTime: new Date(),
  currentStateId: 'test_state',
  navigationHistory: ['test_state'],
  caseData,
  auditTrail: [],
  completedPhases: [],
});

const createMockState = (fields: PathwayState['fields'] = []): PathwayState => ({
  id: 'test_state',
  type: 'data_entry',
  phase: 'test',
  prompt: 'Test prompt',
  fields,
  transitions: [],
});

// =============================================================================
// Clinical Rules Tests
// =============================================================================

describe('CLINICAL_RULES', () => {
  it('contains expected rule definitions', () => {
    expect(CLINICAL_RULES.length).toBeGreaterThan(0);

    const ruleIds = CLINICAL_RULES.map((r) => r.id);
    expect(ruleIds).toContain('dose_range_check');
    expect(ruleIds).toContain('onset_after_start');
    expect(ruleIds).toContain('age_plausibility');
  });

  it('each rule has required properties', () => {
    for (const rule of CLINICAL_RULES) {
      expect(rule.id).toBeTruthy();
      expect(rule.description).toBeTruthy();
      expect(rule.appliesTo.length).toBeGreaterThan(0);
      expect(typeof rule.check).toBe('function');
    }
  });
});

// =============================================================================
// getRulesForField Tests
// =============================================================================

describe('getRulesForField()', () => {
  it('returns rules for dose fields', () => {
    const rules = getRulesForField('dose_amount');
    expect(rules.length).toBeGreaterThan(0);
    expect(rules.some((r) => r.id === 'dose_range_check')).toBe(true);
  });

  it('returns rules for date fields', () => {
    const rules = getRulesForField('onset_date');
    expect(rules.length).toBeGreaterThan(0);
    expect(rules.some((r) => r.id === 'onset_after_start')).toBe(true);
  });

  it('returns rules for age field', () => {
    const rules = getRulesForField('patient_age');
    expect(rules.length).toBeGreaterThan(0);
    expect(rules.some((r) => r.id === 'age_plausibility')).toBe(true);
  });

  it('returns empty array for unknown field', () => {
    const rules = getRulesForField('unknown_field_xyz');
    expect(rules).toEqual([]);
  });
});

// =============================================================================
// Dose Range Check Tests
// =============================================================================

describe('dose_range_check rule', () => {
  it('returns warning for unusually high dose', () => {
    const context = createMockContext({
      drug_name: 'acetaminophen',
    });

    const warnings = runClinicalRules('dose_amount', 10000, context);

    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0].severity).toBe('high');
    expect(warnings[0].message).toContain('unusually high');
  });

  it('returns warning for unusually low dose', () => {
    const context = createMockContext({
      drug_name: 'acetaminophen',
    });

    const warnings = runClinicalRules('dose_amount', 50, context);

    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0].severity).toBe('medium');
    expect(warnings[0].message).toContain('unusually low');
  });

  it('returns no warning for normal dose', () => {
    const context = createMockContext({
      drug_name: 'acetaminophen',
    });

    const warnings = runClinicalRules('dose_amount', 500, context);

    expect(warnings.length).toBe(0);
  });

  it('handles brand names', () => {
    const context = createMockContext({
      drug_name: 'Tylenol',
    });

    const warnings = runClinicalRules('dose_amount', 10000, context);

    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0].message).toContain('Tylenol');
  });

  it('returns no warning for unknown drug', () => {
    const context = createMockContext({
      drug_name: 'UnknownDrug123',
    });

    const warnings = runClinicalRules('dose_amount', 999999, context);

    // Unknown drugs can't be validated
    expect(warnings.length).toBe(0);
  });
});

// =============================================================================
// Temporal Consistency Tests
// =============================================================================

describe('temporal consistency rules', () => {
  describe('onset_after_start', () => {
    it('returns warning when onset is before drug start', () => {
      const context = createMockContext({
        drug_start_date: new Date('2024-06-15'),
      });

      const warnings = runClinicalRules('onset_date', new Date('2024-06-10'), context);

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0].message).toContain('before the drug');
    });

    it('returns no warning when onset is after drug start', () => {
      const context = createMockContext({
        drug_start_date: new Date('2024-06-10'),
      });

      const warnings = runClinicalRules('onset_date', new Date('2024-06-15'), context);

      expect(warnings.length).toBe(0);
    });
  });

  describe('stop_after_start', () => {
    it('returns warning when stop date is before start date', () => {
      const context = createMockContext({
        drug_start_date: new Date('2024-06-15'),
      });

      const warnings = runClinicalRules('drug_stop_date', new Date('2024-06-10'), context);

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0].message).toContain('before the start date');
    });
  });

  describe('death_after_onset', () => {
    it('returns warning when death is before onset', () => {
      const context = createMockContext({
        onset_date: new Date('2024-06-15'),
      });

      const warnings = runClinicalRules('death_date', new Date('2024-06-10'), context);

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0].message).toContain('before the reaction onset');
    });
  });
});

// =============================================================================
// Age Plausibility Tests
// =============================================================================

describe('age_plausibility rule', () => {
  it('returns warning for negative age', () => {
    const context = createMockContext();
    const warnings = runClinicalRules('patient_age', -5, context);

    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0].message).toContain('cannot be negative');
  });

  it('returns warning for extremely high age', () => {
    const context = createMockContext();
    const warnings = runClinicalRules('patient_age', 150, context);

    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0].message).toContain('unusually high');
  });

  it('returns no warning for normal age', () => {
    const context = createMockContext();
    const warnings = runClinicalRules('patient_age', 45, context);

    expect(warnings.length).toBe(0);
  });
});

// =============================================================================
// Weight Plausibility Tests
// =============================================================================

describe('weight_plausibility rule', () => {
  it('returns warning for impossibly low weight', () => {
    const context = createMockContext();
    const warnings = runClinicalRules('weight_value', 0.1, context);

    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0].message).toContain('too low');
  });

  it('returns warning for extremely high weight', () => {
    const context = createMockContext();
    const warnings = runClinicalRules('weight_value', 600, context);

    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0].message).toContain('unusually high');
  });

  it('checks weight vs age consistency for infants', () => {
    const context = createMockContext({
      patient_age: 0.5, // 6 months
    });

    const warnings = runClinicalRules('weight_value', 20, context);

    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0].message).toContain('infant');
  });
});

// =============================================================================
// Consistency Check Tests
// =============================================================================

describe('consistency rules', () => {
  describe('death_outcome_consistency', () => {
    it('warns when death outcome has no death date', () => {
      const context = createMockContext({});
      const warnings = runClinicalRules('reaction_outcome', 'fatal', context);

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0].message).toContain('no death date');
    });

    it('no warning when death outcome has death date', () => {
      const context = createMockContext({
        death_date: new Date('2024-06-20'),
      });
      const warnings = runClinicalRules('reaction_outcome', 'fatal', context);

      expect(warnings.length).toBe(0);
    });
  });

  describe('pregnancy_sex_consistency', () => {
    it('warns when pregnancy status for male patient', () => {
      const context = createMockContext({
        patient_sex: 'male',
      });
      const warnings = runClinicalRules('pregnancy_status', 'pregnant', context);

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0].message).toContain('male patient');
    });
  });

  describe('dechallenge_consistency', () => {
    it('warns when dechallenge positive but drug ongoing', () => {
      const context = createMockContext({
        drug_ongoing: true,
      });
      const warnings = runClinicalRules('dechallenge', 'yes_improved', context);

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0].message).toContain('still ongoing');
    });
  });
});

// =============================================================================
// Causality Evidence Tests
// =============================================================================

describe('causality_evidence_check rule', () => {
  it('warns when certain causality lacks evidence', () => {
    const context = createMockContext({
      dechallenge: 'not_done',
      rechallenge: 'not_done',
    });
    const warnings = runClinicalRules('causality', 'certain', context);

    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0].message).toContain('Certain');
  });

  it('no warning when certain causality has positive dechallenge', () => {
    const context = createMockContext({
      dechallenge: 'yes_improved',
    });
    const warnings = runClinicalRules('causality', 'certain', context);

    expect(warnings.length).toBe(0);
  });

  it('no warning for probable causality without evidence', () => {
    const context = createMockContext({});
    const warnings = runClinicalRules('causality', 'probable', context);

    expect(warnings.length).toBe(0);
  });
});

// =============================================================================
// Validation Engine Tests
// =============================================================================

describe('ValidationEngine', () => {
  const engine = createValidationEngine();

  describe('validateInput()', () => {
    it('validates required fields', async () => {
      const state = createMockState([
        {
          id: 'patient_initials',
          type: 'text',
          label: 'Patient Initials',
          validators: [
            { type: 'required', message: 'Initials required', severity: 'error' },
          ],
        },
      ]);
      const context = createMockContext();

      const result = await engine.validateInput(
        { field: 'patient_initials', value: '' },
        state,
        context
      );

      expect(result.isValid).toBe(false);
      expect(result.errors?.length).toBeGreaterThan(0);
      expect(result.errors?.[0].code).toBe('REQUIRED');
    });

    it('validates future dates', async () => {
      const state = createMockState([
        {
          id: 'onset_date',
          type: 'date',
          label: 'Onset Date',
          validators: [
            {
              type: 'date',
              message: 'Date cannot be in future',
              severity: 'error',
              params: { maxDate: 'today' },
            },
          ],
        },
      ]);
      const context = createMockContext();

      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const result = await engine.validateInput(
        { field: 'onset_date', value: futureDate },
        state,
        context
      );

      expect(result.isValid).toBe(false);
      expect(result.errors?.some((e) => e.code === 'FUTURE_DATE')).toBe(true);
    });

    it('includes clinical warnings', async () => {
      const state = createMockState([
        {
          id: 'dose_amount',
          type: 'number',
          label: 'Dose',
        },
      ]);
      const context = createMockContext({
        drug_name: 'acetaminophen',
      });

      const result = await engine.validateInput(
        { field: 'dose_amount', value: 10000 },
        state,
        context
      );

      expect(result.warnings?.length).toBeGreaterThan(0);
      expect(result.warnings?.[0].type).toBe('clinical_plausibility');
    });
  });

  describe('validateSubmission()', () => {
    it('validates E2B minimum requirements', async () => {
      const context = createMockContext({
        // Missing required fields
      });

      const result = await engine.validateSubmission(context);

      expect(result.isValid).toBe(false);
      expect(result.errors?.length).toBeGreaterThan(0);
      expect(result.errors?.some((e) => e.field === 'patient_initials')).toBe(true);
      expect(result.errors?.some((e) => e.field === 'drug_name')).toBe(true);
      expect(result.errors?.some((e) => e.field === 'reaction_description')).toBe(true);
    });

    it('passes with minimum required fields', async () => {
      const context = createMockContext({
        patient_initials: 'JD',
        drug_name: 'Acetaminophen',
        reaction_description: 'Rash on arms',
      });

      const result = await engine.validateSubmission(context);

      expect(result.isValid).toBe(true);
      expect(result.errors?.length ?? 0).toBe(0);
    });

    it('deduplicates warnings', async () => {
      const context = createMockContext({
        patient_initials: 'JD',
        drug_name: 'acetaminophen',
        reaction_description: 'Rash',
        dose_amount: 10000,
        drug_dose: 10000, // Both fields trigger same rule
      });

      const result = await engine.validateSubmission(context);

      // Count warnings for dose
      const doseWarnings = result.warnings?.filter((w) =>
        w.message.includes('unusually high')
      );

      // Should have unique warnings only
      expect(doseWarnings?.length).toBeLessThanOrEqual(2);
    });
  });
});
