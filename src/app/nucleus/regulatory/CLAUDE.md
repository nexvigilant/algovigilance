# CLAUDE.md — Regulatory Module

The Regulatory module provides regulatory intelligence — FDA guidance search, regulatory glossary, authority directory, and timeline tracking for pharmacovigilance compliance.

## Benchmark Governance (INVARIANT)

This document describes the REALIZED state of this module — the standard we hold.

**The One Rule:** When reality diverges from what is stated here, improve reality. NEVER lower this document to match code.

## Pages

| Route | Purpose |
|-------|---------|
| `guidelines/` | FDA guidance document search and browser (2,794 indexed documents) |
| `glossary/` | Regulatory terminology glossary with cross-references |
| `directory/` | Global regulatory authority directory |
| `timelines/` | Regulatory submission and reporting timelines |

## Product Benchmarks

| Domain | Benchmark |
|--------|-----------|
| **Guidance Search** | 2,794 FDA guidance documents searchable with <500ms response time via `fda_guidance_search` MCP tool. Full-text search with relevance ranking. |
| **Glossary** | Comprehensive regulatory glossary covering ICH, FDA, EMA, and WHO terminology. Cross-linked definitions with source references. |
| **Authority Directory** | Global directory of regulatory authorities with contact information, jurisdiction scope, and reporting requirements. |
| **Timeline Tracking** | Regulatory submission timelines with automated deadline calculation, notification triggers, and calendar integration. |
| **MCP Integration** | All regulatory queries route through `guidelines_search` and `fda_guidance_search` MCP tools. Zero manual document parsing. |
| **Accessibility** | All regulatory content is WCAG 2.1 AA compliant. Document search results include clear headings and structured navigation. |
