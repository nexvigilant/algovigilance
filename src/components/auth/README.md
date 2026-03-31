# Auth Components Module

> **Path:** `src/components/auth`  
> **Parent:** [`../README.md`](../README.md)  
> **Last Verified:** 2024-12-28  
> **Maintainer:** Auth & Security Engineer

---

## Purpose

The Auth Components module provides the user interface for identity management on the NexVigilant platform. It handles sign-in, multi-step unified registration, and password recovery. These components are designed to be high-security and low-friction, integrating directly with Firebase Auth and the platform's profile synchronization logic.

---

## File Manifest

| File | Type | Purpose | Status |
|------|------|---------|--------|
| `auth-form.tsx` | UI | Standard email/password and OAuth provider entry point | Active |
| `unified-signup-form.tsx`| UI | Complex multi-step wizard combining account creation and professional profile | Active |
| `auth-loading.tsx` | UI | Full-page skeleton and transition state for authentication | Active |
| `coming-soon.tsx` | UI | Placeholder for gated features in development | Active |
| `index.ts` | Barrel | Central entry point for all auth UI components | Active |

---

## Navigation

| Direction | Link |
|-----------|------|
| ⬆️ Parent | [`../README.md`](../README.md) |
| ➡️ Hooks | [`../../hooks/use-auth.tsx`](../../hooks/use-auth.tsx) |

---

*Identity UI Core. Verified by Security Lead on 2024-12-28.*
