# CLAUDE.md — Design System

Living design system documentation — the visual and interactive reference for all Nucleus UI components, patterns, and brand tokens.

## Benchmark Governance (INVARIANT)

This document describes the REALIZED state of this module — the standard we hold.

**The One Rule:** When reality diverges from what is stated here, improve reality. NEVER lower this document to match code.

## Pages

| Route | Purpose |
|-------|---------|
| `page.tsx` | Design system overview and component catalog |
| `neural-manifold/` | Neural network visual motif documentation and interactive demo |
| `sparse-coding/` | Sparse coding visualization patterns |

## Product Benchmarks

| Domain | Benchmark |
|--------|-----------|
| **Component Coverage** | Every reusable UI component in `src/components/` has a design system entry with usage examples, props documentation, and visual variants. |
| **Brand Tokens** | All color tokens (Gold, Cyan, Copper, Emerald), typography scales, and spacing values documented with live previews. |
| **Interactive Demos** | Neural manifold and sparse coding pages provide interactive, configurable demonstrations of visual patterns used across the platform. |
| **Consistency** | Design system pages use the same components they document — zero divergence between docs and reality. |
| **Accessibility** | Design system documents accessibility requirements for each component — required ARIA attributes, keyboard behavior, and contrast ratios. |

## Architecture

- Full reference: `docs/design-system/VISUAL-DIRECTION.md`
- Color system: `@/components/ui/` components use semantic Tailwind tokens
- Typography: Font scales defined in Tailwind config, documented here
