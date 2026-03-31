# lib (The Engine Room)

> **Path:** `src/lib`

---

## 🎯 Purpose

The **lib** directory is the core logic engine and algorithmic core of the NexVigilant platform. It contains all non-UI code, including proprietary signal detection algorithms, AI research flows, Firebase infrastructure, and mission-critical utilities. This module serves as the T1 grounding point for the Studio application, where business logic is strictly typed and validated against the Lex Primitiva foundation.

## 🚀 Development Goals

1. **Type-Safe Infrastructure**: Ensure all data access and manipulation is governed by strict TypeScript interfaces and Zod schemas.
2. **Deterministic Computation**: Implement mathematical and statistical models (PRR, ROR, IC) with zero-tolerance for precision loss.
3. **High-Concurrency Orchestration**: Optimize the `parallel-utils` and `concurrency` modules to handle population-scale data ingestion and synthesis.
4. **Observable Intelligence**: Build comprehensive logging and telemetry into every research flow via the `logger` and `error-reporting` modules.

## 🔭 Action Items & Aspirations

- [ ] **Federated Signal Launch**: Complete the `federated-signal` module for privacy-preserving multi-org safety detection.
- [ ] **Autonomous Researcher v2**: Enhance the `deep-research` agent with multi-modal capabilities and cross-guideline reasoning.
- [ ] **FSRS Persistence**: Implement the full Spaced Repetition (FSRS) algorithm within the `academy` module for personalized mastery tracking.
- [ ] **Wasm Signal Bridge**: Transpile core Rust signal algorithms into WebAssembly for use within the `algorithms` module.

## 🛡️ Management Measures

- **Server-Side Isolation**: Critical logic in `lib` is strictly demarcated as `server-only` to prevent accidental exposure to the client-side bundle.
- **Rate Limit Enforcement**: Use the `rate-limit.ts` module (Firestore-backed) to prevent API abuse and manage token budgets (tATP).
- **Audit Logging**: Every write operation must be preceded by an audit entry in the `security` module to maintain SOC 2 compliance.
- **Schema Gating**: All incoming external data (from Stripe, OpenAI, etc.) must pass through Zod validators in `lib/schemas` before being processed.

---

## Quick Reference
...

## Quick Reference

| Aspect | Details |
|--------|---------|
| **Domain** | Infrastructure, Business Logic, AI, Data |
| **Status** | Stable / Core |
| **Dependencies** | `firebase-admin`, `genkit`, `zod`, `uuid`, `stripe` |
| **Outputs** | API Clients, Orchestrators, Mathematical Models |

---

## File Manifest (Root)

| File | Type | Purpose | Status |
|------|------|---------|--------|
| `firebase-admin.ts` | Config | Server-side Firebase SDK initialization | Active |
| `firebase.ts` | Config | Client-side Firebase SDK initialization | Active |
| `logger.ts` | Utility | Centralized scoped logging system | Active |
| `parallel-utils.ts` | Utility | Batch processing and concurrency control | Active |
| `error-reporting.ts` | Utility | Client/Server error capture and telemetry | Active |
| `intelligence.ts` | Data | Hybrid Article/CMS retrieval logic | Active |
| `design-tokens.ts` | Config | Central source of truth for theme values | Active |
| `rate-limit.ts` | Infrastructure | Firestore-backed rate limiting | Active |
| `utils.ts` | Utility | Shared helper functions (dates, formatting) | Active |

### Core Subdirectories

| Directory | Purpose | Has README |
|-----------|---------|------------|
| `/ai/` | Genkit flows and LLM orchestration | ✅ |
| `/manufacturing/` | Content generation pipeline for KSBs | ✅ |
| `/federated-signal/` | Privacy-preserving multi-org signal detection | ❌ |
| `/deep-research/` | Autonomous AI research agent | ❌ |
| `/algorithms/` | Proprietary scoring and validation logic | ❌ |
| `/academy/` | Course, enrollment, and LMS utilities | ✅ |
| `/concurrency/` | Advanced async queue and worker management | ❌ |
| `/security/` | Auth guards and audit trail logging | ❌ |

---

## Relationships & Data Flow

```
[app/actions] → [lib/ai] → [lib/firebase-admin] → Cloud Firestore
      ↓             ↓                ↑
[lib/logger]   [lib/parallel]   [lib/utils]
```

**Internal Dependencies:**
- `logger.ts` is imported by nearly every file in `lib`.
- `parallel-utils.ts` powers the `manufacturing` and `deep-research` modules.
- `firebase-admin.ts` provides the primary database connection for all server actions.

---

## Conventions & Standards

- **Server-Only:** Most files in `lib` (except `firebase.ts`, `utils.ts`, `design-tokens.ts`) are intended for Server Components or Server Actions.
- **Branded IDs:** All ID handling should use the branded types defined in `@/types`.
- **Error Handling:** Use `handleActionError` for consistency across all server actions.
- **Logging:** Every file should initialize a scoped logger: `const log = logger.scope('path/to/file')`.

---

## Navigation

| Direction | Link |
|-----------|------|
| ⬆️ Parent | [`../README.md`](../README.md) |
| ⬇️ AI Module | [`./ai/README.md`](./ai/README.md) |
| ⬇️ Pipeline | [`./manufacturing/README.md`](./manufacturing/README.md) |
| ⬇️ Federated | [`./federated-signal/README.md`](./federated-signal/README.md) |

---

*Auto-generated structure. Verified by System Architect on 2024-12-28.*
