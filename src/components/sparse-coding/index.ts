// Constants and types
export * from './constants';
export * from './utils';

// Hooks
export { useSparseCodingMetrics } from './hooks/useSparseCodingMetrics';
export type {
  CodingMetrics,
  ComparisonMetrics,
  SparseCodingCalculations,
  SparsitySweepDataPoint,
  ComparisonBarDataPoint,
} from './hooks/useSparseCodingMetrics';

// Charts
export { EfficiencyChart } from './charts/EfficiencyChart';
export { ComparisonBarChart } from './charts/ComparisonBarChart';

// Panels
export { PhysicalConstantsPanel } from './panels/PhysicalConstantsPanel';
export { NetworkConfigPanel } from './panels/NetworkConfigPanel';

// Main Calculator (dynamic import wrapper)
export { default as SparseCodingCalculator } from './SparseCodingCalculatorWrapper';
export type { SparseCodingCalculatorProps } from './SparseCodingCalculatorWrapper';
