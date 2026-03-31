# AI Module (Genkit Orchestration)

> **Path:** `src/lib/ai`

---

## 🎯 Purpose

The **AI** module is the high-level orchestration layer for all generative intelligence features within the Studio. Powered by **Google Genkit** and the **Gemini 2.5** family, it provides a structured, type-safe framework for executing complex research flows, content synthesis (ALO Manufacturing), and autonomous clinical agents. This module serves as the semantic bridge between the platform's user interface and the underlying LLM capabilities.

## 🚀 Development Goals

1. **Grounded Synthesis**: Every AI-generated artifact (KSB, case narrative) must be grounded in observable evidence and verifiable regulatory sources.
2. **Schema-Driven Reliability**: Enforce 100% Zod-backed input/output schemas for all Genkit flows to ensure deterministic downstream processing.
3. **Multi-Model Orchestration**: Enable dynamic routing between Gemini 2.5 models (Flash/Pro) based on task complexity and token budget (tATP).
4. **Agentic Observability**: Provide granular tracing and debugging for every step of an autonomous agent run via the Genkit UI and local logging.

## 🔭 Action Items & Aspirations

- [ ] **Vertex AI Migration**: Complete the transition to Vertex AI for production-grade Imagen generation and enhanced security.
- [ ] **Streaming Reasoning**: Implement real-time token streaming for the `nexvigilant-agent` to improve perceived responsiveness.
- [ ] **Cross-Crate Context**: Bridge the `nexcore-os` IPC bus into the conversational agent for real-time system status reasoning.
- [ ] **Automated Peer Review**: Develop a "Critic" flow that cross-validates generated content against established ToV axioms.

## 🛡️ Management Measures

- **Token Budgeting**: All flows must report estimated token usage to the `nexcore-energy` module to prevent budget exhaustion.
- **Moderation Guardrails**: Every user-facing response MUST pass through the `moderateContent` flow before being rendered.
- **Fail-Safe Defaults**: AI failures should never crash the UI; every flow must provide a schema-compliant "Safe Fallback" object.
- **Strict Environment Gating**: API keys (Gemini, Resend) are exclusively managed via `gcloud` secrets and never exposed to the client bundle.

---

## Quick Reference
...

## Quick Reference

| Aspect | Details |
|--------|---------|
| **Domain** | Backend / AI Logic |
| **Status** | Stable |
| **Dependencies** | `genkit`, `google-genai`, `@genkit-ai/google-genai`, `firebase-admin` |
| **Outputs** | Validated ALO content, moderation results, regulatory insights, conversational responses |

---

## File Manifest

| File | Type | Purpose | Status |
|------|------|---------|--------|
| `genkit.ts` | Config | Initializes the Genkit instance with Google AI plugin | Active |
| `genkit-vertex.ts` | Config | Vertex AI specific configuration (Imagen, etc.) | Active |
| `index.ts` | Barrel | Centralized exports for all AI flows and utilities | Active |
| `dev.ts` | Script | Local development and testing utilities for flows | Experimental |

### Subdirectories

| Directory | Purpose | Has README |
|-----------|---------|------------|
| `/flows/` | Domain-specific Genkit flows (moderation, generation, etc.) | ❌ |

---

## Relationships & Data Flow

```
User Input/System Trigger → [index.ts] → [flows/*.ts] → [genkit.ts] → Google Gemini API
                                 ↑            ↓
                          [lib/logger.ts]  [Zod Schemas]
```

**Internal Dependencies:**
- All flows in `/flows/` rely on the `ai` instance defined in `genkit.ts`.
- `index.ts` provides a clean API for the rest of the application.

**External Dependencies:**
- Requires `GOOGLE_GENAI_API_KEY` or Vertex AI Service Account.
- Interacts with Firestore via `lib/firebase-admin.ts` for RAG and caching.

---

## Usage Patterns

### Common Workflows

1. **Content Generation (ALO Manufacturing)**
   - Call `generateFullALOContent(input)` from `flows/generate-alo-content.ts`.
   - Expected output: Structured ALO JSON matching `ALOContent` interface.

2. **Automated Moderation**
   - Call `moderateContent(request)` from `flows/content-moderation.ts`.
   - Expected output: `ModerationResult` with risk scores and violation categories.

3. **Conversational Agent**
   - Call `runNexVigilantAgent(input)` from `flows/nexvigilant-agent.ts`.
   - Utilizes RAG (Vector Search) to ground responses in Strategic Doctrine.

### Entry Points

- **Primary API:** `src/lib/ai/index.ts` — Import any flow directly from here.
- **Agent Entry:** `runNexVigilantAgent` — The primary interface for the website's conversational AI.

---

## Conventions & Standards

- **Flow-Based:** All AI tasks must be implemented as Genkit Flows for observability and type safety.
- **Zod-First:** Every flow must define strict `inputSchema` and `outputSchema` using Zod.
- **System Prompts:** Prompts should be centralized within the flow files and include "Calibrated" or "Authoritative" instruction sets.
- **Error Handling:** All flows must handle `ai.generate` failures and return safe fallback objects (defined in the schema).

---

## Known Limitations

- [ ] Rate limiting for Perplexity and Gemini APIs is handled at the consumer level, not inside the module.
- [ ] RAG cache in `nexvigilant-agent.ts` uses local hashing; consider a more robust vector DB integration.
- [ ] Regulatory analysis has a token limit of ~15,000 characters for document text.

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2024-12-24 | Initial centralization of Genkit flows | Matthew Campion |
| 2024-12-28 | Unified regulatory analysis and agent logic | Gemini CLI |

---

## Navigation

| Direction | Link |
|-----------|------|
| ⬆️ Parent | [`../README.md`](../README.md) |
| ➡️ Related | [`../deep-research/README.md`](../deep-research/README.md) |
| ⬇️ Children | [`./flows/`](./flows/) |

---

*Auto-generated structure. Enriched manually. Verified by AI Architect on 2024-12-28.*
