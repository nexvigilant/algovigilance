# Constants Module

> **Path:** `src/lib/constants`  
> **Parent:** [`../README.md`](../README.md)  
> **Last Verified:** 2024-12-28  
> **Maintainer:** Core Infrastructure Engineer

---

## Purpose

This module serves as the primary source of truth for hardcoded values that are shared across multiple components or services. Centralizing these "magic values" ensures consistency and makes global updates (e.g., changing a support email or a retry delay) straightforward.

---

## File Manifest

| File | Type | Purpose |
|------|------|---------|
| `urls.ts` | Config | Primary site URLs, social links, and external API endpoints |
| `timing.ts` | Config | Standardized durations (ms) for debouncing, intervals, and timeouts |
| `config.ts` | Config | Global business logic thresholds (Moderation, Batch sizes) |
| `z-index.ts` | Config | Centralized layering scale (Base, Modal, Tooltip, Max) |
| `organizations.ts` | Data | Static registry of supported medical/clinical organizations |

---

## Navigation

| Direction | Link |
|-----------|------|
| ⬆️ Parent | [`../README.md`](../README.md) |
| ➡️ Config | [`../config/README.md`](../config/README.md) |

---

*Verified by Core Eng on 2024-12-28.*
