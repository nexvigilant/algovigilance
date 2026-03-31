# Concurrency Module

> **Path:** `src/lib/concurrency`  
> **Parent:** [`../README.md`](../README.md)  
> **Last Verified:** 2024-12-28  
> **Maintainer:** Core Infrastructure Engineer

---

## Purpose

The Concurrency module provides advanced primitives for managing asynchronous execution, rate limiting, and batch processing. It ensures the NexVigilant platform respects external API limits (e.g., PubMed, Perplexity) and maintains system stability during heavy background tasks like ALO manufacturing.

---

## Quick Reference

| Aspect | Details |
|--------|---------|
| **Domain** | Infrastructure / Async Logic |
| **Status** | Stable |
| **Dependencies** | None (Pure JS/TS) |
| **Outputs** | Execution Control, Limiter Statistics |

---

## File Manifest

| File | Type | Purpose | Status |
|------|------|---------|--------|
| `rate-limiter.ts` | Algorithm | Hybrid counting semaphore + time-based delay limiter | Active |
| `index.ts` | Barrel | Central entry point for concurrency patterns | Active |

### Subdirectories

| Directory | Purpose | Has README |
|-----------|---------|------------|
| `/__tests__/` | Unit tests for queue and timing logic | ❌ |

---

## Relationships & Data Flow

```
[System Task] → [RateLimiter] → [Async Operation] → Result
                      ↑
               [Queue Management]
```

**Internal Dependencies:**
- `index.ts` exposes convenient factory functions (`pLimit`, `pBatch`) built on the `RateLimiter` class.

**External Dependencies:**
- Heavily utilized by `lib/deep-research` and `lib/manufacturing` for API-sensitive tasks.

---

## Usage Patterns

### Common Workflows

1. **Limit Concurrent API Requests**
   - Use `pLimit(concurrency)` to wrap fetch calls.
   - Example: `const limit = pLimit(3); const results = await Promise.all(urls.map(u => limit(() => fetch(u))));`

2. **Sequential Batching with Delay**
   - Use `pBatch(items, processor, options)` for interval-based processing.
   - Example: Process 100 items in groups of 10, with 1s between groups to avoid burst limits.

### Entry Points

- **Primary:** `RateLimiter` — The core class for complex limiters.
- **Utility:** `pLimit` — Drop-in replacement for `p-limit` library style.
- **Presets:** `createRateLimiter('polite')` — Preconfigured settings for common APIs.

---

## Conventions & Standards

- **FIFO Ordering:** The limiter guarantees First-In-First-Out execution for waiting tasks.
- **Resource Cleanup:** Always use the `limiter.run(() => ...)` wrapper or ensure `release()` is called in a `finally` block to prevent semaphore leaks.
- **Accuracy:** All delays are minimums; actual time may vary slightly due to JS event loop latency.

---

## Known Limitations

- [ ] Current implementation is memory-based; state is not shared across Vercel Serverless instances (requires Redis for global rate limiting).
- [ ] No priority queue support (all tasks have equal weight).

---

## Navigation

| Direction | Link |
|-----------|------|
| ⬆️ Parent | [`../README.md`](../README.md) |
| ➡️ Deep Research | [`../deep-research/README.md`](../deep-research/README.md) |
| ➡️ Manufacturing | [`../manufacturing/README.md`](../manufacturing/README.md) |

---

*Infrastructure Core. Verified by Core Eng on 2024-12-28.*
