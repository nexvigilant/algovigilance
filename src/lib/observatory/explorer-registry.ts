/**
 * Observatory Explorer Registry — Single source of truth for explorer capabilities.
 *
 * Maps each explorer type to its feature support matrix. Used by the
 * personalization system to validate preferences and by the settings panel
 * to show/hide controls per explorer.
 *
 * 11 explorers spanning the full drug lifecycle:
 *   Pre-clinical → Clinical → Regulatory → Post-market → Population
 *
 * Primitive formula: registry = μ(κ) — mapping of comparison-derived capabilities.
 */

export type ObservatoryExplorerType =
  | 'graph'
  | 'career'
  | 'learning'
  | 'state'
  | 'math'
  | 'chemistry'
  | 'regulatory'
  | 'causality'
  | 'timeline'
  | 'epidemiology'
  | 'molecule'
  | 'atlas'
  | 'station'

export interface ExplorerCapabilities {
  /** Supports color-vision-deficiency shape encoding */
  cvd: boolean
  /** Supports ZoomLevelBridge semantic zoom */
  semanticZoom: boolean
  /** Supports Web Worker force-directed layout */
  workerLayout: boolean
  /** Supports post-processing effects (bloom/SSAO/vignette) */
  postProcessing: boolean
  /** Connected to live data endpoint */
  liveData: boolean
  /** Underlying 3D component */
  component: 'ForceGraph3D' | 'StateOrbit3D' | 'SurfacePlot3D' | 'DomainAtlas2D'
  /** Drug lifecycle stage for ordering */
  lifecycleStage?: 'preclinical' | 'clinical' | 'regulatory' | 'postmarket' | 'population' | 'platform'
}

export const EXPLORER_REGISTRY: Record<ObservatoryExplorerType, ExplorerCapabilities> = {
  // ─── Platform Explorers (existing) ──────────────────────────────────────────
  graph: {
    cvd: true,
    semanticZoom: true,
    workerLayout: true,
    postProcessing: true,
    liveData: true,
    component: 'ForceGraph3D',
    lifecycleStage: 'platform',
  },
  career: {
    cvd: true,
    semanticZoom: true,
    workerLayout: false,
    postProcessing: true,
    liveData: false,
    component: 'ForceGraph3D',
    lifecycleStage: 'platform',
  },
  learning: {
    cvd: true,
    semanticZoom: true,
    workerLayout: false,
    postProcessing: true,
    liveData: false,
    component: 'ForceGraph3D',
    lifecycleStage: 'platform',
  },
  state: {
    cvd: false,
    semanticZoom: false,
    workerLayout: false,
    postProcessing: true,
    liveData: false,
    component: 'StateOrbit3D',
    lifecycleStage: 'platform',
  },
  math: {
    cvd: false,
    semanticZoom: false,
    workerLayout: false,
    postProcessing: true,
    liveData: false,
    component: 'SurfacePlot3D',
    lifecycleStage: 'platform',
  },
  // ─── Drug Lifecycle Explorers (Phase 1 plumbing) ────────────────────────────
  chemistry: {
    cvd: false,
    semanticZoom: false,
    workerLayout: false,
    postProcessing: true,
    liveData: true,
    component: 'SurfacePlot3D',
    lifecycleStage: 'preclinical',
  },
  molecule: {
    cvd: true,
    semanticZoom: true,
    workerLayout: false,
    postProcessing: true,
    liveData: true,
    component: 'ForceGraph3D',
    lifecycleStage: 'preclinical',
  },
  regulatory: {
    cvd: false,
    semanticZoom: false,
    workerLayout: false,
    postProcessing: true,
    liveData: true,
    component: 'ForceGraph3D',
    lifecycleStage: 'regulatory',
  },
  causality: {
    cvd: true,
    semanticZoom: true,
    workerLayout: true,
    postProcessing: true,
    liveData: true,
    component: 'ForceGraph3D',
    lifecycleStage: 'postmarket',
  },
  timeline: {
    cvd: false,
    semanticZoom: false,
    workerLayout: false,
    postProcessing: true,
    liveData: true,
    component: 'ForceGraph3D',
    lifecycleStage: 'postmarket',
  },
  epidemiology: {
    cvd: false,
    semanticZoom: false,
    workerLayout: false,
    postProcessing: true,
    liveData: true,
    component: 'SurfacePlot3D',
    lifecycleStage: 'population',
  },
  // ─── Meta Explorer (cross-domain translation) ──────────────────────────────
  atlas: {
    cvd: false,
    semanticZoom: false,
    workerLayout: false,
    postProcessing: false,
    liveData: false,
    component: 'DomainAtlas2D',
    lifecycleStage: 'platform',
  },
  // ─── Station Explorer (live Canvas 2D topology) ─────────────────────────────
  station: {
    cvd: false,
    semanticZoom: false,
    workerLayout: false,
    postProcessing: false,
    liveData: true,
    component: 'DomainAtlas2D',
    lifecycleStage: 'platform',
  },
} as const
