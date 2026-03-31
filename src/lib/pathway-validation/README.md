# Pathway Validation Module

> **Path:** `src/lib/pathway-validation`  
> **Parent:** [`../README.md`](../README.md)  
> **Last Verified:** 2024-12-28  
> **Maintainer:** Clinical Safety Lead / Regulatory Architect

---

## Purpose

The Pathway Validation module provides the clinical and regulatory rules engine for the NexVigilant platform. It ensures that data collected during guided workflows (e.g., case intake) is not only structurally valid but also clinically plausible and compliant with ICH E2B(R3) standards. It handles complex logic such as dose-range verification, temporal consistency (onset after start), and cross-field agreement (e.g., pregnancy status vs. sex).

---

## Quick Reference

| Aspect | Details |
|--------|---------|
| **Domain** | Data Integrity / Clinical Safety |
| **Status** | Stable / Core |
| **Dependencies** | `types/clinical-pathways`, `date-fns` |
| **Outputs** | Validation Errors, Clinical Warnings, Regulatory Compliance Reports |

---

## File Manifest

| File | Type | Purpose | Status |
|------|------|---------|--------|
| `clinical-rules.ts` | Rules | Library of rules for clinical plausibility and consistency | Active |
| `index.ts` | Service | Main validation engine implementing the `ValidationEngine` interface | Active |

---

## Relationships & Data Flow

```
[User Input] → [index.ts] → [Format Checkers] → Errors
                   ↓
           [clinical-rules.ts] → [Clinical Context] → Warnings
                   ↓
           [Regulatory Map] → ICH E2B Requirements → Critical Errors
```

**Internal Dependencies:**
- `index.ts` coordinates the execution of rules defined in `clinical-rules.ts`.
- Utilizes `PathwayContext` to perform cross-field validations (e.g., comparing `onset_date` to `drug_start_date`).

**External Dependencies:**
- Consumed by `PathwayNavigator` in `lib/pathway-navigator` to block or warn users during workflows.

---

## Usage Patterns

### Common Workflows

1. **Validate Atomic Input**
   - Call `validationEngine.validateInput(userInput, state, context)`.
   - Result: Returns `ValidationResult` with immediate errors (blocking) and warnings (advisory).

2. **Validate Full Case for Submission**
   - Call `validationEngine.validateSubmission(context)`.
   - Result: Checks for ICH E2B minimum case requirements (Patient, Drug, Reaction, Reporter).

### Entry Points

- **Primary:** `validationEngine` — The main interface for all validation tasks.
- **Rules:** `runClinicalRules` — Direct access to the clinical plausibility logic.

---

## Conventions & Standards

- **Error vs. Warning:** 
  - **Errors** are for structural/regulatory failures (e.g., missing initials) and block progression.
  - **Warnings** are for clinical outliers (e.g., unusual dose) and allow progression but require verification.
- **Context Awareness:** Rules should check the `context.caseData` to ensure multi-field consistency.
- **Regulation Mapping:** Every regulatory error should include a `regulation` string (e.g., "ICH E2B(R3)").

---

## Known Limitations

- [ ] Dose ranges in `clinical-rules.ts` are currently a static demo set; requires integration with a comprehensive drug database.
- [ ] Temporal rules assume a single drug-event pair; needs expansion for multi-drug scenarios.

---

## Navigation

| Direction | Link |
|-----------|------|
| ⬆️ Parent | [`../README.md`](../README.md) |
| ➡️ Navigator | [`../pathway-navigator/README.md`](../pathway-navigator/README.md) |
| ⬅️ PV Module | [`../pv/README.md`](../pv/README.md) |

---

*Clinical Integrity Engine. Verified by Safety Architect on 2024-12-28.*
