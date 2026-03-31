# Behavior Tracking Module

> **Path:** `src/hooks/behavior-tracking`  
> **Parent:** [`../README.md`](../README.md)  
> **Last Verified:** 2024-12-28  
> **Maintainer:** Cognitive UX Engineer

---

## Purpose

The Behavior Tracking module implements NexVigilant's "Cognitive Interaction Engine." It goes beyond simple click tracking to analyze the *quality* of user interactions—such as decision latency (hover-to-click ratios), learning velocity, and exploration patterns. These metrics are used to dynamically adjust UI effects (e.g., neural circuit intensity) and provide personalized learning recommendations.

---

## Quick Reference

| Aspect | Details |
|--------|---------|
| **Domain** | Cognitive Analytics / Adaptive UI |
| **Status** | Active / Experimental |
| **Dependencies** | `localStorage`, `Context API`, `TIMING constants` |
| **Outputs** | Behavior Scores (1-100), Interaction Heatmaps, Effect Drivers |

---

## File Manifest

| File | Type | Purpose | Status |
|------|------|---------|--------|
| `use-behavior-tracker.tsx`| Provider | Central store and provider for interaction metrics and computed scores | Active |
| `use-combined-effects.ts` | Hook | Aggregates multiple behavior signals into a unified effect payload | Active |
| `types.ts` | Type | Domain interfaces (Metrics, Scores, SessionData) | Active |
| `index.ts` | Barrel | Central entry point for all tracking algorithms | Active |

### Subdirectories

| Directory | Purpose | Has README |
|-----------|---------|------------|
| `/algorithms/` | Specialized hooks for specific behavior archetypes (e.g., Hesitance, Velocity) | ❌ |

---

## Relationships & Data Flow

```
[UI Interaction] → [useBehaviorTracker] → [Local Storage]
                         ↓
               [Algorithm Hooks] → [Cognitive Scores]
                         ↓
               [UI Effect Hooks] → [Dynamic CSS/Canvas FX]
```

**Internal Dependencies:**
- `use-behavior-tracker.tsx` maintains the raw event log (Navigation, Content, Decision).
- Hooks in `/algorithms/` consume raw metrics to compute high-level archetypes (e.g., `decisionStyle`).

**External Dependencies:**
- Persists state to `localStorage` using the `nexvigilant_behavior_metrics` key.

---

## Usage Patterns

### Common Workflows

1. **Track a Decision Point**
   - Wrap an interactive element with `onHoverStart` and `onHoverEnd` from `useDecisionMomentum`.
   - Result: Automatically computes if the user was "Quick," "Deliberate," or "Hesitant."

2. **Trigger Adaptive Effects**
   - Call `const { primaryColor, intensity } = useCombinedEffects()`.
   - Apply these values to a Background Canvas or SVG filter.
   - Result: The UI "resonates" based on the user's current interaction rhythm.

### Entry Points

- **Provider:** `BehaviorTrackerProvider` — Must wrap components that require tracking or adaptive effects.
- **Hook:** `useBehaviorTracker` — Direct access to raw metrics and current scores.

---

## Conventions & Standards

- **Low Privacy Impact:** No PII is tracked. Data is stored locally and used only for session-level adaptation.
- **Event Limits:** Array-based event logs (e.g., `navigationSequences`) are capped at 1,000 items to prevent `localStorage` bloat.
- **Thresholds:** Behavior archetypes are derived from 3+ samples to prevent noise from single "accidental" clicks.

---

## Known Limitations

- [ ] Current implementation is per-device only; cloud sync of cognitive profiles is planned for Q3 2026.
- [ ] `isTrackingEnabled` is currently hardcoded to `false` for debugging.

---

## Navigation

| Direction | Link |
|-----------|------|
| ⬆️ Parent | [`../README.md`](../README.md) |
| ➡️ Visuals | [`../../components/visualizations/README.md`](../../components/visualizations/README.md) |
| ⬅️ Core Lib | [`../../lib/logger.ts`](../../lib/logger.ts) |

---

*Cognitive Interaction Layer. Verified by UX Architect on 2024-12-28.*
