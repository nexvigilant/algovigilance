'use client';

import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtext: string;
  icon: LucideIcon;
  variant: 'cyan' | 'gold' | 'orange' | 'pink';
  className?: string;
  progress?: number; // Optional progress bar (0-100)
}

export function StatsCard({
  title,
  value,
  subtext,
  icon: Icon,
  variant,
  className,
  progress,
}: StatsCardProps) {
  const variants = {
    cyan: {
      border: 'border-l-cyan',
      glow: 'shadow-[inset_0_0_30px_rgba(0,174,239,0.15),0_0_20px_rgba(0,174,239,0.1)]',
      gradient: 'bg-gradient-to-br from-cyan/10 via-cyan/5 to-transparent',
      text: 'text-cyan',
      iconBg: 'bg-cyan/20',
      iconGlow: 'shadow-[0_0_15px_rgba(0,174,239,0.4)]',
      progressBg: 'bg-cyan',
      hoverGlow: 'hover:shadow-[inset_0_0_40px_rgba(0,174,239,0.2),0_0_30px_rgba(0,174,239,0.15)]',
    },
    gold: {
      border: 'border-l-gold',
      glow: 'shadow-[inset_0_0_30px_rgba(212,175,55,0.15),0_0_20px_rgba(212,175,55,0.1)]',
      gradient: 'bg-gradient-to-br from-gold/10 via-gold/5 to-transparent',
      text: 'text-gold',
      iconBg: 'bg-gold/20',
      iconGlow: 'shadow-[0_0_15px_rgba(212,175,55,0.4)]',
      progressBg: 'bg-gold',
      hoverGlow: 'hover:shadow-[inset_0_0_40px_rgba(212,175,55,0.2),0_0_30px_rgba(212,175,55,0.15)]',
    },
    orange: {
      border: 'border-l-orange-500',
      glow: 'shadow-[inset_0_0_30px_rgba(249,115,22,0.15),0_0_20px_rgba(249,115,22,0.1)]',
      gradient: 'bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent',
      text: 'text-orange-500',
      iconBg: 'bg-orange-500/20',
      iconGlow: 'shadow-[0_0_15px_rgba(249,115,22,0.4)]',
      progressBg: 'bg-orange-500',
      hoverGlow: 'hover:shadow-[inset_0_0_40px_rgba(249,115,22,0.2),0_0_30px_rgba(249,115,22,0.15)]',
    },
    pink: {
      border: 'border-l-pink-500',
      glow: 'shadow-[inset_0_0_30px_rgba(236,72,153,0.15),0_0_20px_rgba(236,72,153,0.1)]',
      gradient: 'bg-gradient-to-br from-pink-500/10 via-pink-500/5 to-transparent',
      text: 'text-pink-500',
      iconBg: 'bg-pink-500/20',
      iconGlow: 'shadow-[0_0_15px_rgba(236,72,153,0.4)]',
      progressBg: 'bg-pink-500',
      hoverGlow: 'hover:shadow-[inset_0_0_40px_rgba(236,72,153,0.2),0_0_30px_rgba(236,72,153,0.15)]',
    },
  };

  const styles = variants[variant];

  return (
    <div className={className}>
      <div
        className={cn(
          'relative rounded-xl border-l-4 overflow-hidden transition-all duration-500',
          'bg-nex-surface/80 backdrop-blur-sm border border-nex-light/30',
          styles.border,
          styles.gradient,
          styles.glow,
          styles.hoverGlow
        )}
      >
        {/* Subtle top highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-light tracking-wide">
              {title}
            </h3>
            <div className={cn(
              'p-2.5 rounded-xl transition-all duration-300',
              styles.iconBg,
              styles.iconGlow
            )}>
              <Icon className={cn('h-5 w-5', styles.text)} />
            </div>
          </div>

          {/* Value */}
          <div className={cn('text-4xl font-bold tracking-tight', styles.text)}>
            {value}
          </div>

          {/* Subtext */}
          <p className="text-xs text-slate-dim font-medium mt-2">{subtext}</p>

          {/* Progress Bar */}
          {progress !== undefined && (
            <div className="mt-4">
              <Progress 
                value={progress} 
                className="h-1.5" 
                indicatorClassName={cn(styles.progressBg, 'shadow-[0_0_10px_currentColor]')}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
