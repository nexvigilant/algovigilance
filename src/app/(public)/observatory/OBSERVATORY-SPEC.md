# Observatory — System Specification & Capability Map

> NexVigilant's visual intelligence layer. 12 immersive 3D explorers powered by 92+ MCP tools across 4 shared rendering engines.

**Route:** `/nucleus/observatory`
**Stack:** Three.js + React Three Fiber (R3F) + OKLab color space
**Architecture:** 7-tier (types > perceptual > shaders > components > scene > explorers > hub)

---

## Quick Stats

| Metric | Value |
|--------|-------|
| Explorer count | 12 (6 drug lifecycle + 6 platform) |
| Rendering engines | 4 (ForceGraph3D, SurfacePlot3D, StateOrbit3D, DomainAtlas2D) |
| Shared viz components | 17 |
| Data hooks | 12 |
| MCP tools wired | 92+ |
| Post-processing effects | 5 (Bloom, SSAO, Vignette, DoF, Chromatic Aberration) |
| Quality presets | 3 (low/medium/high) |
| Atmospheres | 4 (deep-space, clinical, war-room, blueprint) |
| CVD modes | 4 (normal, protanopia, deuteranopia, tritanopia) |
| Layout algorithms | 4 (force, hierarchy, radial, grid) |
| Color space | OKLab (perceptually uniform) |

---

## 1. Rendering Engines

### 1.1 ForceGraph3D
**File:** `src/components/observatory/force-graph-3d.tsx` (~1500 lines)
**Used by:** 7 explorers (graph, molecule, regulatory, causality, timeline, careers, learning)

Physics-based force-directed graph rendering with:
- **4 layout algorithms:** force (Fruchterman-Reingold), hierarchy (DAG layers), radial (concentric), grid
- **CVD shape encoding:** sphere (normal), box (protanopia), cylinder (deuteranopia), torus (tritanopia)
- **Semantic zoom:** 4 levels (macro/meso/micro/focus) — label detail increases as camera approaches
- **Web Worker offload:** force-directed physics computed off-thread for 50+ node graphs
- **Visual encodings:**
  - Size: perceptual radius via Stevens' Power Law (`radius ~ strength^0.4`)
  - Color: node.color or groupColors
  - Opacity: confidence interval width -> material alpha
  - Glow: seriousness score -> bloom intensity
  - Emissive: trend (emerging/stable/declining) -> emissive intensity

### 1.2 SurfacePlot3D
**File:** `src/components/observatory/surface-plot-3d.tsx` (~250 lines)
**Used by:** 3 explorers (chemistry, math, epidemiology)

Parametric surface visualization:
- **Function input:** `(x, y) => z` mapped to vertex grid
- **Resolution:** 32/64/96 vertices per side
- **Color modes:** height, gradient, contour — all via OKLab perceptual color
- **Wireframe toggle**
- **Normals:** estimated via finite differences for correct lighting

### 1.3 StateOrbit3D
**File:** `src/components/observatory/state-orbit-3d.tsx` (~200 lines)
**Used by:** 1 explorer (state)

Probabilistic state machine visualization:
- **3 layouts:** orbital (planetary), flow (left-to-right DAG), ring (flat circle)
- **Transitions:** QuadraticBezierLine with probability labels
- **Animation:** active state pulses, orbital rotation via @react-spring/three

### 1.4 DomainAtlas2D
**File:** `src/app/nucleus/observatory/atlas/atlas-explorer.tsx` (~200 lines)
**Used by:** 1 explorer (atlas)

2D cross-domain translation (HTML/CSS, not Canvas):
- **6 domain lenses:** Biology, Clinical, Chemistry, Military, City, Orchestra
- **10 system components:** foundation, domain, orchestration, service, eventFlow, security, dataPipeline, frontend, configuration, compute
- **T1 primitive decomposition** for each component
- **Confidence badges** per translation

---

## 2. Explorer Inventory

### 2.1 Drug Lifecycle Explorers

| Explorer | Route | Engine | Live Data | Purpose |
|----------|-------|--------|-----------|---------|
| **Chemistry** | `/chemistry` | SurfacePlot3D | viz_biologics, viz_physics | Hill dose-response surfaces (EC50 x Hill coefficient) |
| **Molecule** | `/molecule` | ForceGraph3D | viz_biologics | Atom-bond networks with CPK coloring, charge distribution |
| **Regulatory** | `/regulatory` | ForceGraph3D | guidelines_search, fda_guidance_search, viz_advanced | FDA milestone graphs, approval dependency chains |
| **Causality** | `/causality` | ForceGraph3D | pv_signal_complete, viz_advanced | Naranjo scoring, Bradford Hill criteria, WHO-UMC classification |
| **Timeline** | `/timeline` | ForceGraph3D | drift_ks_test, drift_psi, drift_jsd, viz_advanced | Signal velocity tracking, statistical drift detection |
| **Epidemiology** | `/epidemiology` | SurfacePlot3D | epi_relative_risk, epi_odds_ratio, epi_attributable_fraction | Kaplan-Meier survival surfaces, NNT calculation |

### 2.2 Platform Explorers

| Explorer | Route | Engine | Live Data | Purpose |
|----------|-------|--------|-----------|---------|
| **Graph** | `/graph` | ForceGraph3D | faers_search, faers_drug_events, pv_signal_complete | Signal detection pipelines, preset datasets, live drug query |
| **Math** | `/math` | SurfacePlot3D | None (inline) | 20+ parametric functions (peaks, sinc, Calabi-Yau, Moebius...) |
| **State** | `/state` | StateOrbit3D | None (inline) | 6 state machines (Guardian, Gestation, Meiosis, Session, Signal, ToV) |
| **Careers** | `/careers` | ForceGraph3D | /api/careers | PV career transitions, KSB similarity, salary axis |
| **Learning** | `/learning` | ForceGraph3D | Firestore + KSB | Prerequisite DAGs, completion tracking, locked/unlocked states |
| **Atlas** | `/atlas` | DomainAtlas2D | None (inline) | 6 domain lenses, cross-domain concept translation |

---

## 3. Capability Matrix

| Explorer | CVD | Semantic Zoom | Worker Layout | Post-FX | Live MCP | Lifecycle Stage |
|----------|:---:|:---:|:---:|:---:|:---:|:---:|
| graph | Y | Y | Y | Y | Y | platform |
| chemistry | - | - | - | Y | Y | preclinical |
| molecule | Y | Y | - | Y | Y | preclinical |
| regulatory | Y | Y | - | Y | Y | regulatory |
| causality | Y | Y | - | Y | Y | postmarket |
| timeline | Y | Y | - | Y | Y | postmarket |
| epidemiology | - | - | - | Y | Y | population |
| math | - | - | - | Y | - | platform |
| state | - | - | - | Y | - | platform |
| careers | Y | Y | - | Y | - | platform |
| learning | Y | Y | - | Y | - | platform |
| atlas | - | - | - | - | - | platform |

**Key:** Y = implemented, - = not applicable or not yet implemented

---

## 4. Visual Encoding System

### 4.1 Perceptual Mappings

| Data Dimension | Visual Channel | Function | Source |
|----------------|---------------|----------|--------|
| Signal strength | Node size | `perceptualRadius()` — Stevens' Power Law (s^0.4) | `visual-encoding.ts` |
| Trend direction | Emissive glow | `trendToEmissive()` — emerging=high, stable=mid, declining=low | `visual-encoding.ts` |
| Seriousness | Bloom intensity | `seriousnessToGlow()` — score mapped to bloom threshold | `visual-encoding.ts` |
| Confidence (CI width) | Opacity | `confidenceToOpacity()` — narrow CI=opaque, wide=transparent | `visual-encoding.ts` |
| Confidence (CI width) | Dissolve shader | `confidenceToDissolve()` — uncertainty boundary effect | `uncertainty-material.tsx` |
| Group membership | Color | groupColors record + OKLab perceptual gradients | `observatory-constants.ts` |
| Group (CVD) | Shape | `getNodeGeometry()` — sphere/box/cylinder/torus by mode | `cvd-geometry.tsx` |

### 4.2 OKLab Color Space
**File:** `src/lib/observatory/oklab.ts`

All surface plots use OKLab (perceptually uniform) for color gradients. `surfaceColorScale(value, min, max)` produces colors where equal numeric distance = equal perceived distance.

### 4.3 Custom Shaders

| Shader | File | Purpose |
|--------|------|---------|
| GlowMaterial | `glow-material.tsx` | Rim lighting + pulse animation for node halos |
| UncertaintyMaterial | `uncertainty-material.tsx` | Confidence-based dissolve boundary effect |
| EnergyEdge | `energy-edge.tsx` | Animated glow along graph edges |

---

## 5. Scene Infrastructure

### 5.1 SceneContainer
**File:** `src/components/observatory/scene-container.tsx`

Wraps every 3D explorer:
- R3F Canvas setup with configurable camera position
- OrbitControls (damping, zoom limits)
- 3-point lighting (key/fill/rim)
- Optional fog, stars, sparkles (per atmosphere)
- Post-processing pipeline (bloom, SSAO, vignette, DoF, chromatic aberration)

### 5.2 Atmospheres
**File:** `src/lib/observatory/atmospheres.ts`

| Atmosphere | Feel | Lighting | Background |
|------------|------|----------|------------|
| deep-space | Dark, expansive | Cool tones, rim-lit | Near-black + stars |
| clinical | Clean, precise | Neutral white | Light gray |
| war-room | Intense, focused | Red-shifted | Dark + fog |
| blueprint | Technical, grid | Blue-tinted | Deep blue + grid |

### 5.3 Quality Presets
**File:** `src/lib/observatory/quality-presets.ts`

| Level | Bloom | SSAO | Vignette | DoF | Chromatic | Stars | Est. Bundle |
|-------|:-----:|:----:|:--------:|:---:|:---------:|:-----:|:-----------:|
| low | - | - | - | - | - | - | ~30KB |
| medium | Y | - | Y | - | - | Y | ~50KB |
| high | Y | Y | Y | Y | Y | Y | ~80KB |

---

## 6. Data Architecture

### 6.1 Hook Pattern

Every explorer uses a `use-*-data.ts` hook returning:
```typescript
{ data: T, loading: boolean, error: Error | null, refetch: () => void }
```

Hooks call MCP tools via `/api/nexcore/*` proxy (never direct backend calls).

### 6.2 Adapter Pattern
**File:** `src/lib/observatory/adapter.ts`

```typescript
interface ObservatoryAdapter {
  name: string
  transform(data: unknown): ObservatoryDataset
}

interface ObservatoryDataset {
  nodes: GraphNode[]
  edges?: GraphEdge[]
  stem?: DatasetStem    // STEM grounding metadata
}
```

### 6.3 MCP Tool Wiring

| Tool Domain | Tools | Used By |
|-------------|-------|---------|
| **viz_*** | viz_foundation, viz_biologics, viz_physics, viz_advanced | chemistry, molecule, regulatory, causality, timeline |
| **pv_*** | pv_signal_complete | causality, graph |
| **faers_*** | faers_search, faers_drug_events | graph |
| **guidelines_*** | guidelines_search, fda_guidance_search | regulatory |
| **drift_*** | drift_ks_test, drift_psi, drift_jsd | timeline |
| **epi_*** | epi_relative_risk, epi_odds_ratio, epi_attributable_fraction | epidemiology |

### 6.4 Preset Datasets (Graph Explorer)

| Dataset | Nodes | Purpose |
|---------|-------|---------|
| nexcore-layers | 4-layer DAG | NexCore architecture visualization |
| harm-taxonomies | ToV harm types | Theory of Vigilance structure |
| string-theory | Physics model | Cross-domain concept exploration |
| faers-live | Dynamic | Live FAERS adverse event query |

---

## 7. User Preferences

**File:** `src/lib/observatory/use-observatory-preferences.ts`
**Storage:** localStorage

| Preference | Type | Default |
|------------|------|---------|
| CVD mode | normal/protanopia/deuteranopia/tritanopia | normal |
| Default explorer | string | graph |
| Atmosphere | auto/deep-space/clinical/war-room/blueprint | auto |
| Quality | low/medium/high | medium |
| Worker layout | boolean | true |

Settings panel: `src/components/observatory/observatory-settings.tsx`

---

## 8. File Map

```
src/app/nucleus/observatory/
  CLAUDE.md                          # Module guidance (benchmarks)
  OBSERVATORY-SPEC.md                # This document
  page.tsx                           # Hub server page (metadata)
  observatory-hub.tsx                # Hub client (card grid)
  chemistry/
    page.tsx + chemistry-explorer.tsx + use-chemistry-data.ts + chemistry-adapter.ts
  molecule/
    page.tsx + molecule-explorer.tsx + use-molecule-data.ts
  regulatory/
    page.tsx + regulatory-explorer.tsx + use-regulatory-data.ts
  causality/
    page.tsx + causality-explorer.tsx + use-causality-data.ts
  timeline/
    page.tsx + timeline-explorer.tsx + use-timeline-data.ts
  epidemiology/
    page.tsx + epidemiology-explorer.tsx + use-epidemiology-data.ts
  graph/
    page.tsx + graph-explorer.tsx + use-signal-data.ts + graph-datasets.ts + live-signal-adapter.ts
  math/
    page.tsx + math-explorer.tsx + math-functions.ts + math-helpers.ts
  state/
    page.tsx + state-explorer.tsx
  careers/
    page.tsx + career-explorer.tsx + use-career-data.ts + career-adapter.ts
  learning/
    page.tsx + learning-explorer.tsx + use-learning-data.ts + learning-adapter.ts
  atlas/
    page.tsx + atlas-explorer.tsx + domain-translations.ts

src/components/observatory/           # Shared rendering components
  scene-container.tsx                 # Canvas + lights + controls + post-FX
  force-graph-3d.tsx                  # ForceGraph3D engine (~1500 lines)
  surface-plot-3d.tsx                 # SurfacePlot3D engine (~250 lines)
  state-orbit-3d.tsx                  # StateOrbit3D engine (~200 lines)
  instanced-graph.tsx                 # InstancedSignalCloud (1000s of particles)
  semantic-zoom.tsx                   # ZoomLevelBridge + AdaptiveNode
  glow-material.tsx                   # Custom glow shader
  uncertainty-material.tsx            # Confidence dissolve shader
  energy-edge.tsx                     # Animated edge glow
  post-processing.tsx                 # Bloom/SSAO/Vignette/DoF/CA pipeline
  cvd-geometry.tsx                    # CVD-safe shape encoding
  observatory-constants.ts            # All colors, physics, material, animation params
  graph-layouts.ts                    # Force/hierarchy/radial/grid algorithms
  observatory-settings.tsx            # Settings panel UI
  explorer-shared.tsx                 # ExplorerNav + CVD_OPTIONS
  index.ts                           # Re-exports

src/lib/observatory/                  # Library layer
  types.ts                           # All domain types
  explorer-registry.ts               # 12-explorer capability matrix
  themes.ts                          # 4 theme presets
  quality-presets.ts                  # Low/medium/high quality levels
  atmospheres.ts                     # 4 atmosphere definitions
  oklab.ts                           # OKLab perceptual color space
  visual-encoding.ts                 # Perceptual mapping functions
  adapter.ts                         # Data adapter interface
  use-explorer-effects.ts            # Quality preset -> effect toggles
  use-observatory-preferences.ts     # LocalStorage persistence
  use-worker-layout.ts               # Web Worker force layout
  worker-layout.ts                   # Worker physics engine
```

---

## 9. Performance SOP

| Constraint | Target | Implementation |
|------------|--------|----------------|
| Initial load per route | <200KB | `next/dynamic` lazy loading, code splitting |
| Frame rate | 60fps | Web Worker offload at 50+ nodes, instanced rendering |
| Node capacity | 200+ at 60fps | InstancedMesh for particles, LOD via semantic zoom |
| Graph capacity | 1000+ particles | InstancedSignalCloud component |
| Reduced motion | Respect OS setting | `prefers-reduced-motion` disables all post-FX and animations |
| Memory | Bounded | Dispose geometries/materials on unmount |

---

## 10. Accessibility SOP

| Requirement | Implementation |
|-------------|----------------|
| CVD support | Shape encoding on all ForceGraph3D explorers (4 modes) |
| Reduced motion | All animations + post-FX disabled when OS preference set |
| Keyboard navigation | ExplorerNav keyboard-navigable, OrbitControls keyboard-enabled |
| Text alternatives | Data tables alongside 3D views, STEM grounding text panels |
| Screen readers | aria-labels on explorer panels, semantic HTML structure |
| WCAG AA | Color contrast ratios verified across all 4 atmospheres |

---

## 11. Extension Points

| Extension | How To |
|-----------|--------|
| **Add new explorer** | Create route dir + page.tsx + explorer.tsx + use-*-data.ts, register in `explorer-registry.ts`, add to ExplorerNav in `explorer-shared.tsx` |
| **Add MCP tool wiring** | Create data hook using `call()` from `@/lib/nexcore-mcp/core`, return `{ data, loading, error, refetch }` |
| **Add atmosphere** | Add entry to `atmospheres.ts`, update `AtmosphereId` type |
| **Add layout algorithm** | Add to `graph-layouts.ts`, update layout type union |
| **Add visual encoding** | Add function to `visual-encoding.ts`, wire into ForceGraph3D props |
| **Add CVD shape** | Update `getNodeGeometry()` in `cvd-geometry.tsx` |

---

## 12. T1 Primitive Grounding

| Observatory Concept | T1 Primitive | Symbol |
|---------------------|-------------|--------|
| Force-directed layout | Causality | -> |
| Node size encoding | Quantity | N |
| Graph topology | Mapping | mu |
| Drug lifecycle stages | Sequence | sigma |
| Zoom levels | Boundary | partial |
| State machines | State | varsigma |
| Layout algorithms | Recursion | rho |
| Data absence (no signal) | Void | emptyset |
| OKLab perceptual distance | Comparison | kappa |
| Preferences persistence | Persistence | pi |
| Refresh intervals | Frequency | nu |
| Explorer routing | Location | lambda |
| Aggregated metrics | Sum | Sigma |

**Root composition:** Observatory = mu(Mapping) + lambda(Location) + N(Quantity)
Every explorer maps data (mu) to spatial positions (lambda) with encoded magnitudes (N).
