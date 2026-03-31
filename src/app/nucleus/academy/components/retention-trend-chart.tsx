'use client';

import { cn } from '@/lib/utils';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import type { RetentionTrendPoint } from '@/lib/actions/fsrs';

interface RetentionTrendChartProps {
  data: RetentionTrendPoint[];
  className?: string;
}

const chartConfig = {
  retention: {
    label: 'Retention %',
    color: 'var(--color-cyan, #7B95B5)',
  },
  cardCount: {
    label: 'Cards',
    color: 'var(--color-gold, #d4af37)',
  },
} satisfies ChartConfig;

/**
 * Line chart showing retention trend over time.
 * Powered by real FSRS data via getRetentionTrend().
 */
export function RetentionTrendChart({ data, className }: RetentionTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className={cn('bg-nex-dark/80 border border-nex-light/30 rounded-2xl p-5', className)}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg" role="img" aria-label="chart">📈</span>
          <h3 className="text-sm font-semibold text-slate-light tracking-wide">
            Retention Trend
          </h3>
        </div>
        <div className="flex items-center justify-center h-32 text-slate-dim text-sm">
          No review data yet. Start reviewing to see your retention trend.
        </div>
      </div>
    );
  }

  // Format dates for display
  const chartData = data.map(point => ({
    ...point,
    label: new Date(point.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
  }));

  const currentRetention = data[data.length - 1]?.retention ?? 0;

  return (
    <div className={cn('bg-nex-dark/80 border border-nex-light/30 rounded-2xl p-5', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg" role="img" aria-label="chart">📈</span>
          <h3 className="text-sm font-semibold text-slate-light tracking-wide">
            Retention Trend
          </h3>
        </div>
        <div className="text-right">
          <span className={cn(
            'text-lg font-bold',
            currentRetention >= 80 ? 'text-cyan' : currentRetention >= 60 ? 'text-gold' : 'text-red-400'
          )}>
            {currentRetention}%
          </span>
          <span className="text-xs text-slate-dim ml-1">current</span>
        </div>
      </div>

      {/* Chart */}
      <ChartContainer config={chartConfig} className="h-40 w-full">
        <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="retentionFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-cyan, #7B95B5)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="var(--color-cyan, #7B95B5)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${v}%`}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            type="monotone"
            dataKey="retention"
            stroke="var(--color-cyan, #7B95B5)"
            strokeWidth={2}
            fill="url(#retentionFill)"
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
