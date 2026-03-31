# Shared Components Module

> **Path:** `src/components/shared`  
> **Parent:** [`../README.md`](../README.md)  
> **Last Verified:** 2024-12-28  
> **Maintainer:** Platform UX & Security Lead

---

## Purpose

The Shared Components module contains high-value UI elements that are utilized across the entire application—including marketing (public), product (nucleus), and legal pages. It serves as the primary location for cross-cutting concerns like SEO metadata, security-hardened HTML rendering, accessibility aids, and global notification banners.

---

## Quick Reference

| Aspect | Details |
|--------|---------|
| **Domain** | Universal UI / Utility Components |
| **Status** | Stable / Core |
| **Dependencies** | `dompurify`, `next-seo`, `lucide-react` |
| **Outputs** | Sanitized HTML, Structured Data, Global Banners |

---

## File Manifest

| File | Type | Purpose | Status |
|------|------|---------|--------|
| `index.ts` | Barrel | Central entry point for all shared utilities | Active |

### Subdirectories

| Directory | Purpose | Has README |
|-----------|---------|------------|
| `/security/` | Render-time XSS prevention (`SafeHtml`) and CSP hardening | ❌ |
| `/seo/` | JSON-LD Structured Data and dynamic OpenGraph metadata | ❌ |
| `/banners/` | Global state indicators (Cookie consent, Trial status) | ❌ |
| `/accessibility/`| WCAG 2.1 compliance aids (Skip links, Screen-reader only text) | ❌ |
| `/branding/` | Official SVG logos and eye-conography | ❌ |

---

## Relationships & Data Flow

```
[UI Component] → [SafeHtml] → [DOMPurify] → Sanitized DOM
[Page Meta] → [StructuredData] → [Schema.org] → JSON-LD script
```

**Internal Dependencies:**
- `SafeHtml` is the mandatory renderer for all user-generated content (posts, bios).
- `Branding` components provide consistent logo rendering across headers and footers.

**External Dependencies:**
- Aligned with **ICH E2B(R3)** for specific safety data display standards.
- Uses **Google Search Central** recommendations for structured data logic.

---

## Usage Patterns

### Common Workflows

1. **Render User Content**
   - Call `<SafeHtml html={userBio} type="minimal" />`.
   - Result: Automatically strips scripts and dangerous attributes before injection.

2. **Add Dynamic SEO**
   - Call `<WebsiteSchema />` or `<OrganizationSchema />` in a page layout.
   - Result: Injects high-quality metadata for search engine indexing.

### Entry Points

- **Security:** `SafeHtml` — Mandatory for any non-static HTML string.
- **Access:** `SkipToContent` — Mandatory for every page wrapper.

---

## Conventions & Standards

- **Defense-in-Depth:** Even if data is sanitized on the server, `SafeHtml` must be used on the client.
- **Visually Hidden:** Use the `VisuallyHidden` component for text that must be available to screen readers but hidden from the visual UI.
- **Banner Priority:** Global banners are layered via `Z_INDEX.toast` to ensure visibility over complex visualizations.

---

## Known Limitations

- [ ] `SafeHtml` replacement of `target="_blank"` uses a simple regex; complex link structures may need more robust AST parsing.
- [ ] Structured data schemas currently do not support the full "Medical" vocabulary from Schema.org.

---

## Navigation

| Direction | Link |
|-----------|------|
| ⬆️ Parent | [`../README.md`](../README.md) |
| ⬅️ Layout | [`../layout/README.md`](../layout/README.md) |
| ➡️ Security | [`../../lib/security/README.md`](../../lib/security/README.md) |

---

*Universal Logic & Compliance. Verified by Security Lead on 2024-12-28.*
