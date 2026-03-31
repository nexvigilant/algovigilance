/**
 * Activity Engines
 * Interactive learning components for KSB practice activities
 */

// Red Pen Engine - Error detection and correction
export { RedPenEngine, type RedPenResult } from './red-pen-engine';

// Triage Engine - Classification and prioritization
export { TriageEngine, type TriageResult } from './triage-engine';

// Synthesis Engine - Content creation with AI evaluation
export { SynthesisEngine, type SynthesisResult } from './synthesis-engine';

// Calculator Engine - PV calculations (PRR, ROR, IC, EBGM)
export { CalculatorEngine } from './calculator-engine';

// Timeline Engine - Regulatory deadline management
export { TimelineEngine } from './timeline-engine';

// Code Playground Engine - Interactive coding exercises with LiveCodes
export { CodePlaygroundEngine, type CodePlaygroundResult } from './code-playground-engine';

/**
 * Engine Type Map
 * Maps engine type strings to their components
 */
export const ENGINE_COMPONENTS = {
  red_pen: 'RedPenEngine',
  triage: 'TriageEngine',
  synthesis: 'SynthesisEngine',
  calculator: 'CalculatorEngine',
  timeline: 'TimelineEngine',
  code_playground: 'CodePlaygroundEngine',
} as const;

export type EngineType = keyof typeof ENGINE_COMPONENTS;
