/**
 * Observatory Domain Types — Typed scene objects for data-driven 3D visualization.
 *
 * Section 2.2 of the Observatory 3D Rendering Architecture.
 */

// ─── Pharmacovigilance Signal ────────────────────────────────────────────────

export interface PharmacovigilanceSignal {
  id: string
  drug: string
  event: string
  disproportionality: number
  reportCount: number
  temporalTrend: 'emerging' | 'stable' | 'declining'
  confidenceInterval: [number, number]
  seriousness: number
  relatedness: number
}

// ─── Career Node ─────────────────────────────────────────────────────────────

export interface CareerNode {
  role: string
  domain: string
  salaryRange: [number, number]
  transitionProbability: number
  skillGap: number
}

// ─── Learning Pathway ────────────────────────────────────────────────────────

export interface LearningPathway {
  moduleSequence: string[]
  completionRate: number
  competencyMapping: Record<string, number>
}

// ─── Visual Encoding ─────────────────────────────────────────────────────────

/** Maps data attributes to visual channels */
export interface VisualEncoding {
  position: string
  size: string
  color: string
  opacity: string
  shape: string
  glow: string
}

/** Machine-readable encoding specification */
export interface ObservatoryEncodingSpec {
  name: string
  dataType: string
  encoding: VisualEncoding
  description: string
}

// ─── Scene Atmosphere ───────────────────────────────────────────────────────

export type AtmosphereId = 'deep-space' | 'clinical' | 'war-room' | 'blueprint'

export interface SceneAtmosphere {
  id: AtmosphereId
  label: string
  keyLight: { color: string; intensity: number; position: [number, number, number] }
  fillLight: { color: string; intensity: number; position: [number, number, number] }
  rimLight: { color: string; intensity: number; position: [number, number, number] }
  ambient: { intensity: number }
  hemisphere: { sky: string; ground: string; intensity: number }
  fog: { near: number; far: number }
  stars: { enabled: boolean; count: number; saturation: number; speed: number }
  sparkles: { enabled: boolean; count: number; color: string; opacity: number }
  environment: string
  background: string
}

// ─── Chemistry Compound ──────────────────────────────────────────────────────

export interface ChemistryCompound {
  id: string
  name: string
  smiles: string
  molecularWeight: number
  logP: number
  bindingAffinity: number
  admeProfile: {
    absorption: number
    distribution: number
    metabolism: number
    excretion: number
  }
}

// ─── Regulatory Milestone ────────────────────────────────────────────────────

export type RegulatoryPhase =
  | 'preclinical'
  | 'phase1'
  | 'phase2'
  | 'phase3'
  | 'nda'
  | 'approval'
  | 'postmarket'

export interface RegulatoryMilestone {
  id: string
  label: string
  phase: RegulatoryPhase
  status: 'completed' | 'active' | 'pending' | 'blocked'
  deadline: string
  dependencies: string[]
  complianceScore: number
}

// ─── Causality Assessment ────────────────────────────────────────────────────

export type WhoUmcCategory =
  | 'certain'
  | 'probable'
  | 'possible'
  | 'unlikely'
  | 'conditional'
  | 'unassessable'

export interface CausalityAssessment {
  id: string
  drug: string
  event: string
  naranjoScore: number
  bradfordHillCriteria: Record<string, number>
  whoUmcCategory: WhoUmcCategory
  temporalRelationship: number
}

// ─── Timeline Event ──────────────────────────────────────────────────────────

export type TimelineCategory =
  | 'signal'
  | 'regulatory'
  | 'clinical'
  | 'manufacturing'
  | 'postmarket'

export interface TimelineEvent {
  id: string
  label: string
  timestamp: string
  category: TimelineCategory
  severity: number
  velocity: number
  linkedSignals: string[]
}

// ─── Epidemiology Population ─────────────────────────────────────────────────

export interface SurvivalPoint {
  time: number
  probability: number
}

export interface EpidemiologyPopulation {
  id: string
  cohort: string
  population: number
  incidenceRate: number
  prevalence: number
  relativeRisk: number
  attributableFraction: number
  survivalCurve: SurvivalPoint[]
}

// ─── Molecule Structure ──────────────────────────────────────────────────────

export interface MoleculeAtom {
  id: string
  element: string
  position: [number, number, number]
  charge: number
  hybridization: string
}

export interface MoleculeBond {
  source: string
  target: string
  order: 1 | 2 | 3
  rotatable: boolean
}

// ─── CVD Support ─────────────────────────────────────────────────────────────

export type CVDMode = 'normal' | 'deuteranopia' | 'protanopia' | 'tritanopia'

// ─── Semantic Zoom ───────────────────────────────────────────────────────────

export type SemanticZoomLevel = 1 | 2 | 3 | 4
