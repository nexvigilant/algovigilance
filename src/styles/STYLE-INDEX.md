# NexVigilant Style System Index

> Single source of truth for the Studio design token architecture.
> Lex Primitiva notation: N(quantity), κ(comparison), σ(sequence), μ(mapping), ∂(boundary), λ(location)

## Architecture

```
src/styles/
  tokens/golden-scale.css    <- N: φ-based spacing, typography, color RGB tuples
  tokens/dark-mode.css       <- ς: state (dark mode overrides)
  tokens/container-queries.css <- ∂: boundary (container-responsive utilities)
  animations/emerald-city.css <- σ: sequence (keyframe definitions)
  effects/crystal.css        <- μ: mapping (crystal card effect layers)
  effects/circuit-effects.css <- μ: mapping (circuit background effects)
  index.css                  <- σ: import order (tokens → animations → effects)

src/app/globals.css          <- Tailwind layers + utility classes + body gradient
tailwind.config.ts           <- Tailwind theme extensions (colors, shadows, animations)
```

**Layer order** (σ — sequence matters):
1. CSS tokens (`golden-scale.css`) — variables, no classes
2. CSS animations (`emerald-city.css`) — `@keyframes` definitions
3. CSS effects (`crystal.css`, `circuit-effects.css`) — utility classes using tokens
4. Tailwind base layer (`globals.css @layer base`) — CSS variable declarations for shadcn
5. Tailwind utilities layer (`globals.css @layer utilities`) — custom utility classes
6. Tailwind config (`tailwind.config.ts`) — extends theme with token references

## Color System

### Background Scale (nex.*)
| Token | HSL | Purpose |
|-------|-----|---------|
| `nex-deep` | 215 15% 5% | Deepest backgrounds, body base |
| `nex-dark` | 215 15% 8% | Secondary backgrounds, sidebar |
| `nex-surface` | 215 12% 14% | Cards, modals, elevated content |
| `nex-light` | 215 10% 20% | Hover states, elevated surfaces |
| `nex-border` | 215 8% 28% | Borders, dividers, input outlines |

### RGB Tuples (for `rgba()` in CSS)
Defined in `golden-scale.css`, consumed via `rgba(var(--nex-*-rgb), opacity)`:

| Variable | RGB | Brand Role |
|----------|-----|------------|
| `--nex-cyan-rgb` | 123, 149, 181 | Steel blue — primary accent |
| `--nex-cyan-glow-rgb` | 148, 171, 197 | Steel blue — glow/hover state |
| `--nex-ember-rgb` | 220, 38, 38 | Ember red — CTA, energy |
| `--nex-ember-glow-rgb` | 239, 68, 68 | Ember red — glow state |
| `--nex-gold-rgb` | 212, 175, 55 | Gold — authority, headers |
| `--nex-gold-bright-rgb` | 244, 208, 63 | Gold — highlights, shimmer |

### Tailwind Color Families
| Family | Variants | Usage |
|--------|----------|-------|
| `cyan.*` | DEFAULT, glow, soft, muted, dark, deep, pale, faint, dim | Steel blue accent, links, interactive |
| `ember.*` | DEFAULT, glow, soft, muted, dark, deep, pale, faint, dim | CTA buttons, energy, urgency |
| `gold.*` | DEFAULT, bright, dim, metallic-100..900, shimmer, gleam, antique | Headers, authority, premium |
| `slate.*` | light, dim | Body text, secondary text |

### Hex References (golden-scale.css)
| Variable | Value | Notes |
|----------|-------|-------|
| `--color-cyan` | #7B95B5 | Steel blue (post-rebrand) |
| `--color-cyan-glow` | #94ABC5 | Steel blue glow |
| `--color-navy-deep` | #0B0D13 | Charcoal steel base |
| `--color-navy-dark` | #141820 | Charcoal steel dark |
| `--color-navy-surface` | #1E2430 | Charcoal steel surface |
| `--color-navy-light` | #2A303C | Charcoal steel border |

## Spacing: Golden Scale (φ = 1.618)

Base: 8px. Each step multiplied by φ.

| Token | Value | px |
|-------|-------|----|
| `golden-1` | 0.5rem | 8 |
| `golden-2` | 0.809rem | 13 |
| `golden-3` | 1.309rem | 21 |
| `golden-4` | 2.118rem | 34 |
| `golden-5` | 3.426rem | 55 |
| `golden-6` | 5.544rem | 89 |
| `golden-7` | 8.970rem | 144 |
| `golden-8` | 14.514rem | 232 |

## Typography: Golden Scale

| Token | Size | Usage |
|-------|------|-------|
| `golden-xs` | 12.22px | Small metadata |
| `golden-sm` | 14px | Secondary text |
| `golden-base` | 16px | Body copy |
| `golden-lg` | 19.78px | Lead paragraphs |
| `golden-xl` | 25.89px | H4, subheadings |
| `golden-2xl` | 41.89px | H3, section headers |
| `golden-3xl` | 67.78px | H2, page titles |
| `golden-4xl` | 109.66px | H1, hero headlines |

Fluid variants available: `--type-*-fluid` (clamp-based responsive).

## Motion

### Durations (golden-scale.css — canonical source)
| Token | Value | Use |
|-------|-------|-----|
| `--duration-instant` | 0ms | Immediate feedback |
| `--duration-fast` | 150ms | Quick interactions |
| `--duration-normal` | 250ms | Standard transitions |
| `--duration-slow` | 400ms | Deliberate animations |
| `--duration-slower` | 600ms | Emphasis, entrances |

### Easings (golden-scale.css)
| Token | Curve | Character |
|-------|-------|-----------|
| `--ease-smooth` | cubic-bezier(0.4, 0, 0.2, 1) | Material standard |
| `--ease-electric` | cubic-bezier(0.22, 1, 0.36, 1) | Snappy, energetic |
| `--ease-bounce` | cubic-bezier(0.34, 1.56, 0.64, 1) | Overshoot |
| `--ease-glitch` | cubic-bezier(0.25, 0.46, 0.45, 0.94) | Glitch/CRT |

## Effects (CSS Utility Classes)

### Surfaces
| Class | Source | Purpose |
|-------|--------|---------|
| `.glass` | globals.css | Glassmorphism — blurred translucent |
| `.glass-card` | globals.css | Frosted glass card with border |
| `.crystal-card` | globals.css | Faceted gemstone card with specular highlights |
| `.metallic-surface` | effects/emerald-city.css | Sweeping metallic light reflection |
| `.zircon-surface` | globals.css | Premium reflective dark surface |

### Gradients and Glows
| Class | Source | Purpose |
|-------|--------|---------|
| `.text-gradient` | effects/crystal.css | Steel blue text gradient |
| `.text-gradient-gold` | effects/crystal.css | Gold text gradient |
| `.text-cyan-glow` | globals.css | Cyan text with glow shadow |
| `.shadow-glow-cyan` | globals.css | Cyan box-shadow glow |
| `.prismatic-bar` | globals.css | Horizontal rainbow accent line |
| `.glow-orb-cyan` | globals.css | Blurred atmospheric cyan orb |
| `.glow-orb-gold` | globals.css | Blurred atmospheric gold orb |

### Intelligence UI
| Class | Source | Purpose |
|-------|--------|---------|
| `.intel-panel` | globals.css | Standard intel data container |
| `.intel-scanlines` | globals.css | CRT/surveillance monitor overlay |
| `.intel-accent-line` | globals.css | Top border accent on hover |
| `.intel-stamp` | globals.css | Monospace classification stamp |
| `.intel-label` | globals.css | Section label micro-text |
| `.intel-readout` | globals.css | Tabular monospace metrics |
| `.intel-status-active` | globals.css | Pulsing cyan status dot |
| `.intel-status-warning` | globals.css | Pulsing gold status dot |
| `.intel-status-critical` | globals.css | Pulsing red status dot |
| `.bg-grid-tactical` | globals.css | Fine precision grid overlay |
| `.bg-crosshair` | globals.css | Crosshair center pattern |

### Hero Backgrounds
| Class | Source | Purpose |
|-------|--------|---------|
| `.hero-gradient-cyan` | globals.css | Tech/action page hero |
| `.hero-gradient-gold` | globals.css | Premium/strategic page hero |
| `.hero-gradient-copper` | globals.css | Careers/growth page hero |
| `.radial-energy` | globals.css | Ambient cyan glow |
| `.radial-energy-gold` | globals.css | Ambient gold glow |
| `.scanline-effect` | globals.css | Full-page scanline overlay |

## Shadow Tokens (Tailwind)

| Utility | Purpose |
|---------|---------|
| `shadow-glow-cyan` | Steel blue glow — buttons, cards, interactive |
| `shadow-glow-gold` | Gold glow — premium, authority |
| `shadow-card-hover` | Card hover elevation depth |

## Touch Targets

`--height-touch-target: 44px` (WCAG 2.5.5). Use `.touch-target` utility class.

## Patterns

- Use **Tailwind utilities** for component styling (colors, spacing, layout)
- Use **CSS variables** via `rgba(var(--nex-*-rgb), opacity)` for effects/animations
- Use **`cn()`** from `@/lib/utils` for conditional class merging
- Never hardcode brand colors — always reference token variables
- Canonical duration/easing source: `golden-scale.css` (not globals.css)

## Tailwind Version

**Tailwind CSS 3.4** (v4 upgrade deferred — see appendix below).

### v4 Upgrade Assessment

Difficulty: HARD (2-3 weeks). Key blockers:
- Config format migration (`tailwind.config.ts` to CSS-first `@theme`)
- Plugin system rewrite (`tailwindcss-animate` to `tw-animate-css`)
- Arbitrary value syntax change (`[...]` to `(...)` across 825+ files)
- Browser support cliff (Safari 16.4+, Chrome 111+)

Streams 1-3 of this cleanup reduce token count and eliminate duplicates, making the eventual v4 migration cleaner. Cleanup first, upgrade second.
