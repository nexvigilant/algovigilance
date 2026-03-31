/**
 * Tiered Validator Tests
 */

import {
  createTieredValidator,
  requiredRule,
  rangeRule,
  patternRule,
  customRule,
  consistencyRule,
} from '../../tools/algorithms/tiered-validator';

// =============================================================================
// Test Fixtures
// =============================================================================

type TestContext = {
  name?: string;
  email?: string;
  age?: number;
  startDate?: Date;
  endDate?: Date;
};

const createTestValidator = () => {
  return createTieredValidator<TestContext>({
    rules: [
      {
        id: 'name_required',
        description: 'Name is required',
        appliesTo: ['name'],
        severity: 'error',
        check: (value) => value !== undefined && value !== null && value !== '',
        message: 'Name is required',
      },
      {
        id: 'email_format',
        description: 'Email must be valid',
        appliesTo: ['email'],
        severity: 'error',
        check: (value) => {
          if (typeof value !== 'string') return true;
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        },
        message: 'Invalid email format',
        example: 'user@example.com',
      },
      {
        id: 'age_range',
        description: 'Age must be between 0 and 120',
        appliesTo: ['age'],
        severity: 'error',
        check: (value) => {
          if (typeof value !== 'number') return true;
          return value >= 0 && value <= 120;
        },
        message: 'Age must be between 0 and 120',
      },
      {
        id: 'age_unusual',
        description: 'Age over 100 is unusual',
        appliesTo: ['age'],
        severity: 'warning',
        check: (value) => {
          if (typeof value !== 'number') return true;
          return value <= 100;
        },
        message: 'Age over 100 is unusual',
        suggestion: 'Please verify this is correct',
      },
    ],
  });
};

// =============================================================================
// validateField Tests
// =============================================================================

describe('validateField()', () => {
  it('returns valid result for valid input', () => {
    const validator = createTestValidator();
    const result = validator.validateField('name', 'John', {} as TestContext);

    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('returns error for invalid required field', () => {
    const validator = createTestValidator();
    const result = validator.validateField('name', '', {} as TestContext);

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].message).toBe('Name is required');
  });

  it('returns error for invalid email format', () => {
    const validator = createTestValidator();
    const result = validator.validateField('email', 'invalid-email', {} as TestContext);

    expect(result.isValid).toBe(false);
    expect(result.errors[0].message).toBe('Invalid email format');
    expect(result.errors[0].example).toBe('user@example.com');
  });

  it('returns warning for unusual values', () => {
    const validator = createTestValidator();
    const result = validator.validateField('age', 105, {} as TestContext);

    expect(result.isValid).toBe(true); // Warnings don't affect validity
    expect(result.warnings.length).toBe(1);
    expect(result.warnings[0].message).toBe('Age over 100 is unusual');
    expect(result.warnings[0].suggestion).toBe('Please verify this is correct');
  });

  it('returns both error and warning when applicable', () => {
    const validator = createTestValidator();
    const result = validator.validateField('age', 150, {} as TestContext);

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBe(1); // Out of range
    expect(result.warnings.length).toBe(1); // Unusual
  });
});

// =============================================================================
// validate Tests
// =============================================================================

describe('validate()', () => {
  it('validates all fields in data object', () => {
    const validator = createTestValidator();
    const result = validator.validate({
      name: 'John',
      email: 'john@example.com',
      age: 30,
    });

    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
    expect(result.warnings.length).toBe(0);
  });

  it('collects errors from multiple fields', () => {
    const validator = createTestValidator();
    const result = validator.validate({
      name: '',
      email: 'invalid',
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBe(2);
  });

  it('allows proceeding when only warnings exist', () => {
    const validator = createTestValidator();
    const result = validator.validate({
      name: 'John',
      age: 105, // Warning but not error
    });

    expect(result.isValid).toBe(true);
    expect(result.canProceed).toBe(true);
    expect(result.warnings.length).toBe(1);
  });
});

// =============================================================================
// validateForSubmit Tests
// =============================================================================

describe('validateForSubmit()', () => {
  it('behaves like validate by default', () => {
    const validator = createTestValidator();
    const result = validator.validateForSubmit({
      name: 'John',
      age: 105, // Warning
    });

    expect(result.isValid).toBe(true);
    expect(result.canProceed).toBe(true);
  });

  it('can block on warnings when configured', () => {
    const validator = createTieredValidator<TestContext>({
      rules: [
        {
          id: 'age_unusual',
          description: 'Age unusual',
          appliesTo: ['age'],
          severity: 'warning',
          check: (value) => typeof value !== 'number' || value <= 100,
          message: 'Age over 100',
        },
      ],
      warningsBlockSubmit: true,
    });

    const result = validator.validateForSubmit({ age: 105 });

    expect(result.isValid).toBe(true); // No errors
    expect(result.canProceed).toBe(false); // Warnings block
  });
});

// =============================================================================
// getRulesForField Tests
// =============================================================================

describe('getRulesForField()', () => {
  it('returns rules that apply to field', () => {
    const validator = createTestValidator();
    const rules = validator.getRulesForField('age');

    expect(rules.length).toBe(2); // age_range and age_unusual
    expect(rules.some((r) => r.id === 'age_range')).toBe(true);
    expect(rules.some((r) => r.id === 'age_unusual')).toBe(true);
  });

  it('returns empty array for field with no rules', () => {
    const validator = createTestValidator();
    const rules = validator.getRulesForField('unknownField');

    expect(rules.length).toBe(0);
  });
});

// =============================================================================
// addRule Tests
// =============================================================================

describe('addRule()', () => {
  it('adds new rule at runtime', () => {
    const validator = createTestValidator();

    validator.addRule({
      id: 'custom_rule',
      description: 'Custom rule',
      appliesTo: ['custom'],
      severity: 'error',
      check: () => false,
      message: 'Custom error',
    });

    const result = validator.validateField('custom', 'value', {} as TestContext);
    expect(result.errors.some((e) => e.ruleId === 'custom_rule')).toBe(true);
  });
});

// =============================================================================
// removeRule Tests
// =============================================================================

describe('removeRule()', () => {
  it('removes rule by ID', () => {
    const validator = createTestValidator();

    const removed = validator.removeRule('name_required');

    expect(removed).toBe(true);

    const result = validator.validateField('name', '', {} as TestContext);
    expect(result.isValid).toBe(true); // Rule no longer applied
  });

  it('returns false for non-existent rule', () => {
    const validator = createTestValidator();
    const removed = validator.removeRule('non_existent');

    expect(removed).toBe(false);
  });
});

// =============================================================================
// setRuleEnabled Tests
// =============================================================================

describe('setRuleEnabled()', () => {
  it('disables rule', () => {
    const validator = createTestValidator();

    validator.setRuleEnabled('name_required', false);

    const result = validator.validateField('name', '', {} as TestContext);
    expect(result.isValid).toBe(true);
  });

  it('re-enables rule', () => {
    const validator = createTestValidator();

    validator.setRuleEnabled('name_required', false);
    validator.setRuleEnabled('name_required', true);

    const result = validator.validateField('name', '', {} as TestContext);
    expect(result.isValid).toBe(false);
  });
});

// =============================================================================
// getRuleIds Tests
// =============================================================================

describe('getRuleIds()', () => {
  it('returns all rule IDs', () => {
    const validator = createTestValidator();
    const ids = validator.getRuleIds();

    expect(ids).toContain('name_required');
    expect(ids).toContain('email_format');
    expect(ids).toContain('age_range');
    expect(ids).toContain('age_unusual');
  });
});

// =============================================================================
// Rule Factory Tests
// =============================================================================

describe('requiredRule()', () => {
  it('creates required field rule', () => {
    const validator = createTieredValidator({
      rules: [requiredRule('name')],
    });

    const result = validator.validateField('name', '', {});
    expect(result.isValid).toBe(false);
  });

  it('accepts custom message', () => {
    const validator = createTieredValidator({
      rules: [requiredRule('name', 'Name cannot be empty')],
    });

    const result = validator.validateField('name', '', {});
    expect(result.errors[0].message).toBe('Name cannot be empty');
  });
});

describe('rangeRule()', () => {
  it('creates range validation rule', () => {
    const validator = createTieredValidator({
      rules: [rangeRule('score', 0, 100)],
    });

    expect(validator.validateField('score', 50, {}).isValid).toBe(true);
    expect(validator.validateField('score', 150, {}).isValid).toBe(false);
  });

  it('accepts severity option', () => {
    const validator = createTieredValidator({
      rules: [rangeRule('score', 0, 100, { severity: 'warning' })],
    });

    const result = validator.validateField('score', 150, {});
    expect(result.isValid).toBe(true);
    expect(result.warnings.length).toBe(1);
  });
});

describe('patternRule()', () => {
  it('creates pattern validation rule', () => {
    const validator = createTieredValidator({
      rules: [patternRule('phone', /^\d{3}-\d{3}-\d{4}$/)],
    });

    expect(validator.validateField('phone', '123-456-7890', {}).isValid).toBe(true);
    expect(validator.validateField('phone', 'invalid', {}).isValid).toBe(false);
  });
});

describe('customRule()', () => {
  it('creates custom validation rule', () => {
    const validator = createTieredValidator({
      rules: [
        customRule(
          'even_number',
          ['count'],
          (value) => typeof value === 'number' && value % 2 === 0,
          { severity: 'error', message: 'Must be even' }
        ),
      ],
    });

    expect(validator.validateField('count', 4, {}).isValid).toBe(true);
    expect(validator.validateField('count', 3, {}).isValid).toBe(false);
  });
});

describe('consistencyRule()', () => {
  it('validates cross-field consistency', () => {
    const validator = createTieredValidator<TestContext>({
      rules: [
        consistencyRule<TestContext>('date_order', {
          description: 'End date must be after start date',
          field1: 'startDate',
          field2: 'endDate',
          check: (start, end) => {
            if (!(start instanceof Date) || !(end instanceof Date)) return true;
            return start <= end;
          },
          message: 'End date must be after start date',
        }),
      ],
    });

    const validResult = validator.validate({
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
    });
    expect(validResult.isValid).toBe(true);

    const invalidResult = validator.validate({
      startDate: new Date('2024-12-31'),
      endDate: new Date('2024-01-01'),
    });
    expect(invalidResult.warnings.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// Conditional Rules Tests
// =============================================================================

describe('conditional rules', () => {
  it('only applies rule when condition is met', () => {
    const validator = createTieredValidator<TestContext>({
      rules: [
        {
          id: 'adult_email_required',
          description: 'Adults must provide email',
          appliesTo: ['email'],
          severity: 'error',
          check: (value) => value !== undefined && value !== '',
          message: 'Email required for adults',
          condition: (ctx) => (ctx.age ?? 0) >= 18,
        },
      ],
    });

    // Minor - rule doesn't apply
    const minorResult = validator.validate({ age: 10, email: '' });
    expect(minorResult.isValid).toBe(true);

    // Adult - rule applies
    const adultResult = validator.validate({ age: 25, email: '' });
    expect(adultResult.isValid).toBe(false);
  });
});

// =============================================================================
// allIssues Tests
// =============================================================================

describe('allIssues', () => {
  it('combines errors, warnings, and info', () => {
    const validator = createTieredValidator<TestContext>({
      rules: [
        {
          id: 'error_rule',
          description: 'Error',
          appliesTo: ['name'],
          severity: 'error',
          check: () => false,
          message: 'Error message',
        },
        {
          id: 'warning_rule',
          description: 'Warning',
          appliesTo: ['age'],
          severity: 'warning',
          check: () => false,
          message: 'Warning message',
        },
        {
          id: 'info_rule',
          description: 'Info',
          appliesTo: ['email'],
          severity: 'info',
          check: () => false,
          message: 'Info message',
        },
      ],
    });

    const result = validator.validate({ name: 'x', age: 1, email: 'x' });

    expect(result.allIssues.length).toBe(3);
    expect(result.errors.length).toBe(1);
    expect(result.warnings.length).toBe(1);
    expect(result.info.length).toBe(1);
  });
});
