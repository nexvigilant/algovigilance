# CLAUDE.md — Careers Module

The Careers module provides professional assessment tools for pharmacovigilance career development — competency evaluation, performance frameworks, and career pathing.

## Benchmark Governance (INVARIANT)

This document describes the REALIZED state of this module — the standard we hold.

**The One Rule:** When reality diverges from what is stated here, improve reality. NEVER lower this document to match code.

## Pages

| Route | Purpose |
|-------|---------|
| `page.tsx` | Careers hub — assessment catalog and career navigation |
| `skills/` | Skills inventory and self-assessment |
| `assessments/` | Assessment catalog page |
| `assessments/board-effectiveness/` | Board effectiveness evaluation |
| `assessments/fellowship-evaluator/` | Fellowship readiness evaluation |
| `assessments/mentoring-framework/` | Mentoring capability assessment |
| `assessments/performance-conditions/` | Performance conditions analyzer |
| `assessments/competency-assessment/` | Core competency self-assessment |
| `assessments/maturity-model/` | Organizational maturity model evaluation |

## Product Benchmarks

| Domain | Benchmark |
|--------|-----------|
| **Assessment Suite** | 6 validated assessment tools cover individual competency, team effectiveness, organizational maturity, and career readiness. |
| **Scoring** | All assessments produce quantified results with percentile benchmarks, gap identification, and improvement recommendations. |
| **Career Pathing** | Skills inventory maps to EPA pathways, enabling data-driven career development plans aligned to 1,286 KSBs. |
| **Evidence Collection** | Assessment results persist with timestamps and versioning, enabling longitudinal capability tracking. |
| **Accessibility** | All assessment forms are fully accessible — keyboard navigable, screen reader compatible, proper ARIA labels on all interactive elements. |
| **Type Safety** | Assessment result types are fully defined — zero `any` in scoring logic or result rendering. |
