# Clinical Language Module

> **Path:** `src/lib/clinical-language`  
> **Parent:** [`../README.md`](../README.md)  
> **Last Verified:** 2024-12-28  
> **Maintainer:** Clinical Informatics Lead

---

## Purpose

The Clinical Language module serves as the linguistic bridge between rigid regulatory/PV terminology and the everyday clinical language used by healthcare professionals (HCPs). It enables the platform to dynamically re-skin complex concepts (e.g., "Causality Assessment" → "Likelihood the drug caused this") based on the user's specific domain (Pharmacist, Nurse, Physician), improving engagement and reducing cognitive load for transitioning professionals.

---

## Quick Reference

| Aspect | Details |
|--------|---------|
| **Domain** | Clinical Informatics / UX Reskinning |
| **Status** | Stable / Active |
| **Dependencies** | `@/types/clinical-pathways` |
| **Outputs** | Translated Terms, Clinical Analogies, Transformed Prompts |

---

## File Manifest

| File | Type | Purpose | Status |
|------|------|---------|--------|
| `translations.ts` | Data | Mapping of PV terms to domain-specific clinical equivalents | Active |
| `analogies.ts` | Data | Conceptual analogies connecting PV workflows to daily clinical tasks | Active |
| `index.ts` | Service | Main logic for term replacement, analogy retrieval, and text transformation | Active |

---

## Relationships & Data Flow

```
[PV Content] → [index.ts] → [translations.ts] → [Clinical Output]
      ↑             ↓             ↑
[User Domain] → [Logic Engine] → [analogies.ts]
```

**Internal Dependencies:**
- `index.ts` utilizes `translations.ts` for regex-based text transformation.
- `analogies.ts` provides the narrative content for state-level explanations in the pathway system.

**External Dependencies:**
- Consumed by `components/pathway` and `hooks/use-clinical-language` to localize the UI.

---

## Usage Patterns

### Common Workflows

1. **Translate a PV Term**
   - Call `translateTerm('adverse event', 'pharmacist')`.
   - Result: `"unwanted drug reaction"`.

2. **Transform a System Prompt**
   - Call `transformToClinicaLanguage(text, domain)`.
   - Result: A complete sentence where all identified PV terms are replaced with clinical equivalents.

3. **Retrieve a Process Analogy**
   - Call `getClinicalAnalogy('case_triage', 'nurse')`.
   - Result: `"Like triaging a patient in the ED - quickly determining priority and next steps."`.

### Entry Points

- **Primary:** `clinicalLanguageService` — Singleton instance for all transformation logic.
- **Convenience:** `translateTerm`, `getClinicalAnalogy`, `transformToClinicaLanguage`.

---

## Conventions & Standards

- **Longest Match First:** Prompt transformation sorts terms by length descending to prevent partial replacements (e.g., "adverse drug reaction" before "adverse event").
- **Case Sensitivity:** Matching is case-insensitive, but original casing is preserved where possible via regex boundaries.
- **Default Fallbacks:** Every entry must provide a `default` translation for generic or unmapped domains.

---

## Known Limitations

- [ ] Regex-based replacement is literal; does not handle complex grammar shifts (e.g., pluralization of translated terms).
- [ ] Currently limited to English language clinical variations.

---

## Navigation

| Direction | Link |
|-----------|------|
| ⬆️ Parent | [`../README.md`](../README.md) |
| ➡️ PV Module | [`../pv/README.md`](../pv/README.md) |
| ⬇️ Types | [`../../types/clinical-pathways.ts`](../../types/clinical-pathways.ts) |

---

*Linguistic Reskinning Engine. Verified by Clinical Lead on 2024-12-28.*
