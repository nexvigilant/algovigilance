# Layout Module

> **Path:** `src/components/layout`  
> **Parent:** [`../README.md`](../README.md)  
> **Last Verified:** 2024-12-28  
> **Maintainer:** Frontend Architect

---

## Purpose

The Layout module defines the structural shell of the NexVigilant application. it provides consistent page wrappers, navigation headers, footers, and critical runtime boundaries (Error/Loading). It manages the "Gemstone Crystal" aesthetic through background overlays and ensures all pages adhere to WCAG accessibility standards through skip-links and ARIA landmarks.

---

## Quick Reference

| Aspect | Details |
|--------|---------|
| **Domain** | Page Structure / Global UX |
| **Status** | Stable / Core |
| **Dependencies** | `lucide-react`, `next/dynamic`, `lib/utils` |
| **Outputs** | Structural Containers, Headers, Footers, Navigation Menus |

---

## File Manifest

| File | Type | Purpose | Status |
|------|------|---------|--------|
| `index.ts` | Barrel | Centralized exports for all structural components | Active |

### Subdirectories

| Directory | Purpose | Has README |
|-----------|---------|------------|
| `/wrappers/` | High-level page containers (Public, Nucleus, Auth) | ❌ |
| `/headers/` | Navigation bars for different application contexts | ❌ |
| `/footers/` | Standard and minimal site footers | ❌ |
| `/navigation/`| Breadcrumbs and complex menu logic | ❌ |
| `/boundaries/`| Error boundaries, loading spinners, and empty states | ❌ |

---

## Relationships & Data Flow

```
[Root Layout] → [Page Wrapper] → [SiteHeader] → [Breadcrumbs]
                       ↓              ↓
               [Error Boundary] → [Page Content]
```

**Internal Dependencies:**
- `wrappers` use `headers` and `footers` to compose the full page structure.
- `boundaries` wrap the `main-content` area within page wrappers to catch runtime exceptions.

**External Dependencies:**
- `wrappers` lazy-load expensive decorative effects from `components/effects`.
- `navigation` components often consume hooks like `useBreadcrumbs`.

---

## Usage Patterns

### Common Workflows

1. **Create a New Public Page**
   - Wrap the page content in `<PublicPageWrapper>`.
   - Result: Automatically includes the background neural network, header, and footer.

2. **Handle Section Errors**
   - Wrap a complex component in `<ErrorBoundary>`.
   - Result: Prevents a single component failure from crashing the entire page.

### Entry Points

- **Public:** `PublicPageWrapper` — The standard shell for marketing and info pages.
- **App:** `NucleusHeader` — The primary navigation for the logged-in dashboard.

---

## Conventions & Standards

- **Semantic HTML:** Always use `<header>`, `<main>`, `<footer>`, and `<nav>` tags appropriately.
- **Skip Links:** Every page wrapper must include the `SkipToContent` component at the very top.
- **Lazy Loading:** Use `dynamic()` for decorative background effects to prioritize LCP (Largest Contentful Paint).

---

## Known Limitations

- [ ] Sticky headers currently have slight "jitter" in mobile Safari during rapid scrolling.
- [ ] `NucleusHeader` needs refactoring to reduce its 450+ line size into smaller sub-modules.

---

## Navigation

| Direction | Link |
|-----------|------|
| ⬆️ Parent | [`../README.md`](../README.md) |
| ⬅️ UI | [`../ui/README.md`](../ui/README.md) |
| ➡️ Shared | [`../shared/README.md`](../shared/README.md) |

---

*Structural Foundation. Verified by Frontend Lead on 2024-12-28.*
