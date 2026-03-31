// =============================================================================
// SPARSE CODING CONSTANTS
// Physical constants and derived values for thermodynamic analysis
// Based on: Scientific Concept Optimization Research Report, Section 1.1
// =============================================================================

/**
 * Physical Constants (SI Units)
 */
export const PHYSICAL_CONSTANTS = {
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
} as const;

/**
 * Derived Constants - calculated from physical constants
 */
export const DERIVED_CONSTANTS = {
  landauer_limit: PHYSICAL_CONSTANTS.k_B * PHYSICAL_CONSTANTS.T_body * PHYSICAL_CONSTANTS.ln2, // ~2.97e-21 J/bit
  energy_per_spike: PHYSICAL_CONSTANTS.ATP_per_spike * PHYSICAL_CONSTANTS.ATP_energy,  // ~1e-10 J
} as const;

/**
 * Default network configuration
 */
export const DEFAULT_NETWORK_CONFIG = {
  neuronCount: 1e6,           // 1 million neuron network
  sparseActivation: 0.02,     // 2% sparse activation (biological default)
  denseActivation: 0.15,      // 15% dense activation (typical ANN)
  firingRate: 5,              // Hz (sparse temporal coding)
  densefiringRate: 20,        // Hz (rate coding)
  integrationWindow: 1000,    // ms
  synapticOverhead: 0.3,      // 30% additional energy for synaptic maintenance
} as const;

/**
 * Network configuration type
 */
export interface NetworkConfig {
  neuronCount: number;
  sparseActivation: number;
  denseActivation: number;
  firingRate: number;
  densefiringRate: number;
  integrationWindow: number;
  synapticOverhead: number;
}

/**
 * Color scheme for the calculator
 */
export const COLORS = {
  background: '#0a0e14',
  surface: '#0f1419',
  border: '#1a2332',
  text: '#e8eaed',
  textMuted: '#6b7280',
  primary: '#00d4aa',
  secondary: '#0088cc',
  accent: '#ff9f1c',
  sparse: '#00d4aa',
  dense: '#ff6b35',
  warning: '#ff4757',
  success: '#2ed573',
  purple: '#7b68ee',
} as const;
