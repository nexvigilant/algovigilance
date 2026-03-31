# Course Validation System

> **Status: AVAILABLE** - Refactored on 2024-12-03 to use `src/types/academy.ts`. Available as CLI tool.

## Overview

Comprehensive validation system for academy courses including:
- Structure validation (modules, lessons, ordering)
- Content validation (HTML quality, placeholders, objectives)
- Assessment validation (quiz questions, scoring, explanations)
- Accessibility validation (alt text, heading hierarchy, color contrast)
- Component validation (auto-detecting components)

## Files

| File | Purpose |
|------|---------|
| `validate-course.ts` | Main validation orchestrator |
| `format-report.ts` | Report formatting utilities |
| `types.ts` | Local type definitions (needs migration to academy.ts) |
| `COURSES.md` | Course structure documentation |

### Validators (`validators/`)

| Validator | Purpose |
|-----------|---------|
| `structure.ts` | Course/module/lesson structure |
| `content.ts` | HTML content quality |
| `assessment.ts` | Quiz and assessment validation |
| `accessibility.ts` | WCAG compliance checks |
| `components.ts` | Auto-detecting component validation |
| `health-check.ts` | Overall health status |
| `pattern-linter.ts` | Anti-pattern detection |

### Tests (`__tests__/`)

- `validate-course.test.ts` - Main validation tests
- `validators.test.ts` - Individual validator tests

## Current Workflow Comparison

Before integration, compare with:
1. `scripts/diagnostics/validate-course.ts` - Current course validation script
2. `src/__tests__/frameworks/capability-validation.ts` - Capability validation
3. `src/__tests__/frameworks/mock-course-generators.ts` - Test data generators

## Integration Status

- [x] Migrate `types.ts` to use `src/types/academy.ts` (completed 2024-12-03)
- [x] Update imports throughout validators (completed 2024-12-03)
- [x] npm scripts available: `validate:course`, `validate:course:file`, `validate:course:json`, `validate:course:strict`
- [ ] Optional: Add UI integration in Admin dashboard
- [ ] Optional: Move tests to `src/__tests__/`

## Original Location
Migrated from `infrastructure/course-validation/` on 2025-11-29.
