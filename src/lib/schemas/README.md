# Schemas Module

> **Path:** `src/lib/schemas`  
> **Parent:** [`../README.md`](../README.md)  
> **Last Verified:** 2024-12-28  
> **Maintainer:** API & Data Architect

---

## Purpose

The Schemas module serves as the central source of truth for data validation and type safety across the NexVigilant platform. It utilizes **Zod** to define schemas for Firestore documents, server action inputs, and public-facing forms. This ensures strict runtime validation, preventing malformed data from entering the database and providing automated TypeScript interface generation.

---

## Quick Reference

| Aspect | Details |
|--------|---------|
| **Domain** | Data Validation / Type Safety |
| **Status** | Stable / Core |
| **Dependencies** | `zod`, `firebase/firestore` (Timestamps) |
| **Outputs** | Zod Schemas, Inferred TypeScript Types |

---

## File Manifest

| File | Type | Purpose | Status |
|------|------|---------|--------|
| `firestore.ts` | Schema | Comprehensive schemas for all Firestore collections (Users, Courses, Threats) | Active |
| `affiliate.ts` | Schema | Validation for ambassador, advisor, and affiliate applications | Active |
| `contact.ts` | Schema | Schemas for general inquiries and consulting lead generation | Active |
| `waitlist.ts` | Schema | Simple email validation for the early-access waitlist | Active |
| `index.ts` | Barrel | Centralized exports for all schemas and inferred types | Active |

---

## Relationships & Data Flow

```
[UI Form] → [lib/schemas/*.ts] → [Validation Result]
                     ↓
[Server Action] → [Zod.parse()] → [Firestore Write]
                     ↓
[Firestore Read] → [Zod.safeParse()] → [Typed Component Props]
```

**Internal Dependencies:**
- `firestore.ts` provides the foundational schemas for `lib/actions`.
- `affiliate.ts` and `contact.ts` share common field patterns (e.g., email, URL).

**External Dependencies:**
- Schemas are used by **Server Actions** (`lib/actions`) to validate payloads before database operations.
- Client-side forms use these schemas via **React Hook Form** resolvers.

---

## Usage Patterns

### Common Workflows

1. **Validate Action Input**
   - Import `UpdateUserProfileInputSchema`.
   - Call `validatedData = UpdateUserProfileInputSchema.parse(input)`.
   - Result: Guaranteed safe data or a descriptive Zod error.

2. **Define New Collection**
   - Add the Zod object to `firestore.ts`.
   - Use `z.infer<typeof NewSchema>` to export the TypeScript type.
   - Use `z.custom<Timestamp>()` for date fields to ensure Firebase compatibility.

### Entry Points

- **Primary:** `src/lib/schemas/index.ts` — Import any schema or type from here.
- **Admin:** `UserProfileSchema` — The most critical schema for authorization and roles.

---

## Conventions & Standards

- **Suffix Naming:** Always suffix Zod schemas with `Schema` (e.g., `UserSchema`).
- **Input vs. Document:** Distinguish between a full document schema (with timestamps/IDs) and an `InputSchema` (used for creation, omits auto-fields).
- **Branded Types:** Where possible, use branded strings for IDs to prevent cross-collection ID confusion.

---

## Known Limitations

- [ ] Firestore `Timestamp` objects require custom Zod handling as they are not native Date objects.
- [ ] Circular dependencies can occur if schemas reference each other across different files; keep related sub-schemas in `firestore.ts`.

---

## Navigation

| Direction | Link |
|-----------|------|
| ⬆️ Parent | [`../README.md`](../README.md) |
| ➡️ Actions | [`../actions/README.md`](../actions/README.md) |
| ⬇️ Data | [`../../data/README.md`](../../data/README.md) |

---

*Data Integrity Engine. Verified by Data Lead on 2024-12-28.*
