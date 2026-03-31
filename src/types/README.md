# Types Module (Domain Contracts)

> **Path:** `src/types`  
> **Parent:** [`../README.md`](../README.md)  
> **Last Verified:** 2024-12-28  
> **Maintainer:** Lead Architect

---

## Purpose

The Types module defines the platform's formal domain models and data contracts. It provides a centralized location for TypeScript interfaces, enums, and branded types, ensuring strict type safety and consistency across the frontend, backend, and external API integrations.

---

## File Manifest

| File | Type | Purpose | Status |
|------|------|---------|--------|
| `pdc-framework.ts` | Domain | The CPA > EPA > Domain > KSB hierarchy (1,286 units) | Active |
| `clinical-pathways.ts`| Domain | State machine and context interfaces for guided workflows | Active |
| `alo.ts` | Entity | The 4-phase Active Learning Object structure | Active |
| `federated-signal.ts` | Math | Privacy-preserving aggregation and signal detection types | Active |
| `community.ts` | Entity | Profiles, reputation levels, and badge definitions | Active |
| `index.d.ts` | Global | Global ambient declarations and utility types | Active |

---

## Conventions & Standards

- **Branded IDs:** Use branded string types (e.g., `type UserId = string & { __brand: 'UserId' }`) for primary keys to prevent accidental misuse.
- **Consistency:** Types here must match the Zod schemas in `lib/schemas` for end-to-end safety.
- **Readonly by Default:** Domain entities should favor `readonly` properties to encourage immutable state patterns.

---

## Navigation

| Direction | Link |
|-----------|------|
| ⬆️ Parent | [`../README.md`](../README.md) |
| ➡️ Schemas | [`../lib/schemas/README.md`](../lib/schemas/README.md) |

---

*Type Safety Registry. Verified by Architect on 2024-12-28.*
