# Observatory Architecture — Current State

**Date:** 2026-03-02
**Status:** 3D Canvas renders. Graph nodes render with local font (troika CDN fix applied 2026-03-30).
**Branch:** main

---

## Problem Summary

All `<Text>` components now use `font="/fonts/inter-latin.woff2"` to load Inter from local assets, bypassing troika's CDN font fetch that was blocked by CSP. Fix applied 2026-03-30 via CAPA-001.

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│  Browser (Client)                                        │
│                                                          │
│  Observatory Hub (/nucleus/observatory)                  │
│    └── 12 Explorer Pages (each 'use client')            │
│         ├── Data Hook (use-*-data.ts)                   │
│         ├── Dynamic Import: SceneContainer (ssr:false)  │
│         │    ├── R3F Canvas + Lights + Stars            │
│         │    ├── SafeEnvironment (no-op, HDRI removed)  │
│         │    └── PostProcessing (bloom, SSAO, vignette) │
│         └── Dynamic Import: ForceGraph3D / SurfacePlot  │
│              ├── GraphNodeMesh / AdaptiveNode            │
│              │    └── <Text> from drei ← BROKEN         │
│              └── EnergyEdge / GraphEdgeLine              │
├─────────────────────────────────────────────────────────┤
│  Next.js API Layer                                       │
│                                                          │
│  /api/nexcore/[...path]  (catch-all proxy, auth req'd)  │
│  /api/nexcore/faers       (named, no auth)              │
│  /api/nexcore/career      (named, no auth)              │
│  /api/nexcore/learning    (named, no auth)              │
│  /api/nexcore/compute-visual (server-side MCP calls)    │
├─────────────────────────────────────────────────────────┤
│  nexcore-api (Rust, port 3030)                          │
│                                                          │
│  /api/v1/mcp/{tool}      → MCP tool dispatcher          │
│  /api/v1/faers/*          → OpenFDA queries             │
│  /api/v1/career/*         → Career transition data      │
│  /api/v1/learning/*       → Learning DAG data           │
└─────────────────────────────────────────────────────────┘
```

---

## Explorer Inventory

### Drug Lifecycle Explorers

| Explorer | Route | 3D Component | Data Hooks | Backend Wiring | Fallback Quality |
|----------|-------|-------------|------------|----------------|-----------------|
| **Chemistry** | `/chemistry` | SurfacePlot3D | `use-chemistry-data`, `use-qbr-data` | `chemistry_hill_response`, `qbr_compute` | **High** — client-side Hill curves always render; MCP validates |
| **Molecule** | `/molecule` | ForceGraph3D | `use-molecule-data` | `viz_molecular_info`, `viz_coord_gen`, `chem_molecular_formula` | **High** — preset molecules always show; MCP enriches |
| **Regulatory** | `/regulatory` | ForceGraph3D | `use-regulatory-data` | `guidelines_search`, `foundation_graph_levels`, `viz_dag` | **High** — 22-milestone FDA pipeline DAG hardcoded |
| **Causality** | `/causality` | ForceGraph3D | `use-causality-data` | `pv_signal_complete`, `pv_core_fdr_adjust` | **High** — 8-drug preset library (ibuprofen, vioxx, thalidomide, etc.) |
| **Timeline** | `/timeline` | ForceGraph3D | `use-timeline-data`, `use-drift-data`, `use-bayesian-sequential` | `pv_signal_complete`, `drift_ks_test/psi/jsd`, `pv_core_bayesian_sequential_beta_binomial` | **High** — demo lifecycle + client-side Bayesian |
| **Epidemiology** | `/epidemiology` | SurfacePlot3D | `use-epidemiology-data`, `use-survival-data` | `epidemiology_relative_risk`, `pv_core_kaplan_meier`, `pv_core_log_rank` | **High** — 5-cohort demo + client-side KM |

### Platform Explorers

| Explorer | Route | 3D Component | Data Hooks | Backend Wiring | Fallback Quality |
|----------|-------|-------------|------------|----------------|-----------------|
| **Graph Theory** | `/graph` | ForceGraph3D | `use-signal-data`, `use-graph-analysis`, `use-compute-visual` | `faers/signal-graph` (REST), `graph_analyze` (MCP), `kellnr_*` + `chemistry_hill_response` (server MCP) | **Medium** — static datasets always available; live FAERS needs nexcore-api |
| **Mathematics** | `/math` | SurfacePlot3D | `use-math-data` | `wolfram_calculate` (validation only) | **High** — client-side parametric surfaces always render |
| **State Machines** | `/state` | StateOrbit3D | `use-state-data` | `guardian_homeostasis_tick`, `markov_analyze` | **High** — hardcoded state machines always show |
| **Career Pathways** | `/careers` | ForceGraph3D | `use-career-data` | `career/transitions` (REST) | **None** — no fallback, shows error |
| **Learning Landscapes** | `/learning` | ForceGraph3D | `use-learning-data` | `learning/dag` (REST) | **None** — no fallback, shows error |
| **Domain Atlas** | `/atlas` | DomainAtlas2D | `use-atlas-data` | None (100% static) | **Always works** |

---

## MCP Tool Dependency Map

| MCP Tool | Explorer(s) | Required? | Status |
|----------|------------|-----------|--------|
| `pv_signal_complete` | Causality, Timeline | Enrichment (has preset fallback) | Available in nexcore |
| `pv_core_fdr_adjust` | Causality | Enrichment | Available |
| `pv_core_bayesian_sequential_beta_binomial` | Timeline | Enrichment (client-side fallback) | Available |
| `pv_core_kaplan_meier` | Epidemiology | Enrichment (client-side fallback) | Available |
| `pv_core_log_rank` | Epidemiology | Enrichment | Available |
| `epidemiology_relative_risk` | Epidemiology | Enrichment | Available |
| `chemistry_hill_response` | Chemistry, Graph (compute-visual) | Validation only | Available |
| `qbr_compute` | Chemistry | Enrichment | Available |
| `guidelines_search` | Regulatory | Enrichment (22-node DAG fallback) | Available |
| `foundation_graph_levels` | Regulatory | Enrichment | Available |
| `viz_dag` | Regulatory | Enrichment | Available |
| `viz_molecular_info` | Molecule | Enrichment | Available |
| `viz_coord_gen` | Molecule | Enrichment | Available |
| `graph_analyze` | Graph | Enrichment | Available |
| `wolfram_calculate` | Math | Validation only | Available |
| `guardian_homeostasis_tick` | State | Enrichment | Available |
| `markov_analyze` | State | Enrichment | Available |
| `drift_ks_test` | Timeline | Enrichment | Available |
| `drift_psi` | Timeline | Enrichment | Available |
| `drift_jsd` | Timeline | Enrichment | Available |
| `kellnr_compute_graph_betweenness` | Graph (compute-visual) | Enrichment | **Unknown — non-standard namespace** |
| `kellnr_compute_stats_entropy` | Graph (compute-visual) | Enrichment | **Unknown — non-standard namespace** |
| `chem_molecular_formula` | Molecule | Custom input | Available |
| `career_transitions` (REST) | Careers | **Required** — no fallback | Requires nexcore-api |
| `learning_dag` (REST) | Learning | **Required** — no fallback | Requires nexcore-api |

---

## Fetch Patterns

### Pattern A: MCP via Proxy (most hooks)
```
Browser → fetch('/api/nexcore/api/v1/mcp/{tool}', POST)
       → catch-all proxy (Firebase auth required)
       → http://localhost:3030/api/v1/mcp/{tool}
       → nexcore MCP dispatcher
       → Rust tool handler
       → Response: { tool, success, result: { content: [{ type: "text", text: "<JSON>" }] } }
```
Parsed by `mcpFetch<T>()` or `parseMcpText<T>()` in `src/lib/observatory/mcp-fetch.ts`.

### Pattern B: Named REST (FAERS, Career, Learning)
```
Browser → fetch('/api/nexcore/{route}?params')
       → named route handler (no auth for FAERS/career/learning)
       → http://localhost:3030/api/v1/{path}
       → Rust REST handler
       → Response: direct JSON
```

### Pattern C: Server-Side MCP (compute-visual)
```
Browser → POST /api/nexcore/compute-visual
       → Next.js route handler calls MCP tools directly
       → Promise.allSettled([betweenness, layout3d, entropy, glowCurve])
       → Aggregated response
```

---

## Shared 3D Components

| Component | File | Used By | External Dependencies |
|-----------|------|---------|----------------------|
| `SceneContainer` | `scene-container.tsx` | All explorers | R3F Canvas, drei (Stars, OrbitControls, Sparkles) |
| `SafeEnvironment` | `safe-environment.tsx` | SceneContainer | **None** (HDRI removed — was drei Environment) |
| `ForceGraph3D` | `force-graph-3d.tsx` | 7 explorers | drei (`Text`, `Line`, `Billboard`) ← local font |
| `SurfacePlot3D` | `surface-plot-3d.tsx` | 3 explorers | R3F (pure mesh/geometry) |
| `StateOrbit3D` | `state-orbit-3d.tsx` | 1 explorer | drei (`Text`, `Billboard`) ← local font |
| `AdaptiveNode` | `semantic-zoom.tsx` | ForceGraph3D | drei (`Text`, `Billboard`) ← local font |
| `EnergyEdge` | `energy-edge.tsx` | ForceGraph3D | R3F shaders (no drei) |
| `InstancedSignalCloud` | `instanced-graph.tsx` | ForceGraph3D (>50 nodes) | R3F instanced mesh (no drei) |
| `ObservatoryPostProcessing` | `post-processing.tsx` | SceneContainer | `@react-three/postprocessing` |

---

## Recommendation: First Explorer to Wire End-to-End

**Graph Theory** (`/nucleus/observatory/graph`)

Rationale:
1. Uses ForceGraph3D — fixes here propagate to 6 other explorers
2. Has 7 static datasets that don't need nexcore-api (NexCore Layers, PV Signal Network, T1 Primitives, String Theory D=10, ToV Harm Types, Signal Detection Pipeline, CYP3A4 DDI Network)
3. Live mode (FAERS) tests the full proxy chain
4. `graph_analyze` MCP tool tests the MCP pathway
5. Most feature-complete explorer (CVD modes, semantic zoom, worker layout, analysis panel)

### Steps to Get Graph Explorer Rendering

1. ~~**Fix `<Text>` font loading**~~ — DONE (2026-03-30, CAPA-001). All 10 `<Text>` instances use `font="/fonts/inter-latin.woff2"`.

2. **Verify static dataset rendering** — confirm NexCore Layers dataset renders nodes + edges with no backend

3. **Test Live FAERS** — search "aspirin" in Live mode, verify signal graph from OpenFDA

4. **Test Graph Analysis** — click "Analyze" button, verify PageRank/Louvain/centrality enrichment

5. **Deploy and verify on production**

---

## External Dependencies Remaining

| Dependency | Used By | Risk | Fix |
|------------|---------|------|-----|
| `troika-three-text` (via drei `Text`) | ForceGraph3D, AdaptiveNode, StateOrbit3D | **Fixed** — all `<Text>` use local font | Done (2026-03-30) |
| `@react-three/postprocessing` | SceneContainer | Low — degrades gracefully | SSAO NormalPass warning is cosmetic |
| `three` Web Workers | R3F internal | **Fixed** — `worker-src 'self' blob:` in CSP | Done |
| drei `Environment` HDRI | SceneContainer | **Fixed** — SafeEnvironment returns null | Done |

---

## Files Changed This Session

| File | Change | Status |
|------|--------|--------|
| `vercel.json` | Removed stale CSP + duplicate security headers | Deployed |
| `next.config.ts` | CSP now single source of truth | Deployed |
| `safe-environment.tsx` | HDRI removed — returns null | Deployed |
| `NEXT_PUBLIC_PREVIEW_MODE` | Set to `false` on Vercel | Deployed — nucleus auth-gated |
