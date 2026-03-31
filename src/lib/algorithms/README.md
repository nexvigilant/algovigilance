# Algorithms Module

> **Path:** `src/lib/algorithms`  
> **Parent:** [`../`](../README.md)  
> **Last Verified:** 2024-12-28  
> **Maintainer:** Principal Algorithm Engineer

---

## Purpose

The Algorithms module contains the mathematical and logical kernels that power NexVigilant's high-fidelity research validation and network analysis. It implements proprietary frameworks for measuring scientific credibility (CMER), detecting citation manipulation (CIDRE), and ensuring systematic review compliance (PRISMA).

---

## Quick Reference

| Aspect | Details |
|--------|---------|
| **Domain** | Scientific Computing / Graph Theory / Validation |
| **Status** | Stable / Core |
| **Dependencies** | `OpenAlex API`, `Semantic Scholar API`, `Standard Deviation / Log-Gamma` |
| **Outputs** | Credibility Grades (A-F), Cartel Detection Reports, Compliance Maps |

---

## File Manifest

| File | Type | Purpose | Status |
|------|------|---------|--------|
| `research-validator.ts` | Algorithm | Core CMER Framework (Credibility, Methodology, Evidence, Reproducibility) | Active |
| `cidre-algorithm.ts` | Algorithm | Citation Cartel Detection using indirect reciprocity analysis | Active |
| `cmer-v2-extensions.ts` | Extension | v2 enhancements: S-Value (Surprisal) and Domain-specific weights | Active |
| `text-extractors.ts` | Utility | Regex and NLP-based extraction of statistical indicators from text | Active |
| `openalex-client.ts` | Client | Live integration with OpenAlex for global citation graph data | Active |
| `semantic-scholar-client.ts`| Client | Integration with Semantic Scholar for citation context analysis | Active |
| `index.ts` | Barrel | Centralized exports for the algorithmic suite | Active |

### Subdirectories

| Directory | Purpose | Has README |
|-----------|---------|------------|
| `/prisma/` | PRISMA 2020 systematic review pipeline and validation | ❌ |
| `/__tests__/` | Unit tests for complex mathematical functions | ❌ |

---

## Relationships & Data Flow

```
[Raw Research Artifact] → [text-extractors.ts] → [research-validator.ts] → [Grade/Flags]
                                  ↓                     ↑
                          [Global Citation APIs] → [cidre-algorithm.ts]
```

**Internal Dependencies:**
- `research-validator-v2.ts` utilizes `cmer-v2-extensions.ts` for advanced statistical scoring.
- `cidre-algorithm.ts` operates on graph structures built by the API clients.

**External Dependencies:**
- Relies on **OpenAlex** and **Semantic Scholar** for external verification of citation networks.

---

## Usage Patterns

### Common Workflows

1. **Grade a Research Paper (CMER)**
   - Pass a structured `ResearchArtifact` to `validateResearch(artifact)`.
   - Result: Multi-dimensional score, A-F grade, and identified "Flags".

2. **Detect Citation Cartels (CIDRE)**
   - Build a `CitationGraph` from API data.
   - Call `analyzeCIDRE(graph)`.
   - Result: List of suspicious "Clusters" and individual node centrality scores.

### Entry Points

- **Primary:** `validateResearchV2` — The most current unified validation entry point.
- **Network:** `analyzeCIDRE` — Formal citation network analysis.

---

## Conventions & Standards

- **Functional Purity:** Algorithmic kernels should be stateless and deterministic where possible.
- **Complexity Aware:** Graph operations (CIDRE) must use efficient algorithms (e.g., Tarjan's for SCCs) to handle large citation networks.
- **Validation Weights:** Weights (Credibility vs. Methodology) must always sum to 1.0.

---

## Known Limitations

- [ ] `text-extractors.ts` is currently regex-heavy; migration to LLM-based extraction is planned for higher precision.
- [ ] CIDRE bisection search for quantiles is sensitive to sparse graph noise.

---

## Navigation

| Direction | Link |
|-----------|------|
| ⬆️ Parent | [`../README.md`](../README.md) |
| ➡️ Deep Research | [`../deep-research/README.md`](../deep-research/README.md) |
| ⬇️ PRISMA | [`./prisma/README.md`](./prisma/README.md) |

---

*Mathematical Integrity Core. Verified by Principal Engineer on 2024-12-28.*
