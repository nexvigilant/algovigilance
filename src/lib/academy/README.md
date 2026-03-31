# Academy Module

> **Path:** `src/lib/academy`  
> **Parent:** [`../`](../README.md)  
> **Last Verified:** 2024-12-28  
> **Maintainer:** LMS Lead / Education Architect

---

## Purpose

The Academy module is the technical foundation of the NexVigilant LMS. It manages the lifecycle of **Active Learning Objects (ALOs)**, tracks learner progress across the 1,286 KSB taxonomy, implements the **FSRS (Free Spaced Repetition Scheduler)** algorithm for optimal retention, and ensures content quality through automated validation suites.

---

## Quick Reference

| Aspect | Details |
|--------|---------|
| **Domain** | EdTech / Learning Management Systems |
| **Status** | Stable / Active |
| **Dependencies** | `firebase-admin`, `d3-dag` (visuals), `date-fns` |
| **Outputs** | Unified Progress Reports, Course Certificates, FSRS Schedules |

---

## File Manifest

| File | Type | Purpose | Status |
|------|------|---------|--------|
| `unified-progress.ts` | Service | Consolidates lesson/activity scores into a single learner document | Active |
| `fsrs/` | Algorithm | Free Spaced Repetition Scheduler for knowledge retention | Active |
| `ksb-to-dag.ts` | Utility | Transforms flat KSB lists into Directed Acyclic Graphs for UI | Active |
| `quiz-builder.ts` | Factory | Standardized generation of multiple-choice and triage quizzes | Active |
| `daily-activity.ts` | Tracker | Manages learner streaks and daily engagement metrics | Active |
| `certificate-generator.ts`| Utility | PDF generation for course and capability completion | Active |
| `index.ts` | Barrel | Central entry point for Academy logic | Active |

### Subdirectories

| Directory | Purpose | Has README |
|-----------|---------|------------|
| `/course-validation/` | Linter for ensuring courses meet pedagogical standards | ✅ |
| `/fsrs/` | Core mathematical model for memory stability/retrievability | ❌ |
| `/validation/` | Shared health checks and pattern linters | ✅ |

---

## Relationships & Data Flow

```
[ALO Content] → [quiz-builder.ts] → [Unified Progress] → [daily-activity.ts]
      ↑                                   ↓                     ↓
[KSB Taxonomy] → [ksb-to-dag.ts] → [Pathway DAGs]      [Milestones/Badges]
```

**Internal Dependencies:**
- `unified-progress.ts` is the primary write-target for all learning activities.
- `ksb-to-dag.ts` powers the visualization components in `components/pathway`.
- `fsrs/` updates are triggered after every activity completion.

**External Dependencies:**
- Integrates with **Firebase Firestore** for persistent progress and enrollment data.

---

## Usage Patterns

### Common Workflows

1. **Record Learning Progress**
   - After a lesson, call `recordLessonCompletion(userId, courseId, lessonId)`.
   - Result: Updates `overallProgress` and triggers `checkMilestone`.

2. **Generate Learning Path**
   - Fetch KSBs by level from `pdc-queries.ts`.
   - Pass to `convertKSBsToDAG(ksbsByLevel, ...)`.
   - Result: A visualizable `PathwayDAG` with locked/available states.

### Entry Points

- **Primary:** `src/lib/academy/index.ts` — Use for progress and streak tracking.
- **Validation:** `validateCourse(course)` — Pedagogical linter for course definitions.

---

## Conventions & Standards

- **Progress Immutability:** Never overwrite a high score with a lower one in `recordActivityScore`.
- **FSRS Calibration:** The scheduler assumes a 90% retention target by default.
- **DAG Consistency:** All nodes in a pathway DAG must be connected to either a prerequisite or a terminal checkpoint.

---

## Known Limitations

- [ ] PDF certificate generation is currently server-side only due to font-loading constraints.
- [ ] Streak tracking resets based on UTC; needs local-timezone awareness.

---

## Navigation

| Direction | Link |
|-----------|------|
| ⬆️ Parent | [`../README.md`](../README.md) |
| ➡️ Manufacturing | [`../manufacturing/README.md`](../manufacturing/README.md) |
| ⬇️ Validation | [`./course-validation/README.md`](./course-validation/README.md) |

---

*LMS Core Logic. Verified by Education Architect on 2024-12-28.*
