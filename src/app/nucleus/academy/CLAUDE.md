# CLAUDE.md — Academy Module

The Academy is the core learning engine of the Nucleus portal, delivering structured pharmacovigilance capability development through EPA pathways, KSB mapping, and spaced repetition.

## Benchmark Governance (INVARIANT)

This document describes the REALIZED state of this module — the standard we hold.

**The One Rule:** When reality diverges from what is stated here, improve reality. NEVER lower this document to match code.

## Pages

| Route | Purpose |
|-------|---------|
| `pathways/` | 21 EPA Pathway browser with progress tracking and filtering |
| `pathways/[epaId]/` | Individual EPA pathway detail with stage progression |
| `ksb/[ksbId]/` | Individual KSB detail with evidence collection |
| `build/[id]/` | Active pathway building — practice activities and assessments |
| `build/epa/[epaId]/` | EPA-specific build view |
| `preview/[id]/` | Pathway preview before enrollment |
| `gvp-modules/` | GVP module catalog |
| `gvp-curriculum/` | GVP curriculum overview |
| `gvp-assessments/` | GVP assessment engine |
| `gvp-progress/` | GVP learner progress dashboard |

## Redirects (intentional legacy routes)

| Route | Target | Reason |
|-------|--------|--------|
| `learn/` | `pathways/` | "Learn" deprecated per terminology policy |
| `courses/` | `pathways/` | Replaced by EPA pathway model |
| `certificates/` | `verifications/` | Renamed to "verifications" |
| `skills/` | `/nucleus/careers/skills` | Moved to Careers section |
| `capabilities/` | `/nucleus/careers/skills` | Moved to Careers section |
| `assessments/` | `/nucleus/careers/assessments` | Moved to Careers section |

## Client pages (thin wrappers with client components)

| Route | Client Component | Purpose |
|-------|-----------------|---------|
| `bookmarks/` | `BookmarksClient` | Saved lesson bookmarks |
| `progress/` | `ProgressClient` | Learning progress tracker |
| `verifications/` | `CertificatesClient` | Earned verification display |

## GVP pages (server components with dedicated sub-components)

| Route | Component | Purpose |
|-------|-----------|---------|
| `gvp-modules/` | `GvpModulesCatalog` | EMA GVP I-XVI module catalog |
| `gvp-curriculum/` | `GvpCurriculum` | Auto-generated GVP learning blueprint |
| `gvp-assessments/` | `GvpAssessments` | GVP scenario-based competency checks |
| `gvp-progress/` | `GvpProgress` | GVP track progress dashboard |

## Interactive Labs (Academy→Glass bridge, Move 0)

| Route | Lines | Station Domain |
|-------|-------|----------------|
| `interactive/signal-investigation/` | 987 | D08 PRR/ROR/IC/EBGM |
| `interactive/causality-assessment/` | 1051 | D02 Naranjo/WHO-UMC |
| `interactive/drug-comparison/` | 672 | D01 FAERS cross-drug |
| `interactive/benefit-risk/` | 755 | D10 B:R calculator |
| `interactive/sparse-coding/` | 28+356+1719 | Neural efficiency calculator (D08) |

Bridge mapping: `src/lib/academy/glass-bridge-mapping.ts` (15 domains → Station tools).
Tests: `src/lib/academy/__tests__/glass-bridge-mapping.test.ts` (41 tests).

## Product Benchmarks

| Domain | Benchmark |
|--------|-----------|
| **KSB Coverage** | All 1,286 KSBs across 15 domains are interactively accessible with progress tracking, gap analysis, and pathway recommendations. |
| **EPA Pathways** | 21 EPA pathways fully navigable with real-time progress indicators, prerequisite enforcement, and completion verification. |
| **FSRS Integration** | Spaced repetition scheduling drives all knowledge review. Retention rates exceed 85% at 30-day intervals. |
| **Pathway Completion** | Average pathway completion rate exceeds 60%. Drop-off analysis identifies and addresses friction points. |
| **Assessment Quality** | All assessments are Diamond v2 compliant with automated scoring, evidence-based grading, and verification certificates. |
| **Server Components** | All data fetching uses server components with Suspense boundaries. Zero client-side data fetching for initial page loads. |
| **Accessibility** | WCAG 2.1 AA on every academy page. Screen reader navigation through pathway trees works flawlessly. |

## Data Flow

- **Pathways**: `getEPAPathways()` server action → `PathwaysClient` client component
- **KSBs**: Firestore `/pv_domains/{id}/capability_components`
- **Enrollments**: Firestore `/enrollments/{id}` (owner-only access)
- **Progress**: Client-side hooks with optimistic updates

## Terminology

| Code | UI Label |
|------|----------|
| `CapabilityPathway` | Capability Pathway |
| `PracticeActivity` | Practice Activity |
| `CapabilityStage` | Capability Stage |
| `PathwayEnrollment` | Pathway Journey |

Action verbs: **Build** / **Practice** / **Develop** (never "Learn" or "Enroll").
