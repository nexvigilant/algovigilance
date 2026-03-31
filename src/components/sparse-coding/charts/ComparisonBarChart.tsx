'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { COLORS } from '../constants';
import type { ComparisonBarDataPoint } from '../hooks/useSparseCodingMetrics';

interface ComparisonBarChartProps {
  data: ComparisonBarDataPoint[];
}

export function ComparisonBarChart({ data }: ComparisonBarChartProps) {
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
        Sparse vs Dense Comparison
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
          <XAxis type="number" stroke={COLORS.textMuted} fontSize={10} />
          <YAxis
            dataKey="name"
            type="category"
            stroke={COLORS.textMuted}
            fontSize={10}
            width={80}
          />
          <Tooltip
            contentStyle={{
              background: COLORS.background,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              fontSize: '11px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '10px' }} />
          <Bar dataKey="sparse" name="Sparse" fill={COLORS.sparse} radius={[0, 4, 4, 0]} />
          <Bar dataKey="dense" name="Dense" fill={COLORS.dense} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
