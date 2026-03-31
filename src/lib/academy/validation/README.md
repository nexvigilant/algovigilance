# Academy Validation Utilities

> **Status: NOT IN USE** - These utilities were migrated from `infrastructure/validation/` and should be explored and compared to the current workflow before integration.

## Files

### health-check.ts
Infrastructure health checker that validates:
- Directory structure
- Required files existence
- TypeScript compilation
- Import/export consistency

### pattern-linter.ts
Anti-pattern detector that checks for:
- Direct console.log usage (should use logger)
- Hardcoded API keys
- Missing error boundaries
- Improper async/await patterns

## Current Workflow Comparison

Before using these utilities, compare them with:
1. `src/__tests__/frameworks/capability-validation.ts` - Capability validation framework
2. `scripts/diagnostics/validate-course.ts` - Course validation script
3. ESLint rules in `eslint.config.mjs`

## Integration Considerations

- [ ] Review overlap with existing validation
- [ ] Determine if health-check.ts adds value beyond existing checks
- [ ] Consider merging pattern-linter.ts rules into ESLint config
- [ ] Update npm scripts if integrating

## Original Location
Migrated from `infrastructure/validation/` on 2025-11-29.
