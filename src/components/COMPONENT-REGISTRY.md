# Component Registry

Quick reference for Claude Code to find and apply components.

## Directory Structure

```
src/components/
├── ui/                    # shadcn/ui primitives + branded/
│   └── branded/           # MagneticButton, CircuitButton, PCBGrid
├── layout/                # Structural components
│   ├── headers/           # SiteHeader, NucleusHeader
│   ├── footers/           # SiteFooter
│   ├── navigation/        # Breadcrumbs, UniversalNavMenu, LegalNav
│   ├── wrappers/          # PublicPageWrapper, PageHeader, AuthRedirect
│   └── boundaries/        # Error/Loading/Empty states, toasts
├── shared/                # Cross-cutting utilities
│   ├── banners/           # CookieConsent, TrialBanner, etc.
│   ├── branding/          # Logo, EyeLogo
│   ├── seo/               # StructuredData schemas
│   └── accessibility/     # SkipToContent
├── voice/                 # DEPRECATED: re-exports from boundaries
├── visualizations/        # Neural visualizations (has index.ts)
├── effects/               # Visual effects (has index.ts)
├── sparse-coding/         # Modular calculator components
├── academy/               # Academy-specific (has index.ts)
├── intelligence/          # Content hub (has index.ts)
├── marketing/             # Marketing pages + landing/
├── auth/                  # Auth flows
└── [other domain folders] # Feature-specific components
```

## UI Primitives (`ui/`)

```typescript
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
// Or barrel: import { Button, Card } from '@/components/ui';
```

| Component | Usage |
|-----------|-------|
| Button | Actions, CTAs |
| Card | Content containers |
| Dialog | Modals |
| Tabs | Tabbed interfaces |
| Form | React Hook Form |
| Input, Select, Textarea | Form inputs |
| Sheet | Slide-out panels |
| Sidebar | Navigation |
| Toast | Notifications |

## Layout & Navigation (`layout/`)

```typescript
import { SiteHeader, NucleusHeader } from '@/components/layout/headers';
import { SiteFooter } from '@/components/layout/footers';
import { Breadcrumbs, NucleusBreadcrumbs } from '@/components/layout/navigation';
import { PublicPageWrapper, PageHeader } from '@/components/layout/wrappers';
```

| Component | Location | Usage |
|-----------|----------|-------|
| SiteHeader | `layout/headers` | Main nav header |
| NucleusHeader | `layout/headers` | Auth area header |
| SiteFooter | `layout/footers` | Page footer |
| Breadcrumbs | `layout/navigation` | Breadcrumb nav |
| PublicPageWrapper | `layout/wrappers` | Public page layout |
| PageHeader | `layout/wrappers` | Page title + breadcrumbs |

## Boundaries - Error/Loading/Empty States (`layout/boundaries/`)

```typescript
// Error handling
import { ErrorBoundary, ErrorFallback } from '@/components/layout/boundaries';
import { NucleusErrorBoundary, NucleusErrorPage } from '@/components/layout/boundaries';

// Loading states (with context-aware messages)
import { LoadingFallback, LoadingBoundary, LoadingOverlay } from '@/components/layout/boundaries';

// Empty states (with context-aware content)
import { EmptyState, EmptyStateCompact } from '@/components/layout/boundaries';

// Toast notifications
import { voiceToast, customToast } from '@/components/layout/boundaries';

// Constants for messaging
import { LOADING_MESSAGES, ERROR_CONTENT, EMPTY_STATE_CONTENT } from '@/components/layout/boundaries';
```

| Component | Usage |
|-----------|-------|
| ErrorBoundary | Wrap components to catch errors |
| ErrorFallback | Error display with variants (page/card/inline/alert) |
| NucleusErrorBoundary | Portal-specific error boundary |
| NucleusErrorPage | For error.tsx files in nucleus routes |
| LoadingFallback | Loading state with context (academy, community, etc.) |
| LoadingBoundary | Suspense wrapper with loading UI |
| EmptyState | Empty content state with context-aware messaging |
| voiceToast | Toast notifications with brand messaging |

**Context Support:**
```typescript
// Loading with context message
<LoadingFallback context="academy" />  // "Preparing your capability pathways..."

// Empty state with context
<EmptyState context="posts" />  // Auto-populates title, description, icon

// Error with type
<ErrorFallback type="network" error={error} resetError={reset} />
```

> **Note:** `@/components/voice` is deprecated. It re-exports from boundaries for backwards compatibility.

## Shared Utilities (`shared/`)

```typescript
import { Logo, EyeLogo } from '@/components/shared/branding';
import { CookieConsentBanner, TrialBanner } from '@/components/shared/banners';
import { OrganizationSchema } from '@/components/shared/seo';
```

| Component | Location | Usage |
|-----------|----------|-------|
| Logo | `shared/branding` | Main logo |
| EyeLogo | `shared/branding` | Eye icon variant |
| CookieConsentBanner | `shared/banners` | GDPR consent |
| TrialBanner | `shared/banners` | Trial notification |
| OrganizationSchema | `shared/seo` | JSON-LD schema |

## Visualizations (`visualizations/`)

```typescript
// Neural Manifold (3D - requires dynamic import)
import dynamic from 'next/dynamic';
const NeuralManifold = dynamic(
  () => import('@/components/visualizations/neural-manifold/NeuralManifoldVisualization'),
  { ssr: false }
);

// Sparse Coding Calculator
const Calculator = dynamic(
  () => import('@/components/SparseCodingCalculatorWrapper'),
  { ssr: false }
);

// Sparse coding utilities via barrel
import { useSparseCodingMetrics, COLORS } from '@/components/sparse-coding';
```

## Effects (`effects/`)

```typescript
import { CircuitBackground, NeuralCircuitBackground } from '@/components/effects';
```

| Component | Usage |
|-----------|-------|
| NeuralCircuitBackground | Neural signal animation |
| CircuitBackground | Tech circuit pattern |
| EmeraldCityBackground | Ambient city effect |
| AmbientParticles | Floating particles |

## Academy (`academy/`)

```typescript
import { KSBViewer, PortfolioViewer } from '@/components/academy';
```

## Intelligence (`intelligence/`)

```typescript
import { ContentCard, PodcastPlayer, EnhancedMarkdown } from '@/components/intelligence';
```

---

## Key Patterns

### Dynamic Imports (heavy components)
```typescript
import dynamic from 'next/dynamic';
const Component = dynamic(() => import('@/components/...'), { ssr: false });
```

### Barrel Imports
Directories with `index.ts`: ui, effects, visualizations, academy, intelligence, sparse-coding
