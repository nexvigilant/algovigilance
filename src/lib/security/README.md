# Security Module

> **Path:** `src/lib/security`  
> **Parent:** [`../README.md`](../README.md)  
> **Last Verified:** 2024-12-28  
> **Maintainer:** Security Engineer / Lead DevSecOps

---

## Purpose

The Security module provides centralized infrastructure for protecting the NexVigilant platform from common vulnerabilities (XSS, Injection) and maintaining a robust audit trail of security-sensitive events. It implements a unified sanitization strategy for user-generated content and provides specialized Zod schemas for secure input handling.

---

## Quick Reference

| Aspect | Details |
|--------|---------|
| **Domain** | Security / Compliance / Observability |
| **Status** | Stable / Core |
| **Dependencies** | `dompurify`, `firebase-admin`, `zod` |
| **Outputs** | Sanitized Strings, Audit Logs, Security Event Counts |

---

## File Manifest

| File | Type | Purpose | Status |
|------|------|---------|--------|
| `audit-log.ts` | Service | Server-side logging of authentication, permission, and anomaly events | Active |
| `validation.ts` | Utility | Input sanitization (XSS) and strict regex-based security schemas | Active |
| `index.ts` | Barrel | Central entry point for all security functions | Active |

---

## Relationships & Data Flow

```
[User Input] → [validation.ts] → [Sanitized Output]
                     ↓
[System Event] → [audit-log.ts] → [Firestore: security_events]
                     ↓
          [Monitoring Dashboard]
```

**Internal Dependencies:**
- `audit-log.ts` utilizes `lib/firebase-admin.ts` to record events that are protected from non-admin deletion/modification.
- `validation.ts` provides the `secureSchemas` used by the platform's higher-level Zod schemas.

**External Dependencies:**
- Relies on **DOMPurify** for industrial-strength HTML sanitization.

---

## Usage Patterns

### Common Workflows

1. **Log Unauthorized Access**
   - Call `logSecurityEvent({ type: 'unauthorized_access', ip, userId })`.
   - Result: Permanent record in Firestore for incident response.

2. **Sanitize User Bio**
   - Use `secureSchemas.bio.parse(dirtyInput)`.
   - Result: A string that only contains safe HTML tags (b, i, em, etc.).

3. **Check for Injection Attempts**
   - Call `validateUserInput(input)`.
   - Result: Blocks common patterns like `<script>` or `javascript:` while returning a sanitized fallback.

### Entry Points

- **Primary:** `src/lib/security/index.ts` — Import all security primitives.
- **Critical:** `logSecurityEvent` — Must be called in every failed sensitive operation.

---

## Conventions & Standards

- **HTTPS Only:** The `secureSchemas.url` validator enforces HTTPS-only links.
- **Fail Closed:** Security logging errors should never block the primary application flow but must be logged to the console for fallback observability.
- **Admin Isolation:** Security event logs are stored in a separate Firestore collection (`security_events`) with no client-side write access.

---

## Known Limitations

- [ ] IP-based logging relies on the `X-Forwarded-For` header which may need validation in proxy environments.
- [ ] Sanitization is currently focused on HTML; expansion to SQL-style injection patterns for external API inputs is planned.

---

## Navigation

| Direction | Link |
|-----------|------|
| ⬆️ Parent | [`../README.md`](../README.md) |
| ➡️ Actions | [`../actions/README.md`](../actions/README.md) |
| ➡️ Schemas | [`../schemas/README.md`](../schemas/README.md) |

---

*Security Hardening Core. Verified by Security Architect on 2024-12-28.*
