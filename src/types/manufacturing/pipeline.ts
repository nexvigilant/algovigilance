import { type ALO, type ActivityEngineType } from '../alo';

/**
 * Pipeline stages for content manufacturing
 */
export enum PipelineStage {
  CLASSIFY = 'CLASSIFY',
  ASSIGN_ENGINE = 'ASSIGN_ENGINE',
  GENERATE_HOOK = 'GENERATE_HOOK',
  GENERATE_CONCEPT = 'GENERATE_CONCEPT',
  GENERATE_ACTIVITY = 'GENERATE_ACTIVITY',
  GENERATE_REFLECTION = 'GENERATE_REFLECTION',
  VALIDATE = 'VALIDATE',
  PUBLISH = 'PUBLISH'
}

/**
 * Input for a pipeline stage
 */
export interface StageInput {
  ksbId: string;
  context?: Record<string, unknown>;
  previousResults?: Partial<ALO>;
}

/**
 * Output from a pipeline stage
 */
export interface StageOutput {
  stage: PipelineStage;
  success: boolean;
  result?: unknown;
  error?: string;
  durationMs: number;
}

/**
 * Configuration for the content generation pipeline
 */
export interface PipelineConfig {
  stages: PipelineStage[];
  checkpointAfterEachStage: boolean;
  stopOnError: boolean;
}

/**
 * Result of a full pipeline execution
 */
export interface PipelineResult {
  ksbId: string;
  success: boolean;
  stages: StageOutput[];
  finalAlo?: ALO;
  totalDurationMs: number;
}

/**
 * Activity engine mapping configuration
 */
export interface EngineMappingConfig {
  engineMapping: {
    knowledge: ActivityEngineType[];
    skill: ActivityEngineType[];
    behavior: ActivityEngineType[];
    ai_integration: ActivityEngineType[];
  };
  difficultyProgression: boolean;
  authenticWorkSimulation: boolean;
}
