# CLAUDE.md — Vigilance Module

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

The Vigilance module is the PV For NexVigilants operating system — a beginner-friendly drug safety platform where every tool has a UI face (anatomy), a decision tree (physiology), and an MCP backend (nervous system).

## Benchmark Governance (INVARIANT)

This document describes the REALIZED state of this module — the standard we hold.

**The One Rule:** When reality diverges from what is stated here, improve reality. NEVER lower this document to match code.

## Mission

Make pharmacovigilance accessible to intelligent beginners. Every page uses the For NexVigilants UX pattern: friendly titles, step-by-step wizards, zero jargon, plain-English explanations. If a PV professional's grandmother can't understand the page title, rewrite it.

## Anatomy/Physiology Doctrine

Every capability has three layers that must exist in 1:1 correspondence:

| Layer | Metaphor | Implementation | Location |
|-------|----------|----------------|----------|
| **Anatomy** (Structure) | What the user sees | Next.js page with For NexVigilants UX | `vigilance/*/components/*.tsx` |
| **Physiology** (Function) | What happens when they click | Microgram decision tree (YAML) | `~/Projects/rsk-core/rsk/micrograms/` |
| **Nervous System** (Transport) | How data flows | MCP tool + pv-compute | nexcore-mcp + `@/lib/pv-compute` |

Adding a tool without a page is a gap. Adding a page without a microgram is a gap. Close all gaps.

## Pages

### For NexVigilants Pages (rebuilt with guided UX)

| Route | For NexVigilants Title | Wizard Steps | Professional Component | pv-compute | Micrograms |
|-------|----------------------|-------------|----------------------|------------|------------|
| `signals/` | "Is This Drug Causing Problems?" | 4 (Enter → Results → Classification → Action) | `SignalCalculator` (grid layout) | `computeSignals` | prr-signal, evans-signal, signal-to-causality |
| `causality/` | "Did The Drug Do It?" | 12 (Intro + 10 Naranjo + Verdict) | `CausalityAssessment` (tabs) | `computeNaranjo` | naranjo-quick, causality-to-action |
| `seriousness/` | "Is This Case Serious?" | 8 (Intro + 6 ICH E2A + Verdict) | `SeriousnessClassifier` (2-panel) | None (logic) | case-seriousness, seriousness-to-deadline |
| `faers/` | "Look Up a Drug's Safety Record" | 2 steps (Search → Results) | — (wizard is the only mode) | `computeSignals` | faers-result-classifier |
| `qbri/` | "Is This Drug Worth the Risk?" | 4 (Benefits → Risks → Balance → Meaning) | — | `computeQbri` | risk-score-classifier |

**Dual-mode pattern:** Pages with a "Professional Component" column support both guided (For NexVigilants) and professional modes. The page.tsx uses `useState(false)` to start in wizard mode; a "Professional Mode" button toggles to the expert view. Wizard components: `./components/*-wizard.tsx`. Professional components: `./components/*-calculator.tsx` or `*-assessment.tsx` or `*-classifier.tsx`.
| `risk-score/` | "How Risky Is This Drug?" | 2 panels (Input → Score) | Client-side | risk-score-classifier |
| `drift/` | "What's Changing?" | 3 tabs (Drift + Underreporting + Gaps) | None | drift-alert-classifier, underreporting-estimator |
| `audit/` | "Case History" | Timeline view | None | case-lifecycle-router |
| `workflow-builder/` | "Design a Workflow" | 3 (Name → Steps → Review) | None | workflow-router |
| `operations/` | "Your PV Operations Center" | 4 panels (Cases + Signals + Deadlines + Health) | None | full-case-router |
| `case-tracker/` | "Track Your Cases" | 5-stage pipeline view | None | case-lifecycle-router |
| `pipeline/` | "Run a Safety Signal Scan" | 3 panels (Input → Analyze → Results) | `computeSignals` | signal-detection-pipeline |
| `fence/` | "Your Safety Guardrails" | 3-col dashboard (Rules + Test + History) | `evaluateFence`, `computeFenceHealth` | — |
| `theory/` | "How Do We Know a Signal Is Real?" | 3 tabs (A1 + A2 + A3 + Combined) | `computeA1DataGeneration`, `computeA2NoiseDominance`, `computeA3SignalExistence` | — |
| `data-explorer/` | "Explore Your Safety Data" | 3 panels (Load → Transform → Results) | `parseCSV`, `groupByAndAggregate`, `sortGroupedRows` | — |
| `risk-bridge/` | "From Signal to Action" | 4 sections (Signal → Risk → Regulatory → Summary) | `computeSignals`, `bridgeSignalToRisk`, `bridgeRiskToRegulatory` | — |

### Professional Pages (original implementation)

| Route | Purpose |
|-------|---------|
| `dashboard/` | Unified PV operations dashboard |
| `drug-safety/` | Drug safety profile viewer |
| `severity/` | Severity grading engine |
| `expectedness/` | Expectedness determination |
| `pvdsl/` | PVDSL interpreter |
| `icsr/` | ICSR management |
| `analytics/` | PV analytics and trends |
| `reporting/` | Regulatory reporting workflows |
| `telemetry/` | System telemetry |
| `terminology/` | MedDRA/WHO-Drug browser |
| `drug-resolver/` | Drug name resolution |
| `comparator/` | Drug comparison |
| `harm-classifier/` | ToV harm taxonomy (A-H) |

## Shared Component Library

`src/components/pv-for-nexvigilants/` — 8 components used across all For NexVigilants pages:

| Component | Purpose | Props |
|-----------|---------|-------|
| `TipBox` | Green callout — helpful shortcuts | `children` |
| `RememberBox` | Blue callout — key concepts | `children` |
| `WarningBox` | Amber callout — pitfalls | `children` |
| `TechnicalStuffBox` | Gray callout — optional deep dive | `children` |
| `StepWizard` | Multi-step progression | `steps[], currentStep, onNext, onBack` |
| `TrafficLight` | Green/yellow/red signal indicator | `level, label` |
| `JargonBuster` | Inline term definition (hover) | `term, definition, children` |
| `ScoreMeter` | Gauge with labeled zones | `value, zones[], label` |

## PV Computation

All STEM/PV computation runs client-side via `@/lib/pv-compute`. Server handles only FAERS queries, NLP, forms, and auth.

```typescript
import { computeSignals, computeSignalsSync } from '@/lib/pv-compute';
import { computeNaranjo, computeWhoUmc } from '@/lib/pv-compute';
import { computeQbri, computeQbriSync } from '@/lib/pv-compute';
import type { ContingencyTable, SignalResult, NaranjoResult, QbriResult } from '@/lib/pv-compute';
```

## Microgram Logic Trees

Decision trees at `~/Projects/rsk-core/rsk/micrograms/` encode PV workflow logic. Each is atomic, self-testing, sub-microsecond. The frontend pages mirror microgram logic — when a page guides a user through steps, those steps match a microgram's decision tree nodes.

### PV Chain Topology
```
workflow-router ──→ prr-signal ──→ signal-to-causality ──→ naranjo-quick ──→ causality-to-action
       │                                                                            │
       ├──→ case-seriousness ──→ seriousness-to-deadline                            │
       │                                                                            ▼
       └──→ full-case-router ◄──────────────────────────────────────────────────────┘
```

## Agent Team

5 domain-knowledge agents at `~/.claude/agents/` form the PV development team:

| Agent | Role | Crates |
|-------|------|--------|
| `pvdsl-dev` | PVDSL language (compiler, native functions) | nexcore-pvdsl |
| `microgram-dev` | Decision tree design from PV domain knowledge | rsk-core micrograms |
| `pv-compute-dev` | Full-stack PV computation (Rust → MCP → TypeScript) | nexcore-pv-core, nexcore-mcp |
| `nucleus-pv-dev` | For NexVigilants frontend pages | nucleus vigilance/ |
| `nexcore-builder` | Build orchestrator (delegates, never implements) | all |

## MCP Tools (49 PV tools)

| Domain | Count | Key Tools |
|--------|-------|-----------|
| PV Signal | 7 | `pv_signal_complete`, `signal_detect` |
| Causality | 2 | `pv_naranjo_quick`, `pv_who_umc_quick` |
| FAERS | 12 | `faers_search`, `faers_drug_events`, `faers_etl_run` |
| Vigilance | 4 | `vigilance_safety_margin`, `vigilance_risk_score` |
| PVOS Kernel | 8 | `pvos_detect`, `pvos_triage`, `pvos_dashboard` |
| PVOS FSM | 6 | `pvos_fsm_transition`, `pvos_workflow_define` |
| PVOS Ops | 7 | `pvos_drift_detect`, `pvos_underreporting_estimate` |
| Regulatory | 3 | `pv_axioms_query`, `pv_axioms_regulation_search` |

## Product Benchmarks

| Domain | Benchmark |
|--------|-----------|
| **For NexVigilants UX** | Every PV page has a plain-English title, step-by-step wizard, and zero jargon. JargonBuster tooltips on every technical term. |
| **Signal Detection** | PRR, ROR, IC, EBGM, Chi-square + Safety Margin execute in <100ms client-side. Evans criteria enforced. |
| **Causality Assessment** | 12-step Naranjo wizard with plain-English questions. WHO-UMC available. |
| **FAERS Integration** | Drug lookup with TrafficLight per adverse event. 20M+ reports searchable. |
| **Microgram Coverage** | Every MCP tool has a corresponding microgram. 36 programs, 365+ tests, 0 failures. |
| **Client-Side Compute** | All computation in browser via `@/lib/pv-compute`. Server only for FAERS/NLP/auth. |
| **PVOS Integration** | 21 MCP tools wired from nexcore-pvos (75 modules). Operations dashboard + case tracker live. |
| **Thresholds** | PRR>=2.0, Chi-sq>=3.841, ROR-LCI>1.0, IC025>0, EB05>=2.0 (Evans criteria). |

## Architecture Rules

- **pv-compute**: All statistical computation uses `@/lib/pv-compute` — never manual formulas
- **MCP bridge**: FAERS routes through `/api/nexcore/*` proxy to NexCore MCP
- **Typed results**: Every computation result is fully typed — no `any` in signal detection paths
- **For NexVigilants components**: Use `@/components/pv-for-nexvigilants` for all guided pages
- **1:1 doctrine**: Every tool needs a page (anatomy) AND a microgram (physiology)
- **Route protection**: Via `src/proxy.ts` (NOT middleware.ts)
