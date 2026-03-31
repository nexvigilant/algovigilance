# Pathway Components Module

> **Path:** `src/components/pathway`  
> **Parent:** [`../README.md`](../README.md)  
> **Last Verified:** 2024-12-28  
> **Maintainer:** Clinical UX Architect

---

## Purpose

The Pathway Components module provides the user interface for guided clinical and regulatory workflows. It is designed to transform complex, multi-step pharmacovigilance tasks into an intuitive, low-friction experience for healthcare professionals. The module focuses on progressive disclosure, clinical language localization, and real-time validation feedback, ensuring that every case report meets regulatory standards before submission.

---

## Quick Reference

| Aspect | Details |
|--------|---------|
| **Domain** | Guided Workflow / Case Intake UI |
| **Status** | Stable / Core |
| **Dependencies** | `lib/pathway-navigator`, `lib/clinical-language`, `lucide-react` |
| **Outputs** | Step-by-Step Guided UI, Validation Alerts, Completion Summaries |

---

## File Manifest

| File | Type | Purpose | Status |
|------|------|---------|--------|
| `pathway-container.tsx`| Orchestrator | Main entry point that manages the Navigator instance and global UI state | Active |
| `pathway-step.tsx` | Unit | Combines step display, progress tracking, and validation for a single state | Active |
| `step-display.tsx` | UI | Renders the actual prompts, options, and input fields for a step | Active |
| `progress-bar.tsx` | UI | Visual indicator of workflow completion and current phase (e.g., Intake, Assessment) | Active |
| `option-button.tsx` | UI | Specialized buttons for multi-choice clinical decision points | Active |
| `index.ts` | Barrel | Central entry point for all pathway UI components | Active |

---

## Relationships & Data Flow

```
[HCP User] → [PathwayContainer] → [lib/pathway-navigator] → State Sync
                   ↓                       ↑
           [PathwayStep] ──→ [StepDisplay] ──→ [User Input]
                   ↓                       ↑
           [Validation Alert] ←── [lib/pathway-validation]
```

**Internal Dependencies:**
- `pathway-container.tsx` maintains the link to the `ClinicalPathwayNavigator` class.
- `pathway-step.tsx` handles the transition between active steps and the `PathwayComplete` success screen.

**External Dependencies:**
- Utilizes `lib/clinical-language` to ensure all UI text matches the user's specific healthcare domain.
- Aligned with **ICH E2B(R3)** standards for mandatory field highlighting.

---

## Usage Patterns

### Common Workflows

1. **Host a Guided Intake Session**
   - Provide the `user` (HCP) and `taskType` to `<PathwayContainer />`.
   - Result: A full-screen or modal experience that guides the user through the entire process.

2. **Render a Decision Point**
   - The container automatically handles states of type `question` by rendering `OptionButton` groups.
   - Result: Users can select paths (e.g., "Report Death") which triggers conditional branching.

### Entry Points

- **Primary:** `PathwayContainer` — The only component that should be imported by external pages.
- **Visuals:** `PhaseIndicator` — Useful for showing high-level workflow status outside the main container.

---

## Conventions & Standards

- **Low Cognitive Load:** Never show more than one primary question or form section at a time.
- **Guidance Tiers:** UI density should adjust based on the `guidanceLevel` computed from the user's profile.
- **Immediate Feedback:** Validation errors must be shown inline immediately after input, while warnings appear at the bottom of the step.

---

## Known Limitations

- [ ] Current layouts are optimized for desktop/tablet; mobile-specific refined view is planned for Q1 2026.
- [ ] Help content is currently rendered in a standard modal; contextual tooltips are a planned enhancement.

---

## Navigation

| Direction | Link |
|-----------|------|
| ⬆️ Parent | [`../README.md`](../README.md) |
| ⬅️ Navigator Lib | [`../../lib/pathway-navigator/README.md`](../../lib/pathway-navigator/README.md) |
| ➡️ Clinical Lang | [`../../lib/clinical-language/README.md`](../../lib/clinical-language/README.md) |

---

*Clinical Workflow UI. Verified by UX Lead on 2024-12-28.*
