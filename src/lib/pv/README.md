# Pharmacovigilance (PV) Module

> **Path:** `src/lib/pv`  
> **Parent:** [`../README.md`](../README.md)  
> **Last Verified:** 2024-12-28  
> **Maintainer:** PV Domain Expert / Lead Safety Engineer

---

## Purpose

The PV module provides the domain-specific logic and regulatory standards for the NexVigilant platform. It implements industry-standard algorithms for signal detection, causality assessment, seriousness classification, and MedDRA terminology navigation, ensuring all safety data processing aligns with ICH E2B(R3) and global regulatory requirements.

---

## Quick Reference

| Aspect | Details |
|--------|---------|
| **Domain** | Pharmacovigilance / Regulatory Science |
| **Status** | Stable / Core |
| **Dependencies** | `MedDRA` (terminology), `ICH E2B` (standards) |
| **Outputs** | Signal Reports, Seriousness Grades, Causality Scores (Naranjo) |

---

## File Manifest

| File | Type | Purpose | Status |
|------|------|---------|--------|
| `signal-detection.ts`| Algorithm | Disproportionality analysis (PRR, ROR, IC) | Active |
| `meddra.ts` | Navigator | Hierarchy management for SOC, HLGT, HLT, PT, LLT | Active |
| `causality.ts` | Algorithm | Naranjo and WHO-UMC causality assessment models | Active |
| `seriousness.ts` | Validator | Automated seriousness classification per regulatory criteria | Active |
| `e2b.ts` | Mapper | Data structures and mapping for ICH E2B(R3) XML reports | Active |
| `age-groups.ts` | Utility | Standardized age categorization (Pediatric/Geriatric) | Active |
| `domain.ts` | Logic | Domain-driven design (DDD) aggregates for safety reports | Active |
| `index.ts` | Barrel | Central entry point for the PV suite | Active |

### Subdirectories

| Directory | Purpose | Has README |
|-----------|---------|------------|
| `/__tests__/` | Unit tests for safety math and regulatory validators | ❌ |

---

## Relationships & Data Flow

```
[Raw Case Data] → [domain.ts] → [meddra.ts] → [seriousness.ts] → [e2b.ts]
                       ↓              ↓               ↓
               [causality.ts] → [signal-detection.ts] → [Safety Signal]
```

**Internal Dependencies:**
- `domain.ts` serves as the primary aggregate for safe report state.
- `meddra.ts` provides the terminology backbone for all reactions and indications.
- `signal-detection.ts` aggregates data from multiple reports to find statistical outliers.

**External Dependencies:**
- Aligned with **ICH E2B(R3)** electronic reporting standards.

---

## Usage Patterns

### Common Workflows

1. **Perform Signal Detection**
   - Provide a drug, event, and a 2x2 `ContingencyTable`.
   - Call `detectSignal(input)`.
   - Result: `SignalDetectionResult` with strength (Strong/Moderate/Weak) and interpretation.

2. **Assess Case Causality**
   - Provide answers to the 10 Naranjo questions.
   - Call `calculateNaranjoScore(answers)`.
   - Result: Interpreted causality category (Definite, Probable, Possible, Doubtful).

### Entry Points

- **Primary:** `src/lib/pv/index.ts` — Import any safety utility or algorithm.
- **Terminology:** `isValidMedDRACode` — Quick validation for 8-digit codes.

---

## Conventions & Standards

- **Zero-Tolerance for All-Zeros:** `validateContingencyTable` will reject tables where all cells are 0.
- **Conservative Thresholds:** Signal detection uses the Evans criteria (PRR ≥ 2.0, Chi² ≥ 4.0) by default to balance sensitivity.
- **MedDRA Integrity:** SOC and PT levels are mandatory for any regulatory-bound hierarchy.

---

## Known Limitations

- [ ] Signal detection is currently frequentist-heavy; expansion of Bayesian (IC) depth is planned.
- [ ] MedDRA navigation requires an external terminology load; local mock data is used for tests.

---

## Navigation

| Direction | Link |
|-----------|------|
| ⬆️ Parent | [`../README.md`](../README.md) |
| ➡️ Algorithms | [`../algorithms/README.md`](../algorithms/README.md) |
| ➡️ Federated | [`../federated-signal/README.md`](../federated-signal/README.md) |

---

*Domain Integrity Core. Verified by Safety Lead on 2024-12-28.*
