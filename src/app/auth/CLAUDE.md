# CLAUDE.md — Auth Module

Authentication flows — the secure gateway to the Nucleus portal. Simple, fast, accessible, and bulletproof.

## Benchmark Governance (INVARIANT)

This document describes the REALIZED state of this module — the standard we hold.

**The One Rule:** When reality diverges from what is stated here, improve reality. NEVER lower this document to match code.

## Pages

| Route | Purpose |
|-------|---------|
| `signin/` | Email/password and social sign-in |
| `signup/` | New account registration |
| `reset-password/` | Password reset flow |

## Product Benchmarks

| Domain | Benchmark |
|--------|-----------|
| **Security** | Firebase Auth with server-side session validation. Zero auth bypass paths. Token refresh is automatic and transparent. |
| **Speed** | Auth pages load in <1s. Sign-in flow completes in <2 steps. Password reset emails deliver within 60 seconds. |
| **Error Handling** | Every auth error surfaces a clear, user-friendly message. No raw Firebase error codes reach the UI. Error messages never reveal account existence. |
| **Accessibility** | All auth forms are WCAG 2.1 AA compliant. Labels on every input. Error messages associated via aria-describedby. Keyboard-navigable tab order. |
| **Validation** | Client-side validation on all fields before submission. Server-side validation on all auth actions. Email format, password strength, and required field checks. |
| **Brand** | Auth pages maintain the clinical intelligence aesthetic. Consistent with the platform visual identity. |

## Architecture Rules

- **Layout**: Shared `auth/layout.tsx` with centered card design
- **No middleware**: Route protection via `src/proxy.ts`, never `middleware.ts`
- **Firebase Client SDK**: Auth pages use client SDK (`@/lib/firebase.ts`) for auth operations
- **Redirect**: Successful auth redirects to `/nucleus` via router
