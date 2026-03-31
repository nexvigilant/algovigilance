# UI Module

> **Path:** `src/components/ui`  
> **Parent:** [`../README.md`](../README.md)  
> **Last Verified:** 2024-12-28  
> **Maintainer:** Design System Lead / UI Engineer

---

## Purpose

The UI module contains the atomic and primitive building blocks of the NexVigilant interface. It is split into two distinct tiers: **Standard Primitives** (powered by Radix UI and shadcn/ui) and **Branded Components** (custom high-fidelity components that implement the neural-circuit aesthetic).

---

## Quick Reference

| Aspect | Details |
|--------|---------|
| **Domain** | Atomic Design / Visual Language |
| **Status** | Stable / Core |
| **Dependencies** | `radix-ui`, `lucide-react`, `tailwind-merge`, `clsx` |
| **Outputs** | Reusable UI Primitives and Styled Components |

---

## File Manifest

### Standard Primitives (shadcn/ui)
*These are standard components configured for the NexVigilant theme.*
- `button.tsx`, `card.tsx`, `dialog.tsx`, `tabs.tsx`, etc.

### Subdirectories

| Directory | Purpose | Has README |
|-----------|---------|------------|
| `/branded/` | High-fidelity "Neural" components (Circuit buttons, stat cards) | ❌ |
| `/nucleus/` | Specialized UI elements for the Nucleus dashboard | ❌ |

---

## Relationships & Data Flow

```
[Tailwind CSS] → [shadcn/ui Primitives] → [Branded Components]
                       ↑                         ↑
               [lib/utils.ts]             [hooks/use-neural-circuit]
```

**Internal Dependencies:**
- `index.ts` provides a convenience barrel for all standard primitives.
- `branded/` components often extend standard primitives (e.g., `CircuitButton` extends `Button`).

**External Dependencies:**
- Aligned with **Radix UI** for accessible, headless primitive logic.

---

## Usage Patterns

### Common Workflows

1. **Adding a New Primitive**
   - Use `npx shadcn-ui@latest add [component]` if it's a standard block.
   - Adjust Tailwind classes to match the design tokens in `lib/design-tokens.ts`.

2. **Creating a Branded Interaction**
   - Utilize `CircuitButton` for primary CTAs to automatically include the sweeping light sweep and glow effects defined in `globals.css`.

### Entry Points

- **Primary:** `src/components/ui/index.ts` — Import atomic primitives.
- **Visual:** `src/components/ui/branded/index.ts` — Import themed components.

---

## Conventions & Standards

- **Accessibility First:** Every component must support keyboard navigation and include ARIA labels where appropriate.
- **Composition:** Favor component composition over large, complex prop sets (e.g., `Card` > `CardHeader` > `CardTitle`).
- **Dynamic Classes:** Always use the `cn()` utility for merging Tailwind classes to prevent conflict.
- **Theme-Aware:** Hardcoded colors are prohibited; use Tailwind theme aliases (e.g., `text-cyan`, `bg-gold`).

---

## Known Limitations

- [ ] Some Radix primitives (e.g., `ScrollArea`) have cross-browser styling inconsistencies in Firefox.
- [ ] Branded animations rely on CSS `@keyframes`; performance may degrade on extremely low-end mobile devices with high particle counts.

---

## Navigation

| Direction | Link |
|-----------|------|
| ⬆️ Parent | [`../README.md`](../README.md) |
| ➡️ Layout | [`../layout/README.md`](../layout/README.md) |
| ⬅️ Lib | [`../../lib/design-tokens.ts`](../../lib/design-tokens.ts) |

---

*Atomic UI Core. Verified by Design Lead on 2024-12-28.*
