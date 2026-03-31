'use client';

import { Bar, BarChart, XAxis, YAxis, Tooltip } from 'recharts';
import { type ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

const chartData = [
  { name: 'Posts', value: 187, fill: 'var(--color-posts)' },
  { name: 'Comments', value: 254, fill: 'var(--color-comments)' },
  { name: 'Likes', value: 865, fill: 'var(--color-likes)' },
  { name: 'Shares', value: 98, fill: 'var(--color-shares)' },
];

const chartConfig = {
  value: {
    label: 'Count',
  },
  posts: {
    label: 'Posts',
    color: 'hsl(var(--chart-1))',
  },
  comments: {
    label: 'Comments',
    color: 'hsl(var(--chart-2))',
  },
  likes: {
    label: 'Likes',
    color: 'hsl(var(--chart-3))',
  },
  shares: {
    label: 'Shares',
    color: 'hsl(var(--chart-4))',
  },
} satisfies ChartConfig;

export function EngagementChart() {
  return (
    <ChartContainer config={chartConfig} className="h-[250px] w-full">
      <BarChart accessibilityLayer data={chartData}>
        <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
        <YAxis />
        <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
        <Bar dataKey="value" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
