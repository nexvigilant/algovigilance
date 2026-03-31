# Federated Signal Module

> **Path:** `src/lib/federated-signal`  
> **Parent:** [`../`](../README.md)  
> **Last Verified:** 2024-12-28  
> **Maintainer:** Lead Data Scientist / Privacy Architect

---

## Purpose

The Federated Signal module implements NexVigilant's proprietary, privacy-preserving multi-organization signal detection system. It allows various organizations to collaborate on drug safety analysis by aggregating local statistics without ever exchanging raw Individual Case Safety Reports (ICSRs).

---

## Quick Reference

| Aspect | Details |
|--------|---------|
| **Domain** | Signal Intelligence / Mathematical Modeling |
| **Status** | Stable / Proprietary |
| **Dependencies** | `firebase-admin`, `@nexvigilant/types` |
| **Outputs** | PRR, ROR, IC, and EBGM signal detection results |

---

## File Manifest

| File | Type | Purpose | Status |
|------|------|---------|--------|
| `secure-aggregation.ts` | Service | Main orchestrator for sum-based secure aggregation | Active |
| `ebgm.ts` | Algorithm | DuMouchel's Gamma-Poisson Shrinker (EBGM) implementation | Active |
| `local-compute.ts` | Module | Per-organization statistics and noise addition (DP) | Active |
| `signal-utils.ts` | Utility | Classification and qualitative analysis of signal strength | Active |
| `demo.ts` | Script | Local simulation of a multi-org federated query | Active |
| `index.ts` | Barrel | Centralized exports for the federated suite | Active |

### Subdirectories

| Directory | Purpose | Has README |
|-----------|---------|------------|
| `/__tests__/` | Unit and integration tests for signal math | ❌ |

---

## Relationships & Data Flow

```
Org A (Local Stats + Noise) ──┐
Org B (Local Stats + Noise) ──┼─→ [Secure Aggregation Service] ─→ [Global Signal Results]
Org C (Local Stats + Noise) ──┘             ↓
                                      [EBGM Algorithm]
```

**Internal Dependencies:**
- `secure-aggregation.ts` coordinates results from `local-compute.ts` and applies `ebgm.ts`.
- `signal-utils.ts` provides consistent qualitative labels (e.g., "Very Strong") based on numeric scores.

**External Dependencies:**
- Relies on **Differential Privacy (DP)** mechanisms implemented in `local-compute.ts` using Laplace/Gaussian noise.

---

## Usage Patterns

### Common Workflows

1. **Initiate Federated Query**
   - Use `FederatedQueryBuilder` to define drug/event criteria.
   - Send query to participating organization nodes.

2. **Compute Global Signal**
   - Collect encrypted/noised contributions via `submitContribution`.
   - Call `computeResult(queryId)` to perform secure sum and calculate metrics.

### Entry Points

- **Primary:** `SecureAggregationService` — The central hub for result computation.
- **Algorithm:** `calculateEBGM` — Standalone implementation of the Gamma-Poisson Shrinker.

---

## Conventions & Standards

- **Numerical Stability:** All gamma/beta math uses log-space calculations (`logGamma`, `digamma`) to prevent overflow.
- **Privacy Budgeting:** Every query must specify an `epsilon` budget for differential privacy.
- **Thresholds:** Uses conservative "Federated Thresholds" (e.g., EB05 > 2.5) to account for aggregation noise.

---

## Known Limitations

- [ ] Current implementation assumes synchronous participation; needs async "staleness" handling.
- [ ] EBGM bisection search is limited to 100 iterations; may need adaptive tolerance for extreme outliers.

---

## Navigation

| Direction | Link |
|-----------|------|
| ⬆️ Parent | [`../README.md`](../README.md) |
| ➡️ Algorithms | [`../algorithms/README.md`](../algorithms/README.md) |
| ➡️ AI Engine | [`../ai/README.md`](../ai/README.md) |

---

*Proprietary Algorithm Documentation. Verified by Privacy Architect on 2024-12-28.*
