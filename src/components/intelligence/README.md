# Intelligence Module

> **Path:** `src/components/intelligence`  
> **Parent:** [`../README.md`](../README.md)  
> **Last Verified:** 2024-12-28  
> **Maintainer:** CMS & Content Lead

---

## Purpose

The Intelligence module manages the content delivery and consumption experience for NexVigilant's research and news articles. It features a high-fidelity "Enhanced Markdown" engine that automatically transforms raw text into visually structured components (callouts, stats, timelines), along with real-time reading progress trackers and interactive data visualization tools.

---

## Quick Reference

| Aspect | Details |
|--------|---------|
| **Domain** | Content Management (CMS) / Reading Experience |
| **Status** | Stable / Active |
| **Dependencies** | `react-markdown`, `remark-gfm`, `lucide-react`, `lib/intelligence` |
| **Outputs** | Structured Article Pages, Reading Progress, Citation Maps |

---

## File Manifest

| File | Type | Purpose | Status |
|------|------|---------|--------|
| `enhanced-markdown-v2.tsx`| Unit | Premium markdown renderer with auto-detection of visual patterns | Active |
| `article-read-tracker.tsx`| Logic | Invisible component that persists "Read" status after 30s dwell time | Active |
| `article-visual-enhancements.tsx`| FX | Collection of styled boxes (DataPointCard, InsightHighlight, etc.) | Active |
| `markdown-citation-components.tsx`| Logic | Logic for interactive, bi-directional citation links in text | Active |
| `content-filter.tsx` | UI | Domain and category filters for the Intelligence Hub feed | Active |
| `newsletter-signup.tsx` | Unit | Subscription form with bot detection and source attribution | Active |
| `index.ts` | Barrel | Central entry point for all intelligence UI components | Active |

---

## Relationships & Data Flow

```
[Raw Text] → [EnhancedMarkdownV2] → [Pattern Utils] → Visual Box
                  ↓                       ↑
          [Citation Utils] → [Interactive Reference List]
                  ↓
          [Read Tracker] → [useSeriesProgress] → Firestore
```

**Internal Dependencies:**
- `EnhancedMarkdownV2` coordinates between `PatternUtils` (detection) and `VisualEnhancements` (rendering).
- `ArticleReadTracker` is a side-effect component typically placed in the article layout.

**External Dependencies:**
- Utilizes **Remark-GFM** for GitHub-flavored markdown support.
- Relies on **Lucide-react** for standardized tactical and clinical icons.

---

## Usage Patterns

### Common Workflows

1. **Render an Intelligence Article**
   - Provide raw markdown to `<EnhancedMarkdown content={...} />`.
   - Result: Text is automatically parsed; headers like "Recommended Actions" or "Key Takeaways" are rendered as themed boxes.

2. **Track Reading Progress**
   - Place `<ArticleReadTracker seriesSlug={...} articleSlug={...} />` at the bottom of an article page.
   - Result: Silently updates the user's progress in Firestore after they stay on the page for 30 seconds.

### Entry Points

- **Primary:** `EnhancedMarkdown` — The standard content renderer.
- **Feed:** `ContentCard` — The primary entry point for article previews in lists.

---

## Conventions & Standards

- **Semantic Styling:** Headers should use the `font-headline` and `uppercase tracking-wide` styles for consistency with the design system.
- **Async Safety:** The read tracker must only execute for authenticated users and must clear its `setTimeout` on unmount.
- **Pattern Detection:** All new visual patterns (e.g., a "Regulatory Update" box) must have a detector in `markdown-pattern-utils.ts` before being added to the renderer.

---

## Known Limitations

- [ ] Citation parsing currently assumes standard author-year or numbering; non-standard bib styles may break links.
- [ ] Large articles (>5,000 words) may see minor lag during initial markdown-to-React transformation.

---

## Navigation

| Direction | Link |
|-----------|------|
| ⬆️ Parent | [`../README.md`](../README.md) |
| ➡️ Academy | [`../academy/README.md`](../academy/README.md) |
| ⬅️ Core Lib | [`../../lib/intelligence.ts`](../../lib/intelligence.ts) |

---

*Content Delivery Core. Verified by Content Lead on 2024-12-28.*
