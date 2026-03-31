# Service Wizard Module

> **Path:** `src/components/service-wizard`  
> **Parent:** [`../README.md`](../README.md)  
> **Last Verified:** 2024-12-28  
> **Maintainer:** Business Development Lead

---

## Purpose

The Service Wizard (Strategic Diagnostic Assessment) is the platform's primary lead generation and diagnostic tool. it guides prospective clients through a multi-step evaluation of their organizational maturity across five domains. The wizard uses custom scoring logic to provide immediate service recommendations and facilitates high-warmth booking for consulting sessions.

---

## File Manifest

| File | Type | Purpose | Status |
|------|------|---------|--------|
| `wizard-container.tsx` | Orchestrator | Main state machine for the 5-step diagnostic flow | Active |
| `wizard-results.tsx` | UI | Personalized recommendations based on computed maturity scores | Active |
| `wizard-question.tsx` | UI | High-fidelity interactive question and option buttons | Active |
| `wizard-booking.tsx` | UI | Integrated calendar selector for scheduling follow-up calls | Active |
| `email-capture-modal.tsx`| UI | Gated lead capture for detailed PDF report access | Active |
| `index.ts` | Barrel | Central entry point for the service wizard | Active |

---

## Navigation

| Direction | Link |
|-----------|------|
| ⬆️ Parent | [`../README.md`](../README.md) |
| ➡️ Scoring | [`../../lib/wizard-scoring.ts`](../../lib/wizard-scoring.ts) |

---

*Diagnostic Experience. Verified by BD Lead on 2024-12-28.*
