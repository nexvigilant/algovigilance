export { SceneContainer, WebGLErrorBoundary, SceneLoadingSkeleton } from './scene-container'
export { ForceGraph3D, type GraphNode, type GraphEdge, type ForceGraph3DProps, type GraphLayout, type EncodedNodeData } from './force-graph-3d'
export { SurfacePlot3D, type SurfacePlot3DProps } from './surface-plot-3d'
export { StateOrbit3D, type StateNode, type StateTransition, type StateOrbit3DProps, type StateLayout } from './state-orbit-3d'
export { GlowShaderMaterial } from './glow-material'
export { ObservatoryPostProcessing } from './post-processing'
export { InstancedSignalCloud } from './instanced-graph'
export { UncertaintyShaderMaterial } from './uncertainty-material'
export { EnergyEdge, EnergyEdgeMaterial } from './energy-edge'
export { AdaptiveNode, useSemanticZoom } from './semantic-zoom'
export { ZoomLevelBridge, CVD_OPTIONS, ZOOM_LEVEL_LABELS, ExplorerNav } from './explorer-shared'
export type { ExplorerKey } from './explorer-shared'
export { getNodeGeometry, useCVDMode, type DataType } from './cvd-geometry'
export * from './observatory-constants'

// Re-export lib types
export type {
  PharmacovigilanceSignal,
  CareerNode,
  LearningPathway,
  VisualEncoding,
  ObservatoryEncodingSpec,
  CVDMode,
  SemanticZoomLevel,
  SceneAtmosphere,
  AtmosphereId,
  ChemistryCompound,
  RegulatoryMilestone,
  RegulatoryPhase,
  CausalityAssessment,
  WhoUmcCategory,
  TimelineEvent,
  TimelineCategory,
  EpidemiologyPopulation,
  SurvivalPoint,
  MoleculeAtom,
  MoleculeBond,
} from '@/lib/observatory/types'

// Re-export lib functions
export { signalColorScale, surfaceColorScale } from '@/lib/observatory/oklab'
export { perceptualRadius, confidenceToOpacity, confidenceToDissolve, trendToEmissive, seriousnessToGlow } from '@/lib/observatory/visual-encoding'
export { useWorkerLayout } from '@/lib/observatory/use-worker-layout'
export { getQualityConfig, detectQualityLevel, QUALITY_LABELS, type QualityLevel, type QualityConfig } from '@/lib/observatory/quality-presets'

// Theme system
export { OBSERVATORY_THEMES, THEME_OPTIONS, getTheme, type ObservatoryThemeId, type ObservatoryTheme } from '@/lib/observatory/themes'

// Effects bridge (preferences + quality -> per-effect booleans)
export { useExplorerEffects, type UseExplorerEffectsReturn } from '@/lib/observatory/use-explorer-effects'

// Preferences + settings
export { useObservatoryPreferences, type ObservatoryPreferences } from '@/lib/observatory/use-observatory-preferences'
export { ObservatorySettings } from './observatory-settings'

// Explorer registry
export { EXPLORER_REGISTRY, type ObservatoryExplorerType, type ExplorerCapabilities } from '@/lib/observatory/explorer-registry'

// Adapter interface
export { createAdapter, type ObservatoryAdapter, type ObservatoryDataset, type DatasetStem } from '@/lib/observatory/adapter'
