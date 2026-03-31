// Neural Manifold (migrated to visualizations/)
export {
  NeuralManifoldVisualization,
  NeuralManifoldWrapper,
} from './neural-manifold';

// Sparse Coding - re-export from root-level module
// The modular sparse-coding components remain at src/components/sparse-coding/
// This re-export provides a unified visualizations namespace
export {
  useSparseCodingMetrics,
  EfficiencyChart,
  ComparisonBarChart,
  PhysicalConstantsPanel,
  NetworkConfigPanel,
  COLORS,
  PHYSICAL_CONSTANTS,
  DERIVED_CONSTANTS,
  DEFAULT_NETWORK_CONFIG,
  formatNumber,
  formatScientific,
} from '../sparse-coding';

export type {
  NetworkConfig,
  CodingMetrics,
  ComparisonMetrics,
  SparseCodingCalculations,
  SparsitySweepDataPoint,
  ComparisonBarDataPoint,
} from '../sparse-coding';
