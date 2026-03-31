# components (The Interface)

> **Path:** `src/components`

---

## 🎯 Purpose

The **components** directory contains the visual building blocks of the Studio application. It follows an Atomic Design philosophy, ranging from primitive UI elements (shadcn/ui) to complex, domain-specific visualizations and layouts. This module is responsible for manifesting the "Vigilance Intelligence Agency" aesthetic and ensuring a consistent, high-performance user experience across the entire platform.

## 🚀 Development Goals

1. **Atomic Consistency**: Enforce a strict hierarchy from `ui/` atoms to feature-level organisms, ensuring reuse and preventing style drift.
2. **Visual Fidelity**: Leverage Framer Motion and Three.js to create immersive, data-driven visualizations of complex pharmacovigilance concepts.
3. **Accessibility-First**: Maintain WCAG 2.1 compliance across all components, utilizing the `lint:a11y-colors` script to verify contrast ratios.
4. **Performance Optimization**: Use dynamic imports and partial pre-rendering (PPR) for heavy visualization components to keep the main bundle light and interactive.

## 🔭 Action Items & Aspirations

- [ ] **NextUI/Shadcn Migration**: Complete the unification of the `ui/` directory under the shadcn/ui pattern.
- [ ] **3D Safety Manifold**: Finalize the interactive WebGL visualization of the safety manifold in `visualizations/`.
- [ ] **Mobile-First Refactoring**: Audit all `nucleus/` components for sub-400px viewport support.
- [ ] **Branded Component Library**: Expand the `ui/branded/` directory with unique NexVigilant interaction patterns (e.g., `MagneticButton`).

## 🛡️ Management Measures

- **Component Registry**: Maintain the `COMPONENT-REGISTRY.md` as the single source of truth for component discovery and usage patterns.
- **Boundary Enforcement**: Every major UI section must be wrapped in a `LoadingBoundary` and `ErrorBoundary` from `layout/boundaries/`.
- **Prop Gating**: Use Zod or strict TypeScript interfaces for all component props to prevent runtime type errors.
- **Visual Regression Tests**: Utilize Playwright screenshots to detect unexpected visual changes in core UI components during CI/CD.

---

## Quick Reference
See [COMPONENT-REGISTRY.md](./COMPONENT-REGISTRY.md) for a full manifest of available components and usage patterns.
