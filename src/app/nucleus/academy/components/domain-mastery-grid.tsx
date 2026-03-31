'use client';

import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import type { DomainMastery } from '@/lib/actions/fsrs';

interface DomainMasteryGridProps {
  domains: DomainMastery[];
  className?: string;
}

/**
 * Grid of domain mastery progress bars.
 * Shows mastered vs learning KSBs per domain with retention percentage.
 */
export function DomainMasteryGrid({ domains, className }: DomainMasteryGridProps) {
  if (domains.length === 0) {
    return (
      <div className={cn('bg-nex-dark/80 border border-nex-light/30 rounded-2xl p-5', className)}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg" role="img" aria-label="target">🎯</span>
          <h3 className="text-sm font-semibold text-slate-light tracking-wide">
            Domain Mastery
          </h3>
        </div>
        <div className="flex items-center justify-center h-24 text-slate-dim text-sm">
          No domain data yet. Start reviewing KSBs to build mastery.
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-nex-dark/80 border border-nex-light/30 rounded-2xl p-5', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg" role="img" aria-label="target">🎯</span>
          <h3 className="text-sm font-semibold text-slate-light tracking-wide">
            Domain Mastery
          </h3>
        </div>
        <span className="text-xs text-slate-dim">
          {domains.reduce((s, d) => s + d.masteredKSBs, 0)} mastered
        </span>
      </div>

      {/* Domain rows */}
      <div className="space-y-3">
        {domains.map(domain => {
          const masteryPercent = domain.totalKSBs > 0
            ? Math.round((domain.masteredKSBs / domain.totalKSBs) * 100)
            : 0;

          const retentionPercent = Math.round(domain.averageRetention * 100);

          return (
            <div key={domain.domainId} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-light truncate max-w-[60%]">
                  {domain.domainName}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-dim">
                    {domain.masteredKSBs}/{domain.totalKSBs}
                  </span>
                  <span className={cn(
                    'text-[10px] font-medium',
                    retentionPercent >= 80 ? 'text-cyan' : retentionPercent >= 60 ? 'text-gold' : 'text-red-400'
                  )}>
                    {retentionPercent}%
                  </span>
                </div>
              </div>
              <Progress
                value={masteryPercent}
                className="h-1.5 bg-nex-light/10 [&>div]:bg-gradient-to-r [&>div]:from-cyan [&>div]:to-gold"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
