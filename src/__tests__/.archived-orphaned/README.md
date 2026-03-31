# Archived Orphaned Tests

These test files were archived on 2025-12-27 because they import from directories that no longer exist.

## Files

| File | Issue |
|------|-------|
| `pattern-singularity-tracker.test.ts` | Imports from `packages/pattern-singularity/` (never created) |
| `pv-patterns.test.ts` | Imports from `packages/pharma-utils/` (never created) |

## Context

These tests were written in anticipation of a monorepo structure with:
- `packages/pattern-singularity/` — Pattern evolution tracking
- `packages/pharma-utils/` — PV utility functions

The monorepo was planned but never implemented. The `workspaces` config in `package.json` referenced these directories but they were never created.

## To Restore

If implementing these packages in the future:

1. Create the package directories
2. Implement the required exports
3. Move these test files back to `src/__tests__/`
4. Update import paths if structure differs

## Why Archive Instead of Delete

The test logic captures intended behavior for:
- Pattern fitness tracking and evolution
- PV classification metrics
- Causality assessment
- Age group calculations

This logic may be valuable when implementing the actual packages.
