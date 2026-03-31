'use client';

import { useState, useMemo, useCallback } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Legend } from 'recharts';
import { NEURAL_THEME } from '@/lib/design-tokens';
import { BRANDED_STRINGS } from '@/lib/branded-strings';

// =============================================================================
// SPARSE CODING EFFICIENCY CALCULATOR
// AlgoVigilance Neural Module - Thermodynamic Analysis Tool
// Based on: Scientific Concept Optimization Research Report, Section 1.1
// =============================================================================

interface SparseCodingCalculatorProps {
  highlightSection?: string;
  onSectionClick?: (sectionId: string) => void;
}

const SparseCodingCalculator = ({ highlightSection, onSectionClick }: SparseCodingCalculatorProps = {}) => {
  const getHighlightStyle = (sectionId: string) => {
    if (highlightSection === sectionId) {
      return {
        boxShadow: '0 0 0 3px #00d4aa, 0 0 20px rgba(0, 212, 170, 0.4)',
        transform: 'scale(1.02)',
        transition: 'all 0.3s ease-in-out',
        zIndex: 10,
        position: 'relative' as const,
      };
    }
    return {};
  };
  // Physical Constants (SI Units)
  const CONSTANTS = useMemo(() => ({
    k_B: 1.380649e-23,        // Boltzmann constant (J/K)
    T_body: 310,              // Body temperature (K) = 37°C
    ln2: Math.log(2),         // Natural log of 2
    ATP_energy: 8.3e-20,      // Energy per ATP hydrolysis (J)
    ATP_per_spike: 1.2e9,     // ATP molecules consumed per action potential
    voltage_swing: 0.1,       // Action potential voltage swing (V) = 100mV
    membrane_capacitance: 1e-2, // Membrane capacitance (F/m²)

    // From Research Report Section 1.1
    shannon_entropy_per_spike: 4.9e11,      // bits per action potential
    thermodynamic_info_per_spike: 3.4e11,   // bits per action potential
    brain_power_budget: 20,                  // Watts
    cortical_neurons: 16e9,                  // ~16 billion cortical neurons
    synapses_per_neuron: 7000,               // Average synaptic connections
  }), []);

  // Derived Constants
  const DERIVED = useMemo(() => ({
    landauer_limit: CONSTANTS.k_B * CONSTANTS.T_body * CONSTANTS.ln2, // ~2.97e-21 J/bit
    energy_per_spike: CONSTANTS.ATP_per_spike * CONSTANTS.ATP_energy,  // ~1e-10 J
  }), [CONSTANTS]);

  // ============= STATE =============
  const [networkConfig, setNetworkConfig] = useState({
    neuronCount: 1e6,           // 1 million neuron network
    sparseActivation: 0.02,     // 2% sparse activation (biological default)
    denseActivation: 0.15,      // 15% dense activation (typical ANN)
    firingRate: 5,              // Hz (sparse temporal coding)
    densefiringRate: 20,        // Hz (rate coding)
    integrationWindow: 1000,    // ms
    synapticOverhead: 0.3,      // 30% additional energy for synaptic maintenance
  });

  // ============= CALCULATIONS =============
  const calculations = useMemo(() => {
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
    const sparseEnergy = sparseTotalSpikes * DERIVED.energy_per_spike * (1 + synapticOverhead);
    const sparseInformation = sparseTotalSpikes * CONSTANTS.shannon_entropy_per_spike;
    const sparseBitsPerJoule = sparseInformation / sparseEnergy;

    // === DENSE CODING METRICS ===
    const denseActiveNeurons = neuronCount * denseActivation;
    const denseTotalSpikes = denseActiveNeurons * densefiringRate * windowSeconds;
    const denseEnergy = denseTotalSpikes * DERIVED.energy_per_spike * (1 + synapticOverhead);
    const denseInformation = denseTotalSpikes * CONSTANTS.shannon_entropy_per_spike;
    const denseBitsPerJoule = denseInformation / denseEnergy;

    // === LANDAUER COMPARISON ===
    const landauerBitsPerJoule = 1 / DERIVED.landauer_limit;
    const sparseEfficiencyRatio = sparseBitsPerJoule / landauerBitsPerJoule;
    const denseEfficiencyRatio = denseBitsPerJoule / landauerBitsPerJoule;

    // === POWER ANALYSIS ===
    const sparsePower = sparseEnergy / windowSeconds;
    const densePower = denseEnergy / windowSeconds;
    const powerSavings = ((densePower - sparsePower) / densePower) * 100;

    // === SCALING TO FULL BRAIN ===
    const brainScaleFactor = CONSTANTS.cortical_neurons / neuronCount;
    const sparseBrainPower = sparsePower * brainScaleFactor;
    const denseBrainPower = densePower * brainScaleFactor;
    const brainBudgetUtilization = (sparseBrainPower / CONSTANTS.brain_power_budget) * 100;

    // === METABOLIC EFFICIENCY ===
    const sparseATPPerSecond = (sparseTotalSpikes / windowSeconds) * CONSTANTS.ATP_per_spike;
    const denseATPPerSecond = (denseTotalSpikes / windowSeconds) * CONSTANTS.ATP_per_spike;
    const atpSavingsPercent = ((denseATPPerSecond - sparseATPPerSecond) / denseATPPerSecond) * 100;

    // === INFORMATION DENSITY ===
    const sparseInfoDensity = sparseInformation / sparseActiveNeurons; // bits per active neuron
    const denseInfoDensity = denseInformation / denseActiveNeurons;
    const sparseBitsPerSpike = CONSTANTS.shannon_entropy_per_spike;

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
        landauerLimit: DERIVED.landauer_limit,
        landauerBitsPerJoule,
      }
    };
  }, [networkConfig, CONSTANTS, DERIVED]);

  // ============= CHART DATA =============
  const sparsitySweepData = useMemo(() => {
    const data = [];
    for (let sparsity = 0.01; sparsity <= 0.30; sparsity += 0.01) {
      const activeNeurons = networkConfig.neuronCount * sparsity;
      const totalSpikes = activeNeurons * networkConfig.firingRate * (networkConfig.integrationWindow / 1000);
      const energy = totalSpikes * DERIVED.energy_per_spike * (1 + networkConfig.synapticOverhead);
      const information = totalSpikes * CONSTANTS.shannon_entropy_per_spike;
      const bitsPerJoule = information / energy;
      const power = energy / (networkConfig.integrationWindow / 1000);

      data.push({
        sparsity: (sparsity * 100).toFixed(0),
        bitsPerJoule: bitsPerJoule / 1e21,
        power: power * 1e6,
        efficiency: (bitsPerJoule / (1 / DERIVED.landauer_limit)) * 100,
        activeNeurons: activeNeurons / 1000,
      });
    }
    return data;
  }, [networkConfig, CONSTANTS, DERIVED]);

  const comparisonBarData = useMemo(() => [
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
  ], [calculations, networkConfig]);

  // ============= FORMATTING =============
  const formatNumber = useCallback((num: number, decimals = 2) => {
    if (num === 0) return '0';
    if (Math.abs(num) < 1e-15) return num.toExponential(decimals);
    if (Math.abs(num) >= 1e15) return num.toExponential(decimals);
    if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(decimals) + ' G';
    if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(decimals) + ' M';
    if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(decimals) + ' k';
    if (Math.abs(num) < 0.001) return num.toExponential(decimals);
    return num.toFixed(decimals);
  }, []);

  const formatScientific = useCallback((num: number, decimals = 2) => {
    return num.toExponential(decimals);
  }, []);

  // ============= COLORS =============
  const colors = NEURAL_THEME.colors;

  // ============= RENDER =============
  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${colors.background} 0%, #0f1419 50%, #0a0e14 100%)`,
      fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
      color: colors.text,
      padding: '24px',
      boxSizing: 'border-box',
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '32px',
        borderBottom: `1px solid ${colors.border}`,
        paddingBottom: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: colors.primary,
            boxShadow: `0 0 16px ${colors.primary}`,
          }} />
          <h1 style={{
            fontSize: '24px',
            fontWeight: 700,
            margin: 0,
            background: `linear-gradient(90deg, ${colors.text}, ${colors.primary})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            {BRANDED_STRINGS.calculators.sparseCoding.title}
          </h1>
        </div>
        <p style={{ fontSize: '12px', color: colors.textMuted, margin: 0 }}>
          {BRANDED_STRINGS.calculators.sparseCoding.subtitle}
        </p>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px' }}>

        {/* Left Panel - Configuration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Physical Constants Reference */}
          <div
            data-highlight="brain-power"
            onClick={() => onSectionClick?.('brain-power')}
            style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            padding: '20px',
            cursor: onSectionClick ? 'pointer' : 'default',
            ...getHighlightStyle('brain-power'),
          }}>
            <div style={{
              fontSize: '10px',
              color: colors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '16px',
            }}>
              Physical Constants (T = 310K)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: colors.textMuted }}>Landauer Limit</span>
                <span style={{ fontSize: '11px', color: colors.primary, fontFamily: 'monospace' }}>
                  {formatScientific(DERIVED.landauer_limit)} J/bit
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: colors.textMuted }}>k<sub>B</sub>T ln(2)</span>
                <span style={{ fontSize: '11px', color: colors.primary, fontFamily: 'monospace' }}>
                  2.97 × 10⁻²¹ J
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: colors.textMuted }}>Energy/Spike</span>
                <span style={{ fontSize: '11px', color: colors.accent, fontFamily: 'monospace' }}>
                  {formatScientific(DERIVED.energy_per_spike)} J
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: colors.textMuted }}>Shannon Entropy/Spike</span>
                <span style={{ fontSize: '11px', color: colors.accent, fontFamily: 'monospace' }}>
                  4.9 × 10¹¹ bits
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: colors.textMuted }}>Brain Power Budget</span>
                <span style={{ fontSize: '11px', color: colors.warning, fontFamily: 'monospace' }}>
                  20 W
                </span>
              </div>
            </div>
          </div>

          {/* Network Configuration */}
          <div
            data-highlight="activation-sliders"
            onClick={() => onSectionClick?.('activation-sliders')}
            style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            padding: '20px',
            cursor: onSectionClick ? 'pointer' : 'default',
            ...getHighlightStyle('activation-sliders'),
          }}>
            <div style={{
              fontSize: '10px',
              color: colors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '16px',
            }}>
              Network Configuration
            </div>

            {/* Neuron Count */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px' }}>Neuron Population</span>
                <span style={{ fontSize: '11px', color: colors.primary, fontFamily: 'monospace' }}>
                  {formatNumber(networkConfig.neuronCount)}
                </span>
              </div>
              <input
                type="range"
                min="4"
                max="9"
                step="0.1"
                value={Math.log10(networkConfig.neuronCount)}
                onChange={(e) => setNetworkConfig(prev => ({
                  ...prev,
                  neuronCount: Math.pow(10, parseFloat(e.target.value))
                }))}
                style={{
                  width: '100%',
                  height: '4px',
                  borderRadius: '2px',
                  background: colors.border,
                  appearance: 'none',
                  cursor: 'pointer',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontSize: '9px', color: colors.textMuted }}>10⁴</span>
                <span style={{ fontSize: '9px', color: colors.textMuted }}>10⁹</span>
              </div>
            </div>

            {/* Sparse Activation */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px' }}>Sparse Activation</span>
                <span style={{ fontSize: '11px', color: colors.sparse, fontFamily: 'monospace' }}>
                  {(networkConfig.sparseActivation * 100).toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min="0.005"
                max="0.10"
                step="0.005"
                value={networkConfig.sparseActivation}
                onChange={(e) => setNetworkConfig(prev => ({
                  ...prev,
                  sparseActivation: parseFloat(e.target.value)
                }))}
                style={{
                  width: '100%',
                  height: '4px',
                  borderRadius: '2px',
                  background: colors.border,
                  appearance: 'none',
                  cursor: 'pointer',
                }}
              />
            </div>

            {/* Dense Activation */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px' }}>Dense Activation</span>
                <span style={{ fontSize: '11px', color: colors.dense, fontFamily: 'monospace' }}>
                  {(networkConfig.denseActivation * 100).toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.50"
                step="0.01"
                value={networkConfig.denseActivation}
                onChange={(e) => setNetworkConfig(prev => ({
                  ...prev,
                  denseActivation: parseFloat(e.target.value)
                }))}
                style={{
                  width: '100%',
                  height: '4px',
                  borderRadius: '2px',
                  background: colors.border,
                  appearance: 'none',
                  cursor: 'pointer',
                }}
              />
            </div>

            {/* Firing Rates */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px' }}>Sparse Firing Rate</span>
                <span style={{ fontSize: '11px', color: colors.sparse, fontFamily: 'monospace' }}>
                  {networkConfig.firingRate} Hz
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={networkConfig.firingRate}
                onChange={(e) => setNetworkConfig(prev => ({
                  ...prev,
                  firingRate: parseInt(e.target.value)
                }))}
                style={{
                  width: '100%',
                  height: '4px',
                  borderRadius: '2px',
                  background: colors.border,
                  appearance: 'none',
                  cursor: 'pointer',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px' }}>Dense Firing Rate</span>
                <span style={{ fontSize: '11px', color: colors.dense, fontFamily: 'monospace' }}>
                  {networkConfig.densefiringRate} Hz
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={networkConfig.densefiringRate}
                onChange={(e) => setNetworkConfig(prev => ({
                  ...prev,
                  densefiringRate: parseInt(e.target.value)
                }))}
                style={{
                  width: '100%',
                  height: '4px',
                  borderRadius: '2px',
                  background: colors.border,
                  appearance: 'none',
                  cursor: 'pointer',
                }}
              />
            </div>

            {/* Synaptic Overhead */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px' }}>Synaptic Overhead</span>
                <span style={{ fontSize: '11px', color: colors.purple, fontFamily: 'monospace' }}>
                  {(networkConfig.synapticOverhead * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.6"
                step="0.05"
                value={networkConfig.synapticOverhead}
                onChange={(e) => setNetworkConfig(prev => ({
                  ...prev,
                  synapticOverhead: parseFloat(e.target.value)
                }))}
                style={{
                  width: '100%',
                  height: '4px',
                  borderRadius: '2px',
                  background: colors.border,
                  appearance: 'none',
                  cursor: 'pointer',
                }}
              />
            </div>
          </div>

          {/* Efficiency Summary */}
          <div style={{
            background: `linear-gradient(135deg, rgba(0,212,170,0.1), rgba(0,136,204,0.1))`,
            border: `1px solid rgba(0,212,170,0.3)`,
            borderRadius: '12px',
            padding: '20px',
          }}>
            <div style={{
              fontSize: '10px',
              color: colors.primary,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '16px',
            }}>
              Efficiency Advantage
            </div>

            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '36px', fontWeight: 700, color: colors.success }}>
                {calculations.comparison.powerSavings.toFixed(1)}%
              </div>
              <div style={{ fontSize: '11px', color: colors.textMuted }}>
                Power Reduction (Sparse vs Dense)
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <div style={{ fontSize: '18px', fontWeight: 600, color: colors.sparse }}>
                  {calculations.comparison.efficiencyGain.toFixed(1)}×
                </div>
                <div style={{ fontSize: '9px', color: colors.textMuted }}>
                  Bits/Joule Gain
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <div style={{ fontSize: '18px', fontWeight: 600, color: colors.accent }}>
                  {calculations.comparison.atpSavings.toFixed(1)}%
                </div>
                <div style={{ fontSize: '9px', color: colors.textMuted }}>
                  ATP Reduction
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Results & Visualizations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Key Metrics Grid */}
          <div
            data-highlight="efficiency-comparison"
            onClick={() => onSectionClick?.('efficiency-comparison')}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
              cursor: onSectionClick ? 'pointer' : 'default',
              borderRadius: '12px',
              ...getHighlightStyle('efficiency-comparison'),
            }}>

            {/* Sparse Bits/Joule */}
            <div style={{
              background: colors.surface,
              border: `1px solid ${colors.sparse}`,
              borderRadius: '12px',
              padding: '20px',
            }}>
              <div style={{ fontSize: '10px', color: colors.textMuted, marginBottom: '8px' }}>
                SPARSE BITS/JOULE
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: colors.sparse }}>
                {formatScientific(calculations.sparse.bitsPerJoule)}
              </div>
              <div style={{ fontSize: '10px', color: colors.textMuted, marginTop: '8px' }}>
                Efficiency: {(calculations.sparse.efficiencyRatio * 100).toFixed(4)}% of Landauer
              </div>
            </div>

            {/* Dense Bits/Joule */}
            <div style={{
              background: colors.surface,
              border: `1px solid ${colors.dense}`,
              borderRadius: '12px',
              padding: '20px',
            }}>
              <div style={{ fontSize: '10px', color: colors.textMuted, marginBottom: '8px' }}>
                DENSE BITS/JOULE
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: colors.dense }}>
                {formatScientific(calculations.dense.bitsPerJoule)}
              </div>
              <div style={{ fontSize: '10px', color: colors.textMuted, marginTop: '8px' }}>
                Efficiency: {(calculations.dense.efficiencyRatio * 100).toFixed(4)}% of Landauer
              </div>
            </div>

            {/* Sparse Power */}
            <div style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '20px',
            }}>
              <div style={{ fontSize: '10px', color: colors.textMuted, marginBottom: '8px' }}>
                SPARSE POWER
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: colors.primary }}>
                {(calculations.sparse.power * 1e6).toFixed(2)}
              </div>
              <div style={{ fontSize: '10px', color: colors.textMuted, marginTop: '8px' }}>
                μW (this network)
              </div>
            </div>

            {/* Dense Power */}
            <div style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '20px',
            }}>
              <div style={{ fontSize: '10px', color: colors.textMuted, marginBottom: '8px' }}>
                DENSE POWER
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: colors.warning }}>
                {(calculations.dense.power * 1e6).toFixed(2)}
              </div>
              <div style={{ fontSize: '10px', color: colors.textMuted, marginTop: '8px' }}>
                μW (this network)
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

            {/* Sparsity Sweep Chart */}
            <div style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '20px',
            }}>
              <div style={{
                fontSize: '10px',
                color: colors.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '16px',
              }}>
                Efficiency vs Activation Level
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={sparsitySweepData}>
                  <defs>
                    <linearGradient id="efficiencyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={colors.primary} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={colors.primary} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                  <XAxis
                    dataKey="sparsity"
                    stroke={colors.textMuted}
                    fontSize={10}
                    label={{ value: 'Activation %', position: 'bottom', fill: colors.textMuted, fontSize: 10 }}
                  />
                  <YAxis
                    stroke={colors.textMuted}
                    fontSize={10}
                    label={{ value: 'Bits/J (×10²¹)', angle: -90, position: 'insideLeft', fill: colors.textMuted, fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: colors.background,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                    formatter={(value) => [`${typeof value === 'number' ? value.toFixed(2) : value} ×10²¹`, 'Bits/Joule']}
                    labelFormatter={(label) => `Activation: ${label}%`}
                  />
                  <Area
                    type="monotone"
                    dataKey="bitsPerJoule"
                    stroke={colors.primary}
                    fill="url(#efficiencyGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div style={{ fontSize: '10px', color: colors.textMuted, marginTop: '12px', textAlign: 'center' }}>
                <span style={{ color: colors.sparse }}>●</span> Current sparse: {(networkConfig.sparseActivation * 100).toFixed(1)}%
                <span style={{ marginLeft: '16px', color: colors.dense }}>●</span> Current dense: {(networkConfig.denseActivation * 100).toFixed(1)}%
              </div>
            </div>

            {/* Power Comparison Bar Chart */}
            <div style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '20px',
            }}>
              <div style={{
                fontSize: '10px',
                color: colors.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '16px',
              }}>
                Sparse vs Dense Comparison
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={comparisonBarData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                  <XAxis type="number" stroke={colors.textMuted} fontSize={10} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke={colors.textMuted}
                    fontSize={10}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      background: colors.background,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="sparse" name="Sparse" fill={colors.sparse} radius={[0, 4, 4, 0]} />
                  <Bar dataKey="dense" name="Dense" fill={colors.dense} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Metrics Table */}
          <div
            data-highlight="landauer-table"
            onClick={() => onSectionClick?.('landauer-table')}
            style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            padding: '20px',
            cursor: onSectionClick ? 'pointer' : 'default',
            ...getHighlightStyle('landauer-table'),
          }}>
            <div style={{
              fontSize: '10px',
              color: colors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '16px',
            }}>
              Detailed Thermodynamic Analysis
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', color: colors.textMuted, fontWeight: 500 }}>Metric</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', color: colors.sparse, fontWeight: 600 }}>Sparse Coding</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', color: colors.dense, fontWeight: 600 }}>Dense Coding</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', color: colors.success, fontWeight: 600 }}>Advantage</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '12px 16px', color: colors.textMuted }}>Active Neurons</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace' }}>{formatNumber(calculations.sparse.activeNeurons)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace' }}>{formatNumber(calculations.dense.activeNeurons)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', color: colors.success }}>
                      {((1 - calculations.sparse.activeNeurons / calculations.dense.activeNeurons) * 100).toFixed(1)}% fewer
                    </td>
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '12px 16px', color: colors.textMuted }}>Spikes/second</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace' }}>{formatNumber(calculations.sparse.totalSpikes)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace' }}>{formatNumber(calculations.dense.totalSpikes)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', color: colors.success }}>
                      {((1 - calculations.sparse.totalSpikes / calculations.dense.totalSpikes) * 100).toFixed(1)}% fewer
                    </td>
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '12px 16px', color: colors.textMuted }}>Energy (J/window)</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace' }}>{formatScientific(calculations.sparse.energy)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace' }}>{formatScientific(calculations.dense.energy)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', color: colors.success }}>
                      {calculations.comparison.powerSavings.toFixed(1)}% savings
                    </td>
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '12px 16px', color: colors.textMuted }}>Information (bits/window)</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace' }}>{formatScientific(calculations.sparse.information)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace' }}>{formatScientific(calculations.dense.information)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', color: colors.textMuted }}>
                      —
                    </td>
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '12px 16px', color: colors.textMuted }}>Bits/Joule</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, color: colors.sparse }}>{formatScientific(calculations.sparse.bitsPerJoule)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, color: colors.dense }}>{formatScientific(calculations.dense.bitsPerJoule)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, color: colors.success }}>
                      {calculations.comparison.efficiencyGain.toFixed(2)}× better
                    </td>
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '12px 16px', color: colors.textMuted }}>ATP/second</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace' }}>{formatScientific(calculations.sparse.atpPerSecond)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace' }}>{formatScientific(calculations.dense.atpPerSecond)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', color: colors.success }}>
                      {calculations.comparison.atpSavings.toFixed(1)}% reduction
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '12px 16px', color: colors.textMuted }}>Scaled to Full Brain (W)</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace' }}>{calculations.sparse.brainPower.toFixed(2)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace' }}>{calculations.dense.brainPower.toFixed(2)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', color: calculations.dense.brainPower > 20 ? colors.warning : colors.success }}>
                      {calculations.dense.brainPower > 20 ? 'Exceeds 20W budget!' : `Within budget`}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Brain Budget Gauge */}
          <div style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            padding: '20px',
          }}>
            <div style={{
              fontSize: '10px',
              color: colors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '16px',
            }}>
              Full Brain Power Budget Analysis (20W Constraint)
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Sparse Gauge */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: colors.sparse }}>Sparse Coding</span>
                  <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                    {calculations.sparse.brainPower.toFixed(2)}W / 20W
                  </span>
                </div>
                <div style={{
                  height: '24px',
                  background: colors.border,
                  borderRadius: '4px',
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <div style={{
                    width: `${Math.min(100, (calculations.sparse.brainPower / 20) * 100)}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${colors.sparse}, ${colors.secondary})`,
                    transition: 'width 0.3s ease',
                  }} />
                  <div style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '10px',
                    fontWeight: 600,
                    color: colors.text,
                  }}>
                    {((calculations.sparse.brainPower / 20) * 100).toFixed(1)}%
                  </div>
                </div>
                <div style={{ fontSize: '10px', color: colors.success, marginTop: '8px' }}>
                  ✓ {(20 - calculations.sparse.brainPower).toFixed(2)}W headroom remaining
                </div>
              </div>

              {/* Dense Gauge */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: colors.dense }}>Dense Coding</span>
                  <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                    {calculations.dense.brainPower.toFixed(2)}W / 20W
                  </span>
                </div>
                <div style={{
                  height: '24px',
                  background: colors.border,
                  borderRadius: '4px',
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <div style={{
                    width: `${Math.min(100, (calculations.dense.brainPower / 20) * 100)}%`,
                    height: '100%',
                    background: calculations.dense.brainPower > 20
                      ? `linear-gradient(90deg, ${colors.dense}, ${colors.warning})`
                      : `linear-gradient(90deg, ${colors.dense}, ${colors.accent})`,
                    transition: 'width 0.3s ease',
                  }} />
                  <div style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '10px',
                    fontWeight: 600,
                    color: colors.text,
                  }}>
                    {((calculations.dense.brainPower / 20) * 100).toFixed(1)}%
                  </div>
                </div>
                <div style={{
                  fontSize: '10px',
                  color: calculations.dense.brainPower > 20 ? colors.warning : colors.success,
                  marginTop: '8px'
                }}>
                  {calculations.dense.brainPower > 20
                    ? `⚠ Exceeds budget by ${(calculations.dense.brainPower - 20).toFixed(2)}W`
                    : `✓ ${(20 - calculations.dense.brainPower).toFixed(2)}W headroom remaining`
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Key Insight Box */}
          <div style={{
            background: `linear-gradient(135deg, rgba(46,213,115,0.1), rgba(0,212,170,0.1))`,
            border: `1px solid rgba(46,213,115,0.3)`,
            borderRadius: '12px',
            padding: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(46,213,115,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: '20px' }}>💡</span>
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: colors.success, marginBottom: '8px' }}>
                  Constraints-Based Enhancement Principle
                </div>
                <p style={{ fontSize: '12px', color: colors.textMuted, lineHeight: 1.6, margin: 0 }}>
                  At {(networkConfig.sparseActivation * 100).toFixed(1)}% sparse activation vs {(networkConfig.denseActivation * 100).toFixed(1)}% dense activation,
                  sparse coding achieves <strong style={{ color: colors.sparse }}>{calculations.comparison.efficiencyGain.toFixed(1)}× greater bits-per-Joule efficiency</strong> while
                  consuming <strong style={{ color: colors.success }}>{calculations.comparison.powerSavings.toFixed(1)}% less power</strong>.
                  This demonstrates why biological neural systems evolved sparse representations—not as a limitation,
                  but as an optimization strategy that <strong style={{ color: colors.accent }}>respects thermodynamic constraints</strong> while
                  maximizing information processing capacity within the brain's 20-Watt power budget.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with equations */}
      <div style={{
        marginTop: '32px',
        paddingTop: '24px',
        borderTop: `1px solid ${colors.border}`,
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
      }}>
        <div style={{ fontSize: '10px', color: colors.textMuted }}>
          <div style={{ color: colors.primary, marginBottom: '4px' }}>Landauer Limit</div>
          E<sub>min</sub> = k<sub>B</sub>T ln(2) = 2.97×10⁻²¹ J/bit
        </div>
        <div style={{ fontSize: '10px', color: colors.textMuted }}>
          <div style={{ color: colors.primary, marginBottom: '4px' }}>Energy per Spike</div>
          E<sub>spike</sub> = N<sub>ATP</sub> × ΔG<sub>ATP</sub> ≈ 10⁻¹⁰ J
        </div>
        <div style={{ fontSize: '10px', color: colors.textMuted }}>
          <div style={{ color: colors.primary, marginBottom: '4px' }}>Shannon Entropy</div>
          H = 4.9×10¹¹ bits per action potential
        </div>
        <div style={{ fontSize: '10px', color: colors.textMuted }}>
          <div style={{ color: colors.primary, marginBottom: '4px' }}>Efficiency Metric</div>
          η = H<sub>total</sub> / E<sub>total</sub> (bits/Joule)
        </div>
      </div>

      {/* Slider Styles */}
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: ${colors.primary};
          cursor: pointer;
          box-shadow: 0 0 10px ${colors.primary};
        }
        input[type="range"]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: ${colors.primary};
          cursor: pointer;
          border: none;
        }
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: ${colors.background};
        }
        ::-webkit-scrollbar-thumb {
          background: ${colors.border};
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${colors.primary};
        }
      `}</style>
    </div>
  );
};

export default SparseCodingCalculator;
