# Visualizations Module

> **Path:** `src/components/visualizations`  
> **Parent:** [`../README.md`](../README.md)  
> **Last Verified:** 2024-12-28  
> **Maintainer:** Neural FX & Data Visualization Lead

---

## Purpose

The Visualizations module houses NexVigilant's high-fidelity, interactive data representations. It focuses on rendering complex mathematical and cognitive concepts—such as neural manifold projection and sparse coding efficiency—using advanced web technologies like **Three.js (WebGL)** and **Recharts**. These visualizations serve both as educational tools and live system health indicators.

---

## Quick Reference

| Aspect | Details |
|--------|---------|
| **Domain** | Data Viz / Neural FX / WebGL |
| **Status** | Stable / Active |
| **Dependencies** | `three`, `recharts`, `lib/design-tokens` |
| **Outputs** | WebGL Canvases, Interactive Charts, Real-time Metric Displays |

---

## File Manifest

| File | Type | Purpose | Status |
|------|------|---------|--------|
| `neural-manifold/` | Unit | High-performance 3D projection of neural state trajectories | Active |
| `index.ts` | Barrel | Central entry point for all system visualizations | Active |

### Integrated Modules
*The following are re-exported for a unified namespace but reside in their own directories:*
- **Sparse Coding:** (from `components/sparse-coding`) Efficiency charts and network configuration panels.

---

## Relationships & Data Flow

```
[System Metrics] → [Simulation Refs] → [Three.js Loop] → WebGL Canvas
        ↑                                   ↓
[User Controls] → [React State] → [Throttled UI Update] → Stats Overlay
```

**Internal Dependencies:**
- Utilizes `lib/design-tokens.ts` for strictly themed color and font injection into non-CSS environments (Canvas/SVG).
- `NeuralManifoldVisualization` uses a "Mutable Simulation Parameters" pattern to prevent React re-renders during high-frequency animation cycles.

**External Dependencies:**
- Relies on **Three.js** for WebGL orchestration and resource management (geometries, materials).

---

## Usage Patterns

### Common Workflows

1. **Embed the Neural Manifold**
   - Use `<NeuralManifoldWrapper />` for a responsive, full-height experience.
   - Adjust `noiseLevel` and `sparsity` to visualize different cognitive states.

2. **Render Sparse Coding Data**
   - Call `useSparseCodingMetrics(config)` and pass results to `<EfficiencyChart />`.
   - Result: A themed Recharts area chart showing bits/joule efficiency.

### Entry Points

- **Primary:** `src/components/visualizations/index.ts` — Import any viz unit.
- **Top-Tier:** `NeuralManifoldVisualization` — The flagship 3D experience.

---

## Conventions & Standards

- **Resource Disposal:** Every Three.js component *must* dispose of geometries, materials, and textures in a `useEffect` cleanup block to prevent memory leaks.
- **Frame Throttling:** Non-visual UI updates (e.g., updating a % counter) should be throttled to 6-10 fps while the render loop continues at 60 fps.
- **High-Performance Preference:** WebGL renderers should be initialized with `powerPreference: "high-performance"`.

---

## Known Limitations

- [ ] WebGL support is required; no SVG/Canvas fallback currently exists for the 3D manifold.
- [ ] `NeuralManifoldVisualization` uses absolute positioning (100vh); requires a dedicated container with hidden overflow.

---

## Navigation

| Direction | Link |
|-----------|------|
| ⬆️ Parent | [`../README.md`](../README.md) |
| ➡️ Sparse Coding | [`../sparse-coding/README.md`](../sparse-coding/README.md) |
| ⬅️ Core Lib | [`../../lib/design-tokens.ts`](../../lib/design-tokens.ts) |

---

*High-Fidelity Viz Core. Verified by Viz Lead on 2024-12-28.*
