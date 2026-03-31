'use client';

import { COLORS, type NetworkConfig } from '../constants';
import { formatNumber } from '../utils';

interface NetworkConfigPanelProps {
  config: NetworkConfig;
  onChange: (config: NetworkConfig) => void;
  isHighlighted?: boolean;
  onClick?: () => void;
}

export function NetworkConfigPanel({
  config,
  onChange,
  isHighlighted,
  onClick,
}: NetworkConfigPanelProps) {
  const highlightStyle = isHighlighted
    ? {
        boxShadow: `0 0 0 3px ${COLORS.primary}, 0 0 20px rgba(0, 212, 170, 0.4)`,
        transform: 'scale(1.02)',
        transition: 'all 0.3s ease-in-out',
        zIndex: 10,
        position: 'relative' as const,
      }
    : {};

  const sliderStyle = {
    width: '100%',
    height: '4px',
    borderRadius: '2px',
    background: COLORS.border,
    appearance: 'none' as const,
    cursor: 'pointer',
  };

  return (
    <div
      data-highlight="activation-sliders"
      onClick={onClick}
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: '12px',
        padding: '20px',
        cursor: onClick ? 'pointer' : 'default',
        ...highlightStyle,
      }}
    >
      <div
        style={{
          fontSize: '10px',
          color: COLORS.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '16px',
        }}
      >
        Network Configuration
      </div>

      {/* Neuron Count */}
      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}
        >
          <span style={{ fontSize: '11px' }}>Neuron Population</span>
          <span
            style={{
              fontSize: '11px',
              color: COLORS.primary,
              fontFamily: 'monospace',
            }}
          >
            {formatNumber(config.neuronCount)}
          </span>
        </div>
        <input
          type="range"
          min="4"
          max="9"
          step="0.1"
          value={Math.log10(config.neuronCount)}
          onChange={(e) =>
            onChange({
              ...config,
              neuronCount: Math.pow(10, parseFloat(e.target.value)),
            })
          }
          style={sliderStyle}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '4px',
          }}
        >
          <span style={{ fontSize: '9px', color: COLORS.textMuted }}>10⁴</span>
          <span style={{ fontSize: '9px', color: COLORS.textMuted }}>10⁹</span>
        </div>
      </div>

      {/* Sparse Activation */}
      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}
        >
          <span style={{ fontSize: '11px' }}>Sparse Activation</span>
          <span
            style={{
              fontSize: '11px',
              color: COLORS.sparse,
              fontFamily: 'monospace',
            }}
          >
            {(config.sparseActivation * 100).toFixed(1)}%
          </span>
        </div>
        <input
          type="range"
          min="0.005"
          max="0.10"
          step="0.005"
          value={config.sparseActivation}
          onChange={(e) =>
            onChange({
              ...config,
              sparseActivation: parseFloat(e.target.value),
            })
          }
          style={sliderStyle}
        />
      </div>

      {/* Dense Activation */}
      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}
        >
          <span style={{ fontSize: '11px' }}>Dense Activation</span>
          <span
            style={{
              fontSize: '11px',
              color: COLORS.dense,
              fontFamily: 'monospace',
            }}
          >
            {(config.denseActivation * 100).toFixed(1)}%
          </span>
        </div>
        <input
          type="range"
          min="0.05"
          max="0.50"
          step="0.01"
          value={config.denseActivation}
          onChange={(e) =>
            onChange({
              ...config,
              denseActivation: parseFloat(e.target.value),
            })
          }
          style={sliderStyle}
        />
      </div>

      {/* Sparse Firing Rate */}
      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}
        >
          <span style={{ fontSize: '11px' }}>Sparse Firing Rate</span>
          <span
            style={{
              fontSize: '11px',
              color: COLORS.sparse,
              fontFamily: 'monospace',
            }}
          >
            {config.firingRate} Hz
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="20"
          step="1"
          value={config.firingRate}
          onChange={(e) =>
            onChange({
              ...config,
              firingRate: parseInt(e.target.value),
            })
          }
          style={sliderStyle}
        />
      </div>

      {/* Dense Firing Rate */}
      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}
        >
          <span style={{ fontSize: '11px' }}>Dense Firing Rate</span>
          <span
            style={{
              fontSize: '11px',
              color: COLORS.dense,
              fontFamily: 'monospace',
            }}
          >
            {config.densefiringRate} Hz
          </span>
        </div>
        <input
          type="range"
          min="10"
          max="100"
          step="5"
          value={config.densefiringRate}
          onChange={(e) =>
            onChange({
              ...config,
              densefiringRate: parseInt(e.target.value),
            })
          }
          style={sliderStyle}
        />
      </div>

      {/* Synaptic Overhead */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}
        >
          <span style={{ fontSize: '11px' }}>Synaptic Overhead</span>
          <span
            style={{
              fontSize: '11px',
              color: COLORS.purple,
              fontFamily: 'monospace',
            }}
          >
            {(config.synapticOverhead * 100).toFixed(0)}%
          </span>
        </div>
        <input
          type="range"
          min="0.1"
          max="0.6"
          step="0.05"
          value={config.synapticOverhead}
          onChange={(e) =>
            onChange({
              ...config,
              synapticOverhead: parseFloat(e.target.value),
            })
          }
          style={sliderStyle}
        />
      </div>
    </div>
  );
}
