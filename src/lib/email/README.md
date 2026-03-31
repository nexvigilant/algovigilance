# Email Module

> **Path:** `src/lib/email`  
> **Parent:** [`../README.md`](../README.md)  
> **Last Verified:** 2024-12-28  
> **Maintainer:** Communications Engineer

---

## Purpose

The Email module provides a unified service for all outbound communications. It handles transactional emails (signup confirmations), administrative alerts (new leads), and community notifications (replies, mentions) using the **Resend** delivery platform.

---

## File Manifest

| File | Type | Purpose |
|------|------|---------|
| `client.ts` | Service | Initializes the Resend SDK and provides shared formatting helpers |
| `admin.ts` | Service | Notification logic for internal team alerts (consulting leads) |
| `acknowledgments.ts`| Service | Automatic "Thank You" replies to customer inquiries |
| `affiliate.ts` | Service | Workflow emails for ambassador and advisor applications |
| `community.ts` | Service | Social interaction notifications (mentions, replies, messages) |
| `brochure.ts` | Service | Dynamic generation and sending of PDF brochures |
| `index.ts` | Barrel | Central entry point for all email services |

---

## Navigation

| Direction | Link |
|-----------|------|
| ⬆️ Parent | [`../README.md`](../README.md) |
| ➡️ Actions | [`../actions/README.md`](../actions/README.md) |

---

*Verified by Backend Lead on 2024-12-28.*
