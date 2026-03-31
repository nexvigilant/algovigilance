'use client';

import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BrandedStatPillProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  variant?: 'cyan' | 'gold' | 'amber';
  className?: string;
  showLabelOnMobile?: boolean;
}

export function BrandedStatPill({
  icon: Icon,
  label,
  value,
  variant = 'cyan',
  className,
  showLabelOnMobile = false
}: BrandedStatPillProps) {
  const variantStyles = {
    cyan: 'border-cyan/20 text-cyan',
    gold: 'border-gold/20 text-gold',
    amber: 'border-amber-500/20 text-amber-500',
  };

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-full border bg-nex-surface",
      variantStyles[variant],
      className
    )}>
      <Icon className="h-4 w-4" />
      <span className="font-mono font-bold">{value}</span>
      <span className={cn(
        "text-slate-dim text-xs",
        showLabelOnMobile ? "inline" : "hidden sm:inline"
      )}>
        {label}
      </span>
    </div>
  );
}
