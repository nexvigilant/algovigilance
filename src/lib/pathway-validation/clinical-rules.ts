/**
 * Clinical Validation Rules
 *
 * Domain-specific validation rules that check for clinical plausibility
 * in PV case data. These rules generate warnings (not errors) to respect
 * clinical judgment while alerting users to potential issues.
 */

import type {
  PathwayContext,
  ValidationWarning,
} from '@/types/clinical-pathways';

/**
 * Clinical rule definition
 */
export interface ClinicalRule {
  /** Unique rule ID */
  id: string;
  /** Human-readable description */
  description: string;
  /** Fields this rule applies to */
  appliesTo: string[];
  /** Check function - returns warning if check fails */
  check: (
    value: unknown,
    context: PathwayContext
  ) => ValidationWarning | null;
}

// =============================================================================
// Dose Range Data
// =============================================================================

/**
 * Typical dose ranges by drug (simplified for demo)
 * In production, this would be from a drug database
 */
const DOSE_RANGES: Record<string, { min: number; max: number; unit: string }> = {
  acetaminophen: { min: 325, max: 4000, unit: 'mg' },
  ibuprofen: { min: 200, max: 3200, unit: 'mg' },
  metformin: { min: 500, max: 2550, unit: 'mg' },
  lisinopril: { min: 2.5, max: 80, unit: 'mg' },
  atorvastatin: { min: 10, max: 80, unit: 'mg' },
  amlodipine: { min: 2.5, max: 10, unit: 'mg' },
  omeprazole: { min: 10, max: 40, unit: 'mg' },
  metoprolol: { min: 25, max: 400, unit: 'mg' },
  losartan: { min: 25, max: 100, unit: 'mg' },
  gabapentin: { min: 100, max: 3600, unit: 'mg' },
  sertraline: { min: 25, max: 200, unit: 'mg' },
  fluoxetine: { min: 10, max: 80, unit: 'mg' },
  warfarin: { min: 1, max: 15, unit: 'mg' },
  aspirin: { min: 81, max: 4000, unit: 'mg' },
  prednisone: { min: 1, max: 80, unit: 'mg' },
};

/**
 * Get dose range for a drug (case-insensitive, handles brand names)
 */
function getDoseRange(drugName: string): { min: number; max: number; unit: string } | null {
  const normalized = drugName.toLowerCase().trim();

  // Direct match
  if (DOSE_RANGES[normalized]) {
    return DOSE_RANGES[normalized];
  }

  // Partial match (e.g., "Tylenol" contains "acetaminophen" concept)
  // In production, this would use a drug mapping service
  const brandMappings: Record<string, string> = {
    tylenol: 'acetaminophen',
    advil: 'ibuprofen',
    motrin: 'ibuprofen',
    glucophage: 'metformin',
    lipitor: 'atorvastatin',
    norvasc: 'amlodipine',
    prilosec: 'omeprazole',
    zoloft: 'sertraline',
    prozac: 'fluoxetine',
    coumadin: 'warfarin',
  };

  for (const [brand, generic] of Object.entries(brandMappings)) {
    if (normalized.includes(brand)) {
      return DOSE_RANGES[generic] || null;
    }
  }

  return null;
}

// =============================================================================
// Clinical Validation Rules
// =============================================================================

/**
 * All clinical validation rules
 */
export const CLINICAL_RULES: ClinicalRule[] = [
  // --- Dose Plausibility ---
  {
    id: 'dose_range_check',
    description: 'Check dose against typical therapeutic range',
    appliesTo: ['dose_amount', 'drug_dose'],
    check: (value, context) => {
      if (typeof value !== 'number' && typeof value !== 'string') {
        return null;
      }

      // Parse dose value
      const doseStr = String(value);
      const doseMatch = doseStr.match(/(\d+(?:\.\d+)?)/);
      if (!doseMatch) return null;

      const doseValue = parseFloat(doseMatch[1]);
      const drugName = String(context.caseData.drug_name || '');

      if (!drugName) return null;

      const range = getDoseRange(drugName);
      if (!range) return null; // Unknown drug, can't check

      if (doseValue < range.min * 0.5) {
        return {
          field: 'dose_amount',
          type: 'clinical_plausibility',
          message: `Dose ${doseValue}${range.unit} is unusually low for ${drugName} (typical: ${range.min}-${range.max}${range.unit})`,
          suggestion: 'Please verify this is the correct dose',
          severity: 'medium',
        };
      }

      if (doseValue > range.max * 1.5) {
        return {
          field: 'dose_amount',
          type: 'clinical_plausibility',
          message: `Dose ${doseValue}${range.unit} is unusually high for ${drugName} (typical: ${range.min}-${range.max}${range.unit})`,
          suggestion: 'This could be a data entry error or an actual overdose - please verify',
          severity: 'high',
        };
      }

      return null;
    },
  },

  // --- Temporal Consistency ---
  {
    id: 'onset_after_start',
    description: 'Reaction onset should be on or after drug start date',
    appliesTo: ['onset_date', 'reaction_onset_date'],
    check: (value, context) => {
      if (!(value instanceof Date)) return null;

      const drugStartDate = context.caseData.drug_start_date;
      if (!(drugStartDate instanceof Date)) return null;

      if (value < drugStartDate) {
        const daysBefore = Math.round(
          (drugStartDate.getTime() - value.getTime()) / (1000 * 60 * 60 * 24)
        );
        return {
          field: 'onset_date',
          type: 'clinical_plausibility',
          message: `Reaction started ${daysBefore} day(s) before the drug was given`,
          suggestion: 'This is unusual - please verify both dates are correct',
          severity: 'medium',
        };
      }

      return null;
    },
  },

  {
    id: 'stop_after_start',
    description: 'Drug stop date should be on or after start date',
    appliesTo: ['drug_stop_date', 'drug_end_date'],
    check: (value, context) => {
      if (!(value instanceof Date)) return null;

      const drugStartDate = context.caseData.drug_start_date;
      if (!(drugStartDate instanceof Date)) return null;

      if (value < drugStartDate) {
        return {
          field: 'drug_stop_date',
          type: 'clinical_plausibility',
          message: 'Drug stop date is before the start date',
          suggestion: 'Please correct the dates',
          severity: 'high',
        };
      }

      return null;
    },
  },

  {
    id: 'death_after_onset',
    description: 'Death date should be on or after reaction onset',
    appliesTo: ['death_date'],
    check: (value, context) => {
      if (!(value instanceof Date)) return null;

      const onsetDate = context.caseData.onset_date || context.caseData.reaction_onset_date;
      if (!(onsetDate instanceof Date)) return null;

      if (value < onsetDate) {
        return {
          field: 'death_date',
          type: 'clinical_plausibility',
          message: 'Death date is before the reaction onset',
          suggestion: 'Please verify the dates',
          severity: 'high',
        };
      }

      return null;
    },
  },

  // --- Age Plausibility ---
  {
    id: 'age_plausibility',
    description: 'Check age is within plausible range',
    appliesTo: ['patient_age', 'age'],
    check: (value) => {
      if (typeof value !== 'number') return null;

      if (value < 0) {
        return {
          field: 'patient_age',
          type: 'clinical_plausibility',
          message: 'Age cannot be negative',
          severity: 'high',
        };
      }

      if (value > 120) {
        return {
          field: 'patient_age',
          type: 'clinical_plausibility',
          message: `Age ${value} is unusually high - please verify`,
          severity: 'medium',
        };
      }

      return null;
    },
  },

  // --- Weight Plausibility ---
  {
    id: 'weight_plausibility',
    description: 'Check weight is within plausible range',
    appliesTo: ['weight_value', 'patient_weight'],
    check: (value, context) => {
      if (typeof value !== 'number') return null;

      const unit = context.caseData.weight_unit || 'kg';
      const weightKg = unit === 'lb' ? value * 0.453592 : value;

      if (weightKg < 0.5) {
        return {
          field: 'weight_value',
          type: 'clinical_plausibility',
          message: 'Weight is too low to be valid',
          severity: 'high',
        };
      }

      if (weightKg > 500) {
        return {
          field: 'weight_value',
          type: 'clinical_plausibility',
          message: `Weight ${value}${unit} seems unusually high - please verify`,
          severity: 'medium',
        };
      }

      // Check weight vs age consistency
      const age = context.caseData.patient_age;
      if (typeof age === 'number') {
        // Pediatric checks
        if (age < 1 && weightKg > 15) {
          return {
            field: 'weight_value',
            type: 'clinical_plausibility',
            message: `Weight ${weightKg}kg seems high for an infant (age ${age})`,
            suggestion: 'Please verify weight and age',
            severity: 'medium',
          };
        }
        if (age < 5 && weightKg > 40) {
          return {
            field: 'weight_value',
            type: 'clinical_plausibility',
            message: `Weight ${weightKg}kg seems high for a child aged ${age}`,
            suggestion: 'Please verify weight and age',
            severity: 'low',
          };
        }
      }

      return null;
    },
  },

  // --- Consistency Checks ---
  {
    id: 'death_outcome_consistency',
    description: 'Death outcome should have death date',
    appliesTo: ['reaction_outcome'],
    check: (value, context) => {
      if (value === 'fatal' || value === 'death') {
        const deathDate = context.caseData.death_date;
        if (!deathDate) {
          return {
            field: 'reaction_outcome',
            type: 'completeness',
            message: 'Death outcome selected but no death date provided',
            suggestion: 'Please provide the date of death',
            severity: 'medium',
          };
        }
      }
      return null;
    },
  },

  {
    id: 'pregnancy_sex_consistency',
    description: 'Pregnancy status requires female sex',
    appliesTo: ['pregnancy_status'],
    check: (value, context) => {
      if (value && value !== 'not_applicable' && value !== 'unknown') {
        const sex = context.caseData.patient_sex;
        if (sex === 'male') {
          return {
            field: 'pregnancy_status',
            type: 'consistency',
            message: 'Pregnancy status provided for male patient',
            suggestion: 'Please verify patient sex or pregnancy status',
            severity: 'high',
          };
        }
      }
      return null;
    },
  },

  {
    id: 'dechallenge_consistency',
    description: 'Positive dechallenge requires drug was stopped',
    appliesTo: ['dechallenge'],
    check: (value, context) => {
      if (value === 'yes_improved' || value === 'yes_no_change') {
        const drugOngoing = context.caseData.drug_ongoing;
        if (drugOngoing === true) {
          return {
            field: 'dechallenge',
            type: 'consistency',
            message: 'Dechallenge response provided but drug is still ongoing',
            suggestion: 'If the drug was stopped, uncheck "still taking"',
            severity: 'medium',
          };
        }
      }
      return null;
    },
  },

  // --- Causality Consistency ---
  {
    id: 'causality_evidence_check',
    description: 'Certain causality should have supporting evidence',
    appliesTo: ['causality'],
    check: (value, context) => {
      if (value === 'certain') {
        const dechallenge = context.caseData.dechallenge;
        const rechallenge = context.caseData.rechallenge;

        // Certain usually requires positive dechallenge or rechallenge
        const hasPositiveDechallenge = dechallenge === 'yes_improved';
        const hasPositiveRechallenge = rechallenge === 'yes_recurred';

        if (!hasPositiveDechallenge && !hasPositiveRechallenge) {
          return {
            field: 'causality',
            type: 'clinical_plausibility',
            message: '"Certain" causality is typically reserved for cases with positive dechallenge or rechallenge',
            suggestion: 'Consider if "Probable" might be more appropriate without this evidence',
            severity: 'low',
          };
        }
      }
      return null;
    },
  },
];

/**
 * Get rules that apply to a specific field
 */
export function getRulesForField(fieldId: string): ClinicalRule[] {
  return CLINICAL_RULES.filter((rule) =>
    rule.appliesTo.some((field) =>
      fieldId.toLowerCase().includes(field.toLowerCase()) ||
      field.toLowerCase().includes(fieldId.toLowerCase())
    )
  );
}

/**
 * Run all applicable clinical rules for a field
 */
export function runClinicalRules(
  fieldId: string,
  value: unknown,
  context: PathwayContext
): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  const rules = getRulesForField(fieldId);

  for (const rule of rules) {
    const warning = rule.check(value, context);
    if (warning) {
      warnings.push(warning);
    }
  }

  return warnings;
}
