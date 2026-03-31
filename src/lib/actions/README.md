# Server Actions Module

> **Path:** `src/lib/actions`  
> **Parent:** [`../README.md`](../README.md)  
> **Last Verified:** 2024-12-28  
> **Maintainer:** Full Stack Lead / API Architect

---

## Purpose

The Server Actions module provides a centralized Data Access Layer (DAL) for the NexVigilant application. These files contain logic that executes exclusively on the server, utilizing the **Firebase Admin SDK** to bypass security rules for administrative tasks, user profile management, and complex business workflows (e.g., Stripe integration, threat ingestion).

---

## Quick Reference

| Aspect | Details |
|--------|---------|
| **Domain** | Backend / Data Access Layer |
| **Status** | Stable / Core |
| **Dependencies** | `firebase-admin`, `stripe`, `zod`, `lib/schemas` |
| **Outputs** | Action Results, Firestore Documents, Payment Sessions |

---

## File Manifest

| File | Type | Purpose | Status |
|------|------|---------|--------|
| `users.ts` | Action | Management of user profiles, preferences, and onboarding | Active |
| `threats.ts` | Action | Guardian threat event creation, retrieval, and resolution | Active |
| `stripe.ts` | Action | Orchestration of checkout sessions and portal management | Active |
| `system-stats.ts`| Action | Aggregation of platform-wide metrics (users, courses, signals) | Active |
| `unified-signup.ts`| Action | Atomic multi-step onboarding and enrollment flow | Active |

---

## Relationships & Data Flow

```
[Client Component] → [lib/actions/*.ts] → [lib/firebase-admin] → Firestore
                           ↓                    ↑
                   [lib/schemas/firestore]   [External APIs]
```

**Internal Dependencies:**
- All actions rely on `lib/firebase-admin.ts` for privileged database access.
- `users.ts` and `threats.ts` use Zod schemas from `lib/schemas/firestore.ts` for runtime validation.

**External Dependencies:**
- `stripe.ts` communicates with the **Stripe API** for billing and subscriptions.

---

## Usage Patterns

### Common Workflows

1. **Update User Profile**
   - Call `updateUserProfile(callerId, data)` from a client form.
   - Result: Privilege check (admin or owner) → Zod validation → Firestore update.

2. **Ingest Guardian Threat**
   - Call `createThreatEvent(data)` (typically from an admin tool or CRON job).
   - Result: Structured threat event creation with automated timestamping.

### Entry Points

- **Users:** `getUserProfile` — Primary way to fetch a complete user document on the server.
- **Threats:** `getCriticalThreats` — Retrieves unresolved high-priority safety events.

---

## Conventions & Standards

- **'use server' Directive:** Every file in this directory must start with `'use server'`.
- **Security Check:** Actions must manually verify authorization (e.g., `if (callerId !== targetUserId && callerRole !== 'admin')`).
- **Timestamp Serialization:** Firestore `Timestamp` objects must be converted to plain objects via `serializeTimestamps` before returning to client components.
- **Branded IDs:** Use string IDs consistent with the `@/types` system.

---

## Known Limitations

- [ ] `searchUserByEmail` requires a full collection scan; needs migration to a dedicated index or Algolia.
- [ ] No global transaction wrapper across different action modules.

---

## Navigation

| Direction | Link |
|-----------|------|
| ⬆️ Parent | [`../README.md`](../README.md) |
| ➡️ Schemas | [`../schemas/README.md`](../schemas/README.md) |
| ➡️ API | [`../../app/api/README.md`](../../app/api/README.md) |

---

*Backend Command & Control. Verified by Backend Lead on 2024-12-28.*
