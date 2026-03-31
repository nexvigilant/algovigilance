/**
 * Pathway Validation Module
 *
 * Comprehensive validation for PV case data including:
 * - Format validation (required fields, patterns)
 * - Clinical plausibility (dose ranges, temporal consistency)
 * - Cross-field consistency (related field agreement)
 * - Regulatory requirements (E2B mandatory fields)
 */

import type {
  PathwayState,
  PathwayContext,
  UserInput,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from '@/types/clinical-pathways';
import { runClinicalRules } from './clinical-rules';

export { CLINICAL_RULES, getRulesForField, runClinicalRules } from './clinical-rules';
export type { ClinicalRule } from './clinical-rules';

/**
 * Validation engine interface
 */
export interface ValidationEngine {
  validateInput(
    input: UserInput,
    state: PathwayState,
    context: PathwayContext
  ): Promise<ValidationResult>;

  validateState(
    state: PathwayState,
    context: PathwayContext
  ): Promise<ValidationResult>;

  validateSubmission(
    context: PathwayContext
  ): Promise<ValidationResult>;
}

// =============================================================================
// Format Validators
// =============================================================================

/**
 * Validate required field
 */
function validateRequired(
  value: unknown,
  fieldId: string,
  message: string
): ValidationError | null {
  if (value === null || value === undefined || value === '') {
    return {
      code: 'REQUIRED',
      field: fieldId,
      message,
    };
  }
  return null;
}

/**
 * Validate date is not in future
 */
function validateNotFutureDate(
  value: unknown,
  fieldId: string,
  message: string
): ValidationError | null {
  if (value instanceof Date) {
    if (value > new Date()) {
      return {
        code: 'FUTURE_DATE',
        field: fieldId,
        message,
        example: new Date().toISOString().split('T')[0],
      };
    }
  }
  // Also handle string dates
  if (typeof value === 'string' && value) {
    const date = new Date(value);
    if (!isNaN(date.getTime()) && date > new Date()) {
      return {
        code: 'FUTURE_DATE',
        field: fieldId,
        message,
        example: new Date().toISOString().split('T')[0],
      };
    }
  }
  return null;
}

/**
 * Validate number range
 */
function validateRange(
  value: unknown,
  fieldId: string,
  min: number,
  max: number,
  message: string
): ValidationError | null {
  if (typeof value === 'number') {
    if (value < min || value > max) {
      return {
        code: 'OUT_OF_RANGE',
        field: fieldId,
        message,
        example: `${min} - ${max}`,
      };
    }
  }
  return null;
}

/**
 * Validate pattern match
 */
function validatePattern(
  value: unknown,
  fieldId: string,
  pattern: RegExp,
  message: string
): ValidationError | null {
  if (typeof value === 'string') {
    if (!pattern.test(value)) {
      return {
        code: 'INVALID_FORMAT',
        field: fieldId,
        message,
      };
    }
  }
  return null;
}

// =============================================================================
// Clinical Validation Engine Implementation
// =============================================================================

/**
 * Create a clinical validation engine
 */
export function createValidationEngine(): ValidationEngine {
  return {
    async validateInput(
      input: UserInput,
      state: PathwayState,
      context: PathwayContext
    ): Promise<ValidationResult> {
      const errors: ValidationError[] = [];
      const warnings: ValidationWarning[] = [];

      // Find field definition
      const field = state.fields?.find((f) => f.id === input.field);

      if (field) {
        // Process each validator
        for (const validator of field.validators || []) {
          switch (validator.type) {
            case 'required': {
              const error = validateRequired(input.value, input.field, validator.message);
              if (error && validator.severity === 'error') {
                errors.push(error);
              }
              break;
            }

            case 'date': {
              const params = validator.params as { maxDate?: string } | undefined;
              if (params?.maxDate === 'today') {
                const error = validateNotFutureDate(input.value, input.field, validator.message);
                if (error && validator.severity === 'error') {
                  errors.push(error);
                }
              }
              break;
            }

            case 'range': {
              const params = validator.params as { min: number; max: number } | undefined;
              if (params) {
                const error = validateRange(
                  input.value,
                  input.field,
                  params.min,
                  params.max,
                  validator.message
                );
                if (error) {
                  if (validator.severity === 'error') {
                    errors.push(error);
                  } else {
                    warnings.push({
                      field: input.field,
                      type: 'clinical_plausibility',
                      message: validator.message,
                      severity: 'medium',
                    });
                  }
                }
              }
              break;
            }

            case 'format': {
              const params = validator.params as { pattern: string } | undefined;
              if (params?.pattern) {
                const error = validatePattern(
                  input.value,
                  input.field,
                  new RegExp(params.pattern),
                  validator.message
                );
                if (error && validator.severity === 'error') {
                  errors.push(error);
                }
              }
              break;
            }
          }
        }
      }

      // Run clinical plausibility rules
      const clinicalWarnings = runClinicalRules(input.field, input.value, context);
      warnings.push(...clinicalWarnings);

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        canProceed: errors.length === 0,
      };
    },

    async validateState(
      state: PathwayState,
      context: PathwayContext
    ): Promise<ValidationResult> {
      const errors: ValidationError[] = [];
      const warnings: ValidationWarning[] = [];

      // Validate all fields in the state
      for (const field of state.fields || []) {
        const value = context.caseData[field.id];

        // Check required fields
        const requiredValidator = field.validators?.find((v) => v.type === 'required');
        if (requiredValidator) {
          const error = validateRequired(value, field.id, requiredValidator.message);
          if (error && requiredValidator.severity === 'error') {
            errors.push(error);
          }
        }

        // Run clinical rules for each field
        if (value !== undefined) {
          const fieldWarnings = runClinicalRules(field.id, value, context);
          warnings.push(...fieldWarnings);
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        canProceed: errors.length === 0,
      };
    },

    async validateSubmission(
      context: PathwayContext
    ): Promise<ValidationResult> {
      const errors: ValidationError[] = [];
      const warnings: ValidationWarning[] = [];

      // Check E2B minimum required fields
      const requiredFields = [
        { field: 'patient_initials', message: 'Patient initials are required' },
        { field: 'drug_name', message: 'Suspect drug name is required' },
        { field: 'reaction_description', message: 'Reaction description is required' },
      ];

      for (const { field, message } of requiredFields) {
        if (!context.caseData[field]) {
          errors.push({
            code: 'REQUIRED',
            field,
            message,
            regulation: 'ICH E2B(R3) minimum case requirements',
          });
        }
      }

      // Run all clinical rules on all case data
      for (const [fieldId, value] of Object.entries(context.caseData)) {
        const fieldWarnings = runClinicalRules(fieldId, value, context);
        warnings.push(...fieldWarnings);
      }

      // Remove duplicate warnings
      const uniqueWarnings = warnings.filter(
        (warning, index, self) =>
          index === self.findIndex(
            (w) => w.field === warning.field && w.message === warning.message
          )
      );

      return {
        isValid: errors.length === 0,
        errors,
        warnings: uniqueWarnings,
        canProceed: errors.length === 0,
      };
    },
  };
}

/**
 * Default validation engine instance
 */
export const validationEngine = createValidationEngine();
