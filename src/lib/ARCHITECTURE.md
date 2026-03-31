# /lib Directory Architecture

## Audit Summary

| Metric | Value |
|--------|-------|
| **Total Files** | 191 TypeScript files |
| **Total Lines** | ~55,000 LOC (excluding tests) |
| **Test Files** | 35 test files |
| **Barrel Files** | 14 index.ts files |
| **Empty Directories** | 3 (assessments/, pathways/, quality/) |

### Issue Classification

| Priority | Count | Type |
|----------|-------|------|
| **P0 (Critical)** | 2 | Duplicate files requiring resolution |
| **P1 (High)** | 5 | Unused files, empty directories |
| **P2 (Medium)** | 8 | Missing barrel files, large files needing split |
| **P3 (Low)** | 3 | Documentation gaps, naming inconsistencies |

---

## Critical Issues (P0)

### 1. Duplicate PDF Generator Files

**Location:** Root vs `pdf/` directory
- `certificate-pdf-generator.ts` (root) - **OUTDATED**
- `pdf/certificate-pdf-generator.ts` - **CURRENT** (has underscore prefixes for unused vars)

**Recommendation:** Delete root `certificate-pdf-generator.ts`, it's unused (0 imports).

### 2. Duplicate PDF Export Files

**Location:**
- `pdf-export.ts` (root) - 2 imports
- `pdf/pdf-export.ts` - Different version

**Recommendation:** Consolidate into `pdf/` directory, update imports.

---

## High Priority Issues (P1)

### 1. Unused Root Files (0 imports)

| File | Last Use | Recommendation |
|------|----------|----------------|
| `certificate-pdf-generator.ts` | Superseded | DELETE - duplicate of pdf/ |
| `intelligence-firestore.ts` | Deprecated | REVIEW - may be dead code |
| `placeholder-images.ts` | Unknown | REVIEW - check if used elsewhere |
| `sheets-formatter.ts` | Unknown | REVIEW - check scripts/ usage |

### 2. Empty Directories

```
assessments/  → DELETE (0 files)
pathways/     → DELETE (0 files)
quality/      → DELETE (0 files)
```

### 3. Missing Main Barrel File

No `lib/index.ts` exists. Consider creating one for frequently-used exports.

---

## Medium Priority Issues (P2)

### 1. Missing Barrel Files

These directories need `index.ts` for clean exports:

| Directory | Files | Priority |
|-----------|-------|----------|
| `actions/` | 5 files | High - frequently imported |
| `ai/` | Multiple subdirs | High - 41 imports |
| `schemas/` | 4 files | High - 29 imports |
| `config/` | 3 files | Medium - 9 imports |
| `security/` | 2 files | Low |
| `constants/` | 1 file | Low |
| `internal/` | 1 file | Low |

### 2. Large Files (>300 lines) - Candidates for Splitting

| File | Lines | Recommendation |
|------|-------|----------------|
| `algorithms/prisma-systematic-review.ts` | 1,328 | Split into sub-modules |
| `email.ts` | 1,295 | Split: templates, sending, config |
| `algorithms/research-validator.ts` | 1,083 | Already has v2 - consider migration |
| `algorithms/cmer-v2-extensions.ts` | 933 | Acceptable - domain complexity |
| `ai/flows/generate-alo-content.ts` | 876 | Split: prompts, generation, validation |
| `pathway-navigator/navigator.ts` | 819 | Split: navigation, rendering |
| `rate-limit.ts` | 754 | Acceptable - comprehensive module |
| `content-validation.ts` | 773 | Move to academy/validation/ |

### 3. React Component in lib/

`security-hardening.tsx` - React component that should be in `/components/shared/`

---

## Low Priority Issues (P3)

### 1. Inconsistent Naming

| Current | Recommended |
|---------|-------------|
| `firebase.ts` vs `firebase-admin.ts` | Clear, keep as-is |
| `rate-limit.ts` vs `concurrency/rate-limiter.ts` | Different purposes, document |

### 2. Documentation Gaps

- Missing JSDoc on several utility functions
- No README in most subdirectories

### 3. Test File Placement

Some tests in `__tests__/` at root, others in module subdirectories. Standardize to co-located pattern.

---

## Module Dependency Map

### Core Utilities (Most Imported)

```
logger           → 358 imports (core dependency)
utils            → 167 imports (core dependency)
firebase-admin   → 138 imports (server-side)
firebase         →  31 imports (client-side)
```

### Business Logic Modules

```
ai/              →  41 imports (AI flows)
email            →  38 imports (email sending)
admin-auth       →  37 imports (auth utilities)
schemas          →  29 imports (Zod schemas)
rate-limit       →  25 imports (rate limiting)
actions          →  21 imports (server actions)
deep-research    →  15 imports (research agent)
```

### Domain-Specific Modules

```
academy          →   8 imports (LMS utilities)
algorithms       →   9 imports (research validation)
pv               →   3 imports (pharmacovigilance)
documents        →   4 imports (PDF generation)
```

---

## Recommended Directory Structure

```
/lib
├── index.ts                    # NEW: Main barrel file
│
├── /core                       # NEW: Consolidate core utilities
│   ├── logger.ts              # Move from root
│   ├── utils.ts               # Move from root
│   ├── errors.ts              # Consolidate error utilities
│   └── index.ts
│
├── /firebase                   # NEW: Firebase consolidation
│   ├── client.ts              # Rename from firebase.ts
│   ├── admin.ts               # Rename from firebase-admin.ts
│   ├── utils.ts               # Move firestore-utils.ts
│   └── index.ts
│
├── /auth                       # NEW: Auth consolidation
│   ├── admin-auth.ts          # Move from root
│   ├── cron-auth.ts           # Move from root
│   ├── errors.ts              # Move auth-errors.ts
│   └── index.ts
│
├── /schemas                    # EXISTS: Add barrel
│   ├── affiliate.ts
│   ├── contact.ts
│   ├── firestore.ts
│   ├── waitlist.ts
│   └── index.ts               # NEW
│
├── /actions                    # EXISTS: Add barrel
│   └── index.ts               # NEW
│
├── /ai                         # EXISTS: Add barrel
│   ├── /flows                 # EXISTS
│   ├── genkit.ts
│   └── index.ts               # NEW
│
├── /academy                    # EXISTS: Well-structured
├── /algorithms                 # EXISTS: Well-structured
├── /deep-research              # EXISTS: Well-structured
├── /documents                  # EXISTS: Well-structured
├── /pv                         # EXISTS: Well-structured
├── /concurrency                # EXISTS: Well-structured
├── /clinical-language          # EXISTS: Well-structured
├── /federated-signal           # EXISTS: Well-structured
├── /manufacturing              # EXISTS: Well-structured
├── /pathway-navigator          # EXISTS: Well-structured
├── /pathway-validation         # EXISTS: Well-structured
│
├── /pdf                        # EXISTS: Keep, consolidate root files
│   └── index.ts               # UPDATE: Remove root duplicates
│
├── /config                     # EXISTS: Add barrel
│   └── index.ts               # NEW
│
├── /security                   # EXISTS: Add barrel
│   └── index.ts               # NEW
│
└── /internal                   # EXISTS: Single file, consider inlining
```

---

## Migration Checklist

### Phase 1: Cleanup (Safe Deletions) ✅ COMPLETED

- [x] Delete `assessments/` (empty)
- [x] Delete `pathways/` (empty)
- [x] Delete `quality/` (empty)
- [x] Delete root `certificate-pdf-generator.ts` (duplicate)
- [x] Review `intelligence-firestore.ts` → KEPT (used by intelligence.ts)
- [x] Delete `placeholder-images.ts` and `.json` (unused)
- [x] Delete `sheets-formatter.ts` (unused)

### Phase 2: Barrel Files ✅ COMPLETED

- [ ] Create `actions/index.ts` (skipped - server actions use direct imports)
- [x] Create `ai/index.ts`
- [x] Create `schemas/index.ts`
- [x] Create `config/index.ts`
- [x] Create `security/index.ts`

### Phase 3: Relocations ✅ COMPLETED

- [x] Move `security-hardening.tsx` → `components/shared/security/`
- [x] Consolidate root `pdf-export.ts` → `pdf/` (updated 2 imports)
- [ ] Move `content-validation.ts` → `academy/validation/` (deferred - complex dependencies)

### Phase 4: Refactoring (Large Files)

- [ ] Split `email.ts` into sub-modules
- [ ] Split `ai/flows/generate-alo-content.ts`
- [ ] Consider splitting `algorithms/prisma-systematic-review.ts`

---

## Import Patterns

### Preferred

```typescript
// Named exports from barrels
import { logger, utils } from '@/lib/core';
import { adminDb, adminTimestamp } from '@/lib/firebase';
import { RateLimiter, pLimit } from '@/lib/concurrency';

// Direct module imports for less common utilities
import { detectSignal } from '@/lib/pv/signal-detection';
```

### Avoid

```typescript
// Deep imports when barrel exists
import { logger } from '@/lib/core/logger'; // Use barrel instead

// export * (breaks tree-shaking)
export * from './module';
```

---

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `rate-limit.ts` |
| Directories | kebab-case | `deep-research/` |
| Exports | camelCase (functions), PascalCase (classes/types) | `logger`, `RateLimiter` |
| Test files | `*.test.ts` | `rate-limit.test.ts` |

---

## Maintenance Guidelines

1. **New utilities** → Add to appropriate subdirectory with barrel export
2. **New domains** → Create subdirectory with `index.ts`, types.ts, and tests
3. **Large files** → Split when exceeding 500 lines
4. **Cross-module dependencies** → Document in this file
5. **Breaking changes** → Update all import paths before merging

---

## Changelog

### 2024-12-24 - Initial Audit & Optimization

**Audit Performed:**
- Mapped 191 TypeScript files (~55K LOC)
- Identified 14 existing barrel files
- Analyzed import patterns across codebase
- Classified issues by priority (P0-P3)

**P0 Issues Resolved:**
- Deleted duplicate `certificate-pdf-generator.ts` at root (superseded by `pdf/` version)
- Consolidated root `pdf-export.ts` into `pdf/` directory (updated 2 imports)

**P1 Issues Resolved:**
- Deleted empty directories: `assessments/`, `pathways/`, `quality/`
- Deleted unused `placeholder-images.ts` and `placeholder-images.json`
- Deleted unused `sheets-formatter.ts`

**P2 Issues Resolved:**
- Moved `security-hardening.tsx` → `components/shared/security/` (updated layout.tsx import)

**Barrel Files Created:**
- `ai/index.ts` - Centralized AI flows and Genkit exports
- `schemas/index.ts` - Zod validation schemas
- `config/index.ts` - Content configuration modules
- `security/index.ts` - Security utilities
- `components/shared/security/index.ts` - SecurityHardening component

**Files Reviewed & Kept:**
- `intelligence-firestore.ts` - Used by `intelligence.ts` for hybrid CMS (file + Firestore)

**Remaining Work (Future Consideration):**
- Consider splitting large files (email.ts: 1,295 lines, prisma-systematic-review.ts: 1,328 lines)
