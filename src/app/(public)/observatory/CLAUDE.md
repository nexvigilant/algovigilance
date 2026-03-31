# CLAUDE.md — Observatory Module

The Observatory is NexVigilant's visual intelligence layer — end-to-end drug lifecycle visualization from pre-clinical chemistry through population epidemiology. 12 immersive 3D explorers powered by 92+ computational tools across 4 shared rendering components.

## Benchmark Governance (INVARIANT)

This document describes the REALIZED state of this module — the standard we hold.

**The One Rule:** When reality diverges from what is stated here, improve reality. NEVER lower this document to match code.

## Explorers

### Drug Lifecycle Explorers

| Route | Purpose | Lifecycle Stage | 3D Component |
|-------|---------|-----------------|--------------|
| `chemistry/` | Pre-clinical compound analysis. ADME profiles, Hill dose-response, binding landscapes, saturation kinetics as 3D energy surfaces. | Pre-clinical | SurfacePlot3D |
| `molecule/` | Atom-bond graphs with CPK coloring, charge distribution glow, conformational energy landscapes. CVD-safe element encoding. | Pre-clinical | ForceGraph3D |
| `regulatory/` | ICH guideline milestones, FDA compliance checkpoints, approval dependencies as force-directed pipeline graphs. 2,794 guidance docs. | Regulatory | ForceGraph3D |
| `causality/` | Bradford Hill criteria, Naranjo scoring, WHO-UMC causality classification as 3D evidence networks. Signal-to-causality mapping. | Post-market | ForceGraph3D |
| `timeline/` | Signal velocity and distribution drift across the drug lifecycle. KS test, PSI, and JSD statistical drift detection on temporal axes. | Post-market | ForceGraph3D |
| `epidemiology/` | Kaplan-Meier survival surfaces, incidence rate topography, population risk contours. NNT, attributable fraction, SMR computation. | Population | SurfacePlot3D |

### Platform Explorers

| Route | Purpose | 3D Component |
|-------|---------|--------------|
| `graph/` | Force-directed networks in 3D. Dependency graphs, signal detection pipelines, ToV harm taxonomies, string theory dimensional structures. | ForceGraph3D |
| `math/` | Parametric surfaces spanning classical analysis, string theory manifolds, PV signal theory. IC surfaces, safety margin d(s), Bayesian evidence. | SurfacePlot3D |
| `state/` | Orbital state dynamics with probabilistic transitions. Signal lifecycle, ToV harm assessment, Guardian homeostasis, session lifecycle. | StateOrbit3D |
| `careers/` | Pharmacovigilance career transitions and skill relationships. KSB similarity drives transition probability. Y-axis maps salary. | ForceGraph3D |
| `learning/` | Learning progression as 3D terrain. Prerequisite DAG with competency levels, completion state, unlockable activities. | ForceGraph3D |
| `atlas/` | Cross-domain architecture translation. Same system through Biology, Clinical Trials, Chemistry, Military lenses via T1 primitive decomposition. | DomainAtlas2D |

## Product Benchmarks

### Rendering & Performance

| Domain | Benchmark |
|--------|-----------|
| **Graph Rendering** | DAGs with 200+ nodes render at 60fps with pan, zoom, and node selection. Layout algorithms produce readable graphs without manual positioning. Force-directed layout runs in a Web Worker to avoid main-thread blocking. |
| **Surface Rendering** | Parametric surfaces render 100x100 grids at 60fps. Interactive variable manipulation updates in real-time. Color mapping uses perceptually uniform OKLab color space. |
| **State Rendering** | Orbital state machines animate transitions at 60fps. Probabilistic arcs show transition weights. Guardian homeostasis displays with <1s refresh. |
| **Performance** | All visualizations lazy-load with code splitting via `next/dynamic`. Initial page load under 200KB per route. Three.js tree-shaken to minimize bundle. |
| **Post-Processing** | Bloom, SSAO, and vignette effects active on all 3D explorers. Configurable via Observatory Settings panel. Automatically disabled when `prefers-reduced-motion` is set. |

### Feature Parity

| Domain | Benchmark |
|--------|-----------|
| **CVD Encoding** | All explorers using ForceGraph3D implement color-vision-deficiency safe shape encoding. Node shapes differentiate categories independent of color. Verified across protanopia, deuteranopia, and tritanopia simulations. |
| **Semantic Zoom** | ZoomLevelBridge provides 3-level semantic detail: macro (cluster labels), meso (node labels + edges), micro (full metadata tooltips). All ForceGraph3D explorers implement semantic zoom. |
| **Worker Layout** | Force-directed layout computation runs in a dedicated Web Worker. Main thread handles rendering only. All ForceGraph3D explorers with 50+ nodes use worker layout. |
| **Live Data** | Drug lifecycle explorers (chemistry, molecule, regulatory, causality, timeline, epidemiology) connect to live NexCore MCP endpoints via `/api/nexcore/*` proxy. Data refreshes on user action or 60s interval. |

### Backend Integration

| Domain | Benchmark |
|--------|-----------|
| **MCP Wiring** | All explorer data hooks route through nexcore-viz MCP tools. Molecular visualization uses `viz_biologics` tools. Graph analysis uses `viz_advanced` tools. Physics simulation uses `viz_physics` tools. Zero client-side computation that should be server-side. |
| **Typed Responses** | Every MCP tool response is typed with a corresponding TypeScript interface in `src/types/observatory.ts`. Zero `any` in the data pipeline from Rust to React. |

### Accessibility & UX

| Domain | Benchmark |
|--------|-----------|
| **Accessibility** | All visualizations include text-based alternative representations for screen readers. Interactive elements are keyboard navigable. WCAG 2.1 AA compliant. |
| **Preferences** | Observatory Settings panel persists user preferences (default explorer, reduced motion, post-processing level, CVD mode). Preferences survive page navigation and session restart. |
| **Cross-Explorer Navigation** | Hub page shows lifecycle progress indicator. Drill-down from any explorer links to related explorers (e.g., molecule → chemistry, causality → timeline). Unified search across all explorer data. |

## Architecture

### 4 Shared 3D Components

| Component | Used By | Capabilities |
|-----------|---------|--------------|
| `ForceGraph3D` | graph, career, learning, molecule, regulatory, causality, timeline | Force-directed layout, node selection, edge rendering, CVD shapes, semantic zoom, worker layout |
| `SurfacePlot3D` | math, chemistry, epidemiology | Parametric surfaces, color mapping, variable manipulation, contour lines |
| `StateOrbit3D` | state | Orbital mechanics, probabilistic transitions, state highlighting |
| `DomainAtlas2D` | atlas | 2D domain translation grid, lens switching, primitive decomposition |

### Infrastructure

- **Client-side rendering**: All visualization components are `'use client'` with `next/dynamic` imports
- **Data hooks**: Each explorer has a `use{Explorer}Data()` hook returning `{ data, loading, error, refetch }`
- **Data source**: NexCore MCP tools via `/api/nexcore/*` REST proxy provide graph data, molecular structures, state snapshots, and mathematical models
- **Canvas/WebGL**: Three.js + React Three Fiber (R3F) for 3D. Graceful fallback to SVG for 2D
- **Registry**: `src/lib/observatory/explorer-registry.ts` — single source of truth for feature support per explorer
- **Preferences**: `useObservatoryPreferences()` hook with localStorage persistence
- **Post-processing**: `ObservatoryPostProcessing` component with bloom, SSAO, vignette
- **Visual effects**: `GlowMaterial`, `UncertaintyMaterial`, `EnergyEdge` shared across explorers

### Backend (nexcore-viz)

| MCP Module | Tools | Frontend Consumers |
|------------|-------|--------------------|
| `viz_foundation` | SVG generation, scaling, theming, axis rendering, DAG layout | graph, learning, careers |
| `viz_biologics` | Molecular parsing (PDB/SDF/SMILES), protein structure, antibody visualization, interaction networks | molecule, chemistry |
| `viz_physics` | Force fields, molecular dynamics, energy minimization, coordinate generation | chemistry, molecule |
| `viz_advanced` | Graph centrality, community detection, hypergraph rendering, spectral analysis, VDAG | graph, causality, regulatory, epidemiology |
