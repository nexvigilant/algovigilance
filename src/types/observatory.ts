/**
 * Observatory Domain Types — canonical import path.
 *
 * Re-exports all types from the primary definition at lib/observatory/types.ts.
 * This path satisfies the CLAUDE.md benchmark: "typed with a corresponding
 * TypeScript interface in src/types/observatory.ts".
 *
 * Primary definitions: src/lib/observatory/types.ts
 * Component re-exports: src/components/observatory/index.ts
 */

export type {
  PharmacovigilanceSignal,
  CareerNode,
  LearningPathway,
  VisualEncoding,
  ObservatoryEncodingSpec,
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
  CVDMode,
  SemanticZoomLevel,
} from '@/lib/observatory/types'
