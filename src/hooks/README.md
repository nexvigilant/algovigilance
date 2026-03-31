# Hooks Module

> **Path:** `src/hooks`  
> **Parent:** [`../README.md`](../README.md)  
> **Last Verified:** 2024-12-28  
> **Maintainer:** Frontend Lead / UX Architect

---

## Purpose

The Hooks module provides the stateful logic and API interfaces for NexVigilant's UI. These React hooks abstract complex behaviors—such as authentication state, real-time Firestore listeners, and AI-guided workflow navigation—allowing components to remain purely presentational and easily testable.

---

## Quick Reference

| Aspect | Details |
|--------|---------|
| **Domain** | React State / Data Fetching / Side Effects |
| **Status** | Stable / Core |
| **Dependencies** | `firebase/auth`, `swr`, `react-hook-form`, `lucide-react` |
| **Outputs** | Context Providers, Stateful Values, Dispatchers |

---

## File Manifest

| File | Type | Purpose | Status |
|------|------|---------|--------|
| `use-auth.tsx` | Auth | Centralized Firebase Auth state and user synchronization | Active |
| `use-server-action-form.tsx`| UI | Integration between Zod, React Hook Form, and Server Actions | Active |
| `use-unread-counts.ts` | Data | Real-time listeners for messaging and notifications | Active |
| `use-video-progress.ts`| Data | Debounced persistence of learner video watch time | Active |
| `use-analytics.tsx` | Telemetry | Interface for tracking UI events and conversions | Active |
| `use-neural-circuit.ts`| FX | Logic for controlling circuit-themed animation states | Active |

### Subdirectories

| Directory | Purpose | Has README |
|-----------|---------|------------|
| `/advanced/` | Complex UI logic (infinite scroll, optimistic updates) | ❌ |
| `/behavior-tracking/` | Algorithmic tracking of user interaction patterns | ❌ |

---

## Relationships & Data Flow

```
[UI Component] → [Custom Hook] → [Context/SWR Cache]
                       ↓                ↑
               [lib/actions] → [lib/firebase-admin]
```

**Internal Dependencies:**
- `use-auth.tsx` provides the base user object used by nearly all other hooks.
- `use-analytics.tsx` is typically called within effect hooks to track lifecycle events.

**External Dependencies:**
- Utilizes **SWR** for client-side caching and revalidation.
- Relies on **Firebase Client SDK** for real-time socket connections.

---

## Usage Patterns

### Common Workflows

1. **Access Current User**
   - Call `const { user, loading } = useAuth();`.
   - Result: Reactive user object (client-side) with automated profile sync.

2. **Handle Type-Safe Form**
   - Call `useServerActionForm({ schema, action, onSuccess })`.
   - Result: Form state, error handling, and server action submission in one hook.

### Entry Points

- **Context:** `AuthProvider` — Must wrap the application root.
- **UI Interaction:** `useToast`, `useMobile`, `useBreadcrumbs`.

---

## Conventions & Standards

- **Suffix Naming:** All custom hooks must start with the `use` prefix.
- **Client Only:** Ensure hooks utilizing browser APIs (e.g., `localStorage`) handle the SSR environment (check `typeof window`).
- **Memoization:** Wrap expensive logic in `useMemo` or `useCallback` to prevent unnecessary child re-renders.

---

## Known Limitations

- [ ] `use-local-storage.ts` does not synchronize across multiple tabs automatically.
- [ ] Analytics tracking uses a "fire and forget" pattern; no guaranteed delivery for critical events.

---

## Navigation

| Direction | Link |
|-----------|------|
| ⬆️ Parent | [`../README.md`](../README.md) |
| ➡️ Components | [`../components/README.md`](../components/README.md) |
| ➡️ Advanced | [`./advanced/README.md`](./advanced/README.md) |

---

*UI Logic Kernels. Verified by Frontend Lead on 2024-12-28.*
