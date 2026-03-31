# Pathway Navigator Module

> **Path:** `src/lib/pathway-navigator`  
> **Parent:** [`../README.md`](../README.md)  
> **Last Verified:** 2024-12-28  
> **Maintainer:** Clinical UX Engineer / Workflow Architect

---

## Purpose

The Pathway Navigator module is the core orchestration engine for guided pharmacovigilance (PV) workflows. It implements a sophisticated finite state machine that guides healthcare professionals through complex regulatory tasks (e.g., ICSR intake, causality assessment) using progressive disclosure and clinical-grade language transformation.

---

## Quick Reference

| Aspect | Details |
|--------|---------|
| **Domain** | Workflow Orchestration / Guided UI |
| **Status** | Stable / Core |
| **Dependencies** | `lib/clinical-language`, `data/pathways`, `firebase/firestore` |
| **Outputs** | Step Displays, Validation Results, Audit Trails, Submission Payloads |

---

## File Manifest

| File | Type | Purpose | Status |
|------|------|---------|--------|
| `navigator.ts` | Algorithm | Main state machine and logic for workflow progression | Active |
| `index.ts` | Barrel | Central entry point for creating and resuming navigators | Active |

---

## Relationships & Data Flow

```
[HCP User] → [PathwayNavigator] → [clinical-language] → [UI Step]
                   ↓                       ↑
           [PathwayRegistry]       [ValidationEngine]
                   ↓                       ↓
           [Submission Data] ←───── [Audit Trail]
```

**Internal Dependencies:**
- `navigator.ts` pulls static pathway definitions from `data/pathways`.
- Relies on `lib/clinical-language` to localize prompts before they reach the UI.

**External Dependencies:**
- Aligned with **ALCOA+** principles by maintaining a complete `AuditEntry` log for every transition.

---

## Usage Patterns

### Common Workflows

1. **Initiate Guided Workflow**
   - Call `createNavigator(user, taskType)`.
   - Result: Initializes context and retrieves the first step display.

2. **Process User Input**
   - Call `navigator.processInput(userInput)`.
   - Result: Performs validation → records audit entry → determines next state → returns next step display.

3. **Complete Submission**
   - When `isComplete()` is true, call `navigator.complete()`.
   - Result: Compiles final JSON payload with full audit metadata.

### Entry Points

- **Primary:** `ClinicalPathwayNavigator` class — Encapsulates all session state.
- **Factory:** `createNavigator` — Simplified initialization with standard dependencies.

---

## Conventions & Standards

- **Auditability:** Every user action (back navigation, help access, input) must generate an `AuditEntry`.
- **Stateless UI:** The navigator should hold the state; the UI components should simply render the `StepDisplay` returned by the navigator.
- **Context Preservation:** All case data collected during the session is stored in the `PathwayContext`.

---

## Known Limitations

- [ ] Session resumption (`resumeNavigator`) is currently a stub; requires Firestore persistence implementation.
- [ ] Condition evaluation for branch logic is currently limited to basic property matching.

---

## Navigation

| Direction | Link |
|-----------|------|
| ⬆️ Parent | [`../README.md`](../README.md) |
| ➡️ Clinical Lang | [`../clinical-language/README.md`](../clinical-language/README.md) |
| ⬇️ Types | [`../../types/clinical-pathways.ts`](../../types/clinical-pathways.ts) |

---

*Workflow Orchestration Core. Verified by UX Lead on 2024-12-28.*
