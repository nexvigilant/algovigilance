# Deep Research Module

> **Path:** `src/lib/deep-research`  
> **Parent:** [`../`](../README.md)  
> **Last Verified:** 2024-12-28  
> **Maintainer:** Research AI Engineer

---

## Purpose

The Deep Research module implements NexVigilant's autonomous AI research agent. Built on **Gemini 2.0 Pro**, it performs multi-step literature searches, systematic reviews, and pharmacovigilance (PV) specific analysis. It bridges the gap between raw LLM generation and regulatory-grade scientific evidence.

---

## Quick Reference

| Aspect | Details |
|--------|---------|
| **Domain** | AI Research / Scientific Literature |
| **Status** | Active / Stable |
| **Dependencies** | `genkit`, `NCBI E-utilities (PubMed)`, `MedDRA`, `Medline` |
| **Outputs** | Systematic Review Reports, PRISMA Flow Diagrams, BibTeX bibliographies |

---

## File Manifest

| File | Type | Purpose | Status |
|------|------|---------|--------|
| `client.ts` | Client | Main factory for DeepResearchClient instances | Active |
| `systematic-review.ts`| Service | PRISMA-compliant literature review orchestration | Active |
| `pubmed-enricher.ts` | Utility | Integration with NCBI E-utilities for article metadata | Active |
| `reference-parser.ts` | Parser | Extracts structured citations from markdown reports | Active |
| `reference-dedup.ts` | Utility | Cross-source reference merging and deduplication | Active |
| `mesh-faers-mapping.ts`| Mapper | Bridges MeSH literature terms with FAERS MedDRA reactions | Active |
| `pmid-watchlist.ts` | Service | Monitoring system for article updates and retractions | Active |
| `report-saver.ts` | Utility | Firestore persistence for research artifacts | Active |
| `index.ts` | Barrel | Central entry point for all research capabilities | Active |

### Subdirectories

| Directory | Purpose | Has README |
|-----------|---------|------------|
| `/__tests__/` | Unit and integration tests for research pipelines | ❌ |

---

## Relationships & Data Flow

```
[User Query] → [DeepResearchClient] → [systematic-review.ts] → [PubMed Enricher]
                     ↓                        ↓                      ↓
              [reference-parser]      [PRISMA Algorithms]      [NCBI API]
                     ↓                        ↓
              [reference-dedup] → [Structured Research Report]
```

**Internal Dependencies:**
- All research flows utilize the `DeepResearchClient` for primary autonomous search.
- `systematic-review.ts` relies on algorithms in `lib/algorithms/prisma` for screening.
- `pubmed-enricher.ts` provides the authoritative data for `reference-dedup.ts`.

---

## Usage Patterns

### Common Workflows

1. **Conduct Systematic Review**
   - Define a `PICOFramework` (Population, Intervention, Comparator, Outcome).
   - Call `conductSystematicReview(config)`.
   - Result: PRISMA-compliant report with an ASCII flow diagram.

2. **Literature Reference Extraction**
   - Pass an AI-generated report to `extractReferences(report)`.
   - Call `enrichReferences(parsedRefs)` to fetch official metadata from PubMed.
   - Result: Structured JSON bibliography ready for export (BibTeX/CSV).

### Entry Points

- **Primary:** `conductSystematicReview` — Formal scientific research.
- **Client:** `getDeepResearchClient().research(query)` — Informal information gathering.

---

## Conventions & Standards

- **NCBI Courtesy:** All PubMed requests must include a `tool` and `email` parameter (NCBI policy).
- **Citations:** Reports must use structured "### Study [Number]" headers to ensure reliable parsing.
- **Rate Limiting:** PubMed API is limited to 3 req/sec without a key; 10 req/sec with a key.

---

## Known Limitations

- [ ] `reference-parser.ts` may struggle with non-standard citation styles (e.g., inline without dates).
- [ ] MeSH to FAERS mapping is currently based on a static mapping table; needs dynamic lookup.

---

## Navigation

| Direction | Link |
|-----------|------|
| ⬆️ Parent | [`../README.md`](../README.md) |
| ➡️ Algorithms | [`../algorithms/README.md`](../algorithms/README.md) |
| ⬇️ Tests | [`./__tests__/README.md`](./__tests__/README.md) |

---

*Autonomous Research Infrastructure. Verified by AI Lead on 2024-12-28.*
