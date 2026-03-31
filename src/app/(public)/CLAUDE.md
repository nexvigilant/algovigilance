# CLAUDE.md — Public Pages

Public-facing marketing and conversion pages — the first impression of NexVigilant. Every page embodies the "Strategic Vigilance Intelligence" brand positioning.

## Benchmark Governance (INVARIANT)

This document describes the REALIZED state of these pages — the standard we hold.

**The One Rule:** When reality diverges from what is stated here, improve reality. NEVER lower this document to match code.

## Pages

| Route | Purpose |
|-------|---------|
| `community/discover/` | Public community discovery and preview |
| `grow/advisor/` | Advisory services landing page |
| `grow/ambassador/` | Ambassador program landing page |
| `intelligence/series/` | Intelligence publication series catalog |
| `trial/start/` | Free trial registration flow |
| `contact/thank-you/` | Contact form confirmation |

## Redirects

`/blog` → `/intelligence` | `/waitlist` → `/membership`

## Product Benchmarks

| Domain | Benchmark |
|--------|-----------|
| **Core Web Vitals** | LCP under 2.5s on all public pages. CLS under 0.1. FID under 100ms. Verified via Vercel analytics. |
| **SEO** | Every page has unique metadata (title, description, Open Graph). Structured data (JSON-LD) on key conversion pages. Sitemap auto-generated. |
| **Conversion** | Trial start flow completes in <3 steps. Form validation is inline and immediate. Success state confirms action clearly. |
| **Brand Consistency** | Every page follows the clinical intelligence agency aesthetic — neural networks (5-15% opacity), grid overlays, 80/20 dark mode, Gold/Cyan/Emerald palette. |
| **Accessibility** | WCAG 2.1 AA on all public pages. Color contrast ratios exceed 4.5:1. All interactive elements have visible focus indicators. |
| **Performance** | Server-rendered with zero client-side JS on pure marketing pages. Images use next/image with automatic optimization. |
| **Mobile** | Fully responsive from 320px to 2560px. Touch targets minimum 44x44px. No horizontal scrolling. |

## Architecture Rules

- **Server components by default**: Marketing pages are server-rendered for SEO and performance
- **Layout**: Shared `(public)/layout.tsx` with header navigation and footer
- **No auth dependency**: Public pages never import Firebase client SDK or auth hooks
- **Metadata**: Every page exports `metadata` with title and description
