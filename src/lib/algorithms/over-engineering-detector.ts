/**
 * Over-Engineering Detection Algorithm
 *
 * @description Identifies capabilities and management systems that are
 *              over-engineered relative to a given strategy's requirements.
 * @complexity Time: O(n × m), Space: O(n × m)
 *             where n = capabilities, m = requirements
 *
 * Mathematical basis:
 * OE(c) = w₁·complexity_ratio + w₂·feature_waste + w₃·abstraction_excess + w₄·scale_mismatch
 *
 * Invariant:
 * Each capability's score reflects only the requirements it actually serves.
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface Requirement {
  id: string;
  description: string;
  criticality: number; // [0, 1] - how important
  complexity_budget: number; // [1, 10] - max justified complexity
  scale_target: ScaleTarget;
}

export type ScaleTarget = 'small' | 'medium' | 'large' | 'enterprise';

export interface Feature {
  name: string;
  used_by_strategy: boolean;
  complexity_contribution: number;
}

export interface CapabilityMetrics {
  lines_of_code: number;
  abstraction_layers: number;
  dependencies: number;
  configuration_options: number;
  test_coverage: number;
}

export interface Capability {
  id: string;
  name: string;
  type: 'capability' | 'management_system';
  requirements_served: string[];
  features: Feature[];
  metrics: CapabilityMetrics;
}

export interface Strategy {
  name: string;
  requirements: Requirement[];
}

export interface OverEngineeringFactors {
  complexity_ratio: number;
  feature_waste_ratio: number;
  abstraction_excess: number;
  scale_mismatch: number;
}

export type Verdict =
  | 'appropriate'
  | 'slightly_over'
  | 'significantly_over'
  | 'severely_over';

export interface SimplificationPotential {
  estimated_reduction: number; // percentage
  risk_level: 'low' | 'medium' | 'high';
}

export interface CapabilityAnalysis {
  capability_id: string;
  capability_name: string;
  over_engineering_score: number;
  verdict: Verdict;
  factors: OverEngineeringFactors;
  recommendations: string[];
  simplification_potential: SimplificationPotential;
  is_orphan: boolean;
}

export interface DetectorConfig {
  weights: {
    complexity: number;
    feature_waste: number;
    abstraction: number;
    scale_mismatch: number;
  };
  thresholds: {
    appropriate: number; // below this = appropriate
    slight: number; // below this = slightly over
    significant: number; // below this = significantly over
    // above significant = severely over
  };
  baseline_complexity: {
    loc_per_complexity_unit: number;
    layers_per_complexity_unit: number;
    deps_per_complexity_unit: number;
    config_options_per_complexity_unit: number;
  };
}

interface StrategyBaseline {
  avg_criticality: number;
  total_complexity_budget: number;
  max_scale: ScaleTarget;
  requirement_count: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_CONFIG: DetectorConfig = {
  weights: {
    complexity: 0.4,
    feature_waste: 0.25,
    abstraction: 0.2,
    scale_mismatch: 0.15,
  },
  thresholds: {
    appropriate: 0.3,
    slight: 0.5,
    significant: 0.7,
  },
  baseline_complexity: {
    loc_per_complexity_unit: 200,
    layers_per_complexity_unit: 0.5,
    deps_per_complexity_unit: 3,
    config_options_per_complexity_unit: 5,
  },
};

const SCALE_ORDER: Record<ScaleTarget, number> = {
  small: 1,
  medium: 2,
  large: 3,
  enterprise: 4,
};

import { logger } from '@/lib/logger';
const log = logger.scope('algorithms/over-engineering-detector');

// ============================================================================
// Main Algorithm
// ============================================================================

export function detectOverEngineering(
  strategy: Strategy,
  capabilities: Capability[],
  config: Partial<DetectorConfig> = {}
): CapabilityAnalysis[] {
  // Merge with defaults
  const cfg = mergeConfig(DEFAULT_CONFIG, config);

  // Validate inputs
  if (strategy.requirements.length === 0) {
    log.warn('Strategy has no requirements - returning empty analysis');
    return [];
  }

  // Build requirement index for O(1) lookup
  const requirementMap = buildRequirementIndex(strategy.requirements);

  // Calculate strategy baseline for normalization
  const baseline = calculateStrategyBaseline(strategy);

  // Analyze each capability
  const results: CapabilityAnalysis[] = capabilities.map((capability) =>
    analyzeCapability(capability, requirementMap, baseline, cfg)
  );

  // Sort by over-engineering score descending (worst first)
  return results.sort((a, b) => b.over_engineering_score - a.over_engineering_score);
}

// ============================================================================
// Core Analysis Functions
// ============================================================================

function analyzeCapability(
  capability: Capability,
  requirementMap: Map<string, Requirement>,
  _baseline: StrategyBaseline,
  config: DetectorConfig
): CapabilityAnalysis {
  // Get served requirements
  const servedReqs = capability.requirements_served
    .map((id) => requirementMap.get(id))
    .filter((r): r is Requirement => r !== undefined);

  // Handle orphan capabilities (serve no requirements)
  if (servedReqs.length === 0) {
    return createOrphanAnalysis(capability);
  }

  // Calculate each factor
  const factors = calculateFactors(capability, servedReqs, config);

  // Compute weighted score
  const score = calculateWeightedScore(factors, config.weights);

  // Classify verdict
  const verdict = classifyVerdict(score, config.thresholds);

  // Generate actionable recommendations
  const recommendations = generateRecommendations(capability, factors, servedReqs);

  // Estimate simplification potential
  const simplification = estimateSimplification(factors);

  return {
    capability_id: capability.id,
    capability_name: capability.name,
    over_engineering_score: Math.round(score * 100) / 100,
    verdict,
    factors: {
      complexity_ratio: Math.round(factors.complexity_ratio * 100) / 100,
      feature_waste_ratio: Math.round(factors.feature_waste_ratio * 100) / 100,
      abstraction_excess: Math.round(factors.abstraction_excess * 100) / 100,
      scale_mismatch: Math.round(factors.scale_mismatch * 100) / 100,
    },
    recommendations,
    simplification_potential: simplification,
    is_orphan: false,
  };
}

function calculateFactors(
  capability: Capability,
  servedReqs: Requirement[],
  config: DetectorConfig
): OverEngineeringFactors {
  // 1. Complexity ratio
  const justifiedComplexity = servedReqs.reduce(
    (sum, r) => sum + r.complexity_budget * r.criticality,
    0
  );
  const complexity_ratio = calculateComplexityRatio(
    capability.metrics,
    justifiedComplexity,
    config.baseline_complexity
  );

  // 2. Feature waste
  const feature_waste_ratio = calculateFeatureWaste(capability.features);

  // 3. Abstraction excess
  const optimalLayers = calculateOptimalLayers(servedReqs);
  const abstraction_excess = calculateAbstractionExcess(
    capability.metrics.abstraction_layers,
    optimalLayers
  );

  // 4. Scale mismatch
  const targetScale = getMaxScaleTarget(servedReqs);
  const scale_mismatch = calculateScaleMismatch(capability, targetScale);

  return {
    complexity_ratio,
    feature_waste_ratio,
    abstraction_excess,
    scale_mismatch,
  };
}

// ============================================================================
// Factor Calculation Functions
// ============================================================================

function calculateComplexityRatio(
  metrics: CapabilityMetrics,
  justifiedComplexity: number,
  baseline: DetectorConfig['baseline_complexity']
): number {
  let adjusted = justifiedComplexity;
  if (adjusted <= 0) {
    adjusted = 1; // Prevent division by zero
  }

  // Normalize actual complexity from metrics
  const actualComplexity =
    metrics.lines_of_code / baseline.loc_per_complexity_unit +
    metrics.abstraction_layers / baseline.layers_per_complexity_unit +
    metrics.dependencies / baseline.deps_per_complexity_unit +
    metrics.configuration_options / baseline.config_options_per_complexity_unit;

  const ratio = actualComplexity / adjusted;

  // Cap at 2.0 for scoring stability (prevents outliers from dominating)
  return Math.min(ratio, 2.0);
}

function calculateFeatureWaste(features: Feature[]): number {
  if (features.length === 0) {
    return 0;
  }

  const unusedCount = features.filter((f) => !f.used_by_strategy).length;
  return unusedCount / features.length;
}

function calculateAbstractionExcess(
  actualLayers: number,
  optimalLayers: number
): number {
  let adjusted = optimalLayers;
  if (adjusted <= 0) {
    adjusted = 1;
  }

  const excess = (actualLayers - adjusted) / adjusted;
  return Math.max(0, excess); // No penalty for under-abstraction
}

function calculateScaleMismatch(
  capability: Capability,
  targetScale: ScaleTarget
): number {
  const capabilityScale = inferScale(capability.metrics);
  const mismatch = SCALE_ORDER[capabilityScale] - SCALE_ORDER[targetScale];

  // Normalize to [0, 1], only penalize over-scaling
  return Math.max(0, mismatch) / 3;
}

function inferScale(metrics: CapabilityMetrics): ScaleTarget {
  // Heuristic based on complexity indicators
  const score =
    (metrics.lines_of_code > 5000 ? 2 : metrics.lines_of_code > 1000 ? 1 : 0) +
    (metrics.dependencies > 20 ? 2 : metrics.dependencies > 10 ? 1 : 0) +
    (metrics.configuration_options > 30
      ? 2
      : metrics.configuration_options > 10
        ? 1
        : 0) +
    (metrics.abstraction_layers > 5 ? 2 : metrics.abstraction_layers > 3 ? 1 : 0);

  if (score >= 6) return 'enterprise';
  if (score >= 4) return 'large';
  if (score >= 2) return 'medium';
  return 'small';
}

function calculateOptimalLayers(requirements: Requirement[]): number {
  // Heuristic: 1 layer base + 0.5 per complexity unit above 3
  const avgComplexity =
    requirements.reduce((sum, r) => sum + r.complexity_budget, 0) /
    requirements.length;

  return Math.max(1, Math.ceil(1 + (avgComplexity - 3) * 0.5));
}

function getMaxScaleTarget(requirements: Requirement[]): ScaleTarget {
  return requirements.reduce((max, r) => {
    return SCALE_ORDER[r.scale_target] > SCALE_ORDER[max] ? r.scale_target : max;
  }, 'small' as ScaleTarget);
}

// ============================================================================
// Scoring & Classification
// ============================================================================

function calculateWeightedScore(
  factors: OverEngineeringFactors,
  weights: DetectorConfig['weights']
): number {
  // Normalize complexity ratio from [0, 2] to [0, 1]
  const normalizedComplexity = factors.complexity_ratio / 2;

  const score =
    weights.complexity * normalizedComplexity +
    weights.feature_waste * factors.feature_waste_ratio +
    weights.abstraction * Math.min(factors.abstraction_excess, 1) +
    weights.scale_mismatch * factors.scale_mismatch;

  return Math.min(1, Math.max(0, score));
}

function classifyVerdict(
  score: number,
  thresholds: DetectorConfig['thresholds']
): Verdict {
  if (score < thresholds.appropriate) return 'appropriate';
  if (score < thresholds.slight) return 'slightly_over';
  if (score < thresholds.significant) return 'significantly_over';
  return 'severely_over';
}

// ============================================================================
// Recommendations Generator
// ============================================================================

function generateRecommendations(
  capability: Capability,
  factors: OverEngineeringFactors,
  servedReqs: Requirement[]
): string[] {
  const recommendations: string[] = [];

  // Complexity recommendations
  if (factors.complexity_ratio > 1.5) {
    recommendations.push(
      `Reduce code complexity: ${capability.name} has ${Math.round((factors.complexity_ratio - 1) * 100)}% more complexity than justified by requirements`
    );

    if (capability.metrics.dependencies > 15) {
      recommendations.push(
        `Audit dependencies: ${capability.metrics.dependencies} dependencies may include unnecessary packages`
      );
    }
  }

  // Feature waste recommendations
  if (factors.feature_waste_ratio > 0.3) {
    const unusedFeatures = capability.features.filter((f) => !f.used_by_strategy);
    recommendations.push(
      `Remove unused features: ${unusedFeatures.length} features (${Math.round(factors.feature_waste_ratio * 100)}%) are not used by the strategy`
    );

    // List top 3 unused features by complexity
    const topUnused = unusedFeatures
      .sort((a, b) => b.complexity_contribution - a.complexity_contribution)
      .slice(0, 3);
    if (topUnused.length > 0) {
      recommendations.push(
        `Priority removals: ${topUnused.map((f) => f.name).join(', ')}`
      );
    }
  }

  // Abstraction recommendations
  if (factors.abstraction_excess > 0.5) {
    const optimalLayers = calculateOptimalLayers(servedReqs);
    recommendations.push(
      `Flatten architecture: Current ${capability.metrics.abstraction_layers} layers could be reduced to ~${optimalLayers} layers`
    );
  }

  // Scale mismatch recommendations
  if (factors.scale_mismatch > 0.3) {
    const targetScale = getMaxScaleTarget(servedReqs);
    const currentScale = inferScale(capability.metrics);
    recommendations.push(
      `Right-size for scale: Built for ${currentScale} but strategy targets ${targetScale}. Consider removing enterprise-grade features.`
    );

    if (capability.metrics.configuration_options > 20) {
      recommendations.push(
        `Reduce configuration options: ${capability.metrics.configuration_options} config options suggest over-generalization`
      );
    }
  }

  // If no specific recommendations, provide general guidance
  if (recommendations.length === 0) {
    recommendations.push(
      'Capability is appropriately engineered for current requirements'
    );
  }

  return recommendations;
}

// ============================================================================
// Simplification Estimation
// ============================================================================

function estimateSimplification(
  factors: OverEngineeringFactors
): SimplificationPotential {
  // Estimate reduction based on factors
  const featureReduction = factors.feature_waste_ratio * 30; // Up to 30% from features
  const complexityReduction = Math.max(0, (factors.complexity_ratio - 1) * 20); // Up to 20%
  const abstractionReduction = factors.abstraction_excess * 15; // Up to 15%

  const totalReduction = Math.min(
    70, // Cap at 70% reduction
    featureReduction + complexityReduction + abstractionReduction
  );

  // Risk increases with reduction amount
  let risk_level: 'low' | 'medium' | 'high';
  if (totalReduction < 20) {
    risk_level = 'low';
  } else if (totalReduction < 40) {
    risk_level = 'medium';
  } else {
    risk_level = 'high';
  }

  return {
    estimated_reduction: Math.round(totalReduction),
    risk_level,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function buildRequirementIndex(
  requirements: Requirement[]
): Map<string, Requirement> {
  return new Map(requirements.map((r) => [r.id, r]));
}

function calculateStrategyBaseline(strategy: Strategy): StrategyBaseline {
  const reqs = strategy.requirements;

  return {
    avg_criticality: reqs.reduce((sum, r) => sum + r.criticality, 0) / reqs.length,
    total_complexity_budget: reqs.reduce((sum, r) => sum + r.complexity_budget, 0),
    max_scale: getMaxScaleTarget(reqs),
    requirement_count: reqs.length,
  };
}

function createOrphanAnalysis(capability: Capability): CapabilityAnalysis {
  return {
    capability_id: capability.id,
    capability_name: capability.name,
    over_engineering_score: 1.0, // Max score - serves no requirements
    verdict: 'severely_over',
    factors: {
      complexity_ratio: 0,
      feature_waste_ratio: 1.0, // All features unused
      abstraction_excess: 0,
      scale_mismatch: 0,
    },
    recommendations: [
      `ORPHAN: "${capability.name}" serves no strategy requirements`,
      'Consider: Is this capability needed? If yes, link to requirements. If no, remove it.',
    ],
    simplification_potential: {
      estimated_reduction: 100,
      risk_level: 'medium',
    },
    is_orphan: true,
  };
}

function mergeConfig(
  defaults: DetectorConfig,
  overrides: Partial<DetectorConfig>
): DetectorConfig {
  return {
    weights: { ...defaults.weights, ...overrides.weights },
    thresholds: { ...defaults.thresholds, ...overrides.thresholds },
    baseline_complexity: {
      ...defaults.baseline_complexity,
      ...overrides.baseline_complexity,
    },
  };
}
