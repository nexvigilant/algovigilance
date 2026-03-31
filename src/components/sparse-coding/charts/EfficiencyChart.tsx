'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { COLORS } from '../constants';
import type { SparsitySweepDataPoint } from '../hooks/useSparseCodingMetrics';

interface EfficiencyChartProps {
  data: SparsitySweepDataPoint[];
  sparseActivation: number;
  denseActivation: number;
}

export function EfficiencyChart({
  data,
  sparseActivation,
  denseActivation,
}: EfficiencyChartProps) {
  return (
    <div
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: '12px',
        padding: '20px',
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
        Efficiency vs Activation Level
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="efficiencyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.4} />
              <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
          <XAxis
            dataKey="sparsity"
            stroke={COLORS.textMuted}
            fontSize={10}
            label={{
              value: 'Activation %',
              position: 'bottom',
              fill: COLORS.textMuted,
              fontSize: 10,
            }}
          />
          <YAxis
            stroke={COLORS.textMuted}
            fontSize={10}
            label={{
              value: 'Bits/J (×10²¹)',
              angle: -90,
              position: 'insideLeft',
              fill: COLORS.textMuted,
              fontSize: 10,
            }}
          />
          <Tooltip
            contentStyle={{
              background: COLORS.background,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              fontSize: '11px',
            }}
            formatter={(value) => [
              `${typeof value === 'number' ? value.toFixed(2) : value} ×10²¹`,
              'Bits/Joule',
            ]}
            labelFormatter={(label) => `Activation: ${label}%`}
          />
          <Area
            type="monotone"
            dataKey="bitsPerJoule"
            stroke={COLORS.primary}
            fill="url(#efficiencyGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div
        style={{
          fontSize: '10px',
          color: COLORS.textMuted,
          marginTop: '12px',
          textAlign: 'center',
        }}
      >
        <span style={{ color: COLORS.sparse }}>●</span> Current sparse:{' '}
        {(sparseActivation * 100).toFixed(1)}%
        <span style={{ marginLeft: '16px', color: COLORS.dense }}>●</span> Current
        dense: {(denseActivation * 100).toFixed(1)}%
      </div>
    </div>
  );
}
