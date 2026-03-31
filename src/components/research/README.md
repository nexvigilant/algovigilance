# Research Components Module

> **Path:** `src/components/research`  
> **Parent:** [`../README.md`](../README.md)  
> **Last Verified:** 2024-12-28  
> **Maintainer:** Principal Algorithm Engineer

---

## Purpose

The Research Components module provides the user interface for scientific validation and citation analysis. It visualizes the output of the CMER and CIDRE algorithms, allowing users to explore citation networks, identify potential citation cartels, and view detailed credibility reports for research artifacts.

---

## File Manifest

| File | Type | Purpose | Status |
|------|------|---------|--------|
| `validation-report.tsx` | Unit | Comprehensive report UI for CMER grades and flags | Active |
| `citation-network-graph.tsx`| Unit | Interactive SVG graph of paper-to-paper citations | Active |
| `cartel-analysis-panel.tsx` | Unit | Detail view for suspicious citation clusters | Active |
| `citation-context-panel.tsx`| Unit | Displays *why* a specific paper was cited using semantic context | Active |
| `index.ts` | Barrel | Central entry point for all research UI components | Active |

---

## Navigation

| Direction | Link |
|-----------|------|
| ⬆️ Parent | [`../README.md`](../README.md) |
| ➡️ Algorithms | [`../../lib/algorithms/README.md`](../../lib/algorithms/README.md) |

---

*Scientific Validation UI. Verified by Principal Engineer on 2024-12-28.*
