'use client';

import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamic imports for Recharts-heavy components (~200KB total)
const KpiChart = dynamic(
  () => import('../components/kpi-chart').then((mod) => mod.KpiChart),
  {
    loading: () => <Skeleton className="h-[350px] w-full rounded-lg bg-nex-light/20" />,
    ssr: false,
  }
);

const EngagementChart = dynamic(
  () => import('../components/engagement-chart').then((mod) => mod.EngagementChart),
  {
    loading: () => <Skeleton className="h-[350px] w-full rounded-lg bg-nex-light/20" />,
    ssr: false,
  }
);

export function ChartsSection() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
      <Card className="col-span-1 lg:col-span-4 bg-nex-surface border border-nex-light hover:border-cyan/50 hover:shadow-card-hover transition-all duration-300">
        <CardHeader>
          <CardTitle className="font-headline text-gold">Insights Cross-Service KPIs</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <KpiChart />
        </CardContent>
      </Card>
      <Card className="col-span-1 lg:col-span-3 bg-nex-surface border border-nex-light hover:border-cyan/50 hover:shadow-card-hover transition-all duration-300">
        <CardHeader>
          <CardTitle className="font-headline text-gold">Community Engagement</CardTitle>
        </CardHeader>
        <CardContent>
          <EngagementChart />
        </CardContent>
      </Card>
    </div>
  );
}
