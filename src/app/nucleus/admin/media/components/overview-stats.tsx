import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface OverviewStatsProps {
  totalAssets: number;
  totalWithImages: number;
  totalMissing: number;
}

export function OverviewStats({ totalAssets, totalWithImages, totalMissing }: OverviewStatsProps) {
  const coverage = totalAssets > 0 ? Math.round((totalWithImages / totalAssets) * 100) : 0;

  return (
    <div className="grid gap-4 md:grid-cols-4 mb-8">
      <Card className="bg-nex-surface border-nex-light">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-dim">Total Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{totalAssets}</div>
        </CardContent>
      </Card>
      <Card className="bg-nex-surface border-nex-light">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-dim">With Images</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-400">{totalWithImages}</div>
        </CardContent>
      </Card>
      <Card className="bg-nex-surface border-nex-light">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-dim">Missing Images</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-400">{totalMissing}</div>
        </CardContent>
      </Card>
      <Card className="bg-nex-surface border-nex-light">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-dim">Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-cyan">{coverage}%</div>
        </CardContent>
      </Card>
    </div>
  );
}
