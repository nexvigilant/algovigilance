'use client';

import { COLORS, DERIVED_CONSTANTS } from '../constants';
import { formatScientific } from '../utils';

interface PhysicalConstantsPanelProps {
  isHighlighted?: boolean;
  onClick?: () => void;
}

export function PhysicalConstantsPanel({
  isHighlighted,
  onClick,
}: PhysicalConstantsPanelProps) {
  const highlightStyle = isHighlighted
    ? {
        boxShadow: `0 0 0 3px ${COLORS.primary}, 0 0 20px rgba(0, 212, 170, 0.4)`,
        transform: 'scale(1.02)',
        transition: 'all 0.3s ease-in-out',
        zIndex: 10,
        position: 'relative' as const,
      }
    : {};

  return (
    <div
      data-highlight="brain-power"
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
        Physical Constants (T = 310K)
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '11px', color: COLORS.textMuted }}>
            Landauer Limit
          </span>
          <span
            style={{
              fontSize: '11px',
              color: COLORS.primary,
              fontFamily: 'monospace',
            }}
          >
            {formatScientific(DERIVED_CONSTANTS.landauer_limit)} J/bit
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '11px', color: COLORS.textMuted }}>
            k<sub>B</sub>T ln(2)
          </span>
          <span
            style={{
              fontSize: '11px',
              color: COLORS.primary,
              fontFamily: 'monospace',
            }}
          >
            2.97 × 10⁻²¹ J
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '11px', color: COLORS.textMuted }}>
            Energy/Spike
          </span>
          <span
            style={{
              fontSize: '11px',
              color: COLORS.accent,
              fontFamily: 'monospace',
            }}
          >
            {formatScientific(DERIVED_CONSTANTS.energy_per_spike)} J
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '11px', color: COLORS.textMuted }}>
            Shannon Entropy/Spike
          </span>
          <span
            style={{
              fontSize: '11px',
              color: COLORS.accent,
              fontFamily: 'monospace',
            }}
          >
            4.9 × 10¹¹ bits
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '11px', color: COLORS.textMuted }}>
            Brain Power Budget
          </span>
          <span
            style={{
              fontSize: '11px',
              color: COLORS.warning,
              fontFamily: 'monospace',
            }}
          >
            20 W
          </span>
        </div>
      </div>
    </div>
  );
}
