# PRISMA Algorithm Suite

> **Path:** `src/lib/algorithms/prisma`  
> **Parent:** [`../README.md`](../README.md)  
> **Last Verified:** 2024-12-28  
> **Maintainer:** Regulatory Engineer / Algorithm Architect

---

## Purpose

The PRISMA module implements the **PRISMA 2020** (Preferred Reporting Items for Systematic Reviews and Meta-Analyses) framework. It provides a formal, finite-state machine pipeline for processing literature records through various phases of identification, screening, and eligibility assessment.

---

## Quick Reference

| Aspect | Details |
|--------|---------|
| **Domain** | Regulatory Compliance / Systematic Review |
| **Status** | Stable |
| **Dependencies** | Internal Algorithm types, Node.js Performance API |
| **Outputs** | Pipeline Statistics, ASCII Flow Diagrams, Compliance Reports |

---

## File Manifest

| File | Type | Purpose | Status |
|------|------|---------|--------|
| `pipeline.ts` | Algorithm | Core finite state machine for literature screening | Active |
| `screening.ts` | Logic | Criteria-based inclusion/exclusion and fingerprinting | Active |
| `compliance.ts` | Validator | Checks review reports against the PRISMA 2020 checklist | Active |
| `flow-diagram.ts`| Utility | Generates ASCII and JSON representations of the review flow | Active |
| `utils.ts` | Utility | Factory functions and consistency validators | Active |
| `types.ts` | Type | Domain-specific interfaces (Phases, Records, Results) | Active |
| `index.ts` | Barrel | Central entry point for the PRISMA suite | Active |

---

## Relationships & Data Flow

```
[LiteratureRecords[]] → [pipeline.ts] → [flow-diagram.ts] → PRISMA 2020 Flow Diagram
                             ↓
                      [screening.ts] → [compliance.ts] → Compliance Grade
```

**Internal Dependencies:**
- `pipeline.ts` transitions records through states defined in `types.ts`.
- `flow-diagram.ts` aggregates data from the `PipelineResult` to produce visual maps.

**External Dependencies:**
- Follows the official **PRISMA 2020 Statement** guidelines.

---

## Usage Patterns

### Common Workflows

1. **Execute Screening Pipeline**
   - Provide an array of `LiteratureRecord` and a `ScreeningConfig`.
   - Call `processScreeningPipeline(records, config)`.
   - Expected output: `PipelineResult` containing included studies and flow statistics.

2. **Generate Flow Diagram**
   - Take the `flowDiagram` data from a `PipelineResult`.
   - Call `generateFlowDiagramText(diagram)`.
   - Expected output: A regulatory-grade ASCII flow chart for reports.

### Entry Points

- **Primary:** `processScreeningPipeline` — The main engine for literature review.
- **Validation:** `validatePRISMACompliance` — Checks if a final report meets all PRISMA items.

---

## Conventions & Standards

- **State Immutability:** Records must not skip phases (e.g., Identified → Included) without passing through intermediate validation.
- **Fingerprinting:** Deduplication uses MD5-style fingerprints of titles and DOIs to ensure unique record counting.
- **Exclusion Reasons:** Every record in the `EXCLUDED` state must provide a valid `exclusionReason`.

---

## Known Limitations

- [ ] Automation-assisted screening (Phase 2) is currently rule-based; integration with Genkit LLM is planned.
- [ ] Diagram generation is limited to standard 1-to-1 flows (Identification → Inclusion).

---

## Navigation

| Direction | Link |
|-----------|------|
| ⬆️ Parent | [`../README.md`](../README.md) |
| ➡️ Deep Research | [`../../deep-research/README.md`](../../deep-research/README.md) |

---

*Regulatory Logic Kernel. Verified by Regulatory Lead on 2024-12-28.*
