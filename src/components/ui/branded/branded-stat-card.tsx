'use client';

import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BrandedStatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  trend?: number;
  loading?: boolean;
  className?: string;
}

export function BrandedStatCard({ 
  icon, 
  label, 
  value, 
  trend, 
  loading,
  className
}: BrandedStatCardProps) {
  return (
    <div className={cn("text-center", className)}>
      <div className="flex items-center justify-center gap-2 mb-1">
        <span className="text-cyan">{icon}</span>
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin text-cyan" />
        ) : (
          <div className="text-3xl font-bold text-cyan">{value}</div>
        )}
      </div>
      <div className="text-sm text-slate-dim">{label}</div>
      {trend !== undefined && !loading && (
        <div className={cn(
          "text-xs flex items-center justify-center gap-1 mt-1",
          trend >= 0 ? 'text-emerald-400' : 'text-rose-400'
        )}>
          {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {Math.abs(trend)}% vs last week
        </div>
      )}
    </div>
  );
}
