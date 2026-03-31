# App Module (Routing & Orchestration)

> **Path:** `src/app`

---

## 🎯 Purpose

The **App** module is the architectural backbone of the Studio application. Utilizing the **Next.js App Router**, it defines the platform's URL topology, manages the request-response lifecycle for pages, and serves as the top-level orchestrator connecting UI components to the NexCore business logic. It handles the critical transition between public-facing marketing content and the high-security Nucleus member portal.

## 🚀 Development Goals

1. **Deterministic Routing**: Maintain a clean, intuitive URL structure that maps 1:1 to the PDC v4.1 domain hierarchy.
2. **Server-First Logic**: Maximize use of React Server Components (RSC) to minimize client-side bundle size and improve time-to-first-byte (TTFB).
3. **Seamless Transitions**: Implement fluid, GPU-accelerated layout transitions between route groups using Framer Motion and Next.js view transitions.
4. **Context-Aware Layouts**: Ensure that global providers (Auth, Telemetry, Behavior) are initialized exactly once at the root level without blocking render.

## 🔭 Action Items & Aspirations

- [ ] **Dynamic Parallel Routes**: Implement parallel routing for the Admin Dashboard to allow side-by-side signal comparison.
- [ ] **Intercepting Routes**: Add "peek" capabilities for KSB details using Next.js intercepting routes (modals for quick reference).
- [ ] **Streaming Dashboard**: Transition all `/nucleus` dashboards to use partial pre-rendering (PPR) and Suspense-based streaming.
- [ ] **Local-First Caching**: Optimize the `nexcore-os` bridge to use client-side persistent caching for fast "back-forward" navigation.

## 🛡️ Management Measures

- **Security Gate (proxy.ts)**: Centralized route protection in `src/proxy.ts` prevents unauthorized access to the Nucleus portal before page render.
- **Metadata Enforcer**: Every `page.tsx` must export a `Metadata` object; missing metadata is flagged during the `audit:metadata` script run.
- **Route Group Isolation**: Use `(group)` folders to isolate layouts and styles between Public, Auth, and Nucleus contexts without affecting URLs.
- **Error Boundaries**: Granular `error.tsx` and `loading.tsx` files are required at every major segment to ensure partial system failures don't crash the UI.

---

## Quick Reference
...

## File Manifest

| File | Type | Purpose | Status |
|------|------|---------|--------|
| `layout.tsx` | Layout | Root structure: Fonts, Providers (Auth/Behavior), and global SEO | Active |
| `page.tsx` | Page | Flagship landing page: High-fidelity marketing and ecosystem entry | Active |
| `globals.css` | Style | Core CSS variables and global "Gemstone" visual effects | Active |
| `sitemap.ts` | Config | Automated generation of SEO sitemap for search engines | Active |
| `api/` | Directory| Backend API endpoints (Auth, Stats, Payments) | Active |
| `actions/` | Directory| Folder-scoped server actions for page-specific logic | Active |

### Core Route Groups

| Group | Purpose | Has Layout |
|-----------|---------|------------|
| `(public)` | Marketing, about, services, and community discovery | ✅ |
| `(legal)` | Privacy policy, terms of service, and disclosures | ✅ |
| `/nucleus/` | Main product dashboard (Academy, Guardian, Careers) | ✅ |
| `/auth/` | Authentication pages (Signin, Signup, Reset) | ✅ |

---

## Relationships & Data Flow

```
[Browser] → [Next.js Router] → [app/layout.tsx] → [Page Component]
                                      ↓                 ↓
                              [hooks/use-auth]   [lib/actions]
```

**Internal Dependencies:**
- `layout.tsx` initializes the `AuthProvider` which all sub-pages rely on for session state.
- Pages in `(public)` utilize `PublicPageWrapper` from `components/layout`.

**External Dependencies:**
- Aligned with **Vercel Analytics** and **Speed Insights** for performance tracking.
- Uses **Google Fonts** (Inter, Space Grotesk) via `next/font`.

---

## Usage Patterns

### Common Workflows

1. **Add a New Public Route**
   - Create a folder in `(public)/[route-name]` with a `page.tsx`.
   - Result: Automatically inherits the public styling and background network.

2. **Protect a Route**
   - Place the route inside `/nucleus/`.
   - Ensure the `NucleusLayout` handles the authentication check and redirect.

### Entry Points

- **Landing:** `src/app/page.tsx` — High-conversion gateway.
- **Member Home:** `src/app/nucleus/page.tsx` — The primary dashboard entry point.

---

## Conventions & Standards

- **Metadata:** Every `page.tsx` must export a `Metadata` object for SEO.
- **Route Groups:** Use `(parentheses)` for organizational route grouping that shouldn't affect the URL path.
- **Dynamic Imports:** Use `next/dynamic` for components below-the-fold to optimize TTI (Time to Interactive).

---

## Known Limitations

- [ ] Route-based transitions using `framer-motion` are currently limited to the root level.
- [ ] API routes in `app/api` do not share a common error-handling middleware (handled per-route).

---

## Navigation

| Direction | Link |
|-----------|------|
| ⬆️ Parent | [`../README.md`](../README.md) |
| ➡️ Components | [`../components/README.md`](../components/README.md) |
| ➡️ Lib | [`../lib/README.md`](../lib/README.md) |

---

*Application Orchestration. Verified by Platform Lead on 2024-12-28.*
