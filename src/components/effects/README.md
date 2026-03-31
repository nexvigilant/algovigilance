# Effects Module

> **Path:** `src/components/effects`  
> **Parent:** [`../README.md`](../README.md)  
> **Last Verified:** 2024-12-28  
> **Maintainer:** Creative Technologist / Motion Designer

---

## Purpose

The Effects module manages the NexVigilant platform's ambient motion and atmospheric visuals. It is responsible for the "Bio-Digital" aesthetic, blending organic biological patterns (Neural Network SVG) with crisp digital interfaces (Circuit Backgrounds). These components are designed to be high-impact but low-overhead, utilizing GPU-accelerated SVG and CSS animations to maintain performance.

---

## Quick Reference

| Aspect | Details |
|--------|---------|
| **Domain** | Ambient UI / Motion Graphics |
| **Status** | Stable / Active |
| **Dependencies** | `lucide-react`, `lib/utils` |
| **Outputs** | Decorative Backgrounds, Particle Systems, Animated SVG Pathing |

---

## File Manifest

| File | Type | Purpose | Status |
|------|------|---------|--------|
| `neural-network-svg/` | Unit | Primary organic background with bezier path signal animations | Active |
| `ambient-particles.tsx`| Unit | Subtle floating bokeh effects for depth and texture | Active |
| `circuit-background.tsx`| Unit | Geometric PCB-style grid with pulsing data nodes | Active |
| `emerald-city-background.tsx`| Unit | Premium metallic sweeping light effects for featured sections | Active |
| `prismatic-rays.tsx` | Unit | Interactive light refraction rays that respond to cursor movement | Active |
| `index.ts` | Barrel | Central entry point for all visual effects | Active |

### Subdirectories

| Directory | Purpose | Has README |
|-----------|---------|------------|
| `/deprecated/` | Legacy Canvas-based effects kept for reference/admin | ✅ |

---

## Relationships & Data Flow

```
[Page Wrapper] → [Effects Module] → [SVG/CSS/Canvas] → GPU Render
       ↑                ↓
 [Theme Config] → [Animation State]
```

**Internal Dependencies:**
- Effects are typically consumed by `layout/wrappers` (e.g., `PublicPageWrapper`).
- `NeuralNetworkSVG` uses deterministic hashing for SSR-safe random path generation.

**External Dependencies:**
- Heavily relies on **CSS @keyframes** and **SVG <animateMotion>** for zero-JS-overhead animation.

---

## Usage Patterns

### Common Workflows

1. **Add Ambient Background to Page**
   - Place `<NeuralNetworkSVG theme="guardian" opacity={0.5} />` as the first child of a relative container.
   - Result: A full-bleed, security-themed animated background.

2. **Add Depth to Hero Section**
   - Overlay `<AmbientParticles count={20} />` on a dark gradient background.
   - Result: Subtle floating particles that enhance the gemstone/crystal depth.

### Entry Points

- **Primary:** `src/components/effects/index.ts` — Import any effect component.
- **Legacy:** `src/components/effects/deprecated/` — Only for experimental testing.

---

## Conventions & Standards

- **Decorative Integrity:** All effects must include `aria-hidden="true"` and `pointer-events-none`.
- **GPU Acceleration:** Favor `transform` (translate/rotate) and `opacity` for animations to avoid layout repaints.
- **SSR Safety:** Any random values must be deterministic (based on a seed/hash) to prevent React hydration mismatches.

---

## Known Limitations

- [ ] High particle counts (>50) in `AmbientParticles` can cause significant CPU usage on mobile browsers.
- [ ] `PrismaticRays` uses a mouse-move listener; must be manually disabled on touch-only devices.

---

## Navigation

| Direction | Link |
|-----------|------|
| ⬆️ Parent | [`../README.md`](../README.md) |
| ➡️ Layout | [`../layout/README.md`](../layout/README.md) |
| ➡️ Visuals | [`../visualizations/README.md`](../visualizations/README.md) |

---

*Atmospheric Motion Layer. Verified by Creative Lead on 2024-12-28.*
