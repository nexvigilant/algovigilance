# Data Module (Static Configuration)

> **Path:** `src/data`  
> **Parent:** [`../README.md`](../README.md)  
> **Last Verified:** 2024-12-28  
> **Maintainer:** Content & Product Lead

---

## Purpose

The Data module serves as the platform's "Hardcoded Knowledge Base." It contains static configuration, content definitions, and business rules that do not require a database but should be decoupled from UI code for easy updates. This includes navigation structures, academy pathways, service outcomes, and the PDC framework taxonomy.

---

## Quick Reference

| Aspect | Details |
|--------|---------|
| **Domain** | Static Content / Business Config |
| **Status** | Stable |
| **Dependencies** | `lucide-react`, `lib/constants` |
| **Outputs** | Nav Menus, Pricing Tiers, Question Sets, Master Lists |

---

## File Manifest

| File | Type | Purpose | Status |
|------|------|---------|--------|
| `navigation.ts` | Config | Site-wide header, footer, and mobile menu structure | Active |
| `service-outcomes.ts`| Content | Mapping of consulting categories to deliverables and outcomes | Active |
| `wizard-questions.ts`| Data | The full 5-domain diagnostic questionnaire for the Service Wizard | Active |
| `membership.ts` | Pricing | Plans, features, and billing tiers for individual/enterprise | Active |
| `changelog.json` | Data | Historical record of platform updates and releases | Active |

### Subdirectories

| Directory | Purpose | Has README |
|-----------|---------|------------|
| `/pdc/` | Master data for the 1,286 KSB taxonomy | ❌ |
| `/pathways/` | State machine definitions for guided workflows | ❌ |
| `/regulatory/`| Country-specific deadline and reporting rules | ❌ |

---

## Usage Patterns

### Common Workflows

1. **Update Nav Links**
   - Modify `JOURNEY_NAVIGATION` in `navigation.ts`.
   - Result: Global header and footer update instantly.

2. **Adjust Diagnostic Logic**
   - Update the `scores` object for an option in `wizard-questions.ts`.
   - Result: Changes how the Service Wizard calculates organizational maturity.

---

## Navigation

| Direction | Link |
|-----------|------|
| ⬆️ Parent | [`../README.md`](../README.md) |
| ➡️ Types | [`../types/README.md`](../types/README.md) |
| ➡️ Constants | [`../lib/constants/README.md`](../lib/constants/README.md) |

---

*Content Source of Truth. Verified by Content Lead on 2024-12-28.*
