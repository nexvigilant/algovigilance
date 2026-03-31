# Advanced Hooks Module

> **Path:** `src/hooks/advanced`  
> **Parent:** [`../README.md`](../README.md)  
> **Last Verified:** 2024-12-28  
> **Maintainer:** Performance & Core UX Lead

---

## Purpose

The Advanced Hooks module contains complex, reusable UI logic designed for high-performance data handling and optimized user experiences. These hooks handle non-trivial patterns such as optimistic UI updates, infinite scrolling with intersection observers, and granular component-level performance monitoring.

---

## Quick Reference

| Aspect | Details |
|--------|---------|
| **Domain** | Advanced React Patterns / Performance |
| **Status** | Stable / Core |
| **Dependencies** | `IntersectionObserver`, `Performance API`, `Next.js Server Actions` |
| **Outputs** | Mutation Handlers, Sentinel Refs, Performance Telemetry |

---

## File Manifest

| File | Type | Purpose | Status |
|------|------|---------|--------|
| `use-optimistic-update.tsx`| Pattern | Atomic server-action mutations with instant UI feedback and rollback | Active |
| `use-infinite-scroll.tsx` | UI | Intersection Observer-based loading for long lists and feeds | Active |
| `use-render-performance.tsx`| Dev | High-precision measurement of render times and paint cycles | Active |
| `use-paginated-query.tsx` | Data | Management of page-based data fetching and navigation state | Active |
| `use-media-query.tsx` | UI | Centralized breakpoint detection synced with design tokens | Active |
| `use-debounce.tsx` | Logic | Standardized value debouncing for search and expensive filters | Active |
| `index.ts` | Barrel | Central entry point for all advanced hooks | Active |

---

## Relationships & Data Flow

```
[User Action] → [useOptimisticUpdate] → [UI State Update (Local)]
                       ↓
               [Server Action] → [Success/Rollback (Global)]
```

**Internal Dependencies:**
- `index.ts` provides a consolidated interface for the UI layer.
- `use-media-query.tsx` is typically used in layout-sensitive components (e.g., sidebars).

**External Dependencies:**
- Relies on **Next.js Server Actions** for the mutation logic in optimistic updates.
- Uses the browser's native **IntersectionObserver** for infinite scrolling.

---

## Usage Patterns

### Common Workflows

1. **Implement Optimistic Like Button**
   - Call `useOptimisticUpdate({ mutationFn: likePost, onOptimisticUpdate: ... })`.
   - Result: UI updates immediately; rolls back automatically if the server request fails.

2. **Create Infinite Feed**
   - Attach `sentinelRef` from `useInfiniteScroll` to a footer div.
   - Result: `loadMore` triggers automatically as the user reaches the bottom.

### Entry Points

- **Primary:** `src/hooks/advanced/index.ts` — Import any advanced primitive.
- **Critical:** `useOptimisticUpdate` — Mandatory for high-fidelity interactive features.

---

## Conventions & Standards

- **Lifecycle Protection:** All async operations in these hooks must check if the component is still mounted (`isMounted.current`) before updating state.
- **Idempotency:** `reset()` functions should return the hook state to its exact `initialData` configuration.
- **Thresholds:** Media queries and infinite scroll thresholds should favor the constants defined in `lib/constants/config.ts`.

---

## Known Limitations

- [ ] `use-infinite-scroll.tsx` does not currently support windowing/virtualization for extremely large lists (>5,000 items).
- [ ] `use-render-performance.tsx` adds minor overhead; intended for development/QA builds only.

---

## Navigation

| Direction | Link |
|-----------|------|
| ⬆️ Parent | [`../README.md`](../README.md) |
| ➡️ Components | [`../../components/README.md`](../../components/README.md) |
| ➡️ Lib | [`../../lib/README.md`](../../lib/README.md) |

---

*High-Fidelity UI Kernels. Verified by Core Lead on 2024-12-28.*
