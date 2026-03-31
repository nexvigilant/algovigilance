import { type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function StatCard({ icon: Icon, label, value, subtext, className }: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtext?: string;
  className?: string;
}) {
  return (
    <Card className={cn('bg-nex-surface border-nex-light', className)}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-cyan/10 p-2">
            <Icon className="h-5 w-5 text-cyan" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-light">{value}</p>
            <p className="text-sm text-slate-dim">{label}</p>
            {subtext && <p className="text-xs text-slate-dim mt-0.5">{subtext}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
