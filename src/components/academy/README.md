# Academy Components Module

> **Path:** `src/components/academy`  
> **Parent:** [`../README.md`](../README.md)  
> **Last Verified:** 2024-12-28  
> **Maintainer:** LMS Frontend Lead / Education UX Designer

---

## Purpose

The Academy Components module provides the user interface for the NexVigilant LMS. It focuses on rendering interactive **Active Learning Objects (ALOs)** and providing learners with detailed analytics regarding their memory stability and mastery. It handles the transition from static content to immersive practice through specialized "Activity Engines."

---

## Quick Reference

| Aspect | Details |
|--------|---------|
| **Domain** | Learning Experience (LX) / EdTech |
| **Status** | Stable / Active |
| **Dependencies** | `lucide-react`, `recharts`, `lib/academy` |
| **Outputs** | ALO Renderers, Activity Engines, FSRS Analytics Dashboards |

---

## File Manifest

| File | Type | Purpose | Status |
|------|------|---------|--------|
| `alo-renderer.tsx` | Orchestrator | Core multi-step renderer for Hook, Concept, Activity, and Reflection | Active |
| `fsrs-analytics.tsx`| Dashboard | Visual representation of memory stability, retention, and streaks | Active |
| `ksb-viewer.tsx` | Unit | Interactive browser for the 1,286 KSB taxonomy | Active |
| `pathway-dag.tsx` | Unit | Visual Directed Acyclic Graph (DAG) for curriculum navigation | Active |
| `fsrs-review-session.tsx`| Unit | Specialized UI for FSRS spaced-repetition flashcard sessions | Active |
| `celebration-effects.tsx`| FX | High-impact visual feedback for milestone completion | Active |
| `index.ts` | Barrel | Central entry point for all academy UI components | Active |

### Subdirectories

| Directory | Purpose | Has README |
|-----------|---------|------------|
| `/activity-engines/` | Specialized practice interfaces (Triage, Red Pen, Calculator) | ❌ |

---

## Relationships & Data Flow

```
[ALO JSON] → [alo-renderer.tsx] → [activity-engines/*] → Score Event
                    ↓                     ↑
            [Section Progress] → [lib/academy/unified-progress]
```

**Internal Dependencies:**
- `alo-renderer.tsx` serves as the parent container for all engines in `/activity-engines/`.
- `fsrs-analytics.tsx` consumes metrics from the `fsrs/` algorithms in `lib/academy`.

**External Dependencies:**
- Aligned with **Recharts** for the retention trend and mastery charts.
- Integrates with **Lucide-react** for standardized clinical iconography.

---

## Usage Patterns

### Common Workflows

1. **Launch a Practice Activity**
   - Provide an `ALO` object to `<ALORenderer alo={...} />`.
   - Result: A 4-step guided experience that automatically captures time-on-task and scores.

2. **Display Learner Mastery**
   - Call `<DomainMasteryGrid userId={...} />`.
   - Result: A heat-map visualization of KSB coverage and memory stability.

### Entry Points

- **Primary:** `ALORenderer` — The main interface for lesson delivery.
- **Engagement:** `DueCardsIndicator` — Displays the current FSRS workload (unseen/review counts).

---

## Conventions & Standards

- **Progressive Disclosure:** Lessons must follow the standard 4-phase architecture (Hook → Concept → Activity → Reflection).
- **Engine Consistency:** All activity engines must implement an `onComplete` callback that returns a standardized `ALOActivityResult`.
- **Performance:** Complex SVG graphs (DAGs) must be memoized and responsive to container resize events.

---

## Known Limitations

- [ ] `CodePlaygroundEngine` requires external script loading (LiveCodes) which may be blocked by strict CSPs.
- [ ] Streak calendar currently assumes user's local browser time for day boundaries.

---

## Navigation

| Direction | Link |
|-----------|------|
| ⬆️ Parent | [`../README.md`](../README.md) |
| ➡️ Activity Engines | [`./activity-engines/README.md`](./activity-engines/README.md) |
| ⬅️ Core Lib | [`../../lib/academy/README.md`](../../lib/academy/README.md) |

---

*Learning Experience Infrastructure. Verified by LX Lead on 2024-12-28.*
