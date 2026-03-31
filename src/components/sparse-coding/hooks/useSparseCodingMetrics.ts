import { useMemo } from 'react';
import { PHYSICAL_CONSTANTS, DERIVED_CONSTANTS, type NetworkConfig } from '../constants';

/**
 * Sparse coding metrics for a single coding strategy
 */
export interface CodingMetrics {
  activeNeurons: number;
  totalSpikes: number;
  energy: number;
  information: number;
  bitsPerJoule: number;
  power: number;
  efficiencyRatio: number;
  atpPerSecond: number;
  infoDensity: number;
  bitsPerSpike?: number;
  brainPower: number;
}

/**
 * Comparison metrics between sparse and dense coding
 */
export interface ComparisonMetrics {
  powerSavings: number;
  atpSavings: number;
  efficiencyGain: number;
  brainBudgetUtilization: number;
  landauerLimit: number;
  landauerBitsPerJoule: number;
}

/**
 * Complete calculation results
 */
export interface SparseCodingCalculations {
  sparse: CodingMetrics;
  dense: CodingMetrics;
  comparison: ComparisonMetrics;
}

/**
 * Sparsity sweep data point for charts
 */
export interface SparsitySweepDataPoint {
  sparsity: string;
  bitsPerJoule: number;
  power: number;
  efficiency: number;
  activeNeurons: number;
}

/**
 * Comparison bar chart data point
 */
export interface ComparisonBarDataPoint {
  name: string;
  sparse: number;
  dense: number;
}

/**
 * Hook that calculates all sparse coding thermodynamic metrics
 */
export function useSparseCodingMetrics(networkConfig: NetworkConfig) {
  // Main calculations
  const calculations = useMemo<SparseCodingCalculations>(() => {
    const {
      neuronCount,
      sparseActivation,
      denseActivation,
      firingRate,
      densefiringRate,
      integrationWindow,
      synapticOverhead
    } = networkConfig;

    const windowSeconds = integrationWindow / 1000;

    // === SPARSE CODING METRICS ===
    const sparseActiveNeurons = neuronCount * sparseActivation;
    const sparseTotalSpikes = sparseActiveNeurons * firingRate * windowSeconds;
    const sparseEnergy = sparseTotalSpikes * DERIVED_CONSTANTS.energy_per_spike * (1 + synapticOverhead);
    const sparseInformation = sparseTotalSpikes * PHYSICAL_CONSTANTS.shannon_entropy_per_spike;
    const sparseBitsPerJoule = sparseInformation / sparseEnergy;

    // === DENSE CODING METRICS ===
    const denseActiveNeurons = neuronCount * denseActivation;
    const denseTotalSpikes = denseActiveNeurons * densefiringRate * windowSeconds;
    const denseEnergy = denseTotalSpikes * DERIVED_CONSTANTS.energy_per_spike * (1 + synapticOverhead);
    const denseInformation = denseTotalSpikes * PHYSICAL_CONSTANTS.shannon_entropy_per_spike;
    const denseBitsPerJoule = denseInformation / denseEnergy;

    // === LANDAUER COMPARISON ===
    const landauerBitsPerJoule = 1 / DERIVED_CONSTANTS.landauer_limit;
    const sparseEfficiencyRatio = sparseBitsPerJoule / landauerBitsPerJoule;
    const denseEfficiencyRatio = denseBitsPerJoule / landauerBitsPerJoule;

    // === POWER ANALYSIS ===
    const sparsePower = sparseEnergy / windowSeconds;
    const densePower = denseEnergy / windowSeconds;
    const powerSavings = ((densePower - sparsePower) / densePower) * 100;

    // === SCALING TO FULL BRAIN ===
    const brainScaleFactor = PHYSICAL_CONSTANTS.cortical_neurons / neuronCount;
    const sparseBrainPower = sparsePower * brainScaleFactor;
    const denseBrainPower = densePower * brainScaleFactor;
    const brainBudgetUtilization = (sparseBrainPower / PHYSICAL_CONSTANTS.brain_power_budget) * 100;

    // === METABOLIC EFFICIENCY ===
    const sparseATPPerSecond = (sparseTotalSpikes / windowSeconds) * PHYSICAL_CONSTANTS.ATP_per_spike;
    const denseATPPerSecond = (denseTotalSpikes / windowSeconds) * PHYSICAL_CONSTANTS.ATP_per_spike;
    const atpSavingsPercent = ((denseATPPerSecond - sparseATPPerSecond) / denseATPPerSecond) * 100;

    // === INFORMATION DENSITY ===
    const sparseInfoDensity = sparseInformation / sparseActiveNeurons;
    const denseInfoDensity = denseInformation / denseActiveNeurons;
    const sparseBitsPerSpike = PHYSICAL_CONSTANTS.shannon_entropy_per_spike;

    return {
      sparse: {
        activeNeurons: sparseActiveNeurons,
        totalSpikes: sparseTotalSpikes,
        energy: sparseEnergy,
        information: sparseInformation,
        bitsPerJoule: sparseBitsPerJoule,
        power: sparsePower,
        efficiencyRatio: sparseEfficiencyRatio,
        atpPerSecond: sparseATPPerSecond,
        infoDensity: sparseInfoDensity,
        bitsPerSpike: sparseBitsPerSpike,
        brainPower: sparseBrainPower,
      },
      dense: {
        activeNeurons: denseActiveNeurons,
        totalSpikes: denseTotalSpikes,
        energy: denseEnergy,
        information: denseInformation,
        bitsPerJoule: denseBitsPerJoule,
        power: densePower,
        efficiencyRatio: denseEfficiencyRatio,
        atpPerSecond: denseATPPerSecond,
        infoDensity: denseInfoDensity,
        brainPower: denseBrainPower,
      },
      comparison: {
        powerSavings,
        atpSavings: atpSavingsPercent,
        efficiencyGain: (sparseBitsPerJoule / denseBitsPerJoule),
        brainBudgetUtilization,
        landauerLimit: DERIVED_CONSTANTS.landauer_limit,
        landauerBitsPerJoule,
      }
    };
  }, [networkConfig]);

  // Chart data - sparsity sweep
  const sparsitySweepData = useMemo<SparsitySweepDataPoint[]>(() => {
    const data: SparsitySweepDataPoint[] = [];
    for (let sparsity = 0.01; sparsity <= 0.30; sparsity += 0.01) {
      const activeNeurons = networkConfig.neuronCount * sparsity;
      const totalSpikes = activeNeurons * networkConfig.firingRate * (networkConfig.integrationWindow / 1000);
      const energy = totalSpikes * DERIVED_CONSTANTS.energy_per_spike * (1 + networkConfig.synapticOverhead);
      const information = totalSpikes * PHYSICAL_CONSTANTS.shannon_entropy_per_spike;
      const bitsPerJoule = information / energy;
      const power = energy / (networkConfig.integrationWindow / 1000);

      data.push({
        sparsity: (sparsity * 100).toFixed(0),
        bitsPerJoule: bitsPerJoule / 1e21,
        power: power * 1e6,
        efficiency: (bitsPerJoule / (1 / DERIVED_CONSTANTS.landauer_limit)) * 100,
        activeNeurons: activeNeurons / 1000,
      });
    }
    return data;
  }, [networkConfig]);

  // Chart data - comparison bars
  const comparisonBarData = useMemo<ComparisonBarDataPoint[]>(() => [
    {
      name: 'Active Neurons',
      sparse: calculations.sparse.activeNeurons,
      dense: calculations.dense.activeNeurons,
    },
    {
      name: 'Total Spikes/s',
      sparse: calculations.sparse.totalSpikes / (networkConfig.integrationWindow / 1000),
      dense: calculations.dense.totalSpikes / (networkConfig.integrationWindow / 1000),
    },
    {
      name: 'Power (μW)',
      sparse: calculations.sparse.power * 1e6,
      dense: calculations.dense.power * 1e6,
    },
  ], [calculations, networkConfig.integrationWindow]);

  return {
    calculations,
    sparsitySweepData,
    comparisonBarData,
    constants: PHYSICAL_CONSTANTS,
    derived: DERIVED_CONSTANTS,
  };
}
