'use client';

import { type LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AcademyDashboardStatCardProps {
  title: string;
  value: string | number;
  subtext: string;
  icon: LucideIcon;
  variant?: 'cyan' | 'gold';
  className?: string;
}

export function AcademyDashboardStatCard({
  title,
  value,
  subtext,
  icon: Icon,
  variant = 'cyan',
  className
}: AcademyDashboardStatCardProps) {
  const isCyan = variant === 'cyan';
  
  return (
    <Card className={cn(
      "bg-nex-surface border border-nex-light hover:border-cyan/50 hover:shadow-card-hover transition-all duration-300",
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold text-slate-light">{title}</CardTitle>
        <div className={cn(
          "p-2 rounded-lg",
          isCyan ? "bg-cyan/10" : "bg-gold/10"
        )}>
          <Icon className={cn("h-4 w-4", isCyan ? "text-cyan" : "text-gold")} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn(
          "text-3xl font-bold",
          isCyan ? "text-cyan" : "text-gold"
        )}>
          {value}
        </div>
        <p className="text-xs text-slate-dim font-medium mt-1">
          {subtext}
        </p>
      </CardContent>
    </Card>
  );
}
